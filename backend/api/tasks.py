"""Task manifest endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List
from shared.schemas import TaskManifest, TaskManifestCreate
from backend.core.container import get_container, ServiceContainer

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("", response_model=TaskManifest)
def create_task_manifest(
    manifest_in: TaskManifestCreate,
    container: ServiceContainer = Depends(get_container),
):
    return container.manifest_service.create_manifest(manifest_in)

@router.get("", response_model=List[TaskManifest])
def list_task_manifests(
    container: ServiceContainer = Depends(get_container),
):
    return list(container.manifest_service.list_manifests().values())

@router.get("/{task_id}", response_model=TaskManifest)
def get_task_manifest(
    task_id: str,
    container: ServiceContainer = Depends(get_container),
):
    manifest = container.manifest_service.get_manifest(task_id)
    if not manifest:
        raise HTTPException(status_code=404, detail="Task manifest not found")
    return manifest
