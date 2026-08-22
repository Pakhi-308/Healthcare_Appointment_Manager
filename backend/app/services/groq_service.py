import json
import logging
import re
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Fallback templates if Groq API is unavailable
FALLBACK_PRE_VISIT = {
    "ai_urgency_level": "Medium",
    "ai_chief_complaint": "General Clinical Consultation Request",
    "ai_suggested_questions": [
        "How long have you been experiencing these primary symptoms?",
        "Have you noticed any triggers or changes in severity throughout the day?",
        "Are you currently taking any prescription or over-the-counter medications for this?"
    ],
    "is_ai_generated": False
}


def get_fallback_post_visit(notes: str) -> Dict[str, str]:
    return {
        "ai_patient_summary": f"Summary of consultation notes: {notes[:300]}... Please follow the prescribed medication schedule and rest adequately.",
        "ai_medication_schedule": "Take all prescribed medications according to the dosage directions on your prescription label. Complete the full course.",
        "ai_followup_steps": "Monitor symptoms closely. Contact the clinic or rebook an appointment if symptoms persist or worsen.",
        "is_ai_generated": False
    }


class GroqService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self._client = None
        if self.api_key and self.api_key.strip():
            try:
                from groq import Groq
                self._client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Groq client: {e}")

    def analyze_symptoms(self, symptoms: str) -> Dict[str, Any]:
        """
        Analyze patient pre-visit symptoms using Groq LLaMA 3.3 70B.
        Prompt Template:
        "Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: <symptoms>"
        """
        exact_prompt = f"Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: {symptoms}"
        
        system_instruction = (
            "You are an expert clinical triage assistant. Always output valid JSON strictly matching this schema:\n"
            "{\n"
            '  "urgency_level": "Low" | "Medium" | "High",\n'
            '  "chief_complaint": "Short summary string",\n'
            '  "suggested_questions": ["Question 1", "Question 2", "Question 3"]\n'
            "}\n"
            "Do not output markdown codeblocks if possible, or wrap in standard ```json. Keep the output clean."
        )

        if not self._client:
            logger.info("Groq API key not configured or client inactive. Using graceful pre-visit fallback.")
            return dict(FALLBACK_PRE_VISIT)

        try:
            response = self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": exact_prompt},
                ],
                temperature=0.2,
                max_tokens=600,
            )
            raw_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                urgency = parsed.get("urgency_level", "Medium")
                if urgency not in ["Low", "Medium", "High"]:
                    urgency = "Medium"
                
                questions = parsed.get("suggested_questions", [])
                if not isinstance(questions, list) or len(questions) < 3:
                    questions = FALLBACK_PRE_VISIT["ai_suggested_questions"]
                else:
                    questions = [str(q) for q in questions[:3]]

                return {
                    "ai_urgency_level": urgency,
                    "ai_chief_complaint": parsed.get("chief_complaint", "Patient symptom assessment"),
                    "ai_suggested_questions": questions,
                    "is_ai_generated": True
                }
            else:
                logger.warning(f"Could not parse JSON from Groq response: {raw_text}")
                return dict(FALLBACK_PRE_VISIT)
        except Exception as exc:
            logger.error(f"Groq API error during pre-visit symptom analysis: {exc}. Gracefully degrading to fallback.")
            return dict(FALLBACK_PRE_VISIT)

    def generate_patient_summary(self, clinical_notes: str) -> Dict[str, Any]:
        """
        Generate patient-friendly post-visit summary using Groq LLaMA 3.3 70B.
        Prompt Template:
        "Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: <notes>"
        """
        exact_prompt = f"Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: {clinical_notes}"
        
        system_instruction = (
            "You are a compassionate healthcare communicator. Convert clinical jargon into clear, reassuring, patient-friendly guidance.\n"
            "Respond in JSON format strictly matching this schema:\n"
            "{\n"
            '  "patient_summary": "Clear, accessible summary of the diagnosis and doctor consultation in warm tone",\n'
            '  "medication_schedule": "Easy-to-understand medication timing, food instructions, and precautions",\n'
            '  "followup_steps": "Actionable next steps, warning signs to watch for, and follow-up timeline"\n'
            "}"
        )

        if not self._client:
            logger.info("Groq API key not configured or client inactive. Using graceful post-visit fallback.")
            return get_fallback_post_visit(clinical_notes)

        try:
            response = self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": exact_prompt},
                ],
                temperature=0.3,
                max_tokens=900,
            )
            raw_text = response.choices[0].message.content.strip()
            
            json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                return {
                    "ai_patient_summary": parsed.get("patient_summary", "Consultation completed."),
                    "ai_medication_schedule": parsed.get("medication_schedule", "Take medicines as directed."),
                    "ai_followup_steps": parsed.get("followup_steps", "Follow up if symptoms persist."),
                    "is_ai_generated": True
                }
            else:
                logger.warning(f"Could not parse JSON from Groq post-visit response: {raw_text}")
                return get_fallback_post_visit(clinical_notes)
        except Exception as exc:
            logger.error(f"Groq API error during post-visit summary generation: {exc}. Gracefully degrading to fallback.")
            return get_fallback_post_visit(clinical_notes)


groq_service = GroqService()
