from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.dependencies import get_current_user
from app.db.supabase_client import supabase_admin
from app.schemas.goal import CreateGoalRequest, GoalResponse, GoalDetailResponse

router = APIRouter()

@router.get("", response_model=List[GoalResponse])
async def list_goals(current_user: dict = Depends(get_current_user)):
    """Get all goals for the logged-in user"""
    
    try:
        # Query goals with plan check
        response = supabase_admin.table('goals')\
            .select('*, plans(id)')\
            .eq('user_id', current_user['id'])\
            .order('created_at', desc=True)\
            .execute()
        
        return [
            GoalResponse(
                id=goal['id'],
                coach_name=goal['coach_name'],
                goal_description=goal['goal_description'],
                status=goal['status'],
                current_step=goal['current_step'],
                created_at=goal['created_at'],
                updated_at=goal['updated_at'],
                has_plan=len(goal.get('plans', [])) > 0
            )
            for goal in response.data
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch goals: {str(e)}"
        )


@router.post("", response_model=GoalResponse)
async def create_goal(
    request: CreateGoalRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new goal"""
    
    try:
        response = supabase_admin.table('goals').insert({
            'user_id': current_user['id'],
            'coach_name': request.coach_name,
            'goal_description': request.goal_description,
            'status': 'onboarding',
            'current_step': 0
        }).execute()
        
        goal = response.data[0]
        
        return GoalResponse(
            id=goal['id'],
            coach_name=goal['coach_name'],
            goal_description=goal['goal_description'],
            status=goal['status'],
            current_step=goal['current_step'],
            created_at=goal['created_at'],
            updated_at=goal['updated_at'],
            has_plan=False
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create goal: {str(e)}"
        )


@router.get("/{goal_id}", response_model=GoalDetailResponse)
async def get_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get goal details with plan"""
    
    try:
        # Get goal with plan
        response = supabase_admin.table('goals')\
            .select('*, plans(*)')\
            .eq('id', goal_id)\
            .eq('user_id', current_user['id'])\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )
        
        goal = response.data
        plans = goal.get('plans', [])
        plan_data = plans[0] if plans else None
        
        return GoalDetailResponse(
            id=goal['id'],
            coach_name=goal['coach_name'],
            goal_description=goal['goal_description'],
            status=goal['status'],
            current_step=goal['current_step'],
            created_at=goal['created_at'],
            plan=plan_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch goal: {str(e)}"
        )