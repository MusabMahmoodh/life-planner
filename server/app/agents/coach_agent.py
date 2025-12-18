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

                    # Create plan in Supabase
                    plan_dict = tool_result
                    plan_response = supabase_admin.table('plans').insert({
                        'goal_id': self.goal['id'],
                        'title': plan_dict.get('title', f"Your {self.goal['goal_description']} Plan"),
                        'steps': plan_dict.get('steps', []),
                        'total_steps': plan_dict.get('total_steps', 0),
                        'status': 'pending_acceptance'
                    }).execute()

                    # Update goal status
                    supabase_admin.table('goals')\
                        .update({'status': 'pending_acceptance'})\
                        .eq('id', self.goal['id'])\
                        .execute()
                    
                    plan = plan_response.data[0]
                    
                    plan_data = {
                        "plan_id": plan['id'],
                        "title": plan['title'],
                        "steps": plan['steps'],
                        "total_steps": plan['total_steps'],
                        "status": plan['status']
                    }
                
                # Handle modify_plan tool
                elif action.tool == "modify_plan":
                    flag = "PLAN_SCREEN"

                    # Get current plan
                    plan_response = supabase_admin.table('plans')\
                        .select('*')\
                        .eq('goal_id', self.goal['id'])\
                        .single()\
                        .execute()

                    if plan_response.data:
                        plan = plan_response.data

                        # Modify plan
                        modified = plan_service.modify_plan_with_agent(
                            modification_request=tool_result.get("modification_request", ""),
                            current_plan={
                                "title": plan['title'],
                                "steps": plan['steps'],
                                "total_steps": plan['total_steps']
                            },
                            current_step=self.goal['current_step']
                        )

                        # Update in Supabase
                        supabase_admin.table('plans')\
                            .update({
                                'steps': modified['steps'],
                                'total_steps': modified['total_steps']
                            })\
                            .eq('goal_id', self.goal['id'])\
                            .execute()

                        # Get updated plan
                        updated_response = supabase_admin.table('plans')\
                            .select('*')\
                            .eq('goal_id', self.goal['id'])\
                            .single()\
                            .execute()
                        
                        updated_plan = updated_response.data
                        
                        plan_data = {
                            "plan_id": updated_plan['id'],
                            "title": updated_plan['title'],
                            "steps": updated_plan['steps'],
                            "total_steps": updated_plan['total_steps'],
                            "modification_note": modified.get("modification_note", ""),
                            "status": updated_plan['status']
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