from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class CreateGoalRequest(BaseModel):
    coach_name: str
    goal_description: str

class GoalResponse(BaseModel):
    id: str
    coach_name: str
    goal_description: str
    status: str
    current_step: int
    created_at: str
    updated_at: str
    has_plan: bool

class GoalDetailResponse(BaseModel):
    id: str
    coach_name: str
    goal_description: str
    status: str
    current_step: int
    created_at: str
    plan: Optional[Dict[str, Any]] = None