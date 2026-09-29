# InvoiceFlow — Solution Architecture & Component Specifications

**Target Audience**: Enterprise Solution Architects, Chief Architects, Technical Directors  

---

## 1. System Context & C4 Container Diagram

```mermaid
graph TD
    User[AP Reviewer / Admin] -->|HTTPS:3000| WebUI[Vite React Admin Panel]
    MailServer[Exchange Online / MS Graph] -->|OAuth2 Client Creds| CoreAPI[FastAPI Core Engine :8000]
    WebUI -->|REST API :8000| CoreAPI

    subgraph Internal Enterprise Infrastructure
        CoreAPI -->|SQLAlchemy Async :5432| DB[(PostgreSQL 16 DB)]
        CoreAPI -->|Celery Broker :6379| Redis[(Redis Broker & Cache)]
        Worker[Celery Pipeline Workers] -->|Tasks| Redis
        Worker -->|Audit Logs| DB
    end

    subgraph External Processing & ERP
        Worker -->|GenAI SDK :443| Gemini[Google Gemini AI Extraction]
        CoreAPI -->|CSV / TXT Flat File| SAP[SAP ECC 6.0 / S/4HANA]
    end
```

---

## 2. Ingestion & Document State Machine

A document transitions through strict state gates. At no point can a document skip a gate or exist without a backing artifact:

```mermaid
stateDiagram-v2
    [*] --> INGESTED: File Bytes Stored (SHA-256 Registered)
    INGESTED --> PREPROCESSED: Layer 1 Image Deskew & Denoise
    PREPROCESSED --> OCR_COMPLETE: Layer 2 Spatial Word Boxes Extracted
    OCR_COMPLETE --> EXTRACTED: Layer 3 AI Structured Schema Extraction
    EXTRACTED --> VALIDATED: Rule Engine & Tax Formula Evaluation
    
    VALIDATED --> APPROVED: STP Score >= Threshold & No Blocking Errors
    VALIDATED --> REVIEW_PENDING: Exceptions or STP Score < Threshold
    
    REVIEW_PENDING --> APPROVED: Human Verified in Workbench
    REVIEW_PENDING --> REJECTED: AP Clerk Rejection to Vendor
    
    APPROVED --> EXPORTED: SAP ECC Batch Generated
    EXPORTED --> [*]
    REJECTED --> [*]
```

---

## 3. Technology Stack Rationale

- **PostgreSQL 16+**: Chosen for native JSONB indexing (allowing arbitrary dynamic field structures without DDL alterations), ACID guarantees, and automated monthly range partitioning for high-volume process logging.
- **FastAPI (Python 3.14)**: Asynchronous non-blocking architecture, native Pydantic v2 data validation, and automated OpenAPI 3.1 specification generation.
- **React 19 + TypeScript**: Type-safe component architecture, zero CSS-framework bloat using Tailwind CSS, and local reactive state persistence.
- **Google GenAI SDK**: Schema-constrained generative extraction providing predictable structured JSON outputs mapped directly to dynamic field definitions.
