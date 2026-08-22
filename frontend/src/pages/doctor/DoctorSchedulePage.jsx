import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  CalendarX, 
  ShieldAlert, 
  Info,
  CalendarCheck
} from 'lucide-react';

export const DoctorSchedulePage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [doctorProfile, setDoctorProfile] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leave Form Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveDate, setLeaveDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [leaveReason, setLeaveReason] = useState('Attending Annual Medical Symposium');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const fetchDoctorDetails = async () => {
    setLoading(true);
    try {
      // Find doctor profile for this user
      const doctorsRes = await api.get('/doctors');
      const myDoc = doctorsRes.data.find(d => d.user_id === user?.id) || doctorsRes.data[0];
      setDoctorProfile(myDoc);

      if (myDoc?.id) {
        const leavesRes = await api.get(`/doctors/${myDoc.id}/leaves`);
        setLeaves(leavesRes.data);
      }
    } catch (err) {
      toast.error('Failed to load doctor schedule data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorDetails();
  }, [user?.id]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!doctorProfile?.id || !leaveDate) return;

    setSubmittingLeave(true);
    try {
      const res = await api.post(`/admin/doctors/${doctorProfile.id}/leaves`, {
        leave_date: leaveDate,
        reason: leaveReason,
      });
      toast.success(res.data.message || 'Leave recorded successfully.');
      setShowLeaveModal(false);
      fetchDoctorDetails();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to apply leave.');
    } finally {
      setSubmittingLeave(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Practitioner Availability</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">
            Working Hours &amp; Leave Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated conflict resolution cancels and notifies affected patients upon leave approval
          </p>
        </div>

        <button
          onClick={() => setShowLeaveModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.3)] self-start"
        >
          <CalendarX className="w-4 h-4" />
          <span>Mark Doctor Leave</span>
        </button>
      </div>

      {/* Grid: Working Hours & Active Leaves */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Working Hours Card */}
        <div className="glass-panel p-6 rounded-2xl border border-purple-900/50 space-y-6 md:col-span-1">
          <div className="flex items-center gap-3 pb-3 border-b border-purple-950">
            <div className="p-2 rounded-xl bg-purple-900/50 text-purple-300">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit']">Clinical Schedule</h3>
              <p className="text-xs text-slate-400">Regular Operating Hours</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Operating Days:</span>
              <div className="flex flex-wrap gap-1.5">
                {(doctorProfile?.working_days || 'Mon,Tue,Wed,Thu,Fri').split(',').map((d) => (
                  <span key={d} className="px-2.5 py-1 rounded-md bg-purple-950 border border-purple-800 text-purple-200 font-semibold">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Working Time Window:</span>
              <div className="p-3 rounded-xl bg-[#0c0418] border border-purple-950 font-mono text-sm text-white">
                {doctorProfile?.working_hours_start || '09:00'} - {doctorProfile?.working_hours_end || '17:00'}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Slot Duration:</span>
              <span className="text-purple-300 font-semibold">{doctorProfile?.slot_duration_minutes || 30} Minutes per Consultation</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Consultation Room:</span>
              <span className="text-white font-semibold">{doctorProfile?.room_number || 'Room 401A'}</span>
            </div>
          </div>
        </div>

        {/* Recorded Leaves Table */}
        <div className="glass-panel p-6 rounded-2xl border border-purple-900/50 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-purple-950">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-950/60 text-rose-300">
                <CalendarX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-['Outfit']">Recorded Leaves &amp; Outages</h3>
                <p className="text-xs text-slate-400">All dates with automatic booking protection active</p>
              </div>
            </div>
            <Badge variant="warning">{leaves.length} Recorded</Badge>
          </div>

          {loading ? (
            <div className="h-36 bg-purple-950/30 rounded-xl animate-pulse" />
          ) : leaves.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto" />
              <p>No active leaves on record. You are marked fully available on your scheduled clinic days.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-purple-950 text-slate-400">
                    <th className="pb-3 font-semibold">Leave Date</th>
                    <th className="pb-3 font-semibold">Reason</th>
                    <th className="pb-3 font-semibold">Logged On</th>
                    <th className="pb-3 font-semibold text-right">Protection Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/50 text-slate-300">
                  {leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-purple-950/20">
                      <td className="py-3 font-semibold text-white">
                        {new Date(l.leave_date).toLocaleDateString([], { dateStyle: 'full' })}
                      </td>
                      <td className="py-3">{l.reason || 'Medical / Emergency Leave'}</td>
                      <td className="py-3 text-slate-400">
                        {new Date(l.created_at).toLocaleDateString([], { dateStyle: 'short' })}
                      </td>
                      <td className="py-3 text-right">
                        <Badge variant="danger" size="sm">Conflicting Bookings Re-routed</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Mark Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-lg w-full glass-panel p-6 sm:p-8 rounded-2xl border border-rose-500/50 space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-purple-950">
              <div className="p-2 rounded-xl bg-rose-950/60 text-rose-300">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit']">Record Doctor Leave</h3>
                <p className="text-xs text-rose-300/80">Automated Patient Protection Trigger</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 space-y-1 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <Info className="w-4 h-4" />
                <span>Automatic Conflict Handler Notice:</span>
              </div>
              <p>
                When leave is marked for this date, any active patient appointments on this date will be 
                <strong> atomically cancelled</strong>, Google Calendar events will be cleaned up, and 
                affected patients will receive an immediate email with a <strong>priority rebooking link</strong>.
              </p>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Leave Date *</label>
                <input
                  type="date"
                  value={leaveDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  required
                  className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Reason for Absence</label>
                <input
                  type="text"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="E.g., Medical conference, personal emergency..."
                  required
                  className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-950">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(244,63,94,0.4)] disabled:opacity-50"
                >
                  {submittingLeave ? 'Processing Conflicts...' : 'Confirm Leave & Notify Patients'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
