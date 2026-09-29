"""
AI Provider abstraction interface and registry.
Supports runtime provider registration and dynamic fallback chains.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class ExtractionResult:
    fields: Dict[str, Any]
    confidence_scores: Dict[str, float]
    bounding_boxes: Dict[str, Dict[str, float]]
    input_tokens: int
    output_tokens: int
    cost_usd: float
    raw_response: str


class BaseAIProvider(ABC):
    @abstractmethod
    async def extract_invoice(
        self,
        file_bytes: bytes,
        mime_type: str,
        system_instruction: str,
        prompt_text: str,
        json_schema: Dict[str, Any],
        model_name: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: int = 4096,
    ) -> ExtractionResult:
        pass


class AIProviderRegistry:
    _providers: Dict[str, BaseAIProvider] = {}

    @classmethod
    def register(cls, key: str, provider: BaseAIProvider) -> None:
        cls._providers[key.upper()] = provider

    @classmethod
    def get(cls, key: str) -> Optional[BaseAIProvider]:
        return cls._providers.get(key.upper())


ai_registry = AIProviderRegistry
