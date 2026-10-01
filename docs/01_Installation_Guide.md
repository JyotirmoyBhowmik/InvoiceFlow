# InvoiceFlow Installation & Sizing Guide

---

## 1. System Requirements & Deployment Profiles

InvoiceFlow supports two deployment profiles to accommodate varying operational scales:

### 1.1 Full Enterprise Profile (High-Volume Multi-Tenant)
- **Components:** Headless Worker + Web Admin Panel + PostgreSQL 16 + Redis 7 + Celery Workers + Flower.
- **Sizing:** 8–16 CPU cores, 16–32 GB RAM, SSD/NVMe storage.
- **Applicability:** Multi-company implementations with concurrent human review teams (> 2,500 invoices/day).

### 1.2 Lite Profile (Minimum Headless Deployment — Recommended for Customer)
- **Components:** Headless Worker + Relational Database + Object Storage (Local/Azure Blob).
- **Zero Redis Dependency:** Uses lightweight internal `APScheduler` instead of Celery/Redis.
- **Zero UI Dependency:** The processing engine runs fully as a console background service (`python -m app.cli serve-worker`).
- **Sizing:** 2–4 CPU cores, 4–8 GB RAM. Operates comfortably on a standard Azure B2s VM or Azure Container App.
- **Applicability:** Unattended email-in / email-out travel & airline processing (1,000–3,000 invoices/month).

---

## 2. Database Portability & Dialect Switch

InvoiceFlow uses pure application-layer business logic through SQLAlchemy 2.0. Database triggers and stored procedures containing business logic are strictly eliminated, enabling seamless portability across database engines:

### 2.1 Target Dialect Configuration (`DATABASE_URL`)
- **PostgreSQL 16+ (Default):**
  ```env
  DATABASE_URL=postgresql+asyncpg://app_user:StrongPassword@localhost:5432/invoiceflow
  ```
- **Microsoft Azure SQL / SQL Server 2022:**
  ```env
  DATABASE_URL=mssql+aioodbc://app_user:StrongPassword@customer-sql.database.windows.net:1433/invoiceflow?driver=ODBC+Driver+18+for+SQL+Server
  ```
- **MySQL 8.0+ / Azure Database for MySQL:**
  ```env
  DATABASE_URL=mysql+aiomysql://app_user:StrongPassword@localhost:3306/invoiceflow
  ```

*Note on Fuzzy Matching:* On PostgreSQL, `pg_trgm` GIN indexes are used when available; on SQL Server and MySQL, InvoiceFlow automatically activates the built-in, portable Python Levenshtein/Jaro-Winkler application-layer matching engine with identical scoring results.

---

## 3. Azure Deployment Architecture (Customer Dedicated Tenant)

Deploying within Customer's Azure tenant ensures complete data sovereignty and direct ExpressRoute integration with SAP ECC:

```bash
# 1. Create dedicated Resource Group
az group create --name rg-customer-invoiceflow --location southeastasia

# 2. Provision Azure Database for PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group rg-customer-invoiceflow \
  --name ps-customer-invoiceflow \
  --location southeastasia \
  --admin-user invoiceflow_admin \
  --admin-password 'ComplexPassword123!' \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 64

# 3. Provision Azure Blob Storage Container with Private Endpoint
az storage account create \
  --resource-group rg-customer-invoiceflow \
  --name stcustomerinvoiceflow \
  --location southeastasia \
  --sku Standard_LRS

# 4. Deploy InvoiceFlow Headless Worker Container App
az containerapp create \
  --name app-invoiceflow-worker \
  --resource-group rg-customer-invoiceflow \
  --environment env-customer-apps \
  --image customeracr.azurecr.io/invoiceflow-worker:latest \
  --target-port 8000 \
  --ingress internal \
  --env-vars \
    DATABASE_URL="secretref:db-conn" \
    STORAGE_TYPE="AZURE_BLOB" \
    AZURE_STORAGE_ACCOUNT="stcustomerinvoiceflow" \
    AI_PROVIDER_DEFAULT="AZURE_OPENAI"
```

---

## 4. Network Ports & Firewall Rules

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
