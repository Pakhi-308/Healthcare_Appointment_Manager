import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { 
  Bell, 
  RotateCw, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send, 
  Filter, 
  AlertTriangle,
  RefreshCw,
  Eye,
  X,
  Sparkles,
  Server,
  Settings,
  Key,
  ShieldCheck,
  Check,
  Globe
} from 'lucide-react';

export const NotificationAuditPage = () => {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [retryingId, setRetryingId] = useState(null);
  const [previewNotif, setPreviewNotif] = useState(null);

  // Resend API Setup State
  const [showConfig, setShowConfig] = useState(false);
  const [resendApiKey, setResendApiKey] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [mailStatus, setMailStatus] = useState(null);

  // Test Email State
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status_filter = filter;

      const [logsRes, statsRes, statusRes] = await Promise.all([
        api.get('/notifications/audit', { params }),
        api.get('/notifications/stats'),
        api.get('/notifications/smtp-status').catch(() => ({ data: null })),
      ]);
      setNotifications(logsRes.data);
      setStats(statsRes.data);
      if (statusRes?.data) {
        setMailStatus(statusRes.data);
      }
    } catch (err) {
      toast.error('Failed to load notification audit records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleSaveResend = async (e) => {
    e.preventDefault();
    if (!resendApiKey.trim()) {
      toast.warning('Please enter your Resend API Key (starts with re_).');
      return;
    }

    setSavingConfig(true);
    try {
      const payload = {
        mail_server: 'https://api.resend.com',
        mail_port: 443,
        mail_username: 'onboarding@resend.dev',
        mail_password: resendApiKey.trim(),
        mail_from: 'onboarding@resend.dev',
        mail_ssl_tls: true,
        mail_starttls: false,
      };

      const res = await api.post('/notifications/smtp-config', payload);

      if (res.data.success) {
        toast.success('Resend API Connected! Real outbound email delivery is now ACTIVE.');
        setMailStatus(res.data);
        setShowConfig(false);
        fetchData();
      } else {
        toast.error(res.data.message || 'Authentication failed. Check your API key.');
      }
    } catch (err) {
      toast.error('Failed to connect Resend API.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleManualRetry = async (id) => {
    setRetryingId(id);
    try {
      await api.post(`/notifications/retry/${id}`);
      toast.success(`Notification #${id} retried successfully!`);
      fetchData();
    } catch (err) {
      toast.error('Retry attempt failed.');
    } finally {
      setRetryingId(null);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid recipient email.');
      return;
    }

    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await api.post('/notifications/test-email', { recipient_email: testEmail.trim() });
      setTestResult(res.data);
      if (res.data.success) {
        toast.success(`Real email sent to ${testEmail}! Check your inbox.`);
      } else {
        toast.warning(res.data.message || 'Dispatched in development simulation mode.');
      }
      fetchData();
    } catch (err) {
      toast.error('Email dispatch failed.');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>Delivery &amp; Retry Orchestration</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">
            Notification Audit &amp; Email Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Outbound email delivery via Resend API (Port 443 HTTPS), live dispatch testing, and retry logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-4 py-2 rounded-xl bg-cyan-950/50 border border-cyan-500/40 hover:bg-cyan-900/60 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{showConfig ? 'Hide Resend Setup' : 'Configure Resend API'}</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-purple-950/40 border border-purple-800/60 hover:bg-purple-900/50 text-purple-200 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Resend Outbound Setup Modal / Card */}
      {showConfig && (
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/40 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">Connect Outbound Resend HTTPS API</h3>
                <p className="text-xs text-slate-400">Enables cloud-safe email delivery over Port 443 HTTPS for booking confirmations, AI triage summaries, and medication alerts.</p>
              </div>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              mailStatus?.is_configured ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/30' : 'bg-amber-950 text-amber-300 border border-amber-600/30'
            }`}>
              {mailStatus?.is_configured ? '● Resend Active' : '○ Simulation Mode'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0a0417] border border-cyan-900/50 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-cyan-300">⚡ 10-Second Setup with Resend:</div>
            <p>1. Open <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">Resend API Keys</a>.</p>
            <p>2. Create a key &rarr; Paste below (starts with <code className="text-purple-300 font-mono">re_...</code>) &rarr; Click <strong>Connect Resend API</strong>.</p>
          </div>

          <form onSubmit={handleSaveResend} className="flex flex-wrap items-center gap-3 pt-1">
            <input
              type="password"
              value={resendApiKey}
              onChange={(e) => setResendApiKey(e.target.value)}
              placeholder="re_123456789abcdef..."
              className="flex-1 min-w-[280px] bg-[#080210] border border-cyan-900/60 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-cyan-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="px-4 py-2.5 rounded-xl bg-purple-950/40 text-slate-300 text-xs font-semibold hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingConfig}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{savingConfig ? 'Connecting...' : 'Connect Resend API'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Live Test Dispatcher */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">Test Live Email Dispatch</h3>
              <p className="text-xs text-slate-400">Send an instant test email to verify live delivery and view HTML rendering.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSendTestEmail} className="flex flex-wrap items-center gap-3 pt-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter your personal email (e.g., pakhishukla308@gmail.com)..."
            className="flex-1 min-w-[280px] bg-[#07020d] border border-purple-800/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono"
            required
          />
          <button
            type="submit"
            disabled={sendingTest}
            className="gradient-btn px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 disabled:opacity-50 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendingTest ? 'Sending Email...' : 'Send Live Test Email'}</span>
          </button>
        </form>

        {testResult && (
          <div className={`p-4 rounded-xl text-xs border ${
            testResult.success 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
              : 'bg-purple-950/40 border-purple-600/40 text-purple-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold font-mono">
                {testResult.is_configured ? 'Live Resend HTTPS Dispatch' : 'In-App Simulation Dispatch'}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-black/40">
                Status: {testResult.status}
              </span>
            </div>
            <p className="text-slate-300 mt-1">{testResult.message}</p>
            <div className="mt-2 text-[11px] text-slate-400 font-mono">
              Transport: Resend HTTPS API (Port 443) | From: {testResult.mail_from}
            </div>
          </div>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30">
          <span className="text-[11px] text-emerald-300 font-semibold uppercase tracking-wider block">Sent Successfully</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{stats?.total_sent || 0}</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30">
          <span className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider block">Pending In Queue</span>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">{stats?.total_pending || 0}</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30">
          <span className="text-[11px] text-rose-300 font-semibold uppercase tracking-wider block">Failed Deliveries</span>
          <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">{stats?.total_failed || 0}</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-purple-500/30">
          <span className="text-[11px] text-purple-300 font-semibold uppercase tracking-wider block">Retried via Queue</span>
          <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">{stats?.total_retried || 0}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-purple-950 pb-4">
        {[
          { key: '', label: 'All Dispatches' },
          { key: 'failed', label: 'Failed Only' },
          { key: 'pending', label: 'Pending Only' },
          { key: 'sent', label: 'Delivered' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === t.key
                ? 'bg-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-purple-950/40 border border-purple-900/60 text-purple-300 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Notification Table */}
      <div className="glass-panel rounded-2xl border border-purple-900/50 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-purple-950/40 rounded-xl animate-pulse" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto" />
            <p>No notification logs matching current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0318] border-b border-purple-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Recipient</th>
                  <th className="px-6 py-4">Trigger Type</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Status &amp; Retries</th>
                  <th className="px-6 py-4">Logged At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-950/60 text-slate-300">
                {notifications.map((notif) => {
                  const isSent = notif.status === 'SENT' || notif.status === 'sent';
                  const isPending = notif.status === 'PENDING' || notif.status === 'pending';
                  const isFailed = notif.status === 'FAILED' || notif.status === 'failed';

                  return (
                    <tr key={notif.id} className="hover:bg-purple-950/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{notif.recipient_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{notif.recipient_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300">
                          {notif.notification_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-200">
                        {notif.subject}
                        {notif.error_message && (
                          <div className="text-[11px] text-rose-400 truncate mt-0.5" title={notif.error_message}>
                            Error: {notif.error_message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isSent && <Badge variant="success" size="sm">SENT</Badge>}
                          {isPending && <Badge variant="warning" size="sm">PENDING</Badge>}
                          {isFailed && <Badge variant="danger" size="sm">FAILED</Badge>}
                          {notif.retry_count > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">({notif.retry_count} retries)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(notif.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewNotif(notif)}
                            className="px-2.5 py-1 rounded-lg bg-purple-900/40 border border-purple-700/50 text-purple-300 hover:text-white hover:bg-purple-800/60 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="View HTML Email"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                          
                          {(isFailed || isPending) && (
                            <button
                              disabled={retryingId === notif.id}
                              onClick={() => handleManualRetry(notif.id)}
                              className="px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 hover:bg-amber-900/60 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <RotateCw className={`w-3 h-3 ${retryingId === notif.id ? 'animate-spin' : ''}`} />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HTML Email Modal Viewer */}
      {previewNotif && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#12072b] border border-purple-700/50 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-purple-950 via-[#1c0a42] to-indigo-950 border-b border-purple-800/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-purple-300 font-semibold">
                  Rendered Email Preview
                </span>
                <h3 className="text-sm font-bold text-white line-clamp-1">{previewNotif.subject}</h3>
              </div>
              <button
                onClick={() => setPreviewNotif(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Meta Bar */}
            <div className="px-5 py-2.5 bg-[#090312] border-b border-purple-900/30 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-slate-500">Recipient:</span> <strong className="text-purple-200">{previewNotif.recipient_name}</strong> ({previewNotif.recipient_email})
              </div>
              <div>
                <span className="text-slate-500">Logged:</span> {new Date(previewNotif.created_at).toLocaleString()}
              </div>
            </div>

            {/* Rendered HTML Email Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#090312]">
              <div 
                className="bg-transparent rounded-xl overflow-hidden"
                dangerouslySetInnerHTML={{ __html: previewNotif.body }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#100624] border-t border-purple-900/40 flex items-center justify-between">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                previewNotif.status === 'SENT' || previewNotif.status === 'sent' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/30' : 'bg-rose-950 text-rose-300'
              }`}>
                Delivery Status: {previewNotif.status}
              </span>
              <button
                onClick={() => setPreviewNotif(null)}
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
