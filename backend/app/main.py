import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db.database import create_tables
from app.api import prompt as prompt_router
from app.api import dashboard as dashboard_router

settings = get_settings()

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("Vault backend starting up...")
    await create_tables()
    logger.info("Database tables ready.")
    yield
    logger.info("Vault backend shutting down.")


app = FastAPI(
    title="Vault — Privacy Gateway API",
    description=(
        "Vault intercepts prompts, masks PII before sending to LLMs, "
        "and rehydrates responses before returning to the user."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(prompt_router.router, prefix="/api", tags=["Prompt"])
app.include_router(dashboard_router.router, prefix="/api/dashboard", tags=["Dashboard"])


@app.get("/health", tags=["Health"])
async def health_check():
    """Simple liveness check — useful for demo."""
    return {"status": "ok", "service": "vault-backend"}