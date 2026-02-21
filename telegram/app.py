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

# Путь к SQLite — в production используй volume / persistent disk
DB_PATH = os.getenv("DB_PATH", "C:/Users/Abrikos/PycharmProjects/PythonProject3/bot_requests.db")  # ← в проде будет /data/bot_requests.db или подобное

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
def init_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS requests (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                comment TEXT,
                created_at TEXT NOT NULL,
                processed_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        logger.info(f"SQLite база инициализирована: {DB_PATH}")
    except Exception as e:
        logger.error(f"Ошибка инициализации БД: {e}")
        raise
    finally:
        conn.close()

init_db()

class RequestData(BaseModel):
    id: int
    name: str
    phone: str
    comment: str
    created_at: str

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
        # 1. Дубликат в локальную SQLite
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR IGNORE INTO requests (id, name, phone, comment, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (data.id, data.name, data.phone, data.comment, data.created_at))
        conn.commit()
        conn.close()
        logger.info(f"Заявка #{data.id} записана в локальную БД")

        # 2. Google Sheets
        row = [data.id, data.created_at, data.name, data.phone, data.comment, now]
        sheet.append_row(row)

        # 3. Telegram
        tg_text = f"""
<b>✅ НОВАЯ ЗАЯВКА #{data.id}</b>

<b>Имя:</b> {data.name}
<b>Телефон:</b> {data.phone}
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