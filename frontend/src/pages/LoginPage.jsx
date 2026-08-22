import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Activity, Lock, Mail, ArrowRight, UserCheck, ShieldCheck, Stethoscope } from 'lucide-react';

export const LoginPage = ({ onNavigate }) => {
  const { login, quickLogin } = useAuth();
  const toast = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.full_name}!`);
      if (user.role === 'doctor') onNavigate('doctor-dashboard');
      else if (user.role === 'admin') onNavigate('admin-dashboard');
      else onNavigate('patient-doctors');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (roleType) => {
    setLoading(true);
    try {
      const user = await quickLogin(roleType);
      toast.success(`Logged in as ${user.full_name} (${roleType.toUpperCase()})`);
      if (roleType === 'doctor') onNavigate('doctor-dashboard');
      else if (roleType === 'admin') onNavigate('admin-dashboard');
      else onNavigate('patient-doctors');
    } catch (err) {
      toast.error('Quick demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-panel p-8 sm:p-10 rounded-3xl border border-purple-600/30 shadow-[0_0_50px_rgba(139,92,246,0.15)] relative">
        {/* Brand Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-cyan-500 p-0.5 shadow-[0_0_25px_rgba(168,85,247,0.4)]">
            <div className="w-full h-full bg-[#0d051f] rounded-[14px] flex items-center justify-center">
              <Activity className="w-7 h-7 text-purple-400" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-center text-white font-['Outfit']">
          Welcome to HealthSync
        </h2>
        <p className="text-xs text-center text-slate-400 mt-1 mb-8">
          Sign in to access your appointments &amp; medical records
        </p>

        {/* Demo Fast Login Pills */}
        <div className="mb-6 p-3 rounded-2xl bg-[#0a0316] border border-purple-900/60">
          <div className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider mb-2 text-center">
            One-Click Evaluator Demo Access
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemo('patient')}
              className="py-2 px-1.5 rounded-lg bg-purple-950/70 border border-purple-500/30 hover:border-purple-400 text-purple-200 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Patient</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('doctor')}
              className="py-2 px-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 text-cyan-200 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
            >
              <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
              <span>Doctor</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('admin')}
              className="py-2 px-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 hover:border-amber-400 text-amber-200 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@healthsync.care"
                required
                className="w-full bg-[#120627] border border-purple-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#120627] border border-purple-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-btn py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 mt-6 shadow-[0_4px_25px_rgba(124,58,237,0.35)] disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-purple-400 hover:text-purple-300 font-semibold underline"
          >
            Create Patient Account
          </button>
        </p>
      </div>
    </div>
  );
};
