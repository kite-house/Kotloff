import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import gspread
from google.oauth2.service_account import Credentials
import telebot
import sqlite3
from datetime import datetime

# ------------------- Настройки логирования -------------------
log_level = os.getenv("LOG_LEVEL", "INFO" if os.getenv("ENV") == "production" else "DEBUG").upper()
logging.basicConfig(level=log_level, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

load_dotenv()

# ------------------- Конфигурация -------------------
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
SERVICE_ACCOUNT_FILE = os.getenv("SERVICE_ACCOUNT_FILE", "service-account.json")


ENV = os.getenv("ENV", "development")  # production / development

if not all([TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GOOGLE_SHEET_ID]):
    logger.critical("Отсутствуют обязательные переменные окружения")
    raise RuntimeError("Missing required environment variables")

# ------------------- Инициализация -------------------
bot = telebot.TeleBot(TELEGRAM_BOT_TOKEN)

# Google Sheets
scopes = ["https://www.googleapis.com/auth/spreadsheets"]
creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=scopes)
gc = gspread.authorize(creds)
sheet = gc.open_by_key(GOOGLE_SHEET_ID).sheet1

# Инициализация заголовков
if len(sheet.get_all_values()) == 0:
    sheet.append_row(["ID", "Дата создания", "Имя", "Телефон", "Комментарий", "Дата обработки"])
    logger.info("Созданы заголовки в Google Sheet")

# Создание/проверка таблицы SQLite
class RequestData(BaseModel):
    id: int
    name: str
    number: str
    comment: str

# ------------------- Lifespan (startup/shutdown) -------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Приложение запущено в режиме: {ENV}")
    yield
    logger.info("Приложение останавливается...")

app = FastAPI(lifespan=lifespan, docs_url="/docs" if ENV != "production" else None)

@app.post("/process-request")
async def process_request(data: RequestData):
    now = datetime.now().strftime("%d.%m.%Y %H:%M:%S")
    try:
        # 2. Google Sheets
        row = [data.id, data.name, data.number, data.comment, now]
        sheet.append_row(row)

        # 3. Telegram
        tg_text = f"""
<b>✅ НОВАЯ ЗАЯВКА #{data.id}</b>

<b>Имя:</b> {data.name}
<b>Телефон:</b> {data.number}
<b>Комментарий:</b> {data.comment or '—'}

🕒 <i>{now}</i>
""".strip()

        bot.send_message(TELEGRAM_CHAT_ID, tg_text, parse_mode="HTML")
        logger.info(f"Заявка #{data.id} отправлена в Telegram")

        return {"success": True}

    except Exception as e:
        logger.error(f"Ошибка обработки заявки #{data.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")

if __name__ == "__main__":
    import uvicorn

    workers = int(os.getenv("UVICORN_WORKERS", "1"))  # в проде ставь 2–4 в зависимости от CPU
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8001)),
        workers=workers if ENV == "production" else 1,
        log_level="info" if ENV == "production" else "debug",
        reload=(ENV == "development"),
    )