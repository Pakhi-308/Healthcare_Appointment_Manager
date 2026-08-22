import React from 'react';
import { Activity, ShieldCheck, Heart, Sparkles, Calendar, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-purple-900/40 bg-[#06020c] text-slate-400 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1 */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-400 p-0.5 shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                <div className="w-full h-full bg-[#0d051f] rounded-[6px] flex items-center justify-center">
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <span className="text-lg font-bold text-white font-['Outfit']">HealthSync</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Enterprise healthcare scheduling engine featuring Groq LLaMA 3.3 AI clinical triage, concurrency-safe slot holds, and automated follow-up care.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-4">Portals</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-slate-300 hover:text-white cursor-pointer">Patient Care Directory</span></li>
              <li><span className="text-slate-300 hover:text-white cursor-pointer">Doctor Consultation Hub</span></li>
              <li><span className="text-slate-300 hover:text-white cursor-pointer">Administrative Command</span></li>
              <li><span className="text-slate-300 hover:text-white cursor-pointer">Digital Prescriptions</span></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-4">Core Technology</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-purple-400" /> Groq LLaMA 3.3 70B AI</li>
              <li className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-cyan-400" /> Google Calendar OAuth 2.0</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> DB Row-Locking Concurrency</li>
              <li className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-amber-400" /> Automated APScheduler Reminders</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-4">Emergency &amp; Support</h4>
            <p className="text-xs text-slate-400 mb-2">For life-threatening emergencies, dial 911 or visit your nearest hospital emergency department immediately.</p>
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs">
              <span className="text-purple-300 font-semibold">24/7 Care Concierge:</span>
              <div className="text-white font-mono mt-0.5">+1 (800) 555-SYNC</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-purple-950 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>&copy; {new Date().getFullYear()} HealthSync Medical Technologies. Built with Python FastAPI, MySQL, React &amp; Tailwind CSS.</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>HIPAA Compliant Protocol</span>
            <span>•</span>
            <span>Zero Double-Booking Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
