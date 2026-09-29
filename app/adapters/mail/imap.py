"""
IMAP & EWS Fallback Adapters for Legacy Mail Servers.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.adapters.mail.base import BaseMailAdapter, IngestedMessage


class ImapMailAdapter(BaseMailAdapter):
    async def connect(self, profile: Dict[str, Any]) -> bool:
        return True

    async def poll_messages(
        self, profile: Dict[str, Any], delta_token: Optional[str] = None
    ) -> List[IngestedMessage]:
        return []

    async def post_process_message(
        self, profile: Dict[str, Any], message_id: str, action: str
    ) -> None:
        pass


class EwsMailAdapter(BaseMailAdapter):
    async def connect(self, profile: Dict[str, Any]) -> bool:
        return True

    async def poll_messages(
        self, profile: Dict[str, Any], delta_token: Optional[str] = None
    ) -> List[IngestedMessage]:
        return []

    async def post_process_message(
        self, profile: Dict[str, Any], message_id: str, action: str
    ) -> None:
        pass
