"""GuardianAI Backend API Server."""

from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import settings
from backend.core.container import get_container
from backend.api import (
    authorize,
    execute,
    tasks,
    sessions,
    ingest,
    approvals,
    audit,
    demo,
    stats,
    auth,
    incidents,
    ai_analysis,
    copilot,
    identity,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure database initialized
    container = get_container()
    container.db.init_database()
    yield

app = FastAPI(
    title="GuardianAI",
    description="Runtime Trust Infrastructure for Autonomous AI Agents",
    version=settings.VERSION,
    lifespan=lifespan,
)

# Enable CORS for frontend cybersecurity dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "guardian_enabled": settings.GUARDIAN_ENABLED,
    }

# Include API v1 Routers
api_prefix = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=api_prefix)
app.include_router(incidents.router, prefix=api_prefix)
app.include_router(authorize.router, prefix=api_prefix)
app.include_router(execute.router, prefix=api_prefix)
app.include_router(tasks.router, prefix=api_prefix)
app.include_router(sessions.router, prefix=api_prefix)
app.include_router(ingest.router, prefix=api_prefix)
app.include_router(approvals.router, prefix=api_prefix)
app.include_router(audit.router, prefix=api_prefix)
app.include_router(demo.router, prefix=api_prefix)
app.include_router(stats.router, prefix=api_prefix)
app.include_router(ai_analysis.router, prefix=api_prefix)
app.include_router(copilot.router, prefix=api_prefix)
app.include_router(identity.router, prefix=api_prefix)

# Mount static files and SPA fallback if frontend/dist exists
dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if dist_dir.exists():
    assets_dir = dist_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_index():
        return FileResponse(dist_dir / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if (
            full_path.startswith("api")
            or full_path.startswith("docs")
            or full_path.startswith("redoc")
            or full_path == "openapi.json"
        ):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = dist_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(dist_dir / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.GUARDIAN_HOST, port=settings.GUARDIAN_PORT, reload=True)

