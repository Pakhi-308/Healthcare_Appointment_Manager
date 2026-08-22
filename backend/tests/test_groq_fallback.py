import pytest
from app.services.groq_service import GroqService, FALLBACK_PRE_VISIT


def test_groq_previsit_fallback_on_unconfigured_key():
    """Verify that if Groq API is not configured, it returns the structured fallback cleanly without throwing."""
    svc = GroqService()
    svc._client = None  # Simulate missing client
    
    result = svc.analyze_symptoms("Patient has chest tightness and shortness of breath for 3 days.")
    assert result is not None
    assert "ai_urgency_level" in result
    assert result["ai_urgency_level"] in ["Low", "Medium", "High"]
    assert "ai_chief_complaint" in result
    assert isinstance(result["ai_suggested_questions"], list)
    assert len(result["ai_suggested_questions"]) == 3
    assert result["is_ai_generated"] is False


def test_groq_postvisit_fallback_on_unconfigured_key():
    """Verify that post-visit summary generation cleanly falls back without disrupting doctor notes submission."""
    svc = GroqService()
    svc._client = None

    clinical_notes = "Patient diagnosed with mild seasonal allergies. Prescribed Cetirizine 10mg once daily at bedtime for 7 days."
    result = svc.generate_patient_summary(clinical_notes)
    assert result is not None
    assert "ai_patient_summary" in result
    assert "ai_medication_schedule" in result
    assert "ai_followup_steps" in result
    assert result["is_ai_generated"] is False
