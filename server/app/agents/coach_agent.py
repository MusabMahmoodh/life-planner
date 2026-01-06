from langchain_classic.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from app.agents.tools import create_plan, modify_plan
from app.agents.prompts import COACH_SYSTEM_PROMPT
from app.config import settings
from app.db.supabase_client import supabase_admin
from app.services.plan_service import plan_service
import json
from typing import Dict, Any, List

class CoachingAgent:
    def __init__(self, goal: dict, user_id: str):
        self.goal = goal
        self.user_id = user_id
        
        # Initialize LangChain components
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.7,
            api_key=settings.OPENAI_API_KEY
        )
        
        self.tools = [create_plan, modify_plan]
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", COACH_SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        self.agent = create_openai_tools_agent(self.llm, self.tools, self.prompt)
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True,
            return_intermediate_steps=True
        )
    
    async def process_message(self, user_input: str) -> Dict[str, Any]:
        """Process user message and return structured response"""
        
        # Load chat history
        chat_history = self._load_history()
        
        # Invoke agent
        response = await self.agent_executor.ainvoke({
            "input": user_input,
            "coach_name": self.goal['coach_name'],
            "goal_description": self.goal['goal_description'],
            "stage": self.goal['status'],
            "chat_history": chat_history,
            "goal_id": self.goal['id']
        })
        
        # Save messages
        self._save_message("user", user_input)
        self._save_message("assistant", response["output"])
        
        # Parse response and handle tool calls
        return self._parse_response(response)
    
    def _load_history(self) -> List:
        """Load chat history from Supabase"""
        response = supabase_admin.table('messages')\
            .select('*')\
            .eq('goal_id', self.goal['id'])\
            .order('created_at')\
            .execute()

        messages = []
        for msg in response.data:
            if msg['role'] == 'user':
                messages.append(HumanMessage(content=msg['content']))
            else:
                messages.append(AIMessage(content=msg['content']))

        return messages
    
    def _save_message(self, role: str, content: str, metadata: dict = None):
        supabase_admin.table('messages').insert({
            'goal_id': self.goal['id'],
            'role': role,
            'content': content,
            'metadata': metadata
        }).execute()

    def _parse_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
    
        output = response["output"]
        flag = "CONVERSATION"
        plan_data = None
        
        # Check if tools were used
        if response.get("intermediate_steps"):
            for step in response["intermediate_steps"]:
                action = step[0]
                tool_output = step[1]
                
                try:
                    tool_result = json.loads(tool_output)
                except:
                    tool_result = {}
                
                # Handle create_plan tool
                if action.tool == "create_plan":
                    flag = "PLAN_SCREEN"

                    # Check if plan already exists
                    plan_dict = tool_result
                    existing_plan_response = supabase_admin.table('plans')\
                        .select('*')\
                        .eq('goal_id', self.goal['id'])\
                        .limit(1)\
                        .execute()
                    
                    if existing_plan_response.data and len(existing_plan_response.data) > 0:
                        # Update existing plan - preserve completed steps
                        existing_plan = existing_plan_response.data[0]
                        existing_steps = existing_plan.get('steps', [])
                        new_steps = plan_dict.get('steps', [])
                        
                        # Separate completed and remaining steps from existing plan
                        completed_steps = [step for step in existing_steps if step.get("completed", False)]
                        remaining_existing_steps = [step for step in existing_steps if not step.get("completed", False)]
                        
                        # Merge: keep completed steps, replace remaining with new steps
                        # Preserve completed steps, use new steps for remaining
                        final_steps = completed_steps + new_steps
                        
                        # Renumber all steps
                        for idx, step in enumerate(final_steps, 1):
                            step["id"] = idx
                        
                        plan_data_to_save = {
                            'title': plan_dict.get('title', existing_plan.get('title', f"Your {self.goal['goal_description']} Plan")),
                            'steps': final_steps,
                            'total_steps': len(final_steps),
                            'status': 'pending_acceptance'
                        }
                        
                        # Update existing plan
                        supabase_admin.table('plans')\
                            .update(plan_data_to_save)\
                            .eq('goal_id', self.goal['id'])\
                            .execute()
                        # Fetch updated plan
                        updated_response = supabase_admin.table('plans')\
                            .select('*')\
                            .eq('goal_id', self.goal['id'])\
                            .limit(1)\
                            .execute()
                        plan = updated_response.data[0]
                    else:
                        # Create new plan
                        plan_data_to_save = {
                            'title': plan_dict.get('title', f"Your {self.goal['goal_description']} Plan"),
                            'steps': plan_dict.get('steps', []),
                            'total_steps': plan_dict.get('total_steps', 0),
                            'status': 'pending_acceptance'
                        }
                        plan_response = supabase_admin.table('plans').insert({
                            'goal_id': self.goal['id'],
                            **plan_data_to_save
                        }).execute()
                        plan = plan_response.data[0]

                    # Update goal status
                    supabase_admin.table('goals')\
                        .update({'status': 'pending_acceptance'})\
                        .eq('id', self.goal['id'])\
                        .execute()
                    
                    plan_data = {
                        "plan_id": plan['id'],
                        "title": plan['title'],
                        "coach_name": self.goal['coach_name'],
                        "goal": self.goal['goal_description'],
                        "steps": plan['steps'],
                        "total_steps": plan['total_steps'],
                        "status": plan['status']
                    }
                
                # Handle modify_plan tool
                elif action.tool == "modify_plan":
                    # Get current plan
                    plan_response = supabase_admin.table('plans')\
                        .select('*')\
                        .eq('goal_id', self.goal['id'])\
                        .limit(1)\
                        .execute()

                    if plan_response.data and len(plan_response.data) > 0:
                        flag = "PLAN_SCREEN"
                        plan = plan_response.data[0]
                        
                        modification_request = tool_result.get("modification_request", "").strip().lower()
                        
                        # Check if this is just a request to show the plan (no specific changes)
                        show_only_keywords = [
                            "show the plan",
                            "show plan",
                            "see the plan",
                            "view the plan",
                            "let's see",
                            "show me",
                            "display the plan"
                        ]
                        
                        is_show_only = not modification_request or any(keyword in modification_request for keyword in show_only_keywords)
                        
                        if is_show_only:
                            # Just show the current plan without modifying
                            plan_data = {
                                "plan_id": plan['id'],
                                "title": plan['title'],
                                "coach_name": self.goal['coach_name'],
                                "goal": self.goal['goal_description'],
                                "steps": plan['steps'],
                                "total_steps": plan['total_steps'],
                                "status": plan['status']
                            }
                        else:
                            # User provided specific changes - modify the plan
                            modified = plan_service.modify_plan_with_agent(
                                modification_request=tool_result.get("modification_request", ""),
                                current_plan={
                                    "title": plan['title'],
                                    "coach_name": plan.get('coach_name', self.goal['coach_name']),
                                    "goal": self.goal['goal_description'],
                                    "steps": plan['steps'],
                                    "total_steps": plan['total_steps']
                                },
                                current_step=self.goal['current_step'],
                                goal_description=self.goal['goal_description']
                            )

                            # Update in Supabase
                            update_data = {
                                'steps': modified['steps'],
                                'total_steps': modified['total_steps'],
                                'status': 'pending_acceptance'  # Set to pending after modification
                            }
                            
                            # Update title if it was modified
                            if 'title' in modified:
                                update_data['title'] = modified['title']
                            
                            supabase_admin.table('plans')\
                                .update(update_data)\
                                .eq('goal_id', self.goal['id'])\
                                .execute()

                            # Update goal status to pending_acceptance
                            supabase_admin.table('goals')\
                                .update({'status': 'pending_acceptance'})\
                                .eq('id', self.goal['id'])\
                                .execute()
                            
                            self.goal['status'] = 'pending_acceptance'

                            # Get updated plan
                            updated_response = supabase_admin.table('plans')\
                                .select('*')\
                                .eq('goal_id', self.goal['id'])\
                                .limit(1)\
                                .execute()

                            updated_plan = updated_response.data[0]
                            
                            plan_data = {
                                "plan_id": updated_plan['id'],
                                "title": modified.get("title", updated_plan['title']),
                                "coach_name": modified.get("coach_name", self.goal['coach_name']),
                                "goal": modified.get("goal", self.goal['goal_description']),
                                "steps": modified['steps'],
                                "total_steps": modified['total_steps'],
                                "modification_note": modified.get("modification_note", "Plan updated based on your request"),
                                "status": "pending_acceptance"
                            }
        
        # Update stage based on conversation
        if self.goal['status'] == 'onboarding' and "shall we finalize" in output.lower():
            supabase_admin.table('goals')\
                .update({'status': 'confirming'})\
                .eq('id', self.goal['id'])\
                .execute()
            self.goal['status'] = 'confirming'
        
        return {
            "message": output,
            "flag": flag,
            "plan_data": plan_data,
            "stage": self.goal['status']
        }