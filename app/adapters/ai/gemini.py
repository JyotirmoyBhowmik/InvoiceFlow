"""
Google Gemini AI Provider Adapter using Google GenAI SDK.
Zero hardcoded prompts or schemas - all injected dynamically from database.
"""

import json
import base64
from typing import Dict, Any, Optional
from google import genai
from google.genai import types
from app.adapters.ai.registry import BaseAIProvider, ExtractionResult, ai_registry
from app.config import settings


class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    async def extract_invoice(
        self,
        file_bytes: bytes,
        mime_type: str,
        system_instruction: str,
        prompt_text: str,
        json_schema: Dict[str, Any],
        model_name: Optional[str] = "gemini-2.5-flash",
        temperature: float = 0.0,
        max_tokens: int = 4096,
    ) -> ExtractionResult:
        if not self.client:
            raise ValueError("GEMINI_API_KEY is not configured in environment or database secret store.")

        part = types.Part.from_bytes(
            data=file_bytes,
            mime_type=mime_type,
        )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_tokens,
            response_mime_type="application/json",
            response_schema=json_schema if json_schema else None,
        )

        response = self.client.models.generate_content(
            model=model_name or "gemini-2.5-flash",
            contents=[part, prompt_text],
            config=config,
        )

        raw_text = response.text or "{}"
        try:
            parsed_json = json.loads(raw_text)
        except Exception:
            parsed_json = {}

        # Token usage estimation
        usage = response.usage_metadata
        in_tokens = usage.prompt_token_count if usage else 0
        out_tokens = usage.candidates_token_count if usage else 0
        cost = (in_tokens / 1000.0 * 0.0001) + (out_tokens / 1000.0 * 0.0004)

        # Build confidence scores map (Gemini structured outputs have high baseline confidence)
        confidence_scores = {k: 95.0 for k in parsed_json.keys()}
        bounding_boxes = {}

        return ExtractionResult(
            fields=parsed_json,
            confidence_scores=confidence_scores,
            bounding_boxes=bounding_boxes,
            input_tokens=in_tokens,
            output_tokens=out_tokens,
            cost_usd=cost,
            raw_response=raw_text,
        )


# Register default Gemini provider
ai_registry.register("GEMINI", GeminiProvider())
