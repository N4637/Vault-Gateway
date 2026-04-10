import logging
from app.core.detector import DetectionResult, PIIDetector
from app.session.store import SessionStore, session_store as default_store

logger = logging.getLogger(__name__)


class PIIMasker:

    def __init__(self, store: SessionStore = None):
        self._store = store or default_store

    def mask(
        self,
        text: str,
        detections: list[DetectionResult],
        session_id: str,
    ) -> tuple[str, dict[str, str]]:
        if not detections:
            return text, {}

        value_to_placeholder: dict[str, str] = {}
        entity_counters: dict[str, int] = {}
        mapping: dict[str, str] = {}

        for detection in detections:
            original_value = detection.text

            if original_value in value_to_placeholder:
                continue

            entity_type = detection.entity_type
            entity_counters[entity_type] = entity_counters.get(entity_type, 0) + 1
            placeholder = f"[{entity_type}_{entity_counters[entity_type]}]"

            value_to_placeholder[original_value] = placeholder
            mapping[placeholder] = original_value

            self._store.set_mapping(session_id, placeholder, original_value)

        masked_text = text
        for detection in sorted(detections, key=lambda d: d.start, reverse=True):
            original_value = detection.text
            placeholder = value_to_placeholder.get(original_value)
            if placeholder:
                masked_text = (
                    masked_text[: detection.start]
                    + placeholder
                    + masked_text[detection.end :]
                )

        logger.info(
            f"Masked {len(mapping)} unique PII values in session {session_id}"
        )
        return masked_text, mapping

    def mask_text(
        self,
        text: str,
        session_id: str,
        detector: PIIDetector,
    ) -> tuple[str, dict[str, str], list[DetectionResult]]:
        
        detections = detector.detect(text)
        masked_text, mapping = self.mask(text, detections, session_id)
        return masked_text, mapping, detections


pii_masker = PIIMasker()
