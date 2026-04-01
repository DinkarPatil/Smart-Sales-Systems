from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with async_session() as session:
        yield session

# Helper to initialize the DB is also good
async def init_db():
    from app.models.models import User, Company, Product, Query, LeadStat
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
