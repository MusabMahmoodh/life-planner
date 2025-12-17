from typing import Dict, Any, List
import uuid
import json

class PlanService:
    """Generates and modifies plans based on user goals"""
    
    def create_plan(
        self, 
        coach_name: str, 
        goal: str, 
        user_responses: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a structured plan from user data"""
        
        plan_id = str(uuid.uuid4())
        
        # Generate steps based on goal (you can make this smarter)
        steps = self._generate_steps(goal, user_responses)
        
        return {
            "plan_id": plan_id,
            "title": f"Your {goal} Journey",
            "coach_name": coach_name,
            "goal": goal,
            "steps": steps,
            "total_steps": len(steps),
            "current_step": 0,
            "created_at": "2024-01-01"  # In real app, use datetime.now()
        }
    
    def modify_plan(
        self, 
        plan_id: str, 
        modification_request: str, 
        current_plan: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Modify existing plan based on user request"""
        
        steps = current_plan["steps"]
        current_step = current_plan["current_step"]
        
        # Handle "skip" requests
        if "skip" in modification_request.lower():
            # Extract number from request (e.g., "skip 5 steps")
            import re
            numbers = re.findall(r'\d+', modification_request)
            skip_count = int(numbers[0]) if numbers else 1
            
            # Remove the next N steps
            new_steps = steps[:current_step + 1] + steps[current_step + 1 + skip_count:]
            
            return {
                **current_plan,
                "steps": new_steps,
                "total_steps": len(new_steps),
                "modification_note": f"Skipped {skip_count} steps as requested"
            }
        
        # Handle other modifications (extend this as needed)
        return current_plan
    
    def _generate_steps(self, goal: str, user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate steps based on goal - customize this logic"""
        
        # Simple example - you can make this much smarter
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