import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { User, Mail, ShieldCheck, Key, Shield, Zap, RefreshCw, Trash2, Cpu } from 'lucide-react';
import { motion } from 'motion/react';
import { getCacheStats, clearEvaluationCache } from '../services/geminiService';

export function DressingRoom() {
  const { user, mockMode, toggleMockMode } = useStore();
  const [cacheStats, setCacheStats] = useState<{
    hits: number;
    misses: number;
    size: number;
    hitRatio: number;
    evictions: number;
  } | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch (e) {
      console.warn("Could not load cache statistics:", e);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const res = await clearEvaluationCache();
      setCacheStats(res.stats);
      setCacheMessage("Cache flushed successfully.");
      setTimeout(() => setCacheMessage(null), 3000);
    } catch (e) {
      setCacheMessage("Failed to clear cache.");
    } finally {
      setIsClearing(false);
    }
  };

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
            <div className="grid-header text-[9px]">Credentials & Execution Environment</div>
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

          {/* Offline / Mock Mode Simulation Toggle */}
          <div className="pt-4">
            <div className="grid-header text-[9px] mb-3">Offline Demonstration & Mock Evaluation Mode</div>
            <div className={`p-4 border transition-all ${mockMode ? 'border-amber-500 bg-amber-50/50 shadow-[2px_2px_0_#d97706]' : 'border-[#141414] bg-slate-50 shadow-[2px_2px_0_#141414]'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu size={20} className={mockMode ? 'text-amber-600' : 'text-slate-500'} />
                  <div>
                    <div className="text-xs font-bold font-mono flex items-center gap-2">
                      MOCK_EVALUATION_MODE
                      {mockMode && <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 text-[8px] font-bold">ACTIVE</span>}
                    </div>
                    <div className="text-[10px] font-mono opacity-60">
                      Simulates deterministic multi-judge evaluations offline without consuming Gemini API tokens.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleMockMode}
                  className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                    mockMode 
                      ? 'bg-amber-600 text-white border-amber-700 shadow-[1px_1px_0_#000]' 
                      : 'bg-white text-slate-800 border-[#141414] hover:bg-slate-100 shadow-[1px_1px_0_#141414]'
                  }`}
                >
                  {mockMode ? 'DISABLE MOCK' : 'ENABLE MOCK'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="lab-card space-y-6">
          <div className="grid-header border-[#141414]/10">Evaluation Cache & Latency Optimization</div>
          
          <div className="space-y-4">
            <div className="p-4 border border-[#141414] bg-slate-50 shadow-[2px_2px_0_#141414] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold font-mono">
                  <Zap size={16} className="text-amber-500" />
                  IN_MEMORY_EVALUATION_CACHE
                </div>
                <button 
                  onClick={loadStats} 
                  title="Refresh statistics"
                  className="p-1 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
              <p className="text-[10px] font-mono opacity-60">
                Caches identical (Variant A, Variant B, Rubric, Models) evaluation tuples to eliminate redundant LLM API costs and provide instant responses.
              </p>

              {cacheStats && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#141414]/10 font-mono text-[10px]">
                  <div className="bg-white p-2 border border-[#141414]/10">
                    <div className="opacity-50 text-[8px] uppercase">Cache Hits</div>
                    <div className="text-sm font-bold text-green-700">{cacheStats.hits}</div>
                  </div>
                  <div className="bg-white p-2 border border-[#141414]/10">
                    <div className="opacity-50 text-[8px] uppercase">Cached Items</div>
                    <div className="text-sm font-bold">{cacheStats.size}</div>
                  </div>
                  <div className="bg-white p-2 border border-[#141414]/10">
                    <div className="opacity-50 text-[8px] uppercase">Hit Ratio</div>
                    <div className="text-sm font-bold">{((cacheStats.hitRatio || 0) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-[9px] font-mono text-green-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
                  CACHE_ACTIVE (TTL: 1 hour)
                </span>
                <button
                  type="button"
                  onClick={handleClearCache}
                  disabled={isClearing}
                  className="px-2.5 py-1 text-[9px] font-mono font-bold text-red-600 border border-red-300 hover:bg-red-50 cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 size={10} />
                  {isClearing ? "CLEARING..." : "FLUSH CACHE"}
                </button>
              </div>
              {cacheMessage && (
                <div className="text-[9px] font-mono text-slate-600 italic">{cacheMessage}</div>
              )}
            </div>

            <div className="grid-header text-[9px] pt-4">Provider Integrations</div>
            <div className="flex items-center justify-between p-4 border border-[#141414] bg-[#141414]/5 shadow-[2px_2px_0_#141414]">
               <div className="flex items-center gap-4">
                 <Shield size={20} />
                 <div>
                   <div className="text-xs font-bold font-mono">GOOGLE_GENAI</div>
                   <div className="text-[10px] font-mono opacity-40 italic">Injected_via_server_environment</div>
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
          </div>
        </section>
      </div>
    </div>
  );
}
