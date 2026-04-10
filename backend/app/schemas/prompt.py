from pydantic import BaseModel, Field
from typing import Optional


class PromptRequest(BaseModel):
    
    prompt: str = Field(..., min_length=1, max_length=10_000, description="Raw user prompt")
    system_message: Optional[str] = Field(
        default=None,
        description="Optional system message / persona for the LLM"
    )


class DetectedEntity(BaseModel):
    
    entity_type: str
    original_text: str
    placeholder: str
    confidence: float


class PromptResponse(BaseModel):
    
    session_id: str
    original_prompt: str
    masked_prompt: str
    raw_llm_response: str 
    llm_response: str                        
    detected_entities: list[DetectedEntity]  
    entity_summary: dict[str, int]           
    pii_detected: bool
    unresolved_placeholders: list[str]       


class PromptError(BaseModel):
   
    error: str
    detail: Optional[str] = None
