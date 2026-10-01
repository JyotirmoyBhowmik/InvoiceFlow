# J2 — Feasibility and Accuracy Assessment Template
**Document Reference:** `docs/decision/J2_Feasibility_and_Accuracy_Assessment_Template.md`  
**Purpose:** Formal evaluation report structure populated by the InvoiceFlow Evaluation Harness (`app.services.eval_service`) following empirical benchmarking of Customer invoice samples.  
**Audience:** Joint Evaluation Committee (Customer Finance, Customer ITD, Project Steering Group)

---

## 1. Document Control & Evaluation Metadata

| Attribute | Details |
|---|---|
| **Evaluation Set Name** | `CUSTOMER_TRAVEL_SAMPLE_SET_V1` |
| **Execution Date** | `YYYY-MM-DD` |
| **Model Profile Tested** | `gemini-3.1-flash-lite` / `gemini-2.5-flash` / `azure-openai-gpt4o-mini` |
| **Target Database Engine** | PostgreSQL 16 (Customer Landing Zone) |
| **Total Invoices Tested** | `[Total Count, e.g. 185]` |
| **Evaluators** | Customer Finance Team (Dipendra, Saurabh) & Technical Team (Vinod, Nitesh) |

---

## 2. Accuracy & Straight-Through Processing (STP) Metrics

### 2.1 Overall Performance Summary
- **Target STP Benchmark:** **95.0% – 98.0%** (Reference solution baseline)
- **Achieved Document-Level STP Rate:** **`[__._]%`**
- **Average Extraction Latency:** **`[____] ms`** per invoice
- **Average Variable AI Cost:** **`[0.____] INR`** (NPR `[0.____]`) vs 15 paisa benchmark

### 2.2 Field-Level Accuracy Matrix

| Field Key | Total Evaluated | Exact Match % | Tolerance Match (<= 0.05) % | Reference SLA | Status |
|---|---|---|---|---|---|
| **`invoice_number`** | | | N/A | 95.0% | `[PASS / FAIL]` |
| **`invoice_date`** | | | N/A | 95.0% | `[PASS / FAIL]` |
| **`vendor_name`** | | | | 95.0% | `[PASS / FAIL]` |
| **`vendor_tax_id` (PAN/GST)** | | | N/A | 95.0% | `[PASS / FAIL]` |
| **`taxable_value`** | | | | 95.0% | `[PASS / FAIL]` |
| **`tax_amount`** | | | | 95.0% | `[PASS / FAIL]` |
| **`total_cost`** | | | | 98.0% | `[PASS / FAIL]` |
| **`trip_id` (when present)**| | | N/A | 90.0% | `[PASS / FAIL]` |
| **`pnr_number` (Airlines)** | | | N/A | 95.0% | `[PASS / FAIL]` |

---

## 3. Customer-Specific & Nepali Language Performance (Part G.6)

| Evaluation Category | Evaluated Count | STP Rate % | Accuracy Observations |
|---|---|---|---|
| **Devanagari Numerals (०–९)** | | | Normalization to Arabic digits: 100% deterministic |
| **Bikram Sambat (B.S.) Dates** | | | Mapping against database conversion calendar |
| **Nepal VAT 13% Reconciliation** | | | Taxable base + 13% tax matches gross total |
| **Nepali-Language Invoices (Printed)**| | | Hotel & regional transportation invoices |
| **Handwritten / Manual Bills** | | | Routed to mandatory exception review |

---

## 4. Financial & Token Cost Analysis

- **Benchmark Cost (Customer Travel Invoices):** Approximately **15 paisa (INR 0.1500 / NPR 0.2400)** per invoice.
- **Measured Empirical Token Usage:**
  - Average Input Tokens: `[____]` tokens
  - Average Output Tokens: `[____]` tokens
  - Effective AI Cost per Document: **`INR [0.____]` / `NPR [0.____]`**
- **Financial Assessment:** 
  `[ ] Meets / beats 15 paisa benchmark`  
  `[ ] Exceeds benchmark (> 25 paisa) — optimization of system prompt / token window required`

---

## 5. Formal Decision Section: Go / Conditional-Go / No-Go

Based on empirical testing against the ground-truth dataset, the steering committee adopts the following determination:

### Option A: GO (Full Production Implementation)
- **Criteria:**
  1. Overall document STP rate >= 95.0%.
  2. Critical financial fields (`total_cost`, `tax_amount`, `vendor_tax_id`) match >= 95.0%.
  3. Nepali Devanagari numerals and B.S. dates successfully reconcile.
  4. Variable cost is within 20 paisa (INR 0.20) per invoice.

### Option B: CONDITIONAL-GO (Targeted Adaptation Phase)
- **Criteria:**
  1. Overall STP is between 88.0% and 94.9%.
  2. Failures are isolated to known edge formats (e.g. handwritten cab slips or non-standard vendor templates).
  3. **Mandatory Conditions:**
     - Configure dedicated extraction prompt / low-confidence routing for handwritten bills.
     - Complete vendor alias mapping in master data for regional hotels.
     - Re-test within 10 business days.

### Option C: NO-GO (Fundamental Architectural Redesign)
- **Criteria:**
  1. STP rate falls below 85.0%.
  2. AI model consistently hallucinates financial figures or vendor tax IDs.
  3. Devanagari parsing fails on standard printed bills.

---

## 6. Committee Sign-off

| Role | Name | Signature | Date |
|---|---|---|---|
| **Customer Project Lead** | Vinod | _____________________ | _________ |
| **Customer Finance Lead** | Dipendra / Saurabh | _____________________ | _________ |
| **Technical Implementation Lead** | Nitesh | _____________________ | _________ |
| **Solution Architect** | Developer | _____________________ | _________ |
