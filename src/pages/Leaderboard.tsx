import React, { useState, useEffect } from 'react';
import { calculateLeaderboardStats, ModelStats } from '../services/metricsService';
import { Trophy, Activity, Zap, TrendingUp, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function Leaderboard() {
  const [stats, setStats] = useState<ModelStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await calculateLeaderboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-sm font-mono text-slate-400 uppercase tracking-widest">Aggregating_Global_Performance_Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-3 mb-2">
           <Trophy className="text-amber-500" size={28} />
           <h2 className="text-3xl font-black tracking-tighter uppercase italic text-slate-900">Model Benchmarks</h2>
        </div>
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest max-w-2xl leading-relaxed">
          Aggregated performance across all public laboratory experiments. Winning rates are calculated based on judge-led variant preference synthesis.
        </p>
      </header>

      {/* Top Performers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.slice(0, 3).map((s, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={s.modelName}
            className={cn(
              "relative overflow-hidden rounded-3xl p-8 border",
              i === 0 ? "bg-slate-900 text-white border-slate-800 shadow-2xl shadow-indigo-500/10" : "bg-white border-slate-200 text-slate-900"
            )}
          >
            {i === 0 && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl -mr-16 -mt-16 rounded-full" />}
            
            <div className="flex justify-between items-start mb-6">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-black",
                i === 0 ? "bg-indigo-600" : "bg-slate-100 text-slate-400"
              )}>
                # {i + 1}
              </div>
              <Activity size={20} className={i === 0 ? "text-indigo-400" : "text-slate-200"} />
            </div>

            <h3 className="text-xl font-bold mb-1 truncate uppercase">{s.modelName}</h3>
            <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-6", i === 0 ? "text-slate-400" : "text-slate-500")}>
              State-of-the-Art Contender
            </p>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <div className="text-[9px] font-bold opacity-50 uppercase mb-1">Win Rate</div>
                 <div className="text-2xl font-black text-indigo-500">{s.winRate.toFixed(1)}%</div>
               </div>
               <div>
                 <div className="text-[9px] font-bold opacity-50 uppercase mb-1">Confidence</div>
                 <div className="text-2xl font-black">{s.averageConfidence.toFixed(2)}</div>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Full Rankings Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <TrendingUp size={14} /> Full Tier Rankings
            </h4>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black tracking-tighter border border-emerald-100">
              <ShieldCheck size={12} /> ANONYMIZED_AGGREGATE_DATA
            </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="px-8 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Model Identifier</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Runs</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Win Rate</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Avg Confidence</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Ties / Peaks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.map((s, i) => (
                <tr key={s.modelName} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <span className="w-5 text-[10px] font-mono text-slate-300">{(i + 1).toString().padStart(2, '0')}</span>
                      <span className="font-bold text-slate-800 text-sm uppercase">{s.modelName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Zap size={12} className="text-amber-400" />
                      <span className="text-xs font-bold text-slate-600">{s.totalEvaluations} Protocols</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                      <span className="text-xs font-black text-indigo-600">{s.winRate.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-xs font-mono font-bold text-slate-500">{s.averageConfidence.toFixed(3)}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">TIES: {s.ties}</span>
                       <span className="text-[9px] font-mono text-indigo-400">PEAK_CONF: {s.peakConfidence.toFixed(2)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {stats.length === 0 && (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-slate-200 animate-spin mx-auto mb-4" />
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Awaiting_Sufficient_Aggregate_Data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
