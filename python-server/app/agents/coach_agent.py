from langchain_classic.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from app.agents.tools import create_plan, modify_plan
from app.agents.prompts import COACH_SYSTEM_PROMPT
from app.config import settings
import json
from typing import Dict, Any, List

# In-memory session storage
SESSIONS_STORAGE = {}

class CoachingSession:
    def __init__(self, session_id: str, coach_name: str, goal_description: str):
        self.session_id = session_id
        self.coach_name = coach_name
        self.goal_description = goal_description
        self.stage = "onboarding"
        self.plan_id = None
        self.chat_history = []
        
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
        
        # Invoke agent
        response = await self.agent_executor.ainvoke({
            "input": user_input,
            "coach_name": self.coach_name,
            "goal_description": self.goal_description,
            "stage": self.stage,
            "chat_history": self.chat_history
        })
        
        # Update chat history
        self.chat_history.append(HumanMessage(content=user_input))
        self.chat_history.append(AIMessage(content=response["output"]))
        
        # Parse response and determine flag
        return self._parse_response(response)
    
    def _parse_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Extract flag and structure response"""
        
        output = response["output"]
        flag = "CONVERSATION"
        plan_data = None
        
        # Check if tools were used
        if response.get("intermediate_steps"):
            for step in response["intermediate_steps"]:
                action = step[0]
                tool_output = step[1]
                
                if action.tool in ["create_plan", "modify_plan"]:
                    flag = "PLAN_SCREEN"
                    try:
                        plan_data = json.loads(tool_output)
                        self.plan_id = plan_data.get("plan_id")
                        
                        # Update stage
                        if action.tool == "create_plan":
                            self.stage = "plan_active"
                        
                    except json.JSONDecodeError:
                        print(f"Failed to parse tool output: {tool_output}")
        
        # Update stage based on conversation
        if self.stage == "onboarding" and "shall we finalize" in output.lower():
            self.stage = "confirming"
        
        return {
            "message": output,
            "flag": flag,
            "plan_data": plan_data,
            "session_id": self.session_id,
            "stage": self.stage
        }


def get_or_create_session(
    session_id: str,
    coach_name: str,
    goal_description: str
) -> CoachingSession:
    """Get existing session or create new one"""
    
    if session_id not in SESSIONS_STORAGE:
        SESSIONS_STORAGE[session_id] = CoachingSession(
            session_id=session_id,
            coach_name=coach_name,
            goal_description=goal_description
        )
    
    return SESSIONS_STORAGE[session_id]