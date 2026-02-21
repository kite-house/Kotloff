from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, update, exc
from datetime import datetime

from src.app.db.models import Applications

async def write_application(session: AsyncSession, data) -> int:
    new_app = Applications(
        name=data.name,
        number=data.number,
        comment=data.comment,
        service=data.service,
        date_created=datetime.now()
    )
    
    session.add(new_app)
    
    await session.commit()
    
    await session.refresh(new_app)
    
    return new_app.id