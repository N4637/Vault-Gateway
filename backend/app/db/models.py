from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class PromptLog(Base):
    __tablename__ = "prompt_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    original_prompt: Mapped[str] = mapped_column(Text)
    masked_prompt: Mapped[str] = mapped_column(Text)
    llm_response: Mapped[str] = mapped_column(Text)
    pii_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    entity_count: Mapped[int] = mapped_column(Integer, default=0)
    unresolved_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    entities: Mapped[list["EntityLog"]] = relationship(
        "EntityLog", back_populates="prompt_log", cascade="all, delete-orphan"
    )


class EntityLog(Base):
    __tablename__ = "entity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    prompt_log_id: Mapped[int] = mapped_column(Integer, ForeignKey("prompt_logs.id"))
    entity_type: Mapped[str] = mapped_column(String(64), index=True)
    placeholder: Mapped[str] = mapped_column(String(64))
    confidence: Mapped[float] = mapped_column(Float)

    prompt_log: Mapped["PromptLog"] = relationship("PromptLog", back_populates="entities")
