from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, goals, plan, chat

app = FastAPI(
    title="AI Coaching Platform API (Supabase)",
    version="2.0.0-supabase",
    description="Full-featured coaching platform with Supabase backend"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(goals.router, prefix="/api/goals", tags=["goals"])
app.include_router(plan.router, prefix="/api/goal", tags=["plan"])
app.include_router(chat.router, prefix="/api/goal", tags=["chat"])

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "coaching-api-supabase",
        "version": "2.0.0"
    }

@app.get("/health")
def health():
    return {"status": "ok"}
