import React from 'react';
import { useStore } from '../store/useStore';
import { User, Mail, ShieldCheck, Key, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export function DressingRoom() {
  const { user } = useStore();

  if (!user) return null;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold tracking-tighter uppercase italic">Dressing Room</h2>
        <p className="text-xs font-mono opacity-60">PERSONA_AND_ACCESS_CONFIGURATION</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="lab-card space-y-6">
          <div className="grid-header border-[#141414]/10">Laboratory Identity</div>
          
          <div className="flex items-center gap-6">
             <div className="w-20 h-20 border border-[#141414] p-1 flex items-center justify-center bg-slate-50">
               {user.photoURL ? (
                 <img src={user.photoURL} alt="User" className="w-full h-full object-cover grayscale" />
               ) : (
                 <User size={32} className="text-slate-300" />
               )}
             </div>
             <div className="space-y-1">
               <div className="text-[10px] font-mono uppercase opacity-50 flex items-center gap-2">
                 Authorized Personnel
                 {user.isGuest && (
                   <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[8px] font-bold rounded">GUEST_SESSION</span>
                 )}
               </div>
               <div className="text-xl font-bold tracking-tight">{user.displayName}</div>
               <div className="text-xs font-mono opacity-80">{user.email}</div>
             </div>
          </div>

          <div className="space-y-4 pt-6">
            <div className="grid-header text-[9px]">Credentials</div>
            <div className="flex items-center justify-between border-b border-[#141414]/5 pb-2">
              <div className="flex items-center gap-2 text-xs font-mono">
                <Mail size={14} className="opacity-40" />
                PRIMARY_EMAIL
              </div>
              <div className="text-[10px] font-mono opacity-40">{user.email}</div>
            </div>
            <div className="flex items-center justify-between border-b border-[#141414]/5 pb-2">
              <div className="flex items-center gap-2 text-xs font-mono">
                <ShieldCheck size={14} className="opacity-40" />
                LAB_ID
              </div>
              <div className="text-[10px] font-mono opacity-40">{user.id.length > 16 ? `${user.id.slice(0, 16)}...` : user.id}</div>
            </div>
          </div>
        </section>

        <section className="lab-card space-y-6">
          <div className="grid-header border-[#141414]/10">Provider Integrations</div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-[#141414] bg-[#141414]/5 shadow-[2px_2px_0_#141414]">
               <div className="flex items-center gap-4">
                 <Shield size={20} />
                 <div>
                   <div className="text-xs font-bold font-mono">GOOGLE_GENAI</div>
                   <div className="text-[10px] font-mono opacity-40 italic">Injected_via_environment</div>
                 </div>
               </div>
               <div className="text-[9px] font-bold text-green-600 font-mono">CONNECTED</div>
            </div>

            <div className="flex items-center justify-between p-4 border border-[#141414]/20 opacity-40 cursor-not-allowed">
               <div className="flex items-center gap-4">
                 <Key size={20} />
                 <div>
                   <div className="text-xs font-bold font-mono">OPENROUTER_UPGRADE</div>
                   <div className="text-[10px] font-mono italic">Future_release_v2.0</div>
                 </div>
               </div>
               <div className="text-[9px] font-bold font-mono">UNAVAILABLE</div>
            </div>

            <div className="flex items-center justify-between p-4 border border-[#141414]/20 opacity-40 cursor-not-allowed">
               <div className="flex items-center gap-4">
                 <Key size={20} />
                 <div>
                   <div className="text-xs font-bold font-mono">ANTHROPIC_DIRECT</div>
                   <div className="text-[10px] font-mono italic">Future_release_v2.0</div>
                 </div>
               </div>
               <div className="text-[9px] font-bold font-mono">UNAVAILABLE</div>
            </div>
          </div>

          <div className="lab-card border-dashed bg-yellow-50/50 mt-8">
            <h4 className="text-[10px] font-bold uppercase font-mono mb-2 flex items-center gap-2">
              <AlertTriangle size={14} className="text-yellow-600" />
              Security Protocol
            </h4>
            <p className="text-[10px] leading-relaxed opacity-60">
              API keys are currently managed via the AI Studio Secrets panel. Verdict Lab does not store third-party keys client-side to prevent session hijacking. Direct BYOK configuration will be available in the Enterprise release.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
