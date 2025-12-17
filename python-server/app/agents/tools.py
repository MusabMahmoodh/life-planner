from langchain.tools import tool
from app.services.plan_service import PlanService
import json

# Store plans in memory (since no DB)
PLANS_STORAGE = {}

@tool
def create_plan(coach_name: str, goal_description: str, user_data: str) -> str:
    """
    Creates a structured plan based on coaching session data.
    
    Args:
        coach_name: Name of the coach
        goal_description: User's main goal
        user_data: JSON string of collected information during onboarding
    
    Returns:
        JSON string with plan details
    """
    try:
        plan_service = PlanService()
        
        # Parse user data
        data = json.loads(user_data) if user_data else {}
        
        # Create plan
        plan = plan_service.create_plan(
            coach_name=coach_name,
            goal=goal_description,
            user_responses=data
        )
        
        # Store in memory
        PLANS_STORAGE[plan["plan_id"]] = plan
        
        return json.dumps(plan)
    
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def modify_plan(plan_id: str, modification_request: str) -> str:
    """
    Modifies an existing plan based on user request.
    
    Args:
        plan_id: ID of the plan to modify
        modification_request: Natural language description of changes (e.g., "skip next 5 steps")
    
    Returns:
        JSON string with updated plan
    """
    try:
        if plan_id not in PLANS_STORAGE:
            return json.dumps({"error": "Plan not found"})
        
        plan_service = PlanService()
        current_plan = PLANS_STORAGE[plan_id]
        
        # Modify plan
        updated_plan = plan_service.modify_plan(
            plan_id=plan_id,
            modification_request=modification_request,
            current_plan=current_plan
        )
        
        # Update storage
        PLANS_STORAGE[plan_id] = updated_plan
        
        return json.dumps(updated_plan)
    
    except Exception as e:
        return json.dumps({"error": str(e)})