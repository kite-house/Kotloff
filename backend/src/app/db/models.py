from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy import String, ForeignKey
from datetime import datetime

class Base(AsyncAttrs, DeclarativeBase):
    pass

class Applications(Base):
    __tablename__ = "applications"
    id: Mapped[int] = mapped_column(primary_key = True, autoincrement = True)
    name: Mapped[str] = mapped_column(String(30))
    number: Mapped[str] = mapped_column(String(20))
    comment: Mapped[str|None] = mapped_column(String(400), nullable=True)
    service: Mapped[str|None] = mapped_column(String(100), nullable = True)
    date_created: Mapped[datetime]
