# J5 — Build vs. Adopt Decision Note: Strategic Implementation Path
**Document Reference:** `docs/decision/J5_Build_vs_Adopt_Decision_Note.md`  
**Purpose:** Strategic analysis comparing the adoption of the existing group reference solution, pure internal greenfield development, and a hybrid architecture.  
**Audience:** Joint Steering Committee (Vinod, Dipendra, Saurabh, Technical Leads)

---

## 1. Executive Context

Customer is evaluating the deployment of an automated, unattended invoice processing solution for corporate travel (Stream A) and airline tax credit claims (Stream B). 

The reference solution built by Customer for ITC/ITD is operational in India. Vinod and Developer discussed implementation ownership:
- Customer has internal Python engineering talent (specifically Nitesh).
- The reference codebase can be shared with Customer with hand-holding and support from Developer.
- However, Customer has unique statutory requirements (Nepal VAT 13%, Devanagari script, B.S. dates, Azure hosting) not present in the Indian reference code.

---

## 2. Comparative Analysis Matrix

| Decision Criteria | Option A: Adopt Reference Solution As-Is | Option B: Pure In-House Greenfield Build | Option C: Hybrid Implementation (Recommended) |
|---|---|---|---|
| **Approach Description** | Directly port Customer's console-based Python/MySQL codebase to Customer environment without modification. | Build an entirely new custom system from scratch inside Customer without using reference artifacts. | Adopt Customer's core extraction & rules framework; augment with InvoiceFlow's Nepal VAT, Devanagari OCR, and Admin Workbench modules. |
| **Fit to Nepal Statutory Needs** | **POOR:** Lacks Nepal 9-digit PAN validation, 13% VAT reconciliation, Devanagari digits, and Bikram Sambat conversion. | **GOOD:** Can be tailor-built, but requires substantial design effort. | **EXCELLENT:** Combines proven travel/airline extraction with pre-built Nepal localization and calendar tables. |
| **Time to First Go-Live** | 4–6 weeks (fastest initially, but blocked on Nepal localization) | 16–24 weeks (long cycle, high risk of scope creep) | **6–8 weeks** (ready-to-deploy modules with clear handover) |
| **Skill & Resourcing Requirement** | Minimal initial code writing, but heavy customization required later. | Requires full-stack architecture, OCR engineering, and data modeling team. | **Feasible:** 1 Python-capable internal developer (Nitesh) with 2 weeks developer hand-holding. |
| **One-Time Development Cost** | Zero external vendor software license; internal time. | High internal opportunity cost ($25,000–$40,000 equivalent). | **Minimal:** Zero software licensing fees; leverage existing internal development. |
| **Recurring Licensing Cost** | Zero external license (only token usage ~15 paisa/invoice). | Zero external license (only token usage). | Zero external license (only token usage). |
| **Maintainability & Ownership** | High dependency on Developer for future updates; difficult if Customer codebase diverges. | High internal ownership, but unproven stability. | **Optimal:** Customer owns the tailored codebase; standard modular architecture (SQLAlchemy + FastAPI/Express). |
| **User & Exception Experience** | Console-only (no UI); finance controllers must inspect database or raw logs for exceptions. | Custom UI needed. | **Dual Mode:** Full headless console service for end-users via email + modern Web Workbench for controllers. |

---

## 3. Evaluation of Options

### Option A (Adopt As-Is):
While adopting the reference code directly has low initial friction, it creates severe immediate operational blockers in Nepal. Customer finance controllers would have to manually calculate 13% VAT, manually convert Bikram Sambat dates, and would lack a human exception review interface for low-confidence bills.

### Option B (Pure In-House Greenfield):
Building from scratch wastes the extensive learning curve already completed by Customer on airline invoice variations (IndiGo, Air India, PNR extraction, ITH consolidated slips).

### Option C (Hybrid Architecture — Recommended):
The hybrid model captures the best of both worlds:
1. **Proven Extraction Knowledge:** Ingests Customer's proven travel prompt structures, airline PNR regex patterns, and deterministic master mapping logic.
2. **Turnkey Customer Enhancements:** Activates InvoiceFlow's existing Nepal VAT 13% validator, Devanagari numeral converter, Bikram Sambat calendar table, and dual headless/UI architecture.
3. **Internal Sustainability:** Nitesh leads the day-to-day operation in Customer's Azure tenant, with structured handover from Developer.

---

## 4. Implementation Recommendation & Next Steps

**Recommendation:** Proceed with **Option C (Hybrid Model)**.
1. **Week 1:** Share representative Customer invoice samples (J1 Checklist) with Developer.
2. **Week 2:** Run accuracy evaluation harness (Part G) on samples using `gemini-3.1-flash-lite` and `azure-openai`.
3. **Week 3:** Complete 5-day technical handover to Nitesh (covering prompt tuning, rule definitions, and master email imports).
4. **Week 4–5:** User Acceptance Testing (UAT) with Customer Finance (Dipendra, Saurabh).
5. **Week 6:** Pilot production launch on Stream A (ITH Travel).
