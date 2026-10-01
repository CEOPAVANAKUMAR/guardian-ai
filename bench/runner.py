"""Benchmark runner for GuardianAI.

Executes fixed security and authorization test cases from bench/cases.yaml,
measures latency distributions (p50, p95, p99), and computes empirical metrics.
"""

import json
import sys
import time
from pathlib import Path
from typing import Any, Dict, List
import yaml

BENCH_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BENCH_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from shared.constants import ActionType, Decision, RiskLevel, TaintLevel
from shared.schemas import ActionRequest
from backend.adapters.database import DatabaseAdapter
from backend.adapters.sql_analyzer import SQLAnalyzer
from backend.approvals.dry_run import DryRunService
from backend.approvals.service import ApprovalService
from backend.approvals.signing import CapabilityTokenService
from backend.audit.chain import AuditChain
from backend.core.pipeline import AuthorizationPipeline
from backend.core.taint_engine import TaintEngine
from backend.policy.evaluator import PolicyEvaluator
from backend.tasks.manifest_service import ManifestService

BENCH_DIR = Path(__file__).resolve().parent

def run_benchmark():
    cases_file = BENCH_DIR / "cases.yaml"
    with open(cases_file, "r", encoding="utf-8") as f:
        cases_data = yaml.safe_load(f).get("cases", [])

    # Setup pristine benchmark environment
    test_db = BENCH_DIR / "bench_scratch.db"
    if test_db.exists():
        test_db.unlink()

    db_adapter = DatabaseAdapter(db_path=str(test_db))
    token_svc = CapabilityTokenService(secret_key="bench_secret_key")
    dry_run = DryRunService(db_adapter)
    appr_svc = ApprovalService(token_service=token_svc, dry_run_service=dry_run)
    audit = AuditChain(secret_key="bench_audit_key")
    evaluator = PolicyEvaluator()
    manifest_svc = ManifestService()
    taint_eng = TaintEngine()
    sql_ana = SQLAnalyzer()

    pipeline = AuthorizationPipeline(
        policy_evaluator=evaluator,
        manifest_service=manifest_svc,
        taint_engine=taint_eng,
        sql_analyzer=sql_ana,
        db_adapter=db_adapter,
        token_service=token_svc,
        approval_service=appr_svc,
        audit_chain=audit,
    )

    total_tests = len(cases_data)
    blocked_malicious = 0
    unsafe_allowed = 0
    false_positives = 0
    escalated_count = 0
    correct_decisions = 0
    latencies: List[float] = []
    case_results: List[Dict[str, Any]] = []

    print(f"[*] Executing {total_tests} GuardianAI benchmark cases...")

    for case in cases_data:
        c_id = case["id"]
        category = case["category"]
        expected_dec = case["expected_decision"]
        target_taint = case.get("taint_level", "CLEAN")

        # Create or retrieve session
        session = taint_eng.create_session(case["agent_id"], case["task_id"])
        if target_taint != "CLEAN":
            taint_eng.taint_session(session.session_id, TaintLevel(target_taint), source="bench_fixture")

        try:
            action_type_enum = ActionType(case["action_type"])
        except ValueError:
            # Handle unknown or test action types
            action_type_enum = ActionType.DB_READ

        req = ActionRequest(
            agent_id=case["agent_id"],
            session_id=session.session_id,
            task_id=case["task_id"],
            action_type=action_type_enum,
            resource=case["resource"],
            params=case.get("params", {}),
        )

        t_start = time.perf_counter()
        res = pipeline.authorize(req)
        lat_ms = (time.perf_counter() - t_start) * 1000.0
        latencies.append(lat_ms)

        actual_dec = res.decision.value
        is_pass = False

        if actual_dec == expected_dec:
            is_pass = True
            correct_decisions += 1
        elif expected_dec in ("ALLOW", "ALLOW_WITH_CONSTRAINTS") and actual_dec in ("ALLOW", "ALLOW_WITH_CONSTRAINTS"):
            is_pass = True
            correct_decisions += 1

        # Security metrics breakdown
        is_malicious_test = category in (
            "destructive database",
            "secret access",
            "external exfiltration",
            "tainted context",
            "out-of-scope",
            "unknown action",
        )

        if is_malicious_test:
            if actual_dec == Decision.DENY.value:
                blocked_malicious += 1
            elif actual_dec in (Decision.ALLOW.value, Decision.ALLOW_WITH_CONSTRAINTS.value):
                unsafe_allowed += 1

        if category == "benign":
            if actual_dec == Decision.DENY.value:
                false_positives += 1

        if actual_dec == Decision.ESCALATE.value:
            escalated_count += 1

        case_results.append({
            "id": c_id,
            "category": category,
            "expected": expected_dec,
            "actual": actual_dec,
            "passed": is_pass,
            "latency_ms": round(lat_ms, 3),
            "reasons": res.reasons,
        })

    # Compute percentiles
    latencies.sort()
    def get_percentile(data, p):
        if not data:
            return 0.0
        idx = int(len(data) * p)
        if idx >= len(data):
            idx = len(data) - 1
        return round(data[idx], 3)

    p50 = get_percentile(latencies, 0.50)
    p95 = get_percentile(latencies, 0.95)
    p99 = get_percentile(latencies, 0.99)
    avg_lat = round(sum(latencies) / len(latencies), 3)

    summary = {
        "total_tests": total_tests,
        "correct_decisions": correct_decisions,
        "blocked_malicious": blocked_malicious,
        "unsafe_allowed": unsafe_allowed,
        "false_positives": false_positives,
        "escalated": escalated_count,
        "accuracy_pct": round((correct_decisions / total_tests) * 100.0, 2),
        "latency_p50_ms": p50,
        "latency_p95_ms": p95,
        "latency_p99_ms": p99,
        "latency_avg_ms": avg_lat,
    }

    output_data = {
        "summary": summary,
        "cases": case_results,
    }

    # Save actual results to bench/results.json
    results_path = BENCH_DIR / "results.json"
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2)

    # Clean up test database
    if test_db.exists():
        try:
            test_db.unlink()
        except Exception:
            pass

    print("\n" + "=" * 60)
    print("GUARDIANAI BENCHMARK RESULTS")
    print("=" * 60)
    for k, v in summary.items():
        print(f"  {k:22}: {v}")
    print("=" * 60)
    print(f"Saved benchmark results to: {results_path}\n")

    return summary

if __name__ == "__main__":
    run_benchmark()
