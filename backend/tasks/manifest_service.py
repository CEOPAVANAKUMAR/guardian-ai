"""Task Manifest management service for GuardianAI.

Maintains immutable task authorizations outside the agent's control.
"""

from typing import Dict, Optional
import uuid
import time
from shared.constants import ActionType
from shared.schemas import TaskManifest, TaskManifestCreate

class ManifestService:
    def __init__(self):
        self._manifests: Dict[str, TaskManifest] = {}
        self._seed_default_manifests()

    def _seed_default_manifests(self):
        # Default benign sales report task
        sales_task = TaskManifest(
            task_id="task_sales_report_001",
            agent_id="agent_analyst_01",
            description="Generate monthly sales and invoice analytics",
            allowed_actions=[
                ActionType.DB_READ,
                ActionType.READ_DOCUMENT,
            ],
            allowed_resources=["sales", "invoices", "clean_invoice.pdf", "poisoned_invoice.pdf"],
            denied_resources=["fake_secrets.env", ".env", "credentials", "api_keys"],
            max_records_affected=100,
            can_read_secrets=False,
            can_send_external=False,
        )
        self._manifests[sales_task.task_id] = sales_task

        # DB Cleanup task (allowed to delete with where condition)
        cleanup_task = TaskManifest(
            task_id="task_db_maintenance_002",
            agent_id="agent_dba_02",
            description="Perform inactive user maintenance and data purging",
            allowed_actions=[
                ActionType.DB_READ,
                ActionType.DB_WRITE,
                ActionType.DB_DELETE,
            ],
            allowed_resources=["customers", "logs"],
            denied_resources=["fake_secrets.env", ".env"],
            max_records_affected=1000,
            can_read_secrets=False,
            can_send_external=False,
        )
        self._manifests[cleanup_task.task_id] = cleanup_task

    def create_manifest(self, manifest_in: TaskManifestCreate) -> TaskManifest:
        manifest = TaskManifest(
            task_id=manifest_in.task_id,
            agent_id=manifest_in.agent_id,
            description=manifest_in.description,
            allowed_actions=manifest_in.allowed_actions,
            allowed_resources=manifest_in.allowed_resources,
            denied_resources=manifest_in.denied_resources,
            max_records_affected=manifest_in.max_records_affected,
            can_read_secrets=manifest_in.can_read_secrets,
            can_send_external=manifest_in.can_send_external,
            created_at=time.time(),
        )
        self._manifests[manifest.task_id] = manifest
        return manifest

    def get_manifest(self, task_id: str) -> Optional[TaskManifest]:
        return self._manifests.get(task_id)

    def list_manifests(self) -> Dict[str, TaskManifest]:
        return self._manifests
