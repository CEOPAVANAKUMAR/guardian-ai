"""Dependency injection container and service singletons for GuardianAI."""

from backend.config import settings
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

from backend.auth.service import AuthService
from backend.incidents.service import IncidentService
from backend.identity.service import IdentityService

class ServiceContainer:
    def __init__(self):
        self.db = DatabaseAdapter()
        self.sql_analyzer = SQLAnalyzer()
        self.taint_engine = TaintEngine()
        self.manifest_service = ManifestService()
        self.evaluator = PolicyEvaluator()
        self.token_service = CapabilityTokenService()
        self.dry_run = DryRunService(self.db)
        self.audit_chain = AuditChain()
        self.incident_service = IncidentService(audit_chain=self.audit_chain)
        self.approval_service = ApprovalService(
            self.token_service,
            self.dry_run,
            incident_service=self.incident_service,
        )
        self.auth_service = AuthService()
        self.identity_service = IdentityService(
            audit_chain=self.audit_chain,
            incident_service=self.incident_service,
        )
        self.pipeline = AuthorizationPipeline(
            policy_evaluator=self.evaluator,
            manifest_service=self.manifest_service,
            taint_engine=self.taint_engine,
            sql_analyzer=self.sql_analyzer,
            db_adapter=self.db,
            token_service=self.token_service,
            approval_service=self.approval_service,
            audit_chain=self.audit_chain,
            incident_service=self.incident_service,
        )

container = ServiceContainer()

def get_container() -> ServiceContainer:
    return container
