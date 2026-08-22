import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { 
  ArrowLeft, 
  Bot, 
  Stethoscope, 
  Sparkles, 
  Pill, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FileText, 
  HelpCircle, 
  AlertCircle, 
  Calendar,
  Clock,
  Activity,
  Video
} from 'lucide-react';

export const ConsultationPage = ({ appointment, onBack, onComplete }) => {
  const toast = useToast();

  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  
  // Medications list
  const [medications, setMedications] = useState([
    { name: '', dosage: '', frequency: 'Twice daily after food', duration_days: 7, instructions: 'Complete full course' }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [completedSummary, setCompletedSummary] = useState(null);

  // Load existing notes if viewing a completed consultation
  useEffect(() => {
    if (appointment?.visit_summary?.raw_clinical_notes) {
      setClinicalNotes(appointment.visit_summary.raw_clinical_notes);
    }
    if (appointment?.prescription) {
      setDiagnosis(appointment.prescription.diagnosis || '');
      setAdvice(appointment.prescription.advice || '');
      setFollowupDate(appointment.prescription.followup_date || '');
      if (appointment.prescription.medications?.length > 0) {
        setMedications(appointment.prescription.medications);
      }
    }
  }, [appointment]);

  const addMedicationRow = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: 'Twice daily after food', duration_days: 5, instructions: 'Take with water' }
    ]);
  };

  const removeMedicationRow = (idx) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const updateMedication = (idx, field, value) => {
    const updated = [...medications];
    updated[idx][field] = value;
    setMedications(updated);
  };

  const handleSubmitConsultation = async (e) => {
    e.preventDefault();
    if (!clinicalNotes.trim() || !diagnosis.trim()) {
      toast.warning('Please enter both clinical notes and a diagnosis.');
      return;
    }

    // Filter valid medications
    const validMeds = medications.filter(m => m.name.trim() !== '');

    setSubmitting(true);
    try {
      const res = await api.post(`/visits/${appointment.id}/notes`, {
        raw_clinical_notes: clinicalNotes,
        diagnosis: diagnosis,
        medications: validMeds,
        advice: advice,
        followup_date: followupDate || null,
      });
      setCompletedSummary(res.data);
      toast.success('Consultation saved! LLaMA 3.3 generated patient instructions and reminders are scheduled.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit consultation notes.');
    } finally {
      setSubmitting(false);
    }
  };

  const patient = appointment?.patient || {};
  const symptoms = appointment?.symptom_form;
  const visitSummary = appointment?.visit_summary;
  const urgency = visitSummary?.ai_urgency_level || 'Medium';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Consultation Queue</span>
        </button>
        <Badge 
          variant={
            urgency === 'High' ? 'urgencyHigh' :
            urgency === 'Medium' ? 'urgencyMedium' : 'urgencyLow'
          }
        >
          {urgency} Clinical Urgency
        </Badge>
      </div>

      {/* Patient Header Card with Live Video Call Button */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Patient Name</span>
            <h2 className="text-lg font-bold text-white mt-0.5">{patient.full_name || 'Patient'}</h2>
            <span className="text-xs text-slate-400">{patient.email} {patient.phone ? `• ${patient.phone}` : ''}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Appointment Slot</span>
            <div className="text-sm font-semibold text-cyan-300 mt-0.5">
              {new Date(appointment.slot_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
            <span className="text-xs text-slate-400">Duration: 30 mins • Status: <span className="text-cyan-400 uppercase font-bold">{appointment.status}</span></span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Intake Severity</span>
            <div className="text-sm font-bold text-white mt-0.5">
              <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 font-bold ${
                (symptoms?.severity_scale || 5) >= 8 ? 'bg-rose-950 text-rose-300 border border-rose-600' :
                (symptoms?.severity_scale || 5) >= 5 ? 'bg-amber-950 text-amber-300 border border-amber-600' :
                'bg-emerald-950 text-emerald-300 border border-emerald-600'
              }`}>
                {symptoms?.severity_scale || 5}/10 Severity
              </span>
              <span>{symptoms?.duration_days || 1} days duration</span>
            </div>
          </div>
        </div>

        {/* Live Video Meeting Action */}
        {appointment.google_meet_link && appointment.status === 'booked' && (
          <div className="flex-shrink-0">
            <a
              href={appointment.google_meet_link}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.35)] transition-all animate-pulse"
            >
              <Video className="w-4 h-4" />
              <span>Join Live Video Call</span>
            </a>
          </div>
        )}
      </div>

      {/* Patient's Reported Symptoms (Full Text) */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/40 bg-[#0d051e] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-purple-950">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-['Outfit']">
              Patient's Reported Symptoms &amp; Medical Intake
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Submitted during booking</span>
        </div>

        <div className="p-4 rounded-xl bg-[#070210] border border-purple-900/60 text-sm text-slate-100 leading-relaxed font-sans">
          {symptoms?.raw_symptoms ? (
            <p className="whitespace-pre-wrap">{symptoms.raw_symptoms}</p>
          ) : (
            <p className="text-slate-500 italic">No symptoms submitted for this visit.</p>
          )}
        </div>

        {symptoms?.additional_notes && (
          <div className="text-xs text-slate-400 bg-purple-950/20 p-2.5 rounded-lg border border-purple-900/30">
            <strong className="text-purple-300">Patient's Additional Notes / Medical History: </strong>
            <span>{symptoms.additional_notes}</span>
          </div>
        )}
      </div>

      {/* AI Pre-Visit Clinical Preparation Box */}
      {visitSummary && (
        <div className="glass-panel p-6 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/40 via-[#130728] to-[#0a0314] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-600/40 text-purple-200">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  AI Pre-Visit Triage &amp; Diagnostic Prompts
                </h3>
                <p className="text-xs text-slate-400">Analyzed from patient intake using Groq LLaMA 3.3 70B</p>
              </div>
            </div>
            <Badge variant="primary" size="sm">Groq LLaMA 3.3</Badge>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0a0316] border border-purple-900/60 text-xs">
            <strong className="text-purple-300 block mb-1">Assessed Chief Complaint:</strong>
            <p className="text-slate-200 leading-relaxed">{visitSummary.ai_chief_complaint}</p>
          </div>

          {/* 3 Suggested Questions for Doctor */}
          {visitSummary.ai_suggested_questions && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Suggested Clinical Diagnostic Questions:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {visitSummary.ai_suggested_questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-slate-200 leading-relaxed"
                  >
                    <span className="text-purple-400 font-bold mr-1">Q{idx + 1}:</span>
                    {q}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Doctor Note Submission Form */}
      <form onSubmit={handleSubmitConsultation} className="space-y-6">
        {/* Clinical Notes */}
        <div className="glass-panel p-6 rounded-2xl border border-purple-900/40 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-purple-950">
            <FileText className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white font-['Outfit']">Doctor Clinical Consultation Notes *</h3>
          </div>
          <textarea
            rows={5}
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Document patient examination, clinical findings, vital signs, and treatment plan here. E.g., Patient presented with tension-type headache with photophobia. Neurological exam normal. Vitals stable. Prescribed mild analgesics and stress-reduction therapy..."
            required
            className="w-full bg-[#120627] border border-purple-900/60 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Diagnosis & Followup */}
        <div className="glass-panel p-6 rounded-2xl border border-purple-900/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">Official Diagnosis *</label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="E.g., Acute Tension Headache / Rhinosinusitis"
              required
              className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">Recommended Follow-up Date (Optional)</label>
            <input
              type="date"
              value={followupDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFollowupDate(e.target.value)}
              className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Prescription Builder */}
        <div className="glass-panel p-6 rounded-2xl border border-purple-900/40 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-purple-950">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white font-['Outfit']">Digital Prescription Composer</h3>
            </div>
            <button
              type="button"
              onClick={addMedicationRow}
              className="px-3 py-1.5 rounded-lg bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1 hover:bg-purple-800"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Medicine
            </button>
          </div>

          <div className="space-y-3">
            {medications.map((med, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#0c0418] border border-purple-900/60 grid grid-cols-1 sm:grid-cols-5 gap-3 items-center"
              >
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">Medication Name</label>
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                    placeholder="E.g., Amoxicillin / Ibuprofen"
                    className="w-full bg-[#13082a] border border-purple-900/60 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">Dosage</label>
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                    placeholder="E.g., 500mg / 1 tablet"
                    className="w-full bg-[#13082a] border border-purple-900/60 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">Frequency</label>
                  <input
                    type="text"
                    value={med.frequency}
                    onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                    placeholder="Twice daily"
                    className="w-full bg-[#13082a] border border-purple-900/60 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400 uppercase block mb-1">Days</label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={med.duration_days}
                      onChange={(e) => updateMedication(idx, 'duration_days', parseInt(e.target.value) || 1)}
                      className="w-full bg-[#13082a] border border-purple-900/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicationRow(idx)}
                      className="mt-4 p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">Additional Patient Advice</label>
            <input
              type="text"
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              placeholder="E.g., Drink at least 2.5L of water daily, avoid direct sunlight, rest for 48 hours."
              className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Submit & AI Conversion Button */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="gradient-btn px-8 py-3.5 rounded-xl font-bold text-white text-sm flex items-center gap-2 shadow-[0_0_25px_rgba(124,58,237,0.4)] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Translating with Groq LLaMA 3.3 &amp; Scheduling Reminders...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Notes &amp; Generate Patient AI Summary</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Completed Success & Summary Modal / Panel */}
      {completedSummary && (
        <div className="glass-panel p-8 rounded-3xl border border-emerald-500/50 bg-gradient-to-br from-[#0e2418] via-[#09150f] to-[#040a07] space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-900/60 text-emerald-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-['Outfit']">
                Consultation Completed &amp; AI Summary Generated!
              </h3>
              <p className="text-xs text-emerald-300/80">
                Converted into patient-accessible language and synced with background medication reminders.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#07130b] border border-emerald-800/40 text-xs text-slate-200 space-y-3">
            <h4 className="font-bold text-emerald-300 text-sm">Generated Patient-Friendly Summary:</h4>
            <p className="leading-relaxed">{completedSummary.ai_patient_summary}</p>
            
            {completedSummary.ai_medication_schedule && (
              <div className="pt-2 border-t border-emerald-950">
                <strong className="text-emerald-400">Medication Schedule: </strong>
                {completedSummary.ai_medication_schedule}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={onComplete}
              className="gradient-btn px-6 py-2.5 rounded-xl font-semibold text-white text-xs"
            >
              Return to Doctor Dashboard &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
