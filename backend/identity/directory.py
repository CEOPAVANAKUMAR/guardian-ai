"""Local, synthetic enterprise directory used by the identity attribution engine.

Everything here is demo data. It models what a real deployment would pull from an
HR system / IdP / device-management (MDM) inventory. No biometrics, webcam,
microphone, keystroke or screen telemetry is modelled anywhere in this module:
behavioural baselines are limited to coarse *application-level* usage patterns
(which datasets/tools an account normally touches and its request cadence).
"""

from typing import Any, Dict, List

DOMAIN = "acme-corp.local"

EMPLOYEES: Dict[str, Dict[str, Any]] = {
    f"alice.chen@{DOMAIN}": {
        "name": "Alice Chen",
        "label": "Employee A",
        "role": "Sales Analyst",
        "department": "Sales",
        "devices": ["DEV-ALICE-LT-014"],
        "networks": ["NET-HQ-WIFI", "NET-HOME-ALICE"],
        "work_hours": (8, 19),
        "work_days": [0, 1, 2, 3, 4],
        "baseline": {
            "datasets": ["sales_aggregates", "sales_forecast_q4"],
            "tools": ["bi_dashboard", "crm"],
            "calls_per_min": 6.0,
        },
    },
    f"ben.okafor@{DOMAIN}": {
        "name": "Ben Okafor",
        "label": "Employee B",
        "role": "Finance Operations Analyst",
        "department": "Finance",
        "devices": ["DEV-BEN-LT-027"],
        "networks": ["NET-HQ-WIFI", "NET-HOME-BEN"],
        "work_hours": (8, 19),
        "work_days": [0, 1, 2, 3, 4],
        "baseline": {
            "datasets": ["invoices", "payroll_records", "sales_forecast_q4"],
            "tools": ["erp", "spreadsheet"],
            "calls_per_min": 14.0,
        },
    },
    f"priya.nair@{DOMAIN}": {
        "name": "Priya Nair",
        "label": "Employee C",
        "role": "Customer Success Analyst",
        "department": "Customer Success",
        "devices": ["DEV-PRIYA-LT-033"],
        "networks": ["NET-HQ-WIFI", "NET-HOME-PRIYA"],
        "work_hours": (8, 19),
        "work_days": [0, 1, 2, 3, 4],
        "baseline": {
            "datasets": ["crm_customer_pii"],
            "tools": ["crm", "ticketing"],
            "calls_per_min": 7.0,
        },
    },
}

DEVICES: Dict[str, Dict[str, Any]] = {
    "DEV-ALICE-LT-014": {"owner": f"alice.chen@{DOMAIN}", "type": "Managed laptop", "shared": False},
    "DEV-BEN-LT-027": {"owner": f"ben.okafor@{DOMAIN}", "type": "Managed laptop", "shared": False},
    "DEV-PRIYA-LT-033": {"owner": f"priya.nair@{DOMAIN}", "type": "Managed laptop", "shared": False},
    "DEV-HOTDESK-02": {"owner": None, "type": "Shared hot-desk workstation", "shared": True},
}

NETWORKS: Dict[str, str] = {
    "NET-HQ-WIFI": "Corporate HQ Wi-Fi (10.20.0.0/16)",
    "NET-HOME-ALICE": "Residential ISP - Alice (known)",
    "NET-HOME-BEN": "Residential ISP - Ben (known)",
    "NET-HOME-PRIYA": "Residential ISP - Priya (known)",
    "NET-UNKNOWN-VPN": "Unrecognised commercial VPN exit node",
}

# Sensitivity drives the bulk-access threshold (records per session).
DATASETS: Dict[str, Dict[str, Any]] = {
    "sales_aggregates": {
        "label": "Sales aggregates", "sensitivity": "INTERNAL", "bulk_threshold": 1000,
        "allowed_roles": ["Sales Analyst", "Customer Success Analyst", "Finance Operations Analyst"],
    },
    "sales_forecast_q4": {
        "label": "Q4 sales forecast", "sensitivity": "CONFIDENTIAL", "bulk_threshold": 250,
        "allowed_roles": ["Sales Analyst", "Finance Operations Analyst"],
    },
    "crm_customer_pii": {
        "label": "CRM customer PII", "sensitivity": "RESTRICTED", "bulk_threshold": 100,
        "allowed_roles": ["Customer Success Analyst"],
    },
    "payroll_records": {
        "label": "Payroll records", "sensitivity": "RESTRICTED", "bulk_threshold": 100,
        "allowed_roles": ["Finance Operations Analyst"],
    },
    "invoices": {
        "label": "Customer invoices", "sensitivity": "CONFIDENTIAL", "bulk_threshold": 250,
        "allowed_roles": ["Finance Operations Analyst"],
    },
}

# Business purposes: which datasets each purpose legitimately needs, and whether
# data may leave the company for that purpose.
PURPOSES: Dict[str, Dict[str, Any]] = {
    "sales_reporting": {
        "label": "Sales reporting", "datasets": ["sales_aggregates", "sales_forecast_q4"], "external_export": False,
    },
    "customer_support": {
        "label": "Customer support", "datasets": ["crm_customer_pii"], "external_export": False,
    },
    "invoice_reconciliation": {
        "label": "Invoice reconciliation", "datasets": ["invoices", "sales_forecast_q4"], "external_export": False,
    },
    "payroll_processing": {
        "label": "Payroll processing", "datasets": ["payroll_records"], "external_export": False,
    },
}


def employee(account: str) -> Dict[str, Any]:
    return EMPLOYEES.get(account, {})


def display_name(account: str) -> str:
    e = EMPLOYEES.get(account)
    return f"{e['name']} ({e['label']})" if e else account


def directory_snapshot() -> Dict[str, List[Dict[str, Any]]]:
    return {
        "employees": [
            {"account": a, "name": e["name"], "label": e["label"], "role": e["role"],
             "department": e["department"], "devices": e["devices"], "networks": e["networks"]}
            for a, e in EMPLOYEES.items()
        ],
        "devices": [{"id": d, **v} for d, v in DEVICES.items()],
        "networks": [{"id": n, "label": l} for n, l in NETWORKS.items()],
        "datasets": [{"id": d, **v} for d, v in DATASETS.items()],
        "purposes": [{"id": p, **v} for p, v in PURPOSES.items()],
    }
