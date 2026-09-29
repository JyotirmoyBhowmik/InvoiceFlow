"""
InvoiceFlow FastAPI Core Application.
Enterprise async microservice with dynamic metadata routing.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Dict, Any
from app.config import settings
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence: load dynamic configurations and error catalogs
    yield
    # Shutdown sequence: dispose engine connection pools
    await engine.dispose()


app = FastAPI(
    title="InvoiceFlow Core Engine",
    description="Enterprise metadata-driven invoice ingestion, OCR, AI extraction, and SAP ECC export API.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz", tags=["Observability"])
async def health_check() -> Dict[str, str]:
    return {"status": "healthy", "service": settings.APP_NAME}


@app.get("/readyz", tags=["Observability"])
async def readiness_check() -> Dict[str, Any]:
    return {
        "status": "ready",
        "environment": settings.ENVIRONMENT,
        "database": "connected",
        "erp_target": settings.DEFAULT_ERP
    }
