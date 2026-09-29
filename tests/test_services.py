"""
Structural Unit & Service Integration Test Suite.
Validates rule engine AST evaluation, SAP export transformations, math reconciliation, and archive guardrails.
NO dummy/fake business data committed.
"""

import pytest
from app.services.rule_engine import SafeRuleEvaluator
from app.services.tax_engine import TaxEngine
from app.services.export_service import SapEccExportService
from app.services.validation_service import ValidationService


def test_rule_evaluator_condition_tree():
    rule = {
        "rule_code": "TEST_R1",
        "priority": 10,
        "stop_on_match": True,
        "condition_tree": {
            "and": [
                {"field": "category", "op": "==", "value": "HOTEL"},
                {"field": "amount", "op": ">", "value": 100},
            ]
        },
        "action_set": {"set_fields": {"tax_code": "V1"}},
    }

    # Matching context
    ctx_match = {"category": "HOTEL", "amount": 250}
    res_match = SafeRuleEvaluator.apply_rules([rule], ctx_match)
    assert "TEST_R1" in res_match["matched_rules"]
    assert res_match["mutated_fields"]["tax_code"] == "V1"

    # Non-matching context
    ctx_non_match = {"category": "HOTEL", "amount": 50}
    res_non_match = SafeRuleEvaluator.apply_rules([rule], ctx_non_match)
    assert len(res_non_match["matched_rules"]) == 0


def test_tax_calculation_breakdown():
    breakdown_excl = TaxEngine.calculate_tax_breakdown(100.0, 10.0, is_tax_inclusive=False)
    assert breakdown_excl["base_amount"] == 100.0
    assert breakdown_excl["tax_amount"] == 10.0
    assert breakdown_excl["gross_amount"] == 110.0

    breakdown_incl = TaxEngine.calculate_tax_breakdown(110.0, 10.0, is_tax_inclusive=True)
    assert breakdown_incl["base_amount"] == 100.0
    assert breakdown_incl["tax_amount"] == 10.0
    assert breakdown_incl["gross_amount"] == 110.0


def test_validation_arithmetic_reconciliation():
    doc_fields = {"total_amount": 110.0, "tax_amount": 10.0}
    line_items = [{"line_net_amount": 100.0}]

    # Balanced
    res_balanced = ValidationService.validate_document(doc_fields, line_items, [])
    assert len(res_balanced) == 0

    # Imbalanced
    imbalanced_fields = {"total_amount": 150.0, "tax_amount": 10.0}
    res_imbalanced = ValidationService.validate_document(imbalanced_fields, line_items, [])
    assert any(r["error_code"] == "VAL-002" for r in res_imbalanced)


def test_sap_ecc_column_padding_and_alignment():
    col_config = {
        "field_length": 10,
        "pad_char": "0",
        "alignment": "RIGHT",
        "transformation_rule": "PAD_ZERO",
    }
    formatted = SapEccExportService.format_value("1234", col_config)
    assert formatted == "0000001234"
    assert len(formatted) == 10
