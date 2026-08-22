import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { 
  Activity, 
  Clock, 
  Calendar, 
  User, 
  Stethoscope, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Bot, 
  Video, 
  Sparkles,
  Search
} from 'lucide-react';

export const DoctorDashboardPage = ({ onStartConsultation }) => {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchDoctorAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments/my');
      setAppointments(res.data);
    } catch (err) {
      toast.error('Failed to load doctor appointments queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorAppointments();
  }, []);

  const totalBooked = appointments.filter(a => a.status === 'booked').length;
  const totalCompleted = appointments.filter(a => a.status === 'completed').length;
  const urgentCount = appointments.filter(a => a.visit_summary?.ai_urgency_level === 'High').length;

  const filtered = appointments.filter((a) => {
    if (filter === 'BOOKED') return a.status === 'booked';
    if (filter === 'COMPLETED') return a.status === 'completed';
    if (filter === 'URGENT') return a.visit_summary?.ai_urgency_level === 'High';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Doctor Clinical Console</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">
            Patient Consultation Queue
          </h1>
        </div>

        <button
          onClick={fetchDoctorAppointments}
          className="px-4 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/40 hover:bg-cyan-900/40 text-cyan-200 text-xs font-semibold self-start"
        >
          Refresh Queue
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Upcoming Visits</span>
            <div className="text-3xl font-extrabold text-white mt-1 font-['Outfit']">{totalBooked}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-300 font-semibold uppercase tracking-wider block">AI Urgent Triage Cases</span>
            <div className="text-3xl font-extrabold text-rose-400 mt-1 font-['Outfit']">{urgentCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Completed Consultations</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1 font-['Outfit']">{totalCompleted}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-purple-950 pb-4">
        {[
          { key: 'ALL', label: 'All Patients' },
          { key: 'BOOKED', label: 'Waiting / Scheduled' },
          { key: 'URGENT', label: 'High Urgency Triage' },
          { key: 'COMPLETED', label: 'Completed' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === t.key
                ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                : 'bg-purple-950/40 border border-purple-900/60 text-purple-300 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Appointment Queue Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <Activity className="w-10 h-10 text-cyan-400/50 mx-auto" />
          <h3 className="text-lg font-bold text-white font-['Outfit']">No Consultations in Queue</h3>
          <p className="text-xs text-slate-400">There are no patient visits in this selected category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((appt) => {
            const patient = appt.patient || {};
            const summary = appt.visit_summary;
            const symptoms = appt.symptom_form;
            const urgency = summary?.ai_urgency_level || 'Medium';

            return (
              <div
                key={appt.id}
                className="glass-panel glass-panel-hover p-6 rounded-2xl border border-purple-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Patient & Symptoms */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-600/40 flex items-center justify-center font-bold text-purple-200">
                      {patient.full_name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {patient.full_name || 'Patient'}
                        <Badge 
                          variant={
                            urgency === 'High' ? 'urgencyHigh' :
                            urgency === 'Medium' ? 'urgencyMedium' : 'urgencyLow'
                          } 
                          size="sm"
                        >
                          {urgency} Urgency
                        </Badge>
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        <span>{new Date(appt.slot_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        <span>• Status: <span className="capitalize font-semibold text-purple-300">{appt.status}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Patient Symptoms Intake */}
                  {symptoms?.raw_symptoms && (
                    <div className="p-3.5 rounded-xl bg-[#0c0418] border border-cyan-950/80 text-xs space-y-1">
                      <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        Patient Symptoms &amp; Intake:
                      </span>
                      <p className="text-slate-200 line-clamp-3 leading-relaxed">
                        "{symptoms.raw_symptoms}"
                      </p>
                    </div>
                  )}

                  {/* AI Triage Highlight */}
                  {summary?.ai_chief_complaint && (
                    <div className="p-3 rounded-xl bg-[#080212] border border-purple-900/60 text-xs">
                      <span className="text-purple-400 font-semibold flex items-center gap-1.5 mb-0.5">
                        <Bot className="w-3.5 h-3.5" />
                        AI Triage Summary:
                      </span>
                      <p className="text-slate-300">{summary.ai_chief_complaint}</p>
                    </div>
                  )}

                  {symptoms && (
                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-4 pt-1">
                      <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-purple-300">
                        <strong>Severity:</strong> {symptoms.severity_scale}/10
                      </span>
                      <span><strong>Duration:</strong> {symptoms.duration_days} days</span>
                      {patient.phone && <span><strong>Phone:</strong> {patient.phone}</span>}
                    </div>
                  )}
                </div>

                {/* Consultation CTA */}
                <div className="flex flex-col sm:flex-row md:flex-col items-end justify-center gap-2 flex-shrink-0">
                  {appt.status === 'booked' ? (
                    <button
                      onClick={() => onStartConsultation(appt)}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all"
                    >
                      <Stethoscope className="w-4 h-4" />
                      <span>Start Consultation</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartConsultation(appt)}
                      className="px-5 py-2.5 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-200 text-xs font-semibold hover:text-white"
                    >
                      View Notes &amp; Prescription
                    </button>
                  )}

                  {appt.google_meet_link && appt.status === 'booked' && (
                    <a
                      href={appt.google_meet_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 mt-1"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Join Google Meet Call
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
