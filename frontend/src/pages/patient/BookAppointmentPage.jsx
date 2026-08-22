import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { SlotHoldTimer } from '../../components/common/SlotHoldTimer';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  DollarSign, 
  Lock, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Bot, 
  Video, 
  HeartPulse,
  Sliders,
  FileText
} from 'lucide-react';

export const BookAppointmentPage = ({ doctor, onBack, onComplete }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  // Wizard Step: 1 = Slot Select, 2 = Hold & Symptoms, 3 = Confirmed
  const [step, setStep] = useState(1);

  // Date & Slot state
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Default to tomorrow
    return today.toISOString().split('T')[0];
  });
  const [slotData, setSlotData] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Hold State
  const [holdInfo, setHoldInfo] = useState(null);
  const [holdingSlot, setHoldingSlot] = useState(false);

  // Symptom Form State
  const [rawSymptoms, setRawSymptoms] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  const [severityScale, setSeverityScale] = useState(6);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Confirmation state
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const fetchSlots = async () => {
    if (!doctor?.id || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const res = await api.get(`/doctors/${doctor.id}/slots`, {
        params: { target_date: selectedDate }
      });
      setSlotData(res.data);
    } catch (err) {
      toast.error('Could not fetch doctor slot availability.');
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [doctor?.id, selectedDate]);

  // Step 1 -> Step 2: Acquire 10-minute temporary slot hold
  const handleHoldSlot = async (slot) => {
    if (!isAuthenticated) {
      toast.warning('Please sign in or register to reserve an appointment slot.');
      return;
    }
    setSelectedSlot(slot);
    setHoldingSlot(true);
    try {
      const res = await api.post(`/doctors/${doctor.id}/holds`, {
        doctor_id: doctor.id,
        slot_start: slot.start_time,
        slot_end: slot.end_time,
      });
      setHoldInfo(res.data);
      toast.success('Slot temporarily locked for 10 minutes! Please complete your symptoms.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'This slot is unavailable or currently held by another patient.');
      fetchSlots();
    } finally {
      setHoldingSlot(false);
    }
  };

  // Step 2 -> Step 3: Atomic confirm booking & Groq AI triage
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!rawSymptoms.trim()) {
      toast.warning('Please provide a brief description of your symptoms.');
      return;
    }

    setSubmittingBooking(true);
    try {
      const res = await api.post('/appointments', {
        doctor_id: doctor.id,
        slot_start: selectedSlot.start_time,
        slot_end: selectedSlot.end_time,
        hold_token: holdInfo?.hold_token,
        raw_symptoms: rawSymptoms,
        duration_days: durationDays,
        severity_scale: severityScale,
        additional_notes: additionalNotes,
      });
      setConfirmedBooking(res.data);
      toast.success('Appointment successfully confirmed and synced with Calendar!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Booking failed due to a slot conflict.');
      fetchSlots();
      setStep(1);
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleHoldExpired = () => {
    toast.error('Your 10-minute slot hold has expired. Please select an available time.');
    setHoldInfo(null);
    setSelectedSlot(null);
    setStep(1);
    fetchSlots();
  };

  const doctorName = doctor?.user?.full_name || 'Specialist Doctor';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Doctor Overview */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Specialists</span>
        </button>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className={step === 1 ? 'text-purple-400 font-bold' : 'text-slate-500'}>1. Select Slot</span>
          <span>&rarr;</span>
          <span className={step === 2 ? 'text-purple-400 font-bold' : 'text-slate-500'}>2. Pre-Visit Triage</span>
          <span>&rarr;</span>
          <span className={step === 3 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>3. Confirmed</span>
        </div>
      </div>

      {/* Doctor Mini Card */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 to-cyan-500 p-0.5 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <div className="w-full h-full bg-[#0e0520] rounded-[14px] flex items-center justify-center font-bold text-purple-300 text-xl">
              {doctorName.charAt(3) || 'D'}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-['Outfit']">{doctorName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="primary" size="sm">{doctor?.specialization}</Badge>
              <span className="text-xs text-slate-400">• {doctor?.experience_years} years experience</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-purple-950/60 border border-purple-900/60 px-3 py-2 rounded-xl text-right">
            <span className="text-slate-400 block">Consultation Fee</span>
            <span className="text-emerald-400 font-bold text-sm">${doctor?.consultation_fee} USD</span>
          </div>
        </div>
      </div>

      {/* STEP 1: Date & Time Slot Selection */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-purple-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-purple-400" />
                <span>Select Appointment Date</span>
              </h3>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#120627] border border-purple-800/60 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Slots View */}
          <div className="glass-panel p-6 rounded-2xl border border-purple-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Available Consultation Slots</span>
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Available</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Held (10m)</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Booked</div>
              </div>
            </div>

            {loadingSlots ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-12 bg-purple-950/40 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : slotData?.is_on_leave ? (
              <div className="p-8 rounded-xl bg-amber-950/30 border border-amber-500/40 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-amber-200">Doctor on Approved Leave</h4>
                <p className="text-xs text-amber-300/80">Dr. {doctorName} is not taking consultations on this date. Please pick another date.</p>
              </div>
            ) : !slotData?.slots || slotData.slots.length === 0 ? (
              <div className="p-8 rounded-xl bg-purple-950/30 border border-purple-900/40 text-center space-y-2">
                <Clock className="w-8 h-8 text-purple-400/60 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">No Clinic Hours Scheduled</h4>
                <p className="text-xs text-slate-400">Doctor does not operate on this day ({new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}).</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {slotData.slots.map((slot, index) => {
                  const startTime = new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  let btnStyle = 'bg-purple-950/50 border-purple-800/40 text-purple-200 hover:border-purple-400 hover:bg-purple-900/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]';
                  if (!slot.is_available && slot.is_held) {
                    btnStyle = 'bg-amber-950/40 border-amber-600/50 text-amber-300 opacity-75 cursor-not-allowed';
                  } else if (!slot.is_available) {
                    btnStyle = 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed line-through';
                  }

                  return (
                    <button
                      key={index}
                      disabled={!slot.is_available || holdingSlot}
                      onClick={() => handleHoldSlot(slot)}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${btnStyle}`}
                    >
                      <span className="font-mono text-sm">{startTime}</span>
                      {slot.is_held && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Held ({slot.hold_expires_in_seconds}s)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Active Slot Hold & Pre-Visit Symptom Intake Form */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Active Slot Hold Timer */}
          <SlotHoldTimer
            expiresAt={holdInfo?.expires_at}
            onExpired={handleHoldExpired}
          />

          {/* Symptom Questionnaire */}
          <form onSubmit={handleConfirmBooking} className="glass-panel p-8 rounded-2xl border border-purple-900/40 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-purple-950">
              <div className="p-2 rounded-xl bg-purple-900/50 border border-purple-500/30 text-purple-300">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit']">Pre-Visit Symptom Assessment</h3>
                <p className="text-xs text-slate-400">Groq LLaMA 3.3 AI will analyze your intake for clinical urgency and doctor preparation</p>
              </div>
            </div>

            {/* Symptoms Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Describe Primary Symptoms &amp; Chief Complaint *
              </label>
              <textarea
                rows={4}
                value={rawSymptoms}
                onChange={(e) => setRawSymptoms(e.target.value)}
                placeholder="E.g., Experiencing throbbing migraine pain on the right side of head, with sensitivity to light and mild nausea for the past 2 days..."
                required
                className="w-full bg-[#120627] border border-purple-900/60 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Duration and Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Symptom Duration (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-200">
                    Discomfort / Severity Scale (1 - 10)
                  </label>
                  <span className={`text-xs font-bold ${
                    severityScale >= 8 ? 'text-rose-400' : severityScale >= 5 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {severityScale}/10 {severityScale >= 8 ? '(High)' : severityScale >= 5 ? '(Moderate)' : '(Mild)'}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={severityScale}
                  onChange={(e) => setSeverityScale(parseInt(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Additional Medical History */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Current Medications / Allergies (Optional)
              </label>
              <input
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="E.g., Taking Metformin, allergic to Penicillin"
                className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Submit CTA */}
            <div className="flex items-center justify-between pt-4 border-t border-purple-950">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel &amp; Change Slot
              </button>

              <button
                type="submit"
                disabled={submittingBooking}
                className="gradient-btn px-8 py-3 rounded-xl font-semibold text-white text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {submittingBooking ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Analyzing &amp; Confirming...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm &amp; Sync Calendar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: Booking Success Confirmation & AI Triage Overview */}
      {step === 3 && confirmedBooking && (
        <div className="space-y-6">
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-emerald-500/40 text-center space-y-4 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-400/50 flex items-center justify-center mx-auto text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">
              Appointment Successfully Confirmed!
            </h2>
            <p className="text-sm text-slate-300 max-w-lg mx-auto">
              Your consultation with <strong>Dr. {doctorName}</strong> is reserved. A confirmation email and Google Calendar invitation have been dispatched.
            </p>

            {/* Booking Details Pill Grid */}
            <div className="bg-[#0b0318] border border-purple-900/60 rounded-2xl p-6 max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-xs">
              <div>
                <span className="text-slate-400 block">Date &amp; Time</span>
                <span className="text-white font-semibold text-sm">
                  {new Date(confirmedBooking.slot_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Consultation Room</span>
                <span className="text-white font-semibold text-sm">{doctor?.room_number || 'Virtual Suite'}</span>
              </div>
              {confirmedBooking.google_meet_link && (
                <div className="sm:col-span-2 pt-2 border-t border-purple-950/80">
                  <span className="text-slate-400 block mb-1">Telehealth Video Link:</span>
                  <a
                    href={confirmedBooking.google_meet_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-cyan-400 font-semibold hover:underline"
                  >
                    <Video className="w-4 h-4" />
                    {confirmedBooking.google_meet_link}
                  </a>
                </div>
              )}
            </div>

            {/* AI Pre-Visit Triage Snapshot */}
            {confirmedBooking.visit_summary && (
              <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-6 max-w-xl mx-auto text-left space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                    <Bot className="w-4 h-4 text-purple-400" />
                    <span>AI Pre-Visit Triage Snapshot</span>
                  </div>
                  <Badge 
                    variant={
                      confirmedBooking.visit_summary.ai_urgency_level === 'High' ? 'urgencyHigh' :
                      confirmedBooking.visit_summary.ai_urgency_level === 'Medium' ? 'urgencyMedium' : 'urgencyLow'
                    }
                    size="sm"
                  >
                    {confirmedBooking.visit_summary.ai_urgency_level} Urgency
                  </Badge>
                </div>
                <div className="text-xs text-slate-300">
                  <strong>Chief Complaint:</strong> {confirmedBooking.visit_summary.ai_chief_complaint}
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-center gap-4">
              <button
                onClick={onComplete}
                className="gradient-btn px-8 py-3 rounded-xl font-semibold text-white text-sm"
              >
                View My Appointments &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
