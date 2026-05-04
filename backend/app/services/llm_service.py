import os
import json

try:
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    print("[LLM] WARNING: google-genai not available. AI chat will use fallback responses.")

SETTINGS_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'settings.json')

class LLMService:
    def __init__(self):
        self.model_name = 'gemini-2.5-flash'
        self.client = None
        self.api_key = None
        self._load_config()

    def _load_config(self):
        # 1. Try loading from .env
        from dotenv import load_dotenv
        load_dotenv()
        
        env_key = os.environ.get("GEMINI_API_KEY")
        if env_key:
            self.api_key = env_key
        # 2. Try loading from settings.json
        elif os.path.exists(SETTINGS_FILE):
            try:
                with open(SETTINGS_FILE, 'r') as f:
                    settings = json.load(f)
                    self.api_key = settings.get("gemini_api_key", "")
            except Exception as e:
                print(f"Failed to load settings: {e}")
        
        # 3. Final fallback
        if not self.api_key:
            self.api_key = "AIzaSyCTMRcSLo6xy2ospXcQMeFnPkqgTEoOafM"
            
        if self.api_key and GENAI_AVAILABLE:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[LLM] Failed to initialize Gemini client: {e}")

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
            
        if GENAI_AVAILABLE:
            self.client = genai.Client(api_key=self.api_key)
        
    def build_system_prompt(self, context: dict, mode: str) -> str:
        base_prompt = (
            "You are an empathetic, highly intelligent AI student companion for ScholarFlow AI. "
            "Your goal is to support the student academically and emotionally.\n\n"
        )
        
        mode_prompts = {
            "casual": "Keep the tone warm, friendly, and conversational. Use emojis.",
            "study": "Be structured, focused, and academic. Provide actionable study tips and breakdown complex topics.",
            "hype": "Be extremely high energy and motivational! Use capital letters for excitement. Hype the student up!",
            "vent": "Be very empathetic, validating, and calming. Listen and validate their feelings. Never dismiss their stress."
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
        if not self.client:
            return "My AI brain is currently disabled. Please ask an admin to configure the API key."
            
        system_prompt = self.build_system_prompt(context, mode)
        prompt = f"{system_prompt}\n\nUser Message:\n{content}\n\nYour Response:"
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            return response.text
        except Exception as e:
            print(f"Gemini API Error: {e}")
            return "I'm having a little trouble connecting to my brain right now, but I'm here for you! Let's talk again in a moment."

    def generate_routine(self, user_description: str) -> list[dict]:
        """Generate a structured daily routine based on a user's description."""
        if not self.client:
            return []
            
        prompt = (
            "You are an AI planner. A student is describing their daily schedule and goals. "
            "Your task is to extract this into a daily routine checklist.\n"
            "Return a strictly formatted JSON array of task objects. DO NOT wrap the JSON in markdown blocks like ```json. Just return the raw JSON.\n"
            "Each task must have these exact keys:\n"
            "- 'title': string (max 100 chars)\n"
            "- 'timeSlot': string (HH:MM 24-hour format)\n"
            "- 'category': string (must be one of 'study', 'wellness', 'personal', 'social')\n"
            "- 'points': integer (usually 10, 15, 20, or 25 based on difficulty)\n"
            "- 'icon': string (a material symbols icon name like 'menu_book', 'self_improvement', 'fitness_center', 'edit_note', 'rocket_launch')\n\n"
            f"User's Description:\n{user_description}"
        )
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            raw_text = response.text.strip()
            # Strip markdown if the LLM ignores instructions
            if raw_text.startswith('```json'):
                raw_text = raw_text[7:]
            if raw_text.endswith('```'):
                raw_text = raw_text[:-3]
            raw_text = raw_text.strip()
            
            routine = json.loads(raw_text)
            return routine
        except Exception as e:
            print(f"Gemini API Error parsing routine: {e}")
            return []

# Singleton instance
llm_service = LLMService()
