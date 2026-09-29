"""
AI Extraction Orchestrator.
Dynamically constructs JSON schema from active field_definition records,
injects DB-versioned prompt templates, invokes fallback chains, and records token usage.
"""

from typing import Dict, Any, List, Optional
from app.adapters.ai.registry import ai_registry, ExtractionResult


class AiExtractionService:
    @classmethod
    def generate_json_schema_from_fields(
        cls, field_definitions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Dynamically constructs JSON schema from field_definition rows.
        """
        properties: Dict[str, Any] = {}
        required: List[str] = []

        for f in field_definitions:
            if not f.get("visible_flag", True):
                continue

            key = f["field_key"]
            dtype = f.get("data_type", "STRING")

            if dtype == "NUMBER":
                json_type = "number"
            elif dtype == "BOOLEAN":
                json_type = "boolean"
            else:
                json_type = "string"

            properties[key] = {
                "type": json_type,
                "description": f.get("ai_hint_text") or f.get("display_label", key),
            }

            if f.get("is_mandatory", False):
                required.append(key)

        return {
            "type": "object",
            "properties": properties,
            "required": required,
        }

    @classmethod
    async def extract_document(
        cls,
        file_bytes: bytes,
        mime_type: str,
        prompt_template: Dict[str, Any],
        field_definitions: List[Dict[str, Any]],
        provider_preference: List[str] = ["GEMINI", "AZURE_DI"],
    ) -> ExtractionResult:
        schema = cls.generate_json_schema_from_fields(field_definitions)
        system_instruction = prompt_template.get("system_instruction", "")
        user_prompt = prompt_template.get("user_prompt_pattern", "")

        last_error = None

        for prov_key in provider_preference:
            provider = ai_registry.get(prov_key)
            if not provider:
                continue

            try:
                result = await provider.extract_invoice(
                    file_bytes=file_bytes,
                    mime_type=mime_type,
                    system_instruction=system_instruction,
                    prompt_text=user_prompt,
                    json_schema=schema,
                )
                return result
            except Exception as e:
                last_error = e
                continue

        raise RuntimeError(f"All AI extraction providers in fallback chain failed: {last_error}")
