"""AST-based SQL security analyzer using sqlglot for GuardianAI.

Strict AST parsing and validation:
- Exactly one statement
- Parse failure -> DENY
- Multi-statement -> DENY
- Destructive commands (DROP, ALTER, TRUNCATE, ATTACH, PRAGMA) -> DENY
- CTE-wrapped destructive operations -> DENY
- DELETE without WHERE -> DENY
- Enforces row LIMIT for SELECT queries
"""

from typing import Any, Dict, List, Optional, Set, Tuple
import sqlglot
from sqlglot import exp
from sqlglot.errors import ParseError

from shared.constants import (
    ActionType,
    Decision,
    RiskLevel,
    REASON_SQL_PARSE_FAILURE,
    REASON_MULTI_STATEMENT_REJECTED,
    REASON_UNSAFE_SQL_CONSTRUCT,
)

FORBIDDEN_FUNCTIONS = {"load_extension", "writefile", "readfile"}
DANGEROUS_COMMANDS = {"attach", "detach", "pragma", "vacuum", "reindex"}

class SQLSecurityReport:
    def __init__(self):
        self.is_valid: bool = True
        self.decision: Decision = Decision.ALLOW_WITH_CONSTRAINTS
        self.risk_level: RiskLevel = RiskLevel.LOW
        self.statement_type: str = "UNKNOWN"
        self.tables: Set[str] = set()
        self.has_where: bool = False
        self.has_limit: bool = False
        self.rewritten_query: Optional[str] = None
        self.reasons: List[str] = []

class SQLAnalyzer:
    def __init__(self, dialect: str = "sqlite"):
        self.dialect = dialect

    def analyze(self, raw_query: str, max_limit: int = 100) -> SQLSecurityReport:
        report = SQLSecurityReport()
        if not raw_query or not raw_query.strip():
            report.is_valid = False
            report.decision = Decision.DENY
            report.risk_level = RiskLevel.MEDIUM
            report.reasons.append("Empty SQL query rejected")
            return report

        # 1. Parse AST with sqlglot
        try:
            statements = sqlglot.parse(raw_query, read=self.dialect)
        except ParseError as e:
            report.is_valid = False
            report.decision = Decision.DENY
            report.risk_level = RiskLevel.HIGH
            report.reasons.append(f"{REASON_SQL_PARSE_FAILURE}: {str(e)}")
            return report
        except Exception as e:
            report.is_valid = False
            report.decision = Decision.DENY
            report.risk_level = RiskLevel.HIGH
            report.reasons.append(f"{REASON_SQL_PARSE_FAILURE}: Parse error: {str(e)}")
            return report

        # 2. Check for multi-statement
        # Also check raw query for unquoted semicolons with extra commands
        if len(statements) != 1:
            report.is_valid = False
            report.decision = Decision.DENY
            report.risk_level = RiskLevel.CRITICAL
            report.reasons.append(f"{REASON_MULTI_STATEMENT_REJECTED}: Query contains {len(statements)} statements")
            return report

        stmt = statements[0]
        if stmt is None:
            report.is_valid = False
            report.decision = Decision.DENY
            report.risk_level = RiskLevel.HIGH
            report.reasons.append(REASON_SQL_PARSE_FAILURE)
            return report

        # 3. Check for forbidden commands (PRAGMA, ATTACH, etc.)
        if isinstance(stmt, (exp.Command, exp.Transaction)):
            report.is_valid = False
            report.decision = Decision.DENY
            report.risk_level = RiskLevel.CRITICAL
            report.reasons.append(f"{REASON_UNSAFE_SQL_CONSTRUCT}: Administrative command rejected")
            return report

        # Check raw command or statement name
        stmt_sql_lower = raw_query.lower()
        for cmd in DANGEROUS_COMMANDS:
            # Check standalone word
            if f"{cmd} " in stmt_sql_lower or f" {cmd}" in stmt_sql_lower or stmt_sql_lower.startswith(f"{cmd};"):
                report.is_valid = False
                report.decision = Decision.DENY
                report.risk_level = RiskLevel.CRITICAL
                report.reasons.append(f"{REASON_UNSAFE_SQL_CONSTRUCT}: '{cmd.upper()}' is not permitted")
                return report

        # 4. Extract tables referenced across entire AST
        for table in stmt.find_all(exp.Table):
            if table.name:
                report.tables.add(table.name.lower())

        # 5. Check for forbidden function calls across AST (load_extension, etc.)
        for func in stmt.find_all(exp.Anonymous, exp.Func):
            func_name = getattr(func, "name", "").lower()
            if func_name in FORBIDDEN_FUNCTIONS:
                report.is_valid = False
                report.decision = Decision.DENY
                report.risk_level = RiskLevel.CRITICAL
                report.reasons.append(f"{REASON_UNSAFE_SQL_CONSTRUCT}: Forbidden function '{func_name}'")
                return report

        # 6. Check for DROP / ALTER / TRUNCATE anywhere in AST (including subqueries and CTEs)
        if stmt.find(exp.Drop):
            report.is_valid = False
            report.decision = Decision.DENY
            report.risk_level = RiskLevel.CRITICAL
            report.statement_type = "DROP"
            report.reasons.append(f"{REASON_UNSAFE_SQL_CONSTRUCT}: DROP statements are prohibited")
            return report

        if stmt.find(exp.Alter):
            report.is_valid = False
            report.decision = Decision.DENY
            report.risk_level = RiskLevel.CRITICAL
            report.statement_type = "ALTER"
            report.reasons.append(f"{REASON_UNSAFE_SQL_CONSTRUCT}: ALTER statements are prohibited")
            return report

        # 7. Check for DELETE operations
        delete_node = stmt.find(exp.Delete)
        if delete_node or isinstance(stmt, exp.Delete):
            report.statement_type = "DELETE"
            report.risk_level = RiskLevel.HIGH

            # Verify WHERE clause exists on the DELETE node
            where_node = (delete_node or stmt).find(exp.Where)
            if not where_node:
                report.is_valid = False
                report.decision = Decision.DENY
                report.risk_level = RiskLevel.CRITICAL
                report.reasons.append("Unscoped DELETE rejected: WHERE clause is mandatory")
                return report

            report.has_where = True
            # Scoped DELETE requires ESCALATE for human approval
            report.decision = Decision.ESCALATE
            report.reasons.append("DELETE operation requires human authorization and impact preview")
            report.rewritten_query = stmt.sql(dialect=self.dialect)
            return report

        # 8. Check for UPDATE operations
        update_node = stmt.find(exp.Update)
        if update_node or isinstance(stmt, exp.Update):
            report.statement_type = "UPDATE"
            where_node = (update_node or stmt).find(exp.Where)
            if not where_node:
                report.is_valid = False
                report.decision = Decision.DENY
                report.risk_level = RiskLevel.CRITICAL
                report.reasons.append("Unscoped UPDATE rejected: WHERE clause is mandatory")
                return report
            report.has_where = True
            report.decision = Decision.ESCALATE
            report.risk_level = RiskLevel.HIGH
            report.reasons.append("UPDATE operation requires human authorization")
            report.rewritten_query = stmt.sql(dialect=self.dialect)
            return report

        # 9. Check for INSERT operations
        if stmt.find(exp.Insert) or isinstance(stmt, exp.Insert):
            report.statement_type = "INSERT"
            report.decision = Decision.ALLOW_WITH_CONSTRAINTS
            report.risk_level = RiskLevel.MEDIUM
            report.rewritten_query = stmt.sql(dialect=self.dialect)
            return report

        # 10. Check for SELECT operations
        select_node = stmt.find(exp.Select)
        if select_node or isinstance(stmt, exp.Select):
            report.statement_type = "SELECT"
            report.decision = Decision.ALLOW_WITH_CONSTRAINTS
            report.risk_level = RiskLevel.LOW

            limit_node = stmt.find(exp.Limit)
            if limit_node:
                report.has_limit = True
                # Parse existing limit value
                try:
                    limit_val = int(limit_node.expression.name)
                    if limit_val > max_limit:
                        stmt = stmt.limit(max_limit)
                except Exception:
                    stmt = stmt.limit(max_limit)
            else:
                report.has_limit = False
                stmt = stmt.limit(max_limit)

            report.rewritten_query = stmt.sql(dialect=self.dialect)
            report.reasons.append(f"SELECT permitted with enforced max limit ({max_limit} rows)")
            return report

        # Unknown statement type
        report.is_valid = False
        report.decision = Decision.DENY
        report.risk_level = RiskLevel.HIGH
        report.reasons.append(f"Unrecognized or unsupported SQL statement: {type(stmt).__name__}")
        return report
