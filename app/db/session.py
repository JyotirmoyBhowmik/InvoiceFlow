"""
Async database session manager for PostgreSQL 16+ using SQLAlchemy 2.0.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=10,
    pool_recycle=3600,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
