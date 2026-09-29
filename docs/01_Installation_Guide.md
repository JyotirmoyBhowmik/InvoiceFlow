# InvoiceFlow Installation & Sizing Guide

---

## 1. System Requirements & Hardware Sizing

| Workload Tier | Daily Invoice Volume | CPU Cores | RAM | Storage (NVMe/SSD) | Network IOPS |
|---|---|---|---|---|---|
| **Development / POC** | < 250 docs/day | 4 cores | 8 GB | 50 GB | Standard |
| **Standard Production** | 2,500 – 5,000 docs/day | 8 cores | 16 GB | 250 GB | 1,500 IOPS |
| **Enterprise High-Volume** | > 10,000 docs/day | 16 cores | 32 GB | 1 TB (RAID 10) | 5,000 IOPS |

- **Operating System**: Ubuntu 22.04 LTS, Ubuntu 24.04 LTS, Red Hat Enterprise Linux 9, or Debian 12.
- **Runtimes**: Python 3.14, Node.js 20 LTS.
- **Data Stores**: PostgreSQL 16+ (with `pgcrypto`, `pg_trgm`, `uuid-ossp`, `btree_gin`), Redis 7+.
- **OCR Libraries**: Tesseract 5.3+ (`tesseract-ocr`, `libtesseract-dev`, `ffmpeg`, `libsm6`, `libxext6`).

---

## 2. Network Ports & Firewall Rules

| Port | Protocol | Source | Destination | Purpose | Access Scope |
|---|---|---|---|---|---|
| **3000** | TCP/HTTP | Clients / Load Balancer | Admin Panel Container | React Vite Web Console | Public / VPN |
| **8000** | TCP/HTTP | Admin Panel / Proxies | FastAPI Backend | Core API & Ingestion Engine | Internal / VPN |
| **5432** | TCP | FastAPI / Workers | PostgreSQL 16 | Relational Master Database | Internal Only |
| **6379** | TCP | FastAPI / Workers | Redis 7 | Celery Task Broker & Cache | Internal Only |
| **5555** | TCP/HTTP | SRE / DevOps | Celery Flower | Asynchronous Task Monitor | Restricted VPN |
| **443** | TCP/HTTPS | FastAPI Backend | Outbound Internet | Microsoft Graph API / Gemini API | Outbound Egress |

---

## 3. Database Schema Initialization

Execute the four master schema files in strict sequential order:

```bash
# 1. Connect to PostgreSQL instance
psql -U postgres -h localhost -d postgres -c "CREATE DATABASE invoiceflow;"

# 2. Execute schema initialization scripts
psql -U postgres -h localhost -d invoiceflow -f schema/00_master.sql
psql -U postgres -h localhost -d invoiceflow -f schema/01_bootstrap_structure.sql
psql -U postgres -h localhost -d invoiceflow -f schema/02_views.sql
psql -U postgres -h localhost -d invoiceflow -f schema/03_partitions.sql
```

---

## 4. Environment Variables Reference (`.env`)

| Variable Name | Required? | Default / Example Value | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | `postgresql+asyncpg://postgres:secret@localhost:5432/invoiceflow` | Async SQLAlchemy 2.0 connection URI |
| `REDIS_URL` | **Yes** | `redis://localhost:6379/0` | Celery task queue broker and cache URI |
| `SECRET_KEY` | **Yes** | `MIN_32_CHAR_CRYPTOGRAPHIC_SECRET_KEY_HERE` | Session signing and JWT key |
| `GEMINI_API_KEY` | Optional | `AIzaSy...` | Fallback API key for Google Gemini provider |
| `STORAGE_TYPE` | **Yes** | `LOCAL` | Storage driver (`LOCAL`, `AZURE_BLOB`, `S3`) |
| `LOCAL_STORAGE_PATH` | If Local | `/var/lib/invoiceflow/artifacts` | Target directory for invoice document files |
| `POLL_INTERVAL_SECONDS`| No | `120` | Default mailbox polling interval in seconds |

---

## 5. Superadmin Provisioning

After database initialization, provision the root administrative account:

```bash
# Interactive mode
python -m app.cli create-admin

# Non-interactive CI/CD mode
python -m app.cli create-admin \
  --username sysadmin \
  --email admin@enterprise.com \
  --full-name "Primary System Administrator" \
  --non-interactive < secret_password.txt
```

---

## 6. Service Verification & Smoke Testing

```bash
# 1. Health Probe
curl -f http://localhost:8000/healthz
# Response: {"status": "healthy", "service": "InvoiceFlow"}

# 2. Readiness Probe
curl -f http://localhost:8000/readyz
# Response: {"status": "ready", "database": "connected", "erp_target": "SAP_ECC"}

# 3. CLI Preflight Check
python -m app.cli preflight
```
