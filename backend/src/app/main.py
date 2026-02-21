from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
import logging

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене замени на конкретные домены
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все методы (включая OPTIONS)
    allow_headers=["*"],  # Разрешаем все заголовки
)

app.include_router(application_router)

