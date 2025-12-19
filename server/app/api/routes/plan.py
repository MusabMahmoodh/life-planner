from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user
from app.db.supabase_client import supabase_admin
from app.schemas.chat import TweakPlanRequest, TweakPlanResponse, UpdateStepCompletionRequest
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
            .limit(1)\
            .execute()

        if not goal_response.data or len(goal_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )

        # Get plan
        plan_response = supabase_admin.table('plans')\
            .select('id')\
            .eq('goal_id', goal_id)\
            .limit(1)\
            .execute()

        if not plan_response.data or len(plan_response.data) == 0:
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
            "plan_id": plan_response.data[0]['id'],
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
            .limit(1)\
            .execute()

        if not goal_response.data or len(goal_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )

        goal = goal_response.data[0]

        # Get plan
        plan_response = supabase_admin.table('plans')\
            .select('*')\
            .eq('goal_id', goal_id)\
            .limit(1)\
            .execute()

        if not plan_response.data or len(plan_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No plan found for this goal"
            )

        plan = plan_response.data[0]
        
        # Separate completed and remaining steps while preserving order
        all_steps = plan['steps']
        remaining_steps = request.remaining_steps if request.remaining_steps else [step for step in all_steps if not step.get('completed', False)]
        
        # Current plan data - only include remaining steps for tweaking
        current_plan_data = {
            "title": plan['title'],
            "coach_name": goal['coach_name'],
            "goal": goal['goal_description'],
            "steps": remaining_steps,
            "total_steps": len(remaining_steps)
        }
        
        # Use AI to tweak only the remaining steps
        modified_plan = plan_service.tweak_plan_with_ai(
            tweak_message=request.tweak_message,
            current_plan=current_plan_data,
            goal_description=goal['goal_description']
        )
        
        # Get modified remaining steps
        modified_remaining_steps = modified_plan.get('steps', remaining_steps)
        
        # Reconstruct final steps preserving original order
        # Map completed steps by their original position
        final_steps = []
        step_id_counter = 1
        
        # First, add all completed steps in their original order
        for step in all_steps:
            if step.get('completed', False):
                step_copy = step.copy()
                step_copy['id'] = step_id_counter
                final_steps.append(step_copy)
                step_id_counter += 1
        
        # Then, add modified remaining steps
        for step in modified_remaining_steps:
            step_copy = step.copy()
            step_copy['id'] = step_id_counter
            step_copy['completed'] = False  # Ensure remaining steps are not marked as completed
            final_steps.append(step_copy)
            step_id_counter += 1
        
        # Update plan in database
        supabase_admin.table('plans')\
            .update({
                'title': modified_plan.get('title', plan['title']),
                'steps': final_steps,
                'total_steps': len(final_steps)
            })\
            .eq('goal_id', goal_id)\
            .execute()
        
        # Get updated plan
        updated_plan_response = supabase_admin.table('plans')\
            .select('*')\
            .eq('goal_id', goal_id)\
            .limit(1)\
            .execute()

        updated_plan = updated_plan_response.data[0]
        
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


@router.put("/{goal_id}/step/{step_id}/completion")
async def update_step_completion(
    goal_id: str,
    step_id: int,
    request: UpdateStepCompletionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update the completion status of a specific step"""
    
    try:
        # Verify goal ownership
        goal_response = supabase_admin.table('goals')\
            .select('id')\
            .eq('id', goal_id)\
            .eq('user_id', current_user['id'])\
            .limit(1)\
            .execute()

        if not goal_response.data or len(goal_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )

        # Get plan
        plan_response = supabase_admin.table('plans')\
            .select('*')\
            .eq('goal_id', goal_id)\
            .limit(1)\
            .execute()

        if not plan_response.data or len(plan_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No plan found for this goal"
            )

        plan = plan_response.data[0]
        steps = plan['steps']
        
        # Find and update the step
        step_found = False
        for step in steps:
            if step['id'] == step_id:
                step['completed'] = request.completed
                step_found = True
                break
        
        if not step_found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Step {step_id} not found in plan"
            )
        
        # Update plan in database
        supabase_admin.table('plans')\
            .update({'steps': steps})\
            .eq('goal_id', goal_id)\
            .execute()
        
        # Update goal's current_step if needed
        if request.completed:
            # Find the first incomplete step
            current_step = 0
            for idx, step in enumerate(steps):
                if not step.get('completed', False):
                    current_step = idx
                    break
                current_step = idx + 1
            
            # Update goal's current_step (0-indexed, so subtract 1 for display)
            supabase_admin.table('goals')\
                .update({'current_step': min(current_step, len(steps))})\
                .eq('id', goal_id)\
                .execute()
        
        return {
            "message": f"Step {step_id} marked as {'completed' if request.completed else 'incomplete'}",
            "step_id": step_id,
            "completed": request.completed
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update step completion: {str(e)}"
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
            .limit(1)\
            .execute()

        if not goal_response.data or len(goal_response.data) == 0:
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