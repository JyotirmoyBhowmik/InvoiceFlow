# J4 — Deployment Option Paper: Cloud vs On-Premises Architecture
**Document Reference:** `docs/decision/J4_Deployment_Option_Paper.md`  
**Purpose:** Evaluates infrastructure and deployment options for InvoiceFlow for Customer, comparing Customer's Azure tenant, on-premises data center, shared landing zone, and alternate cloud options.  
**Audience:** Customer CIO, Infrastructure Steering Group, Security & Compliance Office

---

## 1. Context & Business Constraints

During technical review, the team confirmed:
1. Customer has an **on-premises data center** and an independent **Azure tenant**, separate from the ITC shared data center.
2. The reference solution was originally prototyped on Google Vertex AI with MySQL.
3. Customer requires evaluation of whether to deploy InvoiceFlow in Customer's Azure tenant, on-premises VM, or via a shared landing zone, with critical attention to **data residency**, **network connectivity (ExpressRoute)**, and **security isolation**.

---

## 2. Comparative Analysis of Deployment Options

| Evaluation Dimension | Option 1: Customer Azure Tenant (Recommended) | Option 2: Customer On-Premises Data Center | Option 3: Shared Landing Zone (ITC Google Cloud) | Option 4: AWS Cloud |
|---|---|---|---|---|
| **Primary Compute** | Azure Container Apps / Azure VM (Linux) | VMware / Hyper-V Virtual Machines | Google Cloud Run / Compute Engine | AWS ECS / EC2 |
| **Database Engine** | Azure Database for PostgreSQL Flexible Server | On-Prem PostgreSQL 16 or MS SQL Server 2022 | Cloud SQL for PostgreSQL / Cloud SQL for MySQL | Amazon RDS for PostgreSQL |
| **Object Storage** | Azure Blob Storage (Hot/Cool tier) with Private Endpoint | On-Prem MinIO / Enterprise SAN | Google Cloud Storage (Regional) | Amazon S3 |
| **AI Provider Integration** | Azure OpenAI / Azure AI Foundry (India Central / SE Asia) OR Gemini via secure proxy | Self-hosted vLLM / Ollama OR outbound proxy to Azure AI / Gemini | Google Vertex AI (Gemini 2.5 Flash / Gemini 3.1) | AWS Bedrock / Claude |
| **Network Path** | Customer ExpressRoute / Site-to-Site VPN directly into SAP ECC | Direct internal LAN access to SAP ECC and Mail servers | Requires cross-tenant VPN or dedicated interconnect to Customer | Site-to-Site VPN to Customer SAP |
| **Data Residency & Compliance** | Data encrypted at rest in Customer tenant. Outbound AI calls locked to nearest authorized cloud region. | Highest on-premises residency; images remain within company perimeter. | Data leaves Customer tenant to group tenant; requires legal/inter-company approval. | Third-party cloud; no existing tenancy setup. |
| **One-Time Setup Cost** | Low (leveraging existing Azure EA and subscription) | Medium (hardware provisioning, VM allocation) | Medium (cross-tenant security approval, VPC peering) | High (new account setup, compliance onboarding) |
| **Monthly Operating Cost** | Pay-as-you-go (~$120–$250/month for DB, storage & container) | Existing hardware sunk cost; operational maintenance overhead | Shared group allocation billing | Standard AWS cloud billing |
| **Disaster Recovery (DR)** | Azure GRS / paired region automated failover | Manual SAN replication or cold standby | Group DR policies | AWS multi-AZ |

---

## 3. Deep Dive: Customer Azure Tenant Architecture (Option 1)

```
[Customer Email Ingestion]
  Users / Vendors email invoices to: travel.invoices@snpl.com.np
       │
       ▼
[Microsoft 365 / Entra ID] ──────────► Graph API Webhook / Polling
                                              │
                                              ▼
                                 [InvoiceFlow Headless Worker]
                                 (Azure Container App / VM in VNet)
                                 - Layer 1 Preprocess & Deskew
                                 - Layer 2 Text & Layout Extraction
                                 - Layer 3 AI Multimodal Extraction
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
          [Azure AI Foundry / OpenAI]                   [Azure PostgreSQL Flexible Server]
          (Locked Region: India Central / SE Asia)       (Private Endpoint, schema: invoiceflow)
                      │                                               │
                      ▼                                               ▼
          [Deterministic Rules Engine]                   [Azure Blob Storage]
          - Tax Master (Nepal VAT 13%)                   - Encrypted Invoice Artifacts
          - Vendor Matching (PAN / GSTIN)                - MIS Package ZIP Archives
          - GL & Cost Center Resolution
                      │
                      ▼
          [Run Manager & Export Gate]
          - SAP ECC Vendor Posting File (CSV/TXT via ExpressRoute SFTP)
          - Threaded Return Email with MIS ZIP & Status Summary
```

### Security & Data Residency Controls:
1. **Private Endpoints:** All database connections (`Azure Database for PostgreSQL`) and Blob Storage endpoints are strictly bound to private IP addresses inside Customer's Virtual Network (`VNet`).
2. **AI Provider Region Locking:** If Azure OpenAI is selected, model endpoints are locked to `centralindia` or `southeastasia`. Under Azure enterprise terms, data is processed in-memory and **never used for model training**.
3. **Optional PII Redaction:** The engine can redact traveler personal phone numbers, passport numbers, and credit card numbers before sending invoice text to the AI endpoint.

---

## 4. Cost Drivers Breakdown

1. **Infrastructure (Azure Tenant):**
   - Container Apps / B2s VM: ~$35–$60 / month.
   - Azure PostgreSQL Flexible Server (D2ds_v5, Burstable): ~$70–$120 / month.
   - Blob Storage (Hot, 50 GB/year): ~$5 / month.
   - **Total Hosting:** **~$110–$185 / month**.
2. **Variable AI Inference Cost:**
   - At 1,500 travel invoices / month:
   - Measured benchmark: ~15 paisa INR (~NPR 0.24) per invoice.
   - Monthly AI cost: $1,500 \times 0.15 \text{ INR} = \text{INR } 225 \approx \mathbf{\$2.70 \text{ / month}}$.
3. **Comparison with Current ITD Cost:**
   - Reference baseline: ITD existing cost is approximately ₹12,000 / year (~$145 / year).
   - Internal development within Customer creates **zero external software licensing fees**.

---

## 5. Formal Recommendation

**Recommendation: Deploy Option 1 (Customer Dedicated Azure Tenant).**  
- **Justification:** Customer already operates an active Azure tenant with existing ExpressRoute connectivity into internal ERP systems. This eliminates dependencies on ITC group cross-tenant approvals, satisfies data governance, enables end-to-end automation via Microsoft Graph API, and keeps monthly infrastructure costs minimal (~$120–$180/mo).
