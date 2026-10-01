"""
Comprehensive Service Test Suite for Prompt 03 Requirements.
Tests:
- Processing stream detection & cross-stream double claim checks
- Trip ID validation with employee/date fallback keys
- Nepal Localization: Devanagari numerals, Bikram Sambat conversion, Nepal VAT 13%
- Master data diff calculation & deactivation safety threshold
- Deterministic coding rules enforcement (AI extracts, rules decide)
"""

try:
    import pytest
except ImportError:
    pytest = None

from app.services.stream_service import StreamService
from app.services.nepal_service import NepalLocalizationService
from app.services.master_import_service import MasterImportService
from app.services.eval_service import EvaluationHarnessService
from app.services.rule_engine import SafeRuleEvaluator


def test_stream_detection_airline_vs_travel():
    # Airline Tax Credit document
    airline_text = "Tax Invoice / Air Passenger Ticket InterGlobe Aviation Ltd. PNR: 6E-W8Q29 GSTIN: 07AABCI4818R1Z1"
    stream_b, conf_b, reason_b = StreamService.detect_stream(
        subject="IndiGo Flight Ticket & Tax Invoice",
        raw_text=airline_text,
        extracted_fields={"booking_type": "AIRLINE", "pnr_number": "6E-W8Q29", "gst_claim_status": "ELIGIBLE_ITC"}
    )
    assert stream_b == "STREAM_B_AIRLINE_TAX_CREDIT"
    assert conf_b >= 90.0

    # Travel Agency ITH document
    ith_text = "International Travel House Ltd. Consolidated Hotel, Cab & Air Duty Slip Trip ID: TRIP-2026-9410"
    stream_a, conf_a, reason_a = StreamService.detect_stream(
        subject="ITH Corporate Travel Booking Itinerary",
        raw_text=ith_text,
        extracted_fields={"trip_id": "TRIP-2026-9410"}
    )
    assert stream_a == "STREAM_A_ITH_TRAVEL"
    assert conf_a >= 90.0


def test_cross_stream_double_claim_prevention():
    existing_docs = [
        {
            "id": "doc_existing_payment",
            "document_number": "ITH-INV-9042",
            "stream_code": "STREAM_A_ITH_TRAVEL",
            "pnr_number": "6E-W8Q29",
            "ticket_number": "312-8829104"
        }
    ]

    # Incoming document in Stream B with the same PNR/Ticket
    claim_check = StreamService.check_cross_stream_duplicate_claim(
        document_id="doc_new_tax_claim",
        current_stream="STREAM_B_AIRLINE_TAX_CREDIT",
        match_keys=["6E-W8Q29", "312-8829104"],
        existing_records=existing_docs
    )

    assert claim_check is not None
    assert claim_check["error_code"] == "VAL_STREAM_DOUBLE_CLAIM"
    assert claim_check["is_cross_stream_linked"] is True
    assert claim_check["severity"] == "WARN"


def test_trip_id_validation_and_fallback():
    trip_master = [
        {
            "trip_id": "TRIP-2026-9410",
            "employee_code": "EMP-1049",
            "travel_start_date": "2026-09-20",
            "cost_center_code": "CC100"
        }
    ]

    # Direct Trip ID match
    res_direct = StreamService.validate_trip_id_with_fallback(
        trip_id="TRIP-2026-9410",
        employee_code="EMP-1049",
        invoice_date="2026-09-22",
        travel_route="DEL-BOM",
        trip_references=trip_master
    )
    assert res_direct["is_valid"] is True
    assert res_direct["resolution_mode"] == "DIRECT_MATCH"

    # Absent Trip ID, resolved via fallback keys (employee + date)
    res_fallback = StreamService.validate_trip_id_with_fallback(
        trip_id=None,
        employee_code="EMP-1049",
        invoice_date="2026-09-22",
        travel_route="DEL-BOM",
        trip_references=trip_master
    )
    assert res_fallback["is_valid"] is True
    assert res_fallback["trip_id"] == "TRIP-2026-9410"
    assert res_fallback["resolution_mode"] == "FALLBACK_EMPLOYEE_DATE_MATCH"

    # Absent Trip ID without match -> Permitted WARN, not failure
    res_absent = StreamService.validate_trip_id_with_fallback(
        trip_id=None,
        employee_code="EMP-UNKNOWN",
        invoice_date="2026-09-22",
        travel_route="KTM-PKR",
        trip_references=trip_master
    )
    assert res_absent["is_valid"] is True
    assert res_absent["severity"] == "WARN"
    assert res_absent["resolution_mode"] == "ABSENT_PERMITTED"


def test_nepali_localization():
    # 1. Devanagari numerals to Arabic digits
    devanagari_str = "कमरा नम्बर १०४ रकम: १८५००.०० भ्याट: २४०५.००"
    norm = NepalLocalizationService.normalize_devanagari_numerals(devanagari_str)
    assert "104" in norm
    assert "18500.00" in norm
    assert "2405.00" in norm

    # 2. Nepal PAN 9 digits
    pan_valid, _ = NepalLocalizationService.validate_nepal_pan_vat_number("३०१२९४८५७")
    assert pan_valid is True

    # 3. Bikram Sambat conversion (2083-06-08 B.S. -> 2026-09-24 A.D.)
    ad_date, fiscal_year, fiscal_period = NepalLocalizationService.convert_bs_to_ad("2083-06-08")
    assert ad_date is not None
    assert fiscal_year == "2083/84"
    assert fiscal_period == 3 # Ashwin is month 6 of BS -> Period 3 (Shrawan=1, Bhadra=2, Ashwin=3)

    # 4. Nepal VAT 13% validation
    # Case: 18500 taxable + 2405 VAT (13%) = 20905 gross
    vat_errors = NepalLocalizationService.validate_nepal_vat_invoice(
        taxable_amount=18500.0,
        vat_amount=2405.0,
        total_amount=20905.0,
        tax_rate_percent=13.0
    )
    assert len(vat_errors) == 0


def test_master_import_diff_and_safety_threshold():
    existing = [
        {"vendor_code": "V100", "vendor_name": "Old Vendor 1", "is_active": True},
        {"vendor_code": "V200", "vendor_name": "Old Vendor 2", "is_active": True},
        {"vendor_code": "V300", "vendor_name": "Old Vendor 3", "is_active": True}
    ]

    # Incoming: 1 update, 1 add, missing V200 and V300 in FULL_REPLACE mode
    incoming = [
        {"vendor_code": "V100", "vendor_name": "Updated Vendor 1"},
        {"vendor_code": "V400", "vendor_name": "Brand New Vendor 4"}
    ]

    diff = MasterImportService.calculate_diff(
        master_type="VENDOR",
        incoming_rows=incoming,
        existing_records=existing,
        key_column="vendor_code",
        import_mode="FULL_REPLACE",
        max_deactivation_pct=10.0 # 10% safety limit
    )

    assert diff["rows_added"] == 1
    assert diff["rows_updated"] == 1
    assert diff["rows_deactivated"] == 2
    # 2 deactivations out of 3 = 66.7% > 10% limit -> safety threshold breached!
    assert diff["safety_threshold_breached"] is True


def test_deterministic_coding_rules_enforcement():
    """
    Verifies that AI only extracts raw fields; deterministic rules ALWAYS decide GL, Tax Code, and Cost Center.
    """
    raw_ai_extraction = {
        "vendor_tax_id": "07AAACI1920H1ZP",
        "expense_category": "CAB",
        "company_code": "1000",
        "raw_suggested_gl": "999999" # Should be overwritten by deterministic rule!
    }

    deterministic_rules = [
        {
            "rule_code": "R_CAB_EXPENSE_GL",
            "priority": 10,
            "stop_on_match": True,
            "condition_tree": {"field": "expense_category", "op": "==", "value": "CAB"},
            "action_set": {"set_fields": {"gl_account_code": "600400", "section_code": "194C"}}
        }
    ]

    result = SafeRuleEvaluator.apply_rules(deterministic_rules, raw_ai_extraction)
    assert result["mutated_fields"]["gl_account_code"] == "600400"
    assert result["mutated_fields"]["section_code"] == "194C"
    assert "R_CAB_EXPENSE_GL" in result["matched_rules"]
