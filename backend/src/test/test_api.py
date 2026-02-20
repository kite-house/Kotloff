from httpx import AsyncClient

async def test_generate_slug(ac: AsyncClient):
    response = await ac.post('/application', json = {
        "name": 'Клиент1',
        "number": "+79539913212"
    })
    assert response.status_code == 200