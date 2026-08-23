import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Send, 
  ExternalLink,
  Sparkles,
  Calendar,
  Clock,
  Pill,
  ShieldAlert
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const NotificationDrawer = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, role } = useAuth();
  const toast = useToast();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  
  // Test email state
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setTestEmail(user.email);
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      // If admin, fetch audit; if patient/doctor, fetch my notifications
      const endpoint = role === 'admin' ? '/notifications/audit?limit=30' : '/notifications/my?limit=30';
      const res = await api.get(endpoint);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchNotifications();
    }
  }, [isOpen, isAuthenticated]);

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please provide a valid email address.');
      return;
    }

    setSendingTest(true);
    try {
      const res = await api.post('/notifications/test-email', { recipient_email: testEmail });
      if (res.data.success) {
        toast.success(res.data.message || 'Test email dispatched successfully!');
      } else {
        toast.warning(res.data.message || 'Dispatched in development simulation mode.');
      }
      fetchNotifications();
      setShowTestForm(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to dispatch test email.');
    } finally {
      setSendingTest(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'BOOKING_CONFIRMATION':
        return <Calendar className="w-4 h-4 text-purple-400" />;
      case 'DOCTOR_LEAVE_REBOOK':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'MEDICATION_REMINDER':
        return <Pill className="w-4 h-4 text-emerald-400" />;
      case 'APPOINTMENT_CANCELLATION':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Mail className="w-4 h-4 text-cyan-400" />;
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0d051f] border-l border-purple-900/50 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-5 border-b border-purple-900/40 bg-gradient-to-r from-[#170938] to-[#12062b] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-heading">Notification &amp; Email Hub</h2>
                <p className="text-[11px] text-purple-300">
                  {role === 'admin' ? 'System-wide Dispatched Emails' : `Incoming notices for ${user?.email}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Test Email Action Banner */}
          <div className="px-5 py-3 bg-[#14082e] border-b border-purple-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Email Service Active</span>
            </div>
            <button
              onClick={() => setShowTestForm(!showTestForm)}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              {showTestForm ? 'Cancel' : 'Test Email Dispatch'}
            </button>
          </div>

          {/* Test Email Form (Collapsible) */}
          {showTestForm && (
            <form onSubmit={handleSendTestEmail} className="p-4 bg-purple-950/40 border-b border-purple-900/40 space-y-3">
              <label className="block text-xs font-medium text-purple-200">
                Send Test Email To:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="flex-1 bg-[#090312] border border-purple-800/60 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  required
                />
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="gradient-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  {sendingTest ? 'Sending...' : 'Send'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Dispatches a live SMTP verification email with full HTML formatting.
              </p>
            </form>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
                Loading email logs...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <Mail className="w-8 h-8 mx-auto text-purple-400/40 mb-2" />
                No notification emails recorded yet.
                <p className="text-xs text-slate-500 mt-1">Book an appointment or send a test email to view it here.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => setSelectedNotif(notif)}
                  className="p-3.5 rounded-xl border border-purple-900/40 bg-[#12072b]/70 hover:bg-[#1b0a3d] hover:border-purple-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-950 border border-purple-800/40">
                        {getNotificationIcon(notif.notification_type)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                          {notif.subject}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          To: {notif.recipient_name} ({notif.recipient_email})
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${
                      notif.status === 'SENT'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                        : notif.status === 'FAILED'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                    }`}>
                      {notif.status}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-purple-950/60">
                    <span>{formatTimestamp(notif.created_at)}</span>
                    <span className="text-purple-400 group-hover:underline flex items-center gap-1 font-medium">
                      Read Email &rarr;
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3 border-t border-purple-900/40 bg-[#090312] text-center text-[11px] text-slate-500">
            Automated alerts dispatched via SMTP with LLaMA triage insights.
          </div>
        </div>
      </div>

      {/* HTML Email Modal Viewer */}
      {selectedNotif && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#12072b] border border-purple-700/50 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-purple-950 via-[#1c0a42] to-indigo-950 border-b border-purple-800/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-purple-300 font-semibold">
                  Rendered Email Preview
                </span>
                <h3 className="text-sm font-bold text-white line-clamp-1">{selectedNotif.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Meta Bar */}
            <div className="px-5 py-2.5 bg-[#090312] border-b border-purple-900/30 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-slate-500">Recipient:</span> <strong className="text-purple-200">{selectedNotif.recipient_name}</strong> ({selectedNotif.recipient_email})
              </div>
              <div>
                <span className="text-slate-500">Dispatched:</span> {formatTimestamp(selectedNotif.created_at)}
              </div>
            </div>

            {/* Rendered HTML Email Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#090312]">
              <div 
                className="bg-transparent rounded-xl overflow-hidden"
                dangerouslySetInnerHTML={{ __html: selectedNotif.body }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#100624] border-t border-purple-900/40 flex items-center justify-between">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                selectedNotif.status === 'SENT' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/30' : 'bg-rose-950 text-rose-300'
              }`}>
                Delivery Status: {selectedNotif.status}
              </span>
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-900/50 hover:bg-purple-800 text-white transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
