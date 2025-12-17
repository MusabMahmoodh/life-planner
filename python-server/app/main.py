from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import ChatRequest, CoachResponse, CreateSessionRequest
from app.agents.coach_agent import get_or_create_session
import uuid

app = FastAPI(
    title="AI Coaching Platform API",
    version="1.0.0",
    description="Minimal version - LangChain powered coaching without DB"
)

# CORS - Allow any frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "coaching-api",
        "version": "1.0.0-minimal"
    }


@app.post("/api/session/create")
def create_session(request: CreateSessionRequest):
    """Create a new coaching session"""
    session_id = str(uuid.uuid4())
    
    # Initialize session
    session = get_or_create_session(
        session_id=session_id,
        coach_name=request.coach_name,
        goal_description=request.goal_description
    )
    
    return {
        "session_id": session_id,
        "coach_name": request.coach_name,
        "goal_description": request.goal_description,
        "message": f"Hi! I'm {request.coach_name}, and I'm excited to help you with {request.goal_description}! Let's get to know each other better."
    }


@app.post("/api/chat", response_model=CoachResponse)
async def chat_with_coach(request: ChatRequest):
    """
    Main chat endpoint - handles all conversation states
    Returns: message, flag (PLAN_SCREEN | CONVERSATION), plan_data
    """
    try:
        # Get or create session
        session = get_or_create_session(
            session_id=request.session_id,
            coach_name=request.coach_name or "Alex",
            goal_description=request.goal_description or "achieving your goals"
        )
        
        # Process message through LangChain agent
        response = await session.process_message(request.message)
        
        return CoachResponse(**response)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/session/{session_id}")
def get_session_info(session_id: str):
    """Get session information"""
    from app.agents.coach_agent import SESSIONS_STORAGE
    
    if session_id not in SESSIONS_STORAGE:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = SESSIONS_STORAGE[session_id]
    
    return {
        "session_id": session_id,
        "coach_name": session.coach_name,
        "goal_description": session.goal_description,
        "stage": session.stage,
        "plan_id": session.plan_id,
        "message_count": len(session.chat_history)
    }