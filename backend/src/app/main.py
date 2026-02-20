from fastapi import FastAPI
from contextlib import asynccontextmanager

from src.app.db.db import engine
from src.app.db.models import Base
from src.app.api.application_api import router as application_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

app = FastAPI(
    title = 'GazNux',
    description= '-',
    lifespan=lifespan
)

app.include_router(application_router)

