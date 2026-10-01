"""Protected SQLite database adapter for GuardianAI.

Provides:
- Schema initialization and 1,000+ realistic fake records
- Read-only connection enforcement for read operations
- Safe dry-run impact calculation via generated COUNT(*) queries without executing mutations
- Safe execution path mediated strictly by valid capability tokens
"""

import os
import random
import sqlite3
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import sqlglot
from sqlglot import exp

from backend.config import settings

class DatabaseAdapter:
    def __init__(self, db_path: Optional[str] = None):
        if db_path:
            self.db_path = Path(db_path)
        else:
            self.db_path = settings.DATABASE_PATH
        
        # Ensure parent directory exists
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_database()

    def get_read_connection(self) -> sqlite3.Connection:
        """Read-only SQLite URI connection."""
        uri = f"file:{self.db_path.resolve()}?mode=ro"
        conn = sqlite3.connect(uri, uri=True)
        conn.row_factory = sqlite3.Row
        return conn

    def get_write_connection(self) -> sqlite3.Connection:
        """Internal write connection, strictly protected by Guardian authorization."""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def init_database(self, force_reseed: bool = False):
        """Creates tables and populates with realistic fake data if not already present."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                company TEXT NOT NULL,
                inactive INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                product TEXT NOT NULL,
                amount REAL NOT NULL,
                region TEXT NOT NULL,
                date TEXT NOT NULL,
                FOREIGN KEY(customer_id) REFERENCES customers(id)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_number TEXT NOT NULL UNIQUE,
                customer_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                status TEXT NOT NULL,
                due_date TEXT NOT NULL,
                FOREIGN KEY(customer_id) REFERENCES customers(id)
            )
        """)

        conn.commit()

        # Check existing count
        cursor.execute("SELECT COUNT(*) FROM customers")
        count = cursor.fetchone()[0]
        if count < 1000 or force_reseed:
            self._seed_fake_data(conn, cursor)

        conn.close()

    def _seed_fake_data(self, conn: sqlite3.Connection, cursor: sqlite3.Cursor):
        cursor.execute("DELETE FROM invoices")
        cursor.execute("DELETE FROM sales")
        cursor.execute("DELETE FROM customers")

        first_names = ["Alex", "Jordan", "Taylor", "Morgan", "Sam", "Chris", "Pat", "Riley", "Casey", "Avery", "Elena", "Marcus", "Sophia", "David", "Lucas"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Vance", "Sterling", "Chen"]
        companies = ["Acme Corp", "Globex", "Initech", "Umbrella Co", "Cyberdyne", "Wayne Tech", "Stark Ind", "Hooli", "Pied Piper", "Massive Dynamic"]
        products = ["Enterprise Cloud Suite", "Security Sentinel Pro", "AI Workflow Hub", "Analytics Engine", "Database Accelerator", "Identity Gateway"]
        regions = ["North America", "EMEA", "APAC", "LATAM"]
        statuses = ["PAID", "PENDING", "OVERDUE", "CANCELLED"]

        random.seed(42)  # Deterministic seed for reproducible testing

        customers_data = []
        for i in range(1, 1001):
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            email = f"user{i}@{random.choice(companies).lower().replace(' ', '')}.example.test"
            company = random.choice(companies)
            # Approximately 427 inactive users to match the spec scenario!
            inactive = 1 if (i % 7 in (0, 2, 4) and i <= 996) else 0
            created_at = f"2025-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
            customers_data.append((name, email, company, inactive, created_at))

        cursor.executemany(
            "INSERT INTO customers (name, email, company, inactive, created_at) VALUES (?, ?, ?, ?, ?)",
            customers_data
        )

        sales_data = []
        for i in range(1, 1501):
            cust_id = random.randint(1, 1000)
            product = random.choice(products)
            amount = round(random.uniform(500.0, 25000.0), 2)
            region = random.choice(regions)
            date = f"2026-0{random.randint(1,9)}-{random.randint(1,28):02d}"
            sales_data.append((cust_id, product, amount, region, date))

        cursor.executemany(
            "INSERT INTO sales (customer_id, product, amount, region, date) VALUES (?, ?, ?, ?, ?)",
            sales_data
        )

        invoices_data = []
        for i in range(1, 1201):
            inv_num = f"INV-2026-{i:05d}"
            cust_id = random.randint(1, 1000)
            amount = round(random.uniform(1000.0, 50000.0), 2)
            status = random.choice(statuses)
            due_date = f"2026-1{random.randint(0,2):01d}-{random.randint(1,28):02d}"
            invoices_data.append((inv_num, cust_id, amount, status, due_date))

        cursor.executemany(
            "INSERT INTO invoices (invoice_number, customer_id, amount, status, due_date) VALUES (?, ?, ?, ?, ?)",
            invoices_data
        )

        conn.commit()

    def calculate_impact_preview(self, query: str) -> Dict[str, Any]:
        """Calculates safe impact preview using AST-generated COUNT(*) without running the mutation."""
        try:
            parsed = sqlglot.parse_one(query, read="sqlite")
        except Exception as e:
            return {
                "estimated_affected_records": 0,
                "error": f"Failed to parse query for impact preview: {e}",
            }

        table_name = None
        where_clause = None

        if isinstance(parsed, exp.Delete):
            table = parsed.this
            table_name = table.name if table else None
            where_node = parsed.find(exp.Where)
            if where_node:
                where_clause = where_node.sql(dialect="sqlite")
        elif isinstance(parsed, exp.Update):
            table = parsed.this
            table_name = table.name if table else None
            where_node = parsed.find(exp.Where)
            if where_node:
                where_clause = where_node.sql(dialect="sqlite")

        if not table_name:
            return {"estimated_affected_records": 0, "error": "Target table could not be identified"}

        count_sql = f"SELECT COUNT(*) as count FROM {table_name}"
        if where_clause:
            count_sql += f" {where_clause}"

        try:
            conn = self.get_read_connection()
            cursor = conn.cursor()
            cursor.execute(count_sql)
            row = cursor.fetchone()
            count = row[0] if row else 0
            conn.close()
            return {
                "estimated_affected_records": count,
                "safe_preview_query": count_sql,
                "target_table": table_name,
            }
        except Exception as e:
            return {
                "estimated_affected_records": 0,
                "error": f"Failed to execute impact count: {e}",
            }

    def execute_read_query(self, query: str) -> List[Dict[str, Any]]:
        """Executes a validated SELECT query via the read-only connection."""
        conn = self.get_read_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(query)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()

    def execute_write_query(self, query: str) -> Tuple[bool, int, Optional[str]]:
        """Executes a validated mutation via the write connection."""
        conn = self.get_write_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(query)
            affected = cursor.rowcount
            conn.commit()
            return True, affected, None
        except Exception as e:
            conn.rollback()
            return False, 0, str(e)
        finally:
            conn.close()
