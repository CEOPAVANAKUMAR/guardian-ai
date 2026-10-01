"""Server-side mediated document ingestion endpoint."""

from fastapi import APIRouter, HTTPException, Depends
from shared.schemas import IngestRequest, IngestResponse
from backend.core.container import get_container, ServiceContainer

router = APIRouter(prefix="/ingest", tags=["Ingestion"])

@router.post("", response_model=IngestResponse)
def ingest_document(
    payload: IngestRequest,
    container: ServiceContainer = Depends(get_container),
):
    try:
        return container.taint_engine.ingest_document(
            session_id=payload.session_id,
            agent_id=payload.agent_id,
            document_name=payload.document_name,
            file_path=payload.file_path,
            content_base64=payload.content_base64,
        )
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest document: {str(e)}")
