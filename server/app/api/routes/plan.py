from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user
from app.db.supabase_client import supabase_admin
from app.schemas.chat import TweakPlanRequest, TweakPlanResponse
from app.services.plan_service import plan_service

router = APIRouter()

@router.put("/{goal_id}/accept")
async def accept_plan(
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Accept the plan for a goal"""
    
    try:
        # Verify goal ownership
        goal_response = supabase_admin.table('goals')\
            .select('id')\
            .eq('id', goal_id)\
            .eq('user_id', current_user['id'])\
            .single()\
            .execute()
        
        if not goal_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )
        
        # Get plan
        plan_response = supabase_admin.table('plans')\
            .select('id')\
            .eq('goal_id', goal_id)\
            .single()\
            .execute()
        
        if not plan_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No plan found for this goal"
            )
        
        # Update plan status
        supabase_admin.table('plans')\
            .update({'status': 'accepted'})\
            .eq('goal_id', goal_id)\
            .execute()
        
        # Update goal status
        supabase_admin.table('goals')\
            .update({'status': 'active'})\
            .eq('id', goal_id)\
            .execute()
        
        return {
            "message": "Plan accepted successfully",
            "goal_id": goal_id,
            "plan_id": plan_response.data['id'],
            "status": "active"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to accept plan: {str(e)}"
        )


@router.post("/{goal_id}/tweak", response_model=TweakPlanResponse)
async def tweak_plan(
    goal_id: str,
    request: TweakPlanRequest,
    current_user: dict = Depends(get_current_user)
):
    """Tweak the plan using AI (direct OpenAI completion)"""
    
    try:
        # Get goal
        goal_response = supabase_admin.table('goals')\
            .select('goal_description, coach_name')\
            .eq('id', goal_id)\
            .eq('user_id', current_user['id'])\
            .single()\
            .execute()
        
        if not goal_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )
        
        goal = goal_response.data
        
        # Get plan
        plan_response = supabase_admin.table('plans')\
            .select('*')\
            .eq('goal_id', goal_id)\
            .single()\
            .execute()
        
        if not plan_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No plan found for this goal"
            )
        
        plan = plan_response.data
        
        # Current plan data
        current_plan_data = {
            "title": plan['title'],
            "coach_name": goal['coach_name'],
            "goal": goal['goal_description'],
            "steps": plan['steps'],
            "total_steps": plan['total_steps']
        }
        
        # Use AI to tweak the plan
        modified_plan = plan_service.tweak_plan_with_ai(
            tweak_message=request.tweak_message,
            current_plan=current_plan_data,
            goal_description=goal['goal_description']
        )
        
        # Update plan in database
        supabase_admin.table('plans')\
            .update({
                'title': modified_plan.get('title', plan['title']),
                'steps': modified_plan.get('steps', plan['steps']),
                'total_steps': modified_plan.get('total_steps', plan['total_steps'])
            })\
            .eq('goal_id', goal_id)\
            .execute()
        
        # Get updated plan
        updated_plan_response = supabase_admin.table('plans')\
            .select('*')\
            .eq('goal_id', goal_id)\
            .single()\
            .execute()
        
        updated_plan = updated_plan_response.data
        
        return TweakPlanResponse(
            plan={
                "plan_id": updated_plan['id'],
                "title": updated_plan['title'],
                "steps": updated_plan['steps'],
                "total_steps": updated_plan['total_steps'],
                "status": updated_plan['status'],
                "modification_note": modified_plan.get("modification_note", "Plan updated based on your request")
            },
            message="Plan tweaked successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to tweak plan: {str(e)}"
        )


@router.put("/{goal_id}/complete")
async def complete_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a goal as completed"""
    
    try:
        # Verify goal ownership
        goal_response = supabase_admin.table('goals')\
            .select('id')\
            .eq('id', goal_id)\
            .eq('user_id', current_user['id'])\
            .single()\
            .execute()
        
        if not goal_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )
        
        # Update status
        supabase_admin.table('goals')\
            .update({'status': 'completed'})\
            .eq('id', goal_id)\
            .execute()
        
        return {
            "message": "Goal marked as completed! 🎉",
            "goal_id": goal_id,
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete goal: {str(e)}"
        )