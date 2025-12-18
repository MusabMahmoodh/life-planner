from openai import OpenAI
from app.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def generate_welcome_message(
    coach_name: str,
    goal_description: str,
    status: str,
    current_step: int,
    total_steps: int,
    has_messages: bool
) -> str:
    """Generate a contextual welcome message"""
    
    if not has_messages:
        # First time
        return f"Hi! I'm {coach_name}, and I'm excited to help you with {goal_description}! Let's get to know each other better. Tell me a bit about yourself and your goals."
    
    if status == "onboarding" or status == "confirming":
        return f"Welcome back! Let's continue our conversation about your {goal_description} goal."
    
    if status == "pending_acceptance":
        return f"Hey! I've created a plan for your {goal_description} journey. Take a look and let me know if you'd like to adjust anything!"
    
    if status == "active":
        progress_percent = int((current_step / total_steps) * 100) if total_steps > 0 else 0
        return f"Welcome back! You're {progress_percent}% through your {goal_description} journey (step {current_step} of {total_steps}). How can I support you today?"
    
    if status == "completed":
        return f"Congratulations on completing your {goal_description} goal! 🎉 How are you feeling? Want to set a new goal?"
    
    return f"Welcome back! How can I help you with your {goal_description} goal today?"

chat_service = {
    "generate_welcome_message": generate_welcome_message
}