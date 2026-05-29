import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { History as HistoryIcon, Trash2, ChevronRight, CheckCircle2, FlaskConical, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export function History() {
  const { user } = useStore();
  const [experiments, setExperiments] = useState<any[]>([]);
  const [selectedExp, setSelectedExp] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [filterWinner, setFilterWinner] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'experiments'), where('ownerId', '==', user.id), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setExperiments(data);
      if (data.length > 0 && !selectedExp) setSelectedExp(data[0]);
    });
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this record from history?')) {
      await deleteDoc(doc(db, 'experiments', id));
      if (selectedExp?.id === id) setSelectedExp(null);
    }
  };

  const exportJSON = (exp: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exp, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `experiment_${exp.id.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const filteredExperiments = experiments.filter(exp => {
    const matchesSearch = exp.id.toLowerCase().includes(search.toLowerCase()) || 
                         JSON.stringify(exp.input).toLowerCase().includes(search.toLowerCase());
    const matchesWinner = filterWinner === 'all' || exp.verdict.winner === filterWinner;
    return matchesSearch && matchesWinner;
  }).sort((a, b) => {
    if (sortBy === 'newest') return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
    if (sortBy === 'oldest') return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
    if (sortBy === 'confidence') return (b.verdict.confidence || 0) - (a.verdict.confidence || 0);
    return 0;
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter uppercase italic">Experiment History</h2>
          <p className="text-xs font-mono opacity-60">ARCHIVE_OF_BEHAVIORAL_INSIGHTS</p>
        </div>

        <div className="flex flex-wrap w-full md:w-auto gap-4">
           <div className="relative flex-1 md:w-48">
              <input 
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search history..."
                className="lab-input pl-3 text-[11px] h-9"
              />
           </div>
           <select 
             value={filterWinner} onChange={e => setFilterWinner(e.target.value)}
             className="lab-input w-32 h-9 text-[10px] font-bold uppercase appearance-none bg-slate-50"
           >
             <option value="all">ALL_WINNERS</option>
             <option value="A">VARIANT_A</option>
             <option value="B">VARIANT_B</option>
             <option value="Tie">TIE_ONLY</option>
           </select>
           <select 
             value={sortBy} onChange={e => setSortBy(e.target.value)}
             className="lab-input w-32 h-9 text-[10px] font-bold uppercase appearance-none bg-slate-50"
           >
             <option value="newest">NEWEST_FIRST</option>
             <option value="oldest">OLDEST_FIRST</option>
             <option value="confidence">MAX_CONFIDENCE</option>
           </select>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List View */}
        <div className="lg:col-span-1 border-r border-slate-200 pr-8 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
          {filteredExperiments.length === 0 && (
            <div className="text-[10px] font-bold text-slate-400 py-20 text-center uppercase tracking-widest">
              {experiments.length === 0 ? "NO_RECORDS_YET. EXECUTE_IN_ARENA." : "NO_MATCHES_FOUND"}
            </div>
          )}
          {filteredExperiments.map((exp) => (
            <button
              key={exp.id}
              onClick={() => setSelectedExp(exp)}
              className={cn(
                "w-full text-left p-4 rounded-xl border transition-all duration-300 group relative overflow-hidden",
                selectedExp?.id === exp.id 
                  ? "border-indigo-500 bg-white shadow-lg shadow-indigo-100 ring-1 ring-indigo-500" 
                  : "border-slate-100 bg-white/50 opacity-70 hover:opacity-100 hover:border-slate-300"
              )}
            >
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  {exp.createdAt?.toDate().toLocaleString()}
                </div>
                <button 
                  onClick={(e) => handleDelete(e, exp.id)} 
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <h4 className="text-sm font-bold text-slate-900 truncate mb-2 relative z-10">
                EXP_{exp.id.slice(0, 8)}
              </h4>
              <div className="flex items-center gap-2 relative z-10">
                 <div className={cn(
                   "px-2 py-0.5 text-[8px] font-bold uppercase rounded",
                   exp.verdict.winner === 'Tie' ? "bg-slate-100 text-slate-600" : "bg-indigo-600 text-white shadow-sm"
                 )}>
                   WINNER: {exp.verdict.winner}
                 </div>
                 <div className="text-[8px] font-bold text-slate-400">
                   CONF: {(exp.verdict.confidence * 100).toFixed(0)}%
                 </div>
              </div>
              {selectedExp?.id === exp.id && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
              )}
            </button>
          ))}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
          {selectedExp ? (
            <motion.div 
              key={selectedExp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 pb-20"
            >
              <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-8">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-slate-800">Experiment Report: <span className="text-indigo-600">#{selectedExp.id.slice(0,8)}</span></h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: {selectedExp.testCardId}</p>
                </div>
                <button 
                  onClick={() => exportJSON(selectedExp)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-all flex items-center gap-2"
                >
                  <Download size={14} /> EXPORT_DATA
                </button>
              </div>

              <section className="lab-card border-dashed bg-slate-50/50">
                <div className="grid-header mb-4">Input Context</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(selectedExp.input).map(([k, v]: [string, any]) => (
                    <div key={k} className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{k}</span>
                      <span className="text-xs text-slate-700 font-medium leading-relaxed">{v}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-2 gap-8">
                {['A', 'B'].map(vid => (
                  <div key={vid} className="space-y-4">
                    <div className="grid-header flex justify-between items-center">
                      <span>Variant {vid}</span>
                      {selectedExp.verdict.winner === vid && (
                        <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[8px] font-bold shadow-sm">Winner</span>
                      )}
                    </div>
                    <div className="lab-card max-h-64 overflow-y-auto text-xs prose prose-slate prose-sm border-slate-200 bg-white">
                       <ReactMarkdown>{selectedExp.results[vid]}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>

              <section className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="grid-header border-slate-800 mb-6 text-slate-500">Judge Rationale</div>
                <p className="text-sm leading-relaxed font-medium text-slate-300 relative z-10 italic">
                  {selectedExp.verdict.reasoning}
                </p>
                
                <div className="mt-10 grid grid-cols-3 gap-6 relative z-10">
                   <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                     <div className="grid-header border-transparent mb-2 text-[10px] text-slate-500">Confidence</div>
                     <div className="text-2xl font-bold text-indigo-400">{(selectedExp.verdict.confidence * 100).toFixed(1)}%</div>
                   </div>
                   <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                     <div className="grid-header border-transparent mb-2 text-[10px] text-slate-500">Tally Distribution</div>
                     <div className="text-2xl font-bold text-white flex gap-2">
                       <span title="Variant A">{selectedExp.verdict.majority_vote_tally.A}</span>
                       <span className="opacity-20">/</span>
                       <span title="Variant B">{selectedExp.verdict.majority_vote_tally.B}</span>
                       <span className="opacity-20">/</span>
                       <span title="Tie" className="text-slate-500">{selectedExp.verdict.majority_vote_tally.Tie}</span>
                     </div>
                   </div>
                   <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                     <div className="grid-header border-transparent mb-2 text-[10px] text-slate-500">Engine Profile</div>
                     <div className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">{selectedExp.verdict.engine_version || 'JDAY_V1_PRO'}</div>
                   </div>
                </div>
              </section>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-30 py-40 border-2 border-dashed border-[#141414]">
              <HistoryIcon size={48} className="mb-4" />
              <p className="font-mono text-sm uppercase">No experiment selected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
