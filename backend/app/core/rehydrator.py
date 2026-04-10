import re
import logging
from app.session.store import SessionStore, session_store as default_store

logger = logging.getLogger(__name__)

PLACEHOLDER_PATTERN = re.compile(r"\[([A-Z_]+_\d+)\]")


class PIIRehydrator:

    def __init__(self, store: SessionStore = None):
        self._store = store or default_store

    def rehydrate(self, text: str, session_id: str) -> tuple[str, list[str]]:
        mapping = self._store.get_mapping(session_id)
        if not mapping:
            logger.warning(
                f"No mapping found for session {session_id} — returning text unchanged"
            )
            return text, []

        unresolved: list[str] = []
        rehydrated = text

        # Find all placeholder tokens in the LLM response
        found_placeholders = PLACEHOLDER_PATTERN.findall(rehydrated)

        for token_inner in set(found_placeholders):
            placeholder = f"[{token_inner}]"
            original = mapping.get(placeholder)

            if original is not None:
                rehydrated = rehydrated.replace(placeholder, original)
                logger.debug(f"Rehydrated {placeholder} → {original[:10]}...")
            else:
                unresolved.append(placeholder)
                logger.warning(
                    f"Could not resolve placeholder {placeholder} in session {session_id}"
                )

        if unresolved:
            logger.warning(f"Unresolved placeholders: {unresolved}")

        return rehydrated, unresolved

    def rehydrate_and_cleanup(
        self, text: str, session_id: str
    ) -> tuple[str, list[str]]:
        """
        Rehydrate and then delete the session from the store.
        Call this as the final step of a request cycle.
        """
        result, unresolved = self.rehydrate(text, session_id)
        self._store.delete_session(session_id)
        logger.info(f"Session {session_id} cleaned up after rehydration")
        return result, unresolved


# Singleton
pii_rehydrator = PIIRehydrator()
