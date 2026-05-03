import os
import json
import google.generativeai as genai

SETTINGS_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'settings.json')

class LLMService:
    def __init__(self):
        self.model_name = 'gemini-2.5-flash'
        self.model = None
        self.api_key = None
        self._load_config()

    def _load_config(self):
        if os.path.exists(SETTINGS_FILE):
            try:
                with open(SETTINGS_FILE, 'r') as f:
                    settings = json.load(f)
                    self.api_key = settings.get("gemini_api_key", "")
            except Exception as e:
                print(f"Failed to load settings: {e}")
        else:
            # Default fallback (original hardcoded key)
            self.api_key = "AIzaSyCTMRcSLo6xy2ospXcQMeFnPkqgTEoOafM"
            
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)

    def update_api_key(self, new_key: str):
        self.api_key = new_key
        settings = {}
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'r') as f:
                settings = json.load(f)
        settings["gemini_api_key"] = new_key
        
        os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings, f)
            
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.model_name)
        
    def build_system_prompt(self, context: dict, mode: str) -> str:
        base_prompt = (
            "You are an empathetic, highly intelligent AI student companion for ScholarFlow AI. "
            "Your goal is to support the student academically and emotionally.\n\n"
        )
        
        mode_prompts = {
            "casual": "Keep the tone warm, friendly, and conversational. Use emojis.",
            "study": "Be structured, focused, and academic. Provide actionable study tips and breakdown complex topics.",
            "hype": "Be extremely high energy and motivational! Use capital letters for excitement. Hype the student up!",
            "vent": "Be very empathetic, validating, and calming. Listen and validate their feelings. Never dismiss their stress.",
            "routine": (
                "You are a master of productivity. Help the student design a balanced daily routine. "
                "Include study sessions, wellness breaks (exercise/meditation), and personal time. "
                "CRITICAL: If you suggest a routine, you MUST include a JSON block at the END of your message "
                "wrapped in ```json ... ``` tags with the following structure: "
                '{"type": "routine_suggestion", "name": "AI Suggested Routine", "tasks": '
                '[{"title": "...", "category": "study/wellness/personal", "time_slot": "HH:MM", "points_value": 20}, ...]}'
            )
        }
        
        system_instruction = base_prompt + mode_prompts.get(mode, mode_prompts["casual"])
        
        # Inject context
        system_instruction += "\n\n--- CURRENT STUDENT CONTEXT ---\n"
        system_instruction += f"Student Name: {context.get('display_name', 'Student')}\n"
        system_instruction += f"Current Level: {context.get('level', 1)}\n"
        system_instruction += f"Current Streak: {context.get('current_streak', 0)} days\n"
        system_instruction += f"Total Points: {context.get('total_points', 0)}\n"
        
        return system_instruction

    def generate_response(self, content: str, context: dict, mode: str) -> str:
        if not self.model:
            return "My AI brain is currently disabled. Please ask an admin to configure the API key."
            
        # Automatically switch to routine mode if keywords are detected
        if any(kw in content.lower() for kw in ["routine", "schedule", "plan my day", "daily works"]):
            mode = "routine"

        system_prompt = self.build_system_prompt(context, mode)
        prompt = f"{system_prompt}\n\nUser Message:\n{content}\n\nYour Response:"
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini API Error: {e}")
            return "I'm having a little trouble connecting to my brain right now, but I'm here for you! Let's talk again in a moment."

# Singleton instance
llm_service = LLMService()
