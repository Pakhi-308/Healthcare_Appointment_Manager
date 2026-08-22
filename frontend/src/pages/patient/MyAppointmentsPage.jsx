import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  Bot, 
  XCircle, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ArrowRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const MyAppointmentsPage = ({ onBookNew, onViewPrescription }) => {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Cancel & Reschedule Modals
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState(null);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments/my');
      setAppointments(res.data);
    } catch (err) {
      toast.error('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async () => {
    if (!selectedAppt) return;
    setProcessingAction(true);
    try {
      await api.post(`/appointments/${selectedAppt.id}/cancel`, {
        cancel_reason: cancelReason || 'Cancelled by patient',
      });
      toast.success('Appointment cancelled successfully.');
      setShowCancelModal(false);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel appointment.');
    } finally {
      setProcessingAction(false);
    }
  };

  const openReschedule = async (appt) => {
    setSelectedAppt(appt);
    setShowRescheduleModal(true);
    fetchRescheduleSlots(appt.doctor_id, rescheduleDate);
  };

  const fetchRescheduleSlots = async (doctorId, targetDate) => {
    setLoadingRescheduleSlots(true);
    try {
      const res = await api.get(`/doctors/${doctorId}/slots`, {
        params: { target_date: targetDate },
      });
      setAvailableSlots(res.data?.slots?.filter(s => s.is_available) || []);
    } catch (err) {
      toast.error('Could not fetch alternative slots.');
    } finally {
      setLoadingRescheduleSlots(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedRescheduleSlot || !selectedAppt) {
      toast.warning('Please select a new time slot.');
      return;
    }
    setProcessingAction(true);
    try {
      await api.post(`/appointments/${selectedAppt.id}/reschedule`, {
        new_slot_start: selectedRescheduleSlot.start_time,
        new_slot_end: selectedRescheduleSlot.end_time,
      });
      toast.success('Appointment rescheduled successfully!');
      setShowRescheduleModal(false);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Rescheduling failed.');
    } finally {
      setProcessingAction(false);
    }
  };

  const filtered = appointments.filter((appt) => {
    if (activeFilter === 'BOOKED') return appt.status === 'booked';
    if (activeFilter === 'COMPLETED') return appt.status === 'completed';
    if (activeFilter === 'CANCELLED') return appt.status === 'cancelled';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span>Patient Schedule</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">
            My Appointments &amp; Consultations
          </h1>
        </div>

        <button
          onClick={onBookNew}
          className="gradient-btn px-6 py-2.5 rounded-xl font-semibold text-white text-xs flex items-center gap-2 self-start"
        >
          <span>Book New Consultation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-purple-950 pb-4">
        {['ALL', 'BOOKED', 'COMPLETED', 'CANCELLED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === tab
                ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-purple-950/40 border border-purple-900/60 text-purple-300 hover:text-white'
            }`}
          >
            {tab === 'ALL' ? 'All Records' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl h-44 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-4">
          <CalendarIcon className="w-12 h-12 text-purple-400/50 mx-auto" />
          <h3 className="text-lg font-bold text-white font-['Outfit']">No Appointments Found</h3>
          <p className="text-xs text-slate-400">You don't have any appointments matching this category.</p>
          <button
            onClick={onBookNew}
            className="gradient-btn px-6 py-2 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2"
          >
            Schedule a Specialist Consultation
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((appt) => {
            const doc = appt.doctor || {};
            const docUser = doc.user || {};
            const summary = appt.visit_summary;
            const isBooked = appt.status === 'booked';
            const isCompleted = appt.status === 'completed';
            const isCancelled = appt.status === 'cancelled';

            return (
              <div
                key={appt.id}
                className="glass-panel p-6 sm:p-8 rounded-2xl border border-purple-900/40 space-y-6 hover:border-purple-600/40 transition-all"
              >
                {/* Top Row: Doctor Info & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-700 to-cyan-500 p-0.5 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                      <div className="w-full h-full bg-[#0e0520] rounded-[10px] flex items-center justify-center font-bold text-purple-300 text-lg">
                        {docUser.full_name ? docUser.full_name.charAt(3) || 'D' : 'D'}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {docUser.full_name || 'Specialist Doctor'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Badge variant="primary" size="sm">{doc.specialization || 'Clinical Specialist'}</Badge>
                        <span>• Room: {doc.room_number || 'Telehealth'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isBooked && <Badge variant="primary">Confirmed</Badge>}
                    {isCompleted && <Badge variant="success">Completed</Badge>}
                    {isCancelled && <Badge variant="danger">Cancelled</Badge>}
                  </div>
                </div>

                {/* Middle Row: Appointment Time & Meet Link */}
                <div className="bg-[#0b0318] border border-purple-950 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>
                      <strong className="text-white">Scheduled: </strong>
                      {new Date(appt.slot_start).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                    </span>
                  </div>

                  {appt.google_meet_link && isBooked && (
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-cyan-400" />
                      <a
                        href={appt.google_meet_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>Join Telehealth Meet</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {isCancelled && appt.cancel_reason && (
                    <div className="sm:col-span-2 text-rose-300 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span><strong>Cancellation Note:</strong> {appt.cancel_reason}</span>
                    </div>
                  )}
                </div>

                {/* Pre-Visit AI Triage Box */}
                {summary && (
                  <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300 flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-purple-400" />
                        AI Pre-Visit Clinical Preparation
                      </span>
                      <Badge 
                        variant={
                          summary.ai_urgency_level === 'High' ? 'urgencyHigh' :
                          summary.ai_urgency_level === 'Medium' ? 'urgencyMedium' : 'urgencyLow'
                        }
                        size="sm"
                      >
                        {summary.ai_urgency_level} Urgency
                      </Badge>
                    </div>
                    <p className="text-slate-300">
                      <strong>Intake Assessment:</strong> {summary.ai_chief_complaint}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  {isBooked && (
                    <>
                      <button
                        onClick={() => openReschedule(appt)}
                        className="px-4 py-2 rounded-xl bg-purple-950/60 border border-purple-800/60 hover:bg-purple-900/60 text-purple-200 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reschedule
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAppt(appt);
                          setShowCancelModal(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel Visit
                      </button>
                    </>
                  )}

                  {isCompleted && (
                    <button
                      onClick={onViewPrescription}
                      className="gradient-btn px-5 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Doctor Notes &amp; Prescription
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-md w-full glass-panel p-6 rounded-2xl border border-rose-500/40 space-y-4">
            <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2 text-rose-400">
              <XCircle className="w-5 h-5" />
              <span>Cancel Appointment?</span>
            </h3>
            <p className="text-xs text-slate-300">
              This will remove the consultation from your calendar and notify Dr. {selectedAppt?.doctor?.user?.full_name}.
            </p>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              className="w-full bg-[#120627] border border-purple-900/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
              >
                Keep Appointment
              </button>
              <button
                disabled={processingAction}
                onClick={handleCancel}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(244,63,94,0.4)] disabled:opacity-50"
              >
                {processingAction ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-lg w-full glass-panel p-6 sm:p-8 rounded-2xl border border-purple-600/40 space-y-6">
            <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-purple-400" />
              <span>Reschedule Consultation</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pick New Date</label>
              <input
                type="date"
                value={rescheduleDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  fetchRescheduleSlots(selectedAppt.doctor_id, e.target.value);
                }}
                className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Slots */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pick Available Slot</label>
              {loadingRescheduleSlots ? (
                <div className="h-20 bg-purple-950/40 rounded-xl animate-pulse" />
              ) : availableSlots.length === 0 ? (
                <div className="p-4 rounded-xl bg-purple-950/30 text-center text-xs text-slate-400">
                  No available slots on this date. Please try another day.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableSlots.map((slot, idx) => {
                    const isSelected = selectedRescheduleSlot?.start_time === slot.start_time;
                    const slotFormatted = new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedRescheduleSlot(slot)}
                        className={`p-2 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                            : 'bg-purple-950/40 border-purple-900/60 text-purple-200 hover:border-purple-500'
                        }`}
                      >
                        {slotFormatted}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-950">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
              >
                Dismiss
              </button>
              <button
                disabled={processingAction || !selectedRescheduleSlot}
                onClick={handleRescheduleSubmit}
                className="gradient-btn px-6 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
              >
                {processingAction ? 'Updating...' : 'Save New Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
