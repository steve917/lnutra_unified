from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
import os

Base = declarative_base()

def _to_async_dsn(url: str) -> str:
    # Render may give postgres:// or postgresql://; convert to SQLAlchemy psycopg driver
    if url.startswith('postgres://'):
        url = 'postgresql://' + url[len('postgres://'):]
    if url.startswith('postgresql://'):
        return 'postgresql+psycopg://' + url[len('postgresql://'):]
    return url  # assume good

DATABASE_URL = _to_async_dsn(os.getenv('DATABASE_URL', 'postgresql://localhost/postgres'))

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def init_db():
    # Tables created by models import
    from .models import Prediction  # noqa
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
