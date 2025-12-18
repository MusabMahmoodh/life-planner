from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Literal

class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: str
    metadata: Optional[Dict[str, Any]] = None

class LoadChatResponse(BaseModel):
    messages: List[ChatMessageResponse]
    welcome_message: str
    goal: Dict[str, Any]

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    message: str
    flag: Literal["PLAN_SCREEN", "CONVERSATION"] = "CONVERSATION"
    plan_data: Optional[Dict[str, Any]] = None
    stage: str

class TweakPlanRequest(BaseModel):
    tweak_message: str

class TweakPlanResponse(BaseModel):
    plan: Dict[str, Any]
    message: str