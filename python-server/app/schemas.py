from pydantic import BaseModel
from typing import Optional, Literal, Dict, Any, List

class ChatRequest(BaseModel):
    session_id: str
    message: str
    coach_name: Optional[str] = "Alex"
    goal_description: Optional[str] = None

class CoachResponse(BaseModel):
    message: str
    flag: Literal["PLAN_SCREEN", "CONVERSATION"] = "CONVERSATION"
    plan_data: Optional[Dict[str, Any]] = None
    session_id: str
    stage: str

class CreateSessionRequest(BaseModel):
    coach_name: str
    goal_description: str