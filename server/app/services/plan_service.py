from typing import Dict, Any, List
import json
from openai import OpenAI
from app.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

class PlanService:
    """Service for plan generation and modification"""
    
    def create_plan(
        self, 
        coach_name: str, 
        goal: str, 
        user_responses: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a structured plan from user data"""
        
        steps = self._generate_steps(goal, user_responses)
        
        return {
            "title": f"Your {goal} Journey",
            "coach_name": coach_name,
            "goal": goal,
            "steps": steps,
            "total_steps": len(steps),
        }
    
    def modify_plan_with_agent(
        self, 
        modification_request: str, 
        current_plan: Dict[str, Any],
        current_step: int
    ) -> Dict[str, Any]:
        """Modify plan using LangChain agent (during conversation)"""
        
        steps = current_plan["steps"]
        
        # Handle skip requests
        if "skip" in modification_request.lower():
            import re
            numbers = re.findall(r'\d+', modification_request)
            skip_count = int(numbers[0]) if numbers else 1
            
            new_steps = steps[:current_step + 1] + steps[current_step + 1 + skip_count:]
            
            # Renumber steps
            for idx, step in enumerate(new_steps, 1):
                step["id"] = idx
            
            return {
                **current_plan,
                "steps": new_steps,
                "total_steps": len(new_steps),
                "modification_note": f"Skipped {skip_count} steps as requested"
            }
        
        return current_plan
    
    def tweak_plan_with_ai(
        self,
        tweak_message: str,
        current_plan: Dict[str, Any],
        goal_description: str
    ) -> Dict[str, Any]:
        """Tweak plan using direct OpenAI completion (not LangChain)"""
        
        system_prompt = f"""You are a helpful AI assistant that modifies coaching plans based on user requests.

Current Goal: {goal_description}
Current Plan: {json.dumps(current_plan, indent=2)}

User's Request: {tweak_message}

Your task:
1. Understand what the user wants to change
2. Modify the plan accordingly
3. Return ONLY a valid JSON object with the updated plan

The plan structure must be:
{{
  "title": "string",
  "coach_name": "string",
  "goal": "string",
  "steps": [
    {{"id": number, "title": "string", "description": "string", "duration": "string", "completed": boolean}}
  ],
  "total_steps": number,
  "modification_note": "string explaining what was changed"
}}

Keep the same structure, only modify what's requested. Be smart about adjustments."""

        try:
            response = client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Modify the plan: {tweak_message}"}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            modified_plan = json.loads(response.choices[0].message.content)
            return modified_plan
            
        except Exception as e:
            print(f"Error tweaking plan: {e}")
            return {
                **current_plan,
                "modification_note": f"Could not apply modification: {str(e)}"
            }
    
    def _generate_steps(self, goal: str, user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate steps based on goal"""
        
        base_steps = [
            {"id": 1, "title": "Getting Started", "description": f"Begin your {goal} journey", "duration": "1 day", "completed": False},
            {"id": 2, "title": "Foundation Building", "description": "Build the basics", "duration": "3 days", "completed": False},
            {"id": 3, "title": "Practice Phase", "description": "Regular practice", "duration": "1 week", "completed": False},
            {"id": 4, "title": "Intermediate Progress", "description": "Level up your skills", "duration": "2 weeks", "completed": False},
            {"id": 5, "title": "Advanced Techniques", "description": "Master advanced concepts", "duration": "2 weeks", "completed": False},
            {"id": 6, "title": "Consistency Building", "description": "Make it a habit", "duration": "1 month", "completed": False},
            {"id": 7, "title": "Challenge Yourself", "description": "Push your limits", "duration": "2 weeks", "completed": False},
            {"id": 8, "title": "Mastery", "description": "Achieve your goal", "duration": "1 month", "completed": False},
        ]
        
        return base_steps

plan_service = PlanService()