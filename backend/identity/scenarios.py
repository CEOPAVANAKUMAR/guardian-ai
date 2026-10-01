"""The four built-in demo scenarios (all synthetic, all local)."""

from typing import Any, Dict, List

from backend.identity.directory import DOMAIN
from backend.identity.models import SessionContext

ALICE = f"alice.chen@{DOMAIN}"
BEN = f"ben.okafor@{DOMAIN}"
PRIYA = f"priya.nair@{DOMAIN}"

SCENARIOS: Dict[str, Dict[str, Any]] = {
    "identity_normal": {
        "number": 1,
        "title": "Normal employee",
        "tagline": "Alice signs in with her passkey on her own laptop and builds a sales report.",
        "expected": "ALLOW",
        "playground_tag": "IDENTITY BASELINE",
        "context": {
            "claimed_account": ALICE, "device_id": "DEV-ALICE-LT-014", "network_id": "NET-HQ-WIFI",
            "login_at": "2026-10-01T09:02:11", "access_at": "2026-10-01T09:14:37",
            "auth": {"method": "passkey", "result": "passed"},
            "observed": {"datasets": ["sales_aggregates", "sales_forecast_q4"], "tools": ["bi_dashboard", "crm"],
                         "calls_per_min": 5.8},
            "data_access": {"dataset": "sales_aggregates", "action": "READ", "records": 38,
                            "destination_kind": "internal", "destination_name": "corp-bi-dashboard",
                            "declared_purpose": "sales_reporting"},
        },
    },
    "identity_device_mismatch": {
        "number": 2,
        "title": "Employee A account on Employee B device",
        "tagline": "Alice's account is used on Ben's laptop. Could be a borrowed laptop - Ben is NOT accused.",
        "expected": "STEP-UP VERIFY",
        "playground_tag": "DEVICE MISMATCH",
        "context": {
            "claimed_account": ALICE, "device_id": "DEV-BEN-LT-027", "network_id": "NET-HQ-WIFI",
            "login_at": "2026-10-01T11:20:05", "access_at": "2026-10-01T11:31:42",
            "auth": {"method": "totp", "result": "passed"},
            "observed": {"datasets": ["sales_aggregates", "sales_forecast_q4"], "tools": ["bi_dashboard", "crm"],
                         "calls_per_min": 5.4},
            "data_access": {"dataset": "sales_aggregates", "action": "READ", "records": 22,
                            "destination_kind": "internal", "destination_name": "corp-bi-dashboard",
                            "declared_purpose": "sales_reporting"},
        },
    },
    "identity_account_sharing": {
        "number": 3,
        "title": "Employee B using Employee A's account",
        "tagline": "Multiple independent signals suggest Ben is operating Alice's account at 02:47.",
        "expected": "BLOCK + attribution incident",
        "playground_tag": "ACCOUNT SHARING",
        "context": {
            "claimed_account": ALICE, "device_id": "DEV-BEN-LT-027", "network_id": "NET-HOME-BEN",
            "login_at": "2026-10-01T02:41:07", "access_at": "2026-10-01T02:47:19",
            "auth": {"method": "passkey", "result": "failed"},
            "observed": {"datasets": ["sales_forecast_q4", "invoices"], "tools": ["erp", "spreadsheet"],
                         "calls_per_min": 13.0},
            "data_access": {"dataset": "sales_forecast_q4", "action": "READ", "records": 12,
                            "destination_kind": "none", "destination_name": None,
                            "declared_purpose": "sales_reporting"},
        },
    },
    "insider_bulk_export": {
        "number": 4,
        "title": "Authorized employee, unauthorized purpose",
        "tagline": "Priya, strongly verified on her own laptop, bulk-exports customer PII to a personal cloud.",
        "expected": "BLOCK + insider misuse incident",
        "playground_tag": "INSIDER MISUSE",
        "context": {
            "claimed_account": PRIYA, "device_id": "DEV-PRIYA-LT-033", "network_id": "NET-HQ-WIFI",
            "login_at": "2026-10-01T14:02:51", "access_at": "2026-10-01T14:19:08",
            "auth": {"method": "passkey", "result": "passed"},
            "observed": {"datasets": ["crm_customer_pii"], "tools": ["crm", "ticketing"], "calls_per_min": 9.0},
            "data_access": {"dataset": "crm_customer_pii", "action": "EXPORT", "records": 48200,
                            "destination_kind": "external", "destination_name": "personal-cloud-drive.example",
                            "declared_purpose": "sales_reporting"},
        },
    },
}


def get_context(scenario_id: str) -> SessionContext:
    return SessionContext(**SCENARIOS[scenario_id]["context"])


def list_scenarios() -> List[Dict[str, Any]]:
    return [
        {"id": sid, "number": s["number"], "title": s["title"], "tagline": s["tagline"],
         "expected": s["expected"], "tag": s["playground_tag"], "context": s["context"]}
        for sid, s in SCENARIOS.items()
    ]
