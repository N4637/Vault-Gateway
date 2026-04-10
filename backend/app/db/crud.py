from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import PromptLog, EntityLog
from app.schemas.prompt import PromptResponse
from app.schemas.stats import DashboardStats, EntityTypeStat


async def log_prompt(db: AsyncSession, response: PromptResponse) -> PromptLog:

    prompt_log = PromptLog(
        session_id=response.session_id,
        original_prompt=response.original_prompt,
        masked_prompt=response.masked_prompt,
        llm_response=response.llm_response,
        pii_detected=response.pii_detected,
        entity_count=sum(response.entity_summary.values()),
        unresolved_count=len(response.unresolved_placeholders),
    )
    db.add(prompt_log)
    await db.flush()   

    for entity in response.detected_entities:
        entity_log = EntityLog(
            prompt_log_id=prompt_log.id,
            entity_type=entity.entity_type,
            placeholder=entity.placeholder,
            confidence=entity.confidence,
        )
        db.add(entity_log)

    await db.commit()
    await db.refresh(prompt_log)
    return prompt_log


async def get_dashboard_stats(db: AsyncSession) -> DashboardStats:
    
    total_prompts = await db.scalar(select(func.count()).select_from(PromptLog))
    prompts_with_pii = await db.scalar(
        select(func.count()).select_from(PromptLog).where(PromptLog.pii_detected == True)
    )
    total_fields = await db.scalar(
        select(func.sum(PromptLog.entity_count)).select_from(PromptLog)
    )

    # Entity type breakdown
    result = await db.execute(
        select(EntityLog.entity_type, func.count().label("cnt"))
        .group_by(EntityLog.entity_type)
        .order_by(func.count().desc())
    )
    breakdown = [
        EntityTypeStat(entity_type=row.entity_type, count=row.cnt)
        for row in result.all()
    ]

    return DashboardStats(
        total_prompts_processed=total_prompts or 0,
        total_pii_fields_masked=total_fields or 0,
        entity_type_breakdown=breakdown,
        prompts_with_pii=prompts_with_pii or 0,
        prompts_without_pii=(total_prompts or 0) - (prompts_with_pii or 0),
    )
