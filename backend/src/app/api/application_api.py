from fastapi import APIRouter, HTTPException, status, Depends
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
import requests

from src.app.dependencies import get_session
from src.app.schemas.application_schema import Application as AppSchema
from src.app.db import crud

router = APIRouter()


@router.post('/application')
async def create_application(
    session: Annotated[AsyncSession, Depends(get_session)],
    data: AppSchema
):
    
    try:
        await crud.write_application(session, data)
    except Exception as error:
        raise HTTPException(status_code = status.HTTP_500_INTERNAL_SERVER_ERROR, detail = f'{str(error)}')

    # дергание ручки к тг бот
    try: 
        requests.post("url", json = {
            'name' : data.name,
            'number': data.number,
            'comment' : data.comment,
            'service' : data.service
        })
    except Exception:
        pass

    return {"status" : "Успешно!", "message": "Заявка успешно создана!"}


@router.get('/')
async def main(session: Annotated[AsyncSession, Depends(get_session)]):
    return {'status' : "Успешно!", "message": "Используйте /application для создание заявки"}