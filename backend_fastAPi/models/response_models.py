from pydantic import BaseModel, Field # type: ignore
from typing import Optional

class GenerateResponse(BaseModel):
    html: str = Field(default="", description="Generated HTML code")
    css: str = Field(default="", description="Generated CSS code")
    javascript: str = Field(default="", description="Generated JavaScript code")
    analysis: Optional[str] = Field(default=None, description="Analysis of the requirement")
    plan: Optional[str] = Field(default=None, description="Plan for implementing the UI")
    feedback: Optional[str] = Field(default=None, description="Feedback or suggestions if the requirement isn't clear")
