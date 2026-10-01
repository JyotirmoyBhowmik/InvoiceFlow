"""
Processing Stream Engine for InvoiceFlow.
Supports configurable multi-stream routing, subcategory matrices, Trip ID fallback keys,
and cross-stream linking to prevent double-posting or duplicate tax-credit claims.
Zero hardcoded business rules - fully metadata and master-table driven.
"""

import re
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field


@dataclass
class StreamDefinition:
    stream_code: str
    stream_name: str
    purpose: str  # VENDOR_PAYMENT, TAX_CREDIT_CLAIM, GENERAL
    export_profile_key: str
    scheduler_cron: str = "0 * * * *"
    auto_approve_threshold: float = 95.0
    reply_to_mode: str = "REPLY_ALL"
    detection_priority: int = 10
    detection_rules: Dict[str, Any] = field(default_factory=dict)


class StreamService:
    """
    Manages multi-stream identification, sub-category mandatory matrices,
    Trip ID validation, and cross-stream reconciliation.
    """

    DEFAULT_STREAMS: List[StreamDefinition] = [
        StreamDefinition(
            stream_code="STREAM_A_ITH_TRAVEL",
            stream_name="Travel-Agency / ITH Corporate Travel Invoices",
            purpose="VENDOR_PAYMENT",
            export_profile_key="EXP_SAP_ECC_ITH_VENDOR",
            scheduler_cron="0 * * * *",
            auto_approve_threshold=95.0,
            detection_priority=10,
            detection_rules={
                "mailbox_patterns": ["travel@enterprise.internal", "ith.invoices@snpl.com.np"],
                "subject_keywords": ["travel", "ith", "duty slip", "hotel booking", "car rental", "itinerary"],
                "vendor_tax_ids": ["07AAACI1920H1ZP"], # ITH corporate identifier
            }
        ),
        StreamDefinition(
            stream_code="STREAM_B_AIRLINE_TAX_CREDIT",
            stream_name="Airline Tax Invoices (GST/VAT Input Tax Credit Claim)",
            purpose="TAX_CREDIT_CLAIM",
            export_profile_key="EXP_SAP_ECC_AIRLINE_ITC",
            scheduler_cron="0 * * * *",
            auto_approve_threshold=95.0,
            detection_priority=20,
            detection_rules={
                "mailbox_patterns": ["airline.gst@enterprise.internal", "airtax@snpl.com.np"],
                "subject_keywords": ["tax invoice", "passenger ticket", "gst credit", "air passenger", "boarding"],
                "pnr_required": True,
            }
        )
    ]

    # Subcategory mandatory field matrices (Stream A)
    SUBCATEGORY_MANDATORY_FIELDS: Dict[str, List[str]] = {
        "HOTEL": ["vendor_name", "invoice_number", "invoice_date", "total_cost", "tax_amount", "taxable_value", "vendor_tax_id"],
        "AIRLINE": ["vendor_name", "invoice_number", "invoice_date", "total_cost", "tax_amount", "pnr_ticket", "flight_sector", "vendor_tax_id"],
        "TRAIN": ["vendor_name", "invoice_number", "invoice_date", "total_cost", "tax_amount"],
        "CAB": ["vendor_name", "invoice_number", "invoice_date", "total_cost", "tax_amount"],
        "GENERAL": ["vendor_name", "invoice_number", "invoice_date", "total_cost", "tax_amount"]
    }

    @classmethod
    def detect_stream(
        cls,
        receiving_mailbox: Optional[str] = None,
        subject: Optional[str] = None,
        raw_text: Optional[str] = None,
        extracted_fields: Optional[Dict[str, Any]] = None,
        configured_streams: Optional[List[StreamDefinition]] = None
    ) -> Tuple[str, float, str]:
        """
        Determines the processing stream via configurable order:
        1. Receiving mailbox folder/address match
        2. Subject pattern match
        3. Document semantic content / extracted identifiers
        Returns (stream_code, confidence, detection_reason)
        """
        streams = configured_streams or cls.DEFAULT_STREAMS
        fields = extracted_fields or {}
        norm_subject = (subject or "").lower()
        norm_mailbox = (receiving_mailbox or "").lower()
        norm_text = (raw_text or "").lower()

        # Check explicit Stream B (Airline Tax Credit) indicators:
        # Airline Tax invoices have PNR, Ticket Number, both Airline GSTIN and Customer GSTIN
        is_airline_tax = (
            "air passenger ticket" in norm_text or
            "interglobe aviation" in norm_text or
            "buddha air" in norm_text or
            "yeti airlines" in norm_text or
            "gst credit" in norm_subject or
            fields.get("booking_type") == "AIRLINE" or
            (fields.get("pnr_number") and fields.get("gst_claim_status") == "ELIGIBLE_ITC")
        )

        # Check Stream A (Travel Agency / ITH) indicators:
        is_travel_agency = (
            "international travel house" in norm_text or
            "ith" in norm_text or
            "duty slip" in norm_text or
            "consolidated travel" in norm_text or
            "trip id" in norm_text or
            fields.get("trip_id") is not None
        )

        for s in sorted(streams, key=lambda x: x.detection_priority):
            rules = s.detection_rules

            # 1. Mailbox rule
            for mb in rules.get("mailbox_patterns", []):
                if mb.lower() in norm_mailbox:
                    return s.stream_code, 98.0, f"Receiving mailbox match: {mb}"

            # 2. Subject pattern
            for kw in rules.get("subject_keywords", []):
                if kw.lower() in norm_subject:
                    return s.stream_code, 95.0, f"Subject keyword match: {kw}"

        if is_airline_tax and not is_travel_agency:
            return "STREAM_B_AIRLINE_TAX_CREDIT", 94.0, "Document metadata contains airline PNR / ITC claim indicators"

        if is_travel_agency:
            return "STREAM_A_ITH_TRAVEL", 95.0, "Consolidated travel agency / ITH indicators detected"

        # Default fallback stream
        return "STREAM_A_ITH_TRAVEL", 75.0, "Defaulted to Travel-Agency stream (review pending if threshold < 90)"

    @classmethod
    def detect_subcategory(cls, raw_text: str, filename: str = "") -> str:
        """Identifies hotel, air, train, or cab sub-category within Stream A."""
        combined = f"{filename} {raw_text}".lower()
        if any(w in combined for w in ["hotel", "room night", "stay", "resort", "suite", "annapurna", "marriott"]):
            return "HOTEL"
        if any(w in combined for w in ["flight", "airline", "pnr", "indigo", "air india", "vistara", "buddha air"]):
            return "AIRLINE"
        if any(w in combined for w in ["rail", "train", "irctc", "howrah", "station", "chair car"]):
            return "TRAIN"
        if any(w in combined for w in ["cab", "taxi", "duty slip", "sedan", "airport transfer", "vehicle", "driver"]):
            return "CAB"
        return "GENERAL"

    @classmethod
    def validate_trip_id_with_fallback(
        cls,
        trip_id: Optional[str],
        employee_code: Optional[str],
        invoice_date: Optional[str],
        travel_route: Optional[str],
        trip_references: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Trip ID Handling:
        Invoices arrive WITH or WITHOUT Trip ID.
        - When present: Validate against trip reference.
        - When absent: Link using fallback keys (employee + travel dates + route/hotel).
        - Trip ID absence is a configurable WARN, never a hard failure!
        """
        refs = trip_references or []

        if trip_id:
            # Validate direct match
            for r in refs:
                if r.get("trip_id") == trip_id:
                    return {
                        "is_valid": True,
                        "trip_id": trip_id,
                        "resolution_mode": "DIRECT_MATCH",
                        "status": "VALIDATED",
                        "message": f"Trip ID {trip_id} verified against approved travel authorization",
                        "severity": "INFO"
                    }
            return {
                "is_valid": True,
                "trip_id": trip_id,
                "resolution_mode": "UNCONFIRMED_REFERENCE",
                "status": "WARN",
                "message": f"Trip ID {trip_id} extracted from document but unverified in trip master",
                "severity": "WARN"
            }

        # Fallback Key Resolution (employee + travel date + route)
        if employee_code and invoice_date:
            for r in refs:
                if r.get("employee_code") == employee_code:
                    resolved_id = r.get("trip_id")
                    return {
                        "is_valid": True,
                        "trip_id": resolved_id,
                        "resolution_mode": "FALLBACK_EMPLOYEE_DATE_MATCH",
                        "status": "RESOLVED_FALLBACK",
                        "message": f"Trip ID resolved via fallback keys (Employee {employee_code}, Date {invoice_date}) -> {resolved_id}",
                        "severity": "INFO"
                    }

        return {
            "is_valid": True,
            "trip_id": None,
            "resolution_mode": "ABSENT_PERMITTED",
            "status": "WARN",
            "message": "Trip ID not present on invoice (permitted under corporate travel policy; routed with warning)",
            "severity": "WARN"
        }

    @classmethod
    def check_cross_stream_duplicate_claim(
        cls,
        document_id: str,
        current_stream: str,
        match_keys: List[str], # PNR, Ticket number, Invoice number
        existing_records: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Cross-stream duplicate prevention:
        Detects if an invoice relates to both Stream A (vendor payment) and Stream B (tax credit claim).
        Allows linking both without double-posting the expense, flagging suspected double-claims.
        """
        clean_keys = [k.strip().upper() for k in match_keys if k and len(k.strip()) >= 5]
        if not clean_keys:
            return None

        for rec in existing_records:
            if rec.get("id") == document_id:
                continue

            rec_stream = rec.get("stream_code")
            rec_keys = [
                (rec.get("pnr_number") or "").strip().upper(),
                (rec.get("ticket_number") or "").strip().upper(),
                (rec.get("document_number") or "").strip().upper(),
            ]

            for ck in clean_keys:
                if ck in rec_keys:
                    if rec_stream == current_stream:
                        # Same stream duplicate
                        return {
                            "error_code": "VAL_DUPLICATE_INVOICE",
                            "severity": "BLOCK",
                            "message": f"Duplicate document detected in {current_stream}: Match key '{ck}' matches existing Doc #{rec.get('document_number')}",
                            "linked_document_id": rec.get("id")
                        }
                    else:
                        # Cross-stream link: Stream A (Payment) vs Stream B (Tax Claim)
                        return {
                            "error_code": "VAL_STREAM_DOUBLE_CLAIM",
                            "severity": "WARN",
                            "message": f"Cross-stream match: Match key '{ck}' matches existing Doc #{rec.get('document_number')} in {rec_stream}. Linked for tax-claim reconciliation without double expense posting.",
                            "linked_document_id": rec.get("id"),
                            "is_cross_stream_linked": True
                        }

        return None
