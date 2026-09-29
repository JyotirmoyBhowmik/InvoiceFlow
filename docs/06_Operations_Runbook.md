# InvoiceFlow — Operations Runbook & Incident Playbooks

**Target Audience**: Site Reliability Engineers (SRE), Systems Administrators, DevOps  

---

## 1. Health & Telemetry Probes

| Probe Endpoint | Target Port | Protocol | Success Condition | Action on Failure |
|---|---|---|---|---|
| `/healthz` | `8000` | HTTP GET | HTTP 200 `{"status": "healthy"}` | Restart FastAPI container |
| `/readyz` | `8000` | HTTP GET | HTTP 200 `{"status": "ready", "database": "connected"}` | Check PostgreSQL connection pool |
| `/metrics` | `8000` | HTTP GET | Prometheus text format | Alert if scrape failures persist |

---

## 2. Top Incident Playbooks

### Incident Playbook 1: PostgreSQL Connection Exhaustion (`SYS-001`)
- **Symptom**: API endpoints return HTTP 500; logs show `remaining connection slots are reserved for non-replication superuser connections`.
- **Diagnosis**:
  ```bash
  psql -U postgres -d invoiceflow -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
  ```
- **Remediation**:
  1. Restart pgbouncer connection pooler if present.
  2. Increase `max_connections` in `postgresql.conf` or reduce pool size in `app/db/session.py` (`pool_size=20, max_overflow=10`).

### Incident Playbook 2: Mailbox Delta Cursor Desynchronization (`MAIL-003`)
- **Symptom**: Ingestion worker repeatedly ingests duplicate emails or misses recent messages.
- **Diagnosis**: Microsoft Graph delta token invalidated due to mailbox reorganization or expiration.
- **Remediation**:
  1. Open Admin Panel -> **Mailbox Profiles**.
  2. Click **Reset Delta Cursor**.
  3. The worker resets cursor state to `NULL` and fetches all messages from the last 24 hours idempotently (deduplicating via SHA-256 artifact hashes).

### Incident Playbook 3: Redis Task Queue Backlog
- **Symptom**: Celery Flower (`http://localhost:5555`) shows task queue depth exceeding 5,000 tasks.
- **Diagnosis**: High OCR worker execution time on large multipage PDF files.
- **Remediation**:
  1. Scale worker containers:
     ```bash
     docker compose up -d --scale celery-worker=4
     ```
  2. Inspect queue depth in Redis:
     ```bash
     redis-cli llen celery
     ```

---

## 3. Database Maintenance & Log Partition Management

InvoiceFlow writes high-frequency audit logs to the `invoiceflow.process_log` table, partitioned monthly by `event_timestamp`.

### Automated Monthly Partition Script
Run monthly via cron to create future partitions:
```sql
SELECT invoiceflow.create_monthly_process_log_partition(CURRENT_DATE + INTERVAL '1 month');
```

### Log Retention & Archival
To archive logs older than 180 days:
```bash
pg_dump -U postgres -d invoiceflow -t "invoiceflow.process_log_2026_01" | gzip > /archives/process_log_2026_01.sql.gz
psql -U postgres -d invoiceflow -c "DROP TABLE invoiceflow.process_log_2026_01;"
```
