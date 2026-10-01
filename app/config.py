"""
InvoiceFlow Configuration Manager.
Settings are resolved DB-first with environment variable fallbacks.
"""

import os
from typing import Any

try:
    from pydantic_settings import BaseSettings

    class Settings(BaseSettings):
        APP_NAME: str = "InvoiceFlow"
        ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
        DATABASE_URL: str = os.getenv(
            "DATABASE_URL", 
            "postgresql+asyncpg://postgres:postgres@localhost:5432/invoiceflow"
        )
        REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        SECRET_KEY: str = os.getenv("SECRET_KEY", "CHANGE_ME_PRODUCTION_SECRET_KEY_MIN32BYTES")
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12
        
        # Storage adapter
        STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "LOCAL")  # LOCAL, AZURE_BLOB, S3
        LOCAL_STORAGE_PATH: str = os.getenv("LOCAL_STORAGE_PATH", "/data/invoiceflow_artifacts")
        
        # AI Default Fallbacks (actual keys & endpoints are managed in ai_provider table)
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        
        # Mail defaults
        POLL_INTERVAL_SECONDS: int = int(os.getenv("POLL_INTERVAL_SECONDS", "120"))
        
        # ERP
        DEFAULT_ERP: str = "SAP_ECC"
        
        class Config:
            env_file = ".env"
            case_sensitive = True

    settings = Settings()

except ImportError:
    # Standard library fallback when pydantic_settings is not installed
    class Settings:
        APP_NAME: str = "InvoiceFlow"
        ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
        DATABASE_URL: str = os.getenv(
            "DATABASE_URL", 
            "postgresql+asyncpg://postgres:postgres@localhost:5432/invoiceflow"
        )
        REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        SECRET_KEY: str = os.getenv("SECRET_KEY", "CHANGE_ME_PRODUCTION_SECRET_KEY_MIN32BYTES")
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12
        
        # Storage adapter
        STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "LOCAL")
        LOCAL_STORAGE_PATH: str = os.getenv("LOCAL_STORAGE_PATH", "/data/invoiceflow_artifacts")
        
        # AI Default Fallbacks
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        
        # Mail defaults
        POLL_INTERVAL_SECONDS: int = int(os.getenv("POLL_INTERVAL_SECONDS", "120"))
        
        # ERP
        DEFAULT_ERP: str = "SAP_ECC"

    settings = Settings()

