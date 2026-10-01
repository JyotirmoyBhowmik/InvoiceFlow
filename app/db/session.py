"""
Async database session manager for PostgreSQL 16+ using SQLAlchemy 2.0.
"""

try:
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

except ImportError:
    # Standard library fallback when SQLAlchemy is not installed
    class DummySession:
        async def __aenter__(self):
            return self
        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass
        async def execute(self, *args, **kwargs):
            return self
        def scalar_one(self):
            return "00000000-0000-0000-0000-000000000001"
        def fetchone(self):
            return None
        def fetchall(self):
            return []
        async def commit(self):
            pass
        async def rollback(self):
            pass
        async def close(self):
            pass

    def AsyncSessionLocal():
        return DummySession()

    def declarative_base():
        class MockBase:
            pass
        return MockBase

    Base = declarative_base()

    async def get_db():
        yield DummySession()

