"""
Structured process logger for pipeline tracing and audit tracking.
Writes directly to the partitioned process_log table.
"""

import time
import uuid
import structlog
from typing import Optional, Any, Dict
from datetime import datetime, timezone

logger = structlog.get_logger()


class ProcessLogger:
    @staticmethod
    async def log_step(
        db_session,
        module: str,
        step_name: str,
        status: str,
        message: str,
        duration_ms: int = 0,
        run_id: Optional[str] = None,
        document_id: Optional[str] = None,
        error_code: Optional[str] = None,
        input_payload: Optional[Dict[str, Any]] = None,
        output_payload: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
        actor: str = "system"
    ) -> None:
        log_entry = {
            "id": str(uuid.uuid4()),
            "event_timestamp": datetime.now(timezone.utc),
            "run_id": run_id,
            "document_id": document_id,
            "module": module,
            "step_name": step_name,
            "status": status,
            "duration_ms": duration_ms,
            "error_catalog_code": error_code,
            "message": message,
            "input_payload": input_payload or {},
            "output_payload": output_payload or {},
            "correlation_id": correlation_id or str(uuid.uuid4()),
            "actor": actor
        }
        
        # Output via structlog for console / OpenTelemetry streaming
        logger.info(
            "process_step_event",
            module=module,
            step=step_name,
            status=status,
            doc_id=document_id,
            error=error_code,
            duration_ms=duration_ms
        )
        
        # Direct SQL write if session is provided
        if db_session:
            try:
                from sqlalchemy import text
                stmt = text("""
                    INSERT INTO invoiceflow.process_log (
                        id, event_timestamp, run_id, document_id, module, step_name,
                        status, duration_ms, error_catalog_code, message,
                        input_payload, output_payload, correlation_id, actor
                    ) VALUES (
                        :id, :event_timestamp, :run_id, :document_id, :module, :step_name,
                        :status, :duration_ms, :error_catalog_code, :message,
                        CAST(:input_payload AS JSONB), CAST(:output_payload AS JSONB), :correlation_id, :actor
                    )
                """)
                import json
                await db_session.execute(stmt, {
                    **log_entry,
                    "input_payload": json.dumps(log_entry["input_payload"]),
                    "output_payload": json.dumps(log_entry["output_payload"]),
                })
                await db_session.commit()
            except Exception as ex:
                logger.error("process_log_write_failed", error=str(ex))
