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
        current_step: int,
        goal_description: str = None
    ) -> Dict[str, Any]:
        """Modify plan using AI during conversation"""
        
        steps = current_plan["steps"]
        
        # Handle skip requests (simple pattern matching)
        if "skip" in modification_request.lower():
            import re
            numbers = re.findall(r'\d+', modification_request)
            skip_count = int(numbers[0]) if numbers else 1
            
            # Separate completed and remaining steps
            completed_steps = [step for step in steps if step.get("completed", False)]
            remaining_steps = [step for step in steps if not step.get("completed", False)]
            
            # Only skip from remaining steps, preserve all completed steps
            if remaining_steps and skip_count > 0:
                # Skip from the beginning of remaining steps (or after current step if specified)
                # For simplicity, skip from start of remaining steps
                if skip_count >= len(remaining_steps):
                    # Skip all remaining steps
                    new_remaining_steps = []
                else:
                    # Skip first N remaining steps
                    new_remaining_steps = remaining_steps[skip_count:]
                # Merge completed steps back
                new_steps = completed_steps + new_remaining_steps
            else:
                # All steps completed or invalid skip count, return unchanged
                new_steps = steps
            
            # Renumber all steps
            for idx, step in enumerate(new_steps, 1):
                step["id"] = idx
            
            return {
                **current_plan,
                "steps": new_steps,
                "total_steps": len(new_steps),
                "modification_note": f"Skipped {skip_count} remaining steps as requested"
            }
        
        # Use AI for natural language modifications
        # Preserve completed steps, only modify remaining ones
        completed_steps = [step for step in steps if step.get("completed", False)]
        remaining_steps = [step for step in steps if not step.get("completed", False)]
        
        # If no remaining steps, return unchanged
        if not remaining_steps:
            return {
                **current_plan,
                "modification_note": "All steps are completed. Cannot modify completed plan."
            }
        
        # Create a plan structure with only remaining steps for AI to modify
        remaining_plan = {
            "title": current_plan.get("title", ""),
            "coach_name": current_plan.get("coach_name", ""),
            "goal": goal_description or current_plan.get("goal", ""),
            "steps": remaining_steps,
            "total_steps": len(remaining_steps)
        }
        
        system_prompt = f"""You are a helpful AI assistant that modifies coaching plans based on user requests during conversation.

Current Goal: {goal_description or current_plan.get("goal", "")}
Current Plan (remaining steps only): {json.dumps(remaining_plan, indent=2)}

User's Request: {modification_request}

Important:
- Only modify the REMAINING steps (not completed ones)
- Preserve the plan structure
- Return ONLY a valid JSON object with the updated plan
- Keep completed steps unchanged (they will be merged back)

The plan structure must be:
{{
  "title": "string",
  "coach_name": "string",
  "goal": "string",
  "steps": [
    {{"id": number, "title": "string", "description": "string", "duration": "string", "completed": false}}
  ],
  "total_steps": number,
  "modification_note": "string explaining what was changed"
}}

Be smart about adjustments. Understand the user's intent and modify accordingly."""

        try:
            response = client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Modify the plan based on: {modification_request}"}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            modified_plan = json.loads(response.choices[0].message.content)
            
            # Merge completed steps back with modified remaining steps
            # Renumber all steps properly
            all_steps = completed_steps + modified_plan.get("steps", [])
            for idx, step in enumerate(all_steps, 1):
                step["id"] = idx
            
            return {
                "title": modified_plan.get("title", current_plan.get("title", "")),
                "coach_name": modified_plan.get("coach_name", current_plan.get("coach_name", "")),
                "goal": modified_plan.get("goal", goal_description or current_plan.get("goal", "")),
                "steps": all_steps,
                "total_steps": len(all_steps),
                "modification_note": modified_plan.get("modification_note", "Plan updated based on your request")
            }
            
        except Exception as e:
            print(f"Error modifying plan with AI: {e}")
            return {
                **current_plan,
                "modification_note": f"Could not apply modification: {str(e)}"
            }
    
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