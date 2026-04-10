from pydantic import BaseModel

class EntityTypeStat(BaseModel):
    entity_type: str
    count: int


class DashboardStats(BaseModel):
    total_prompts_processed: int
    total_pii_fields_masked: int
    entity_type_breakdown: list[EntityTypeStat]
    prompts_with_pii: int
    prompts_without_pii: int
