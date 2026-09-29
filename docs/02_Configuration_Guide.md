# InvoiceFlow Configuration & Field Customization Guide

---

## 1. Metadata Field Customization & Dynamic Propagation

InvoiceFlow contains **zero hard-coded field names**. The database table `field_definition` is the central source of truth for:
1. Dynamic UI form rendering on the Review Workbench.
2. Generating the JSON extraction schema (`response_schema`) sent to AI providers.
3. Header and line item validation rules.
4. SAP ECC FB60 column mapping in generated CSV and TXT files.

---

## 2. End-to-End Walkthrough: Renaming a Field

### Objective
Rename standard field `tax_code` to `vat_rate_indicator`, adjust its UI label to `VAT Tax Indicator`, and observe how it flows across all system components with **zero code modifications**.

### Step 1: Update in Admin Console
1. Navigate to **Metadata & Logic > Dynamic Field Definitions**.
2. Locate row with Field Key: `tax_code`.
3. Click the **Edit (pencil)** icon.
4. Modify properties:
   - **Field Key**: `vat_rate_indicator`
   - **Display Label**: `VAT Tax Indicator`
   - **AI Prompt Hint**: `Extract 2-character tax code indicator (e.g. V0, V1, I1)`
   - **Export Column Name**: `MWSKZ` (SAP ECC tax field)
5. Click **Save (checkmark)**.

### Step 2: Verification of Immediate End-to-End Propagation

1. **AI Prompt Engine**: Open **Intelligence & Ingest > AI Provider & Prompts**. Inspect the *Runtime Generated JSON Schema* card. The property key has updated immediately:
   ```json
   {
     "properties": {
       "vat_rate_indicator": {
         "type": "string",
         "description": "Extract 2-character tax code indicator (e.g. V0, V1, I1)"
       }
     }
   }
   ```
2. **Review Workbench**: Open **Operations > Review & Correction**. In the right-hand panel, notice the field label now reads `VAT Tax Indicator`, binds to key `vat_rate_indicator`, and displays bounding box coordinates without altering any JSX template.
3. **SAP ECC Export File**: Open **Intelligence & Ingest > SAP Profile Designer**. The mapping for SAP column `MWSKZ` now references `vat_rate_indicator` as its source field key. The generated CSV and fixed-width TXT files correctly pull data from this attribute.

---

## 3. Declarative Rule Builder Syntax & AST Reference

Business rules are stored in `rule.condition_tree` as declarative JSON ASTs without dynamic evaluation (`eval` is forbidden).

### Supported Comparison Operators

| Operator | Syntax | Description | Example |
|---|---|---|---|
| Equality | `==` | Exact string/numeric match | `{"field": "currency", "op": "==", "value": "USD"}` |
| Inequality | `!=` | Value mismatch | `{"field": "company_code", "op": "!=", "value": "9999"}` |
| Numerical Comparison | `>`, `>=`, `<`, `<=` | Numeric magnitude checks | `{"field": "total_cost", "op": ">", "value": 5000}` |
| Substring Contains | `contains` | Case-insensitive text inclusion | `{"field": "vendor_name", "op": "contains", "value": "Hotel"}` |
| Emptiness | `is_empty` | Checks if field is null/empty | `{"field": "tax_code", "op": "is_empty", "value": ""}` |

### Compound Condition Logic
Rules support arbitrary boolean nesting via `"and"` and `"or"` arrays:

```json
{
  "and": [
    { "field": "expense_category", "op": "==", "value": "HOTEL" },
    {
      "or": [
        { "field": "country_code", "op": "==", "value": "USA" },
        { "field": "total_cost", "op": ">", "value": 500.0 }
      ]
    }
  ]
}
```

### Action Mutation Block
When conditions are met, the action set mutates document fields:

```json
{
  "set_fields": {
    "tax_code": "V1",
    "gl_account_code": "600200",
    "cost_center": "CC100"
  }
}
```
