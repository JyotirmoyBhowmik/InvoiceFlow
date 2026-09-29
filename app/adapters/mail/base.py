"""
Mailbox Ingestion Abstract Adapter Interface.
Defines standard contract for Microsoft Graph, IMAP, and EWS.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class IngestedAttachment:
    filename: str
    content_bytes: bytes
    content_type: str
    size_bytes: int
    is_inline: bool = False
    content_id: Optional[str] = None


@dataclass
class IngestedMessage:
    internet_message_id: str
    source_message_id: str
    sender_email: str
    subject: str
    received_at: datetime
    body_text: str
    body_html: str
    attachments: List[IngestedAttachment]


class BaseMailAdapter(ABC):
    @abstractmethod
    async def connect(self, profile: Dict[str, Any]) -> bool:
        """Establishes connection / acquires OAuth2 bearer token."""
        pass

    @abstractmethod
    async def poll_messages(
        self, profile: Dict[str, Any], delta_token: Optional[str] = None
    ) -> List[IngestedMessage]:
        """Fetches pending messages applying inclusion/exclusion filters."""
        pass

    @abstractmethod
    async def post_process_message(
        self, profile: Dict[str, Any], message_id: str, action: str
    ) -> None:
        """Executes post-fetch action (move to folder, mark read, categorize)."""
        pass
