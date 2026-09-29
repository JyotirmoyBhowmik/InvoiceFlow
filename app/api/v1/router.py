"""
FastAPI v1 Central Router for all Admin, Processing, Review, and Export Modules.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Dict, Any, Optional

api_router = APIRouter(prefix="/api/v1")


@api_router.get("/documents", tags=["Documents"])
async def list_documents(
    status: Optional[str] = Query(None),
    limit: int = 50,
    offset: int = 0
):
    return {"items": [], "total": 0, "limit": limit, "offset": offset}


@api_router.get("/documents/{document_id}", tags=["Documents"])
async def get_document(document_id: str):
    return {"id": document_id, "fields": {}, "line_items": []}


@api_router.post("/documents/{document_id}/approve", tags=["Review Workbench"])
async def approve_document(document_id: str):
    return {"id": document_id, "status": "APPROVED"}


@api_router.post("/documents/{document_id}/reject", tags=["Review Workbench"])
async def reject_document(document_id: str, reason: str):
    return {"id": document_id, "status": "REJECTED", "reason": reason}


@api_router.get("/fields", tags=["Field Definitions"])
async def list_field_definitions():
    return {"items": []}


@api_router.get("/rules", tags=["Rule Builder"])
async def list_rules():
    return {"items": []}


@api_router.post("/export/runs", tags=["SAP Export"])
async def create_export_run():
    return {"run_number": "RUN-2026-0001", "status": "GENERATED"}
