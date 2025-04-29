from pydantic import BaseModel, Field # type: ignore

class GenerateRequest(BaseModel):
    requirement: str = Field(..., description="Description of the UI the user wants to create")
