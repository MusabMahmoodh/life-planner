from langchain.tools import tool
from app.services.plan_service import plan_service
import json

@tool
def create_plan(goal_id: str, coach_name: str, goal_description: str, user_data: str) -> str:
    """
    Creates a structured plan based on coaching session data.
    
    Args:
        goal_id: The goal ID
        coach_name: Name of the coach
        goal_description: User's main goal
        user_data: JSON string of collected information during onboarding
    
    Returns:
        JSON string with plan details
    """
    try:
        # Parse user data
        data = json.loads(user_data) if user_data else {}
        
        # Create plan using service
        plan_data = plan_service.create_plan(
            coach_name=coach_name,
            goal=goal_description,
            user_responses=data
        )
        
        # Note: Actual Supabase save happens in the agent executor (coach_agent.py)
        # This returns the plan data for the agent to include in response
        
        return json.dumps({
            **plan_data,
            "goal_id": goal_id,
            "status": "pending_acceptance"
        })
    
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def modify_plan(goal_id: str, modification_request: str) -> str:
    """
    Modifies an existing plan during conversation.
    
    Args:
        goal_id: ID of the goal
        modification_request: Natural language description of changes (e.g., "skip next 5 steps")
    
    Returns:
        JSON string indicating modification action
    """
    try:
        # Note: Actual Supabase operations handled in agent executor (coach_agent.py)
        # This is called during conversation to signal plan modification
        
        return json.dumps({
            "goal_id": goal_id,
            "modification_request": modification_request,
            "action": "modify"
        })
    
    except Exception as e:
        return json.dumps({"error": str(e)})