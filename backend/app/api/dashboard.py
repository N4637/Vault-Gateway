from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db import crud
from app.schemas.stats import DashboardStats

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_stats(db: AsyncSession = Depends(get_db)) -> DashboardStats:
    """Return aggregated system activity statistics."""
    return await crud.get_dashboard_stats(db)
