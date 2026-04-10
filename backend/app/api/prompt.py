import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.prompt import PromptRequest, PromptResponse, DetectedEntity
from app.core.detector import PIIDetector
from app.core.masker import pii_masker
from app.core.rehydrator import pii_rehydrator
from app.session.store import session_store
from app.llm.client import llm_client
from app.llm.prompts import (
    build_system_prompt,
    build_system_prompt_from_string,
    get_template_for_prompt,
)
from app.db.database import get_db
from app.db import crud

logger = logging.getLogger(__name__)
router = APIRouter()

_detector = PIIDetector(score_threshold=0.4)


@router.post("/prompt", response_model=PromptResponse)
async def process_prompt(
    request: PromptRequest,
    db: AsyncSession = Depends(get_db),
) -> PromptResponse:
    
    session_id = session_store.create_session()
    logger.info(f"New session: {session_id}")

    try:
        detections = _detector.detect(request.prompt)
        entity_summary = _detector.get_entity_summary(detections)
        pii_detected = len(detections) > 0

        masked_prompt, mapping = pii_masker.mask(
            text=request.prompt,
            detections=detections,
            session_id=session_id,
        )

        if request.system_message:
            system = build_system_prompt_from_string(request.system_message)
            logger.debug("Using custom system message with injected placeholder instructions")
        else:
            template = get_template_for_prompt(request.prompt)
            system = build_system_prompt(template)
            logger.debug(f"Auto-selected prompt template: {template.value}")

        llm_raw_response = await llm_client.complete(
            prompt=masked_prompt,
            system=system,
        )

        rehydrated_response, unresolved = pii_rehydrator.rehydrate_and_cleanup(
            text=llm_raw_response,
            session_id=session_id,
        )

        detected_entities = [
            DetectedEntity(
                entity_type=detection.entity_type,
                original_text=detection.text,
                placeholder=_find_placeholder(mapping, detection.text),
                confidence=round(detection.score, 3),
            )
            for detection in detections
        ]

        # Deduplicate — same value may be detected at multiple spans
        seen: set[str] = set()
        unique_entities: list[DetectedEntity] = []
        for entity in detected_entities:
            if entity.original_text not in seen:
                seen.add(entity.original_text)
                unique_entities.append(entity)

        response = PromptResponse(
            session_id=session_id,
            original_prompt=request.prompt,
            masked_prompt=masked_prompt,
            raw_llm_response=llm_raw_response,
            llm_response=rehydrated_response,
            detected_entities=unique_entities,
            entity_summary=entity_summary,
            pii_detected=pii_detected,
            unresolved_placeholders=unresolved,
        )

        try:
            await crud.log_prompt(db, response)
        except Exception as db_err:
            logger.error(f"Failed to log prompt to DB: {db_err}")

        return response

    except Exception as e:
        session_store.delete_session(session_id)
        logger.error(f"Prompt processing failed for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _find_placeholder(mapping: dict[str, str], original_value: str) -> str:
    for placeholder, value in mapping.items():
        if value == original_value:
            return placeholder
    return "[UNKNOWN]"