"""
Session store: holds the placeholder → original value mapping
for each request session.

Since we're skipping auth, each prompt gets a unique session_id
generated at request time. The mapping lives only for the
duration of that request cycle (mask → LLM → rehydrate).

For future scaling this can be swapped to Redis with no changes
to the rest of the codebase — just replace the dict operations.
"""

import uuid
from typing import Optional


class SessionStore:
    """
    Thread-safe in-memory store.
    Structure:
        {
            "session-uuid": {
                "[PERSON_1]": "John Smith",
                "[EMAIL_1]": "john@acme.com",
                ...
            }
        }
    """

    def __init__(self):
        self._store: dict[str, dict[str, str]] = {}

    def create_session(self) -> str:
        """Create a new session and return its ID."""
        session_id = str(uuid.uuid4())
        self._store[session_id] = {}
        return session_id

    def set_mapping(self, session_id: str, placeholder: str, original: str) -> None:
        """Store a single placeholder → original mapping."""
        if session_id not in self._store:
            self._store[session_id] = {}
        self._store[session_id][placeholder] = original

    def get_mapping(self, session_id: str) -> dict[str, str]:
        """Return the full mapping dict for a session."""
        return self._store.get(session_id, {})

    def get_original(self, session_id: str, placeholder: str) -> Optional[str]:
        """Look up a single placeholder's original value."""
        return self._store.get(session_id, {}).get(placeholder)

    def delete_session(self, session_id: str) -> None:
        """Clean up after rehydration is done."""
        self._store.pop(session_id, None)

    def session_exists(self, session_id: str) -> bool:
        return session_id in self._store


# Singleton instance shared across the app
session_store = SessionStore()
