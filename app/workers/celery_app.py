"""
Celery Worker Configuration & Pipeline Stage Tasks.
"""

from celery import Celery
from app.config import settings

celery_app = Celery(
    "invoiceflow",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)


@celery_app.task(name="invoiceflow.poll_mailboxes")
def task_poll_mailboxes():
    return {"status": "polled", "messages_found": 0}


@celery_app.task(name="invoiceflow.process_document_pipeline")
def task_process_document(document_id: str):
    return {"document_id": document_id, "status": "processed"}


@celery_app.task(name="invoiceflow.execute_export_run")
def task_execute_export_run(run_id: str):
    return {"run_id": run_id, "status": "exported"}
