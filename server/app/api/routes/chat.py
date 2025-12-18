from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user
from app.db.supabase_client import supabase_admin
from app.schemas.chat import ChatRequest, ChatResponse, LoadChatResponse, ChatMessageResponse
from app.agents.coach_agent import CoachingAgent
from app.services.chat_service import chat_service

router = APIRouter()

@router.get("/{goal_id}/chat", response_model=LoadChatResponse)
async def load_chat(
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Load chat history for a goal with generated welcome message"""

    try:
        # Get goal with plan (use limit(1) instead of single() to avoid exception on no results)
        goal_response = (
                supabase_admin
                .table('goals')
                .select('*')
                .eq('id', goal_id)
                .eq('user_id', current_user['id'])
                .limit(1)
                .execute()
            )


        if not goal_response.data or len(goal_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )

        goal = goal_response.data[0]
        plans = (supabase_admin
                    .table('plans')
                    .select('*')
                    .eq('goal_id', goal_id)
                    .execute()
                ).data
        total_steps = plans[0]['total_steps'] if plans else 0
        
        # Get messages
        messages_response = supabase_admin.table('messages')\
            .select('*')\
            .eq('goal_id', goal_id)\
            .order('created_at')\
            .execute()
        
        messages = messages_response.data
        
        # Generate welcome message
        welcome_message = chat_service["generate_welcome_message"](
            coach_name=goal['coach_name'],
            goal_description=goal['goal_description'],
            status=goal['status'],
            current_step=goal['current_step'],
            total_steps=total_steps,
            has_messages=len(messages) > 0
        )
        
        return LoadChatResponse(
            messages=[
                ChatMessageResponse(
                    id=msg['id'],
                    role=msg['role'],
                    content=msg['content'],
                    created_at=msg['created_at'],
                    metadata=msg.get('metadata')
                )
                for msg in messages
            ],
            welcome_message=welcome_message,
            goal={
                "id": goal['id'],
                "coach_name": goal['coach_name'],
                "goal_description": goal['goal_description'],
                "status": goal['status'],
                "current_step": goal['current_step']
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching goal: {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load chat: {str(e)}"
        )


@router.post("/{goal_id}/chat", response_model=ChatResponse)
async def chat_with_coach(
    goal_id: str,
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Chat with the coach using LangChain agent"""

    try:
        # Get goal (use limit(1) instead of single() to avoid exception on no results)
        goal_response = supabase_admin.table('goals')\
            .select('*')\
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
        
        # Create agent and process message
        agent = CoachingAgent(goal=goal, user_id=current_user['id'])
        response = await agent.process_message(request.message)
        
        return ChatResponse(**response)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching goal: {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )