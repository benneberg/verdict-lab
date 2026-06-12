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
  const [testCards, setTestCards] = useState<any[]>([]);
  const [selectedExp, setSelectedExp] = useState<any | null>(null);
  
  // Filtering & Sorting State
  const [search, setSearch] = useState('');
  const [filterWinner, setFilterWinner] = useState('all');
  const [filterModel, setFilterModel] = useState('all');
  const [filterTestCard, setFilterTestCard] = useState('all');
  const [datePreset, setDatePreset] = useState('all'); // all, today, week, month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (!user) return;
    const q1 = query(collection(db, 'experiments'), where('ownerId', '==', user.id), orderBy('createdAt', 'desc'));
    const unsubExp = onSnapshot(q1, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setExperiments(data);
      if (data.length > 0 && !selectedExp) setSelectedExp(data[0]);
    });

    const q2 = query(collection(db, 'test_cards'), where('ownerId', '==', user.id));
    const unsubCards = onSnapshot(q2, (snapshot) => {
      setTestCards(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubExp();
      unsubCards();
    };
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

  // Extract unique models/judges and test cards referenced in history
  const uniqueJudges = Array.from(
    new Set(experiments.flatMap(exp => exp.judges || []))
  );

  const uniqueCardIds = Array.from(
    new Set(experiments.map(exp => exp.testCardId).filter(Boolean))
  );

  const matchesDate = (timestamp: any) => {
    if (!timestamp) return true;
    const date = timestamp.toDate();
    const now = new Date();
    
    if (datePreset === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return date >= todayStart;
    }
    if (datePreset === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    }
    if (datePreset === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return date >= monthAgo;
    }
    if (datePreset === 'custom') {
      if (startDate) {
        const start = new Date(startDate);
        if (date < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (date > end) return false;
      }
    }
    return true;
  };

  const filteredExperiments = experiments.filter(exp => {
    // Search filter
    const matchesSearch = exp.id.toLowerCase().includes(search.toLowerCase()) || 
                          JSON.stringify(exp.input).toLowerCase().includes(search.toLowerCase());
    
    // Winner filter
    const matchesWinner = filterWinner === 'all' || exp.verdict?.winner === filterWinner;
    
    // Model/Judge filter
    const matchesModel = filterModel === 'all' || (exp.judges && exp.judges.includes(filterModel));
    
    // Test Card filter
    const matchesTestCard = filterTestCard === 'all' || exp.testCardId === filterTestCard;
    
    // Date filter
    const matchesDateFilter = matchesDate(exp.createdAt);

    return matchesSearch && matchesWinner && matchesModel && matchesTestCard && matchesDateFilter;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
    }
    if (sortBy === 'oldest') {
      return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
    }
    if (sortBy === 'confidence') {
      return (b.verdict?.confidence || 0) - (a.verdict?.confidence || 0);
    }
    if (sortBy === 'performance') {
      // Sort by the winner's support tally (majority count)
      const tallyA = a.verdict?.majority_vote_tally ? Math.max(...Object.values(a.verdict.majority_vote_tally as Record<string, number>)) : 0;
      const tallyB = b.verdict?.majority_vote_tally ? Math.max(...Object.values(b.verdict.majority_vote_tally as Record<string, number>)) : 0;
      return tallyB - tallyA;
    }
    if (sortBy === 'name') {
      const cardA = testCards.find(c => c.id === a.testCardId)?.name || `EXP_${a.id}`;
      const cardB = testCards.find(c => c.id === b.testCardId)?.name || `EXP_${b.id}`;
      return cardA.localeCompare(cardB);
    }
    return 0;
  });

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter uppercase italic">Experiment History</h2>
          <p className="text-xs font-mono opacity-60">ARCHIVE_OF_BEHAVIORAL_INSIGHTS</p>
        </div>

        {/* Global actions / Search bar */}
        <div className="relative w-full lg:w-64 max-w-sm">
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search payload content..."
            className="lab-input pl-3 text-[11px] h-9 w-full"
          />
        </div>
      </header>

      {/* Structured Filtering Panel */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
          Laboratory Control Filters
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Winner Selector */}
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Verdict Winner</label>
            <select 
              value={filterWinner} onChange={e => setFilterWinner(e.target.value)}
              className="lab-input h-9 text-[10px] font-bold uppercase appearance-none bg-slate-50 border-slate-200"
            >
              <option value="all">ALL_WINNERS</option>
              <option value="A">VARIANT_A</option>
              <option value="B">VARIANT_B</option>
              <option value="Tie">TIE_ONLY</option>
            </select>
          </div>

          {/* Model Selector */}
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Evaluator Model</label>
            <select 
              value={filterModel} onChange={e => setFilterModel(e.target.value)}
              className="lab-input h-9 text-[10px] font-bold uppercase appearance-none bg-slate-50 border-slate-200"
            >
              <option value="all">ALL_MODELS</option>
              {uniqueJudges.map(j => (
                <option key={j} value={j}>{j.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Test Card Selector */}
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Linked Test Protocol</label>
            <select 
              value={filterTestCard} onChange={e => setFilterTestCard(e.target.value)}
              className="lab-input h-9 text-[10px] font-bold uppercase appearance-none bg-slate-50 border-slate-200 truncate"
            >
              <option value="all">ALL_PROTOCOLS</option>
              {uniqueCardIds.map(id => {
                const card = testCards.find(c => c.id === id);
                return (
                  <option key={id} value={id}>
                    {card ? card.name : `ID: ${id.slice(0, 8)}...`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sorter Selector */}
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sort Metric Order</label>
            <select 
              value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="lab-input h-9 text-[10px] font-bold uppercase appearance-none bg-slate-50 border-slate-200"
            >
              <option value="newest">NEWEST_FIRST</option>
              <option value="oldest">OLDEST_FIRST</option>
              <option value="confidence">JUDGE_CONFIDENCE</option>
              <option value="performance">PEAK_TALLY_STRENGTH</option>
              <option value="name">ALPHABETIC_NAME</option>
            </select>
          </div>
        </div>

        {/* Date Filters Block */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-48">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Date Interval</label>
            <select 
              value={datePreset} onChange={e => setDatePreset(e.target.value)}
              className="lab-input h-9 text-[10px] font-bold uppercase appearance-none bg-slate-50 border-slate-200"
            >
              <option value="all">ALL_TIME_RECORDS</option>
              <option value="today">LAST_24_HOURS</option>
              <option value="week">LAST_7_DAYS</option>
              <option value="month">LAST_30_DAYS</option>
              <option value="custom">CUSTOM_BOUNDS</option>
            </select>
          </div>

          {datePreset === 'custom' && (
            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)}
                  className="lab-input h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">End Date</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)}
                  className="lab-input h-9 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List View */}
        <div className="lg:col-span-1 border-r border-slate-200 pr-8 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
          {filteredExperiments.length === 0 && (
            <div className="text-[10px] font-bold text-slate-400 py-24 text-center uppercase tracking-widest italic">
              {experiments.length === 0 ? "NO_RECORDS_YET. EXECUTE_IN_ARENA." : "No experiments match applied filter bounds."}
            </div>
          )}
          {filteredExperiments.map((exp) => {
            const card = testCards.find(c => c.id === exp.testCardId);
            return (
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
                    {exp.createdAt?.toDate ? exp.createdAt.toDate().toLocaleString() : new Date(exp.createdAt).toLocaleString()}
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, exp.id)} 
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-slate-900 truncate mb-1 relative z-10">
                  {card ? card.name : `EXP_${exp.id.slice(0, 8)}`}
                </h4>
                <p className="text-[9px] font-mono text-slate-400 mb-3 truncate">
                  Protocol ID: #{exp.id.slice(0, 10)}
                </p>
                <div className="flex items-center gap-2 relative z-10">
                   <div className={cn(
                     "px-2 py-0.5 text-[8px] font-bold uppercase rounded",
                     exp.verdict?.winner === 'Tie' ? "bg-slate-100 text-slate-600" : "bg-indigo-600 text-white shadow-sm"
                   )}>
                     WINNER: {exp.verdict?.winner}
                   </div>
                   <div className="text-[8px] font-bold text-slate-400">
                     CONF: {exp.verdict?.confidence ? (exp.verdict.confidence * 100).toFixed(0) : 0}%
                   </div>
                </div>
                {selectedExp?.id === exp.id && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
                )}
              </button>
            );
          })}
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
                  <h3 className="text-2xl font-bold tracking-tight text-slate-800">
                    Experiment Report: <span className="text-indigo-600">#{selectedExp.id.slice(0,8)}</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Ref Protocol ID: {selectedExp.testCardId}
                  </p>
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
                  {Object.entries(selectedExp.input || {}).map(([k, v]: [string, any]) => (
                    <div key={k} className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{k}</span>
                      <span className="text-xs text-slate-700 font-medium leading-relaxed">{v}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {['A', 'B'].map(vid => (
                  <div key={vid} className="space-y-4">
                    <div className="grid-header flex justify-between items-center">
                      <span>Variant {vid}</span>
                      {selectedExp.verdict?.winner === vid && (
                        <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[8px] font-bold shadow-sm">Winner</span>
                      )}
                    </div>
                    <div className="lab-card max-h-64 overflow-y-auto text-xs prose prose-slate prose-sm border-slate-200 bg-white">
                       <ReactMarkdown>{selectedExp.results?.[vid]}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>

              <section className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="grid-header border-slate-800 mb-6 text-slate-500">Judge Rationale</div>
                <p className="text-sm leading-relaxed font-medium text-slate-300 relative z-10 italic">
                  {selectedExp.verdict?.reasoning}
                </p>
                
                <div className="mt-10 grid grid-cols-3 gap-6 relative z-10">
                   <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                     <div className="grid-header border-transparent mb-2 text-[10px] text-slate-500">Confidence</div>
                     <div className="text-2xl font-bold text-indigo-400">
                       {selectedExp.verdict?.confidence ? (selectedExp.verdict.confidence * 100).toFixed(1) : 0}%
                     </div>
                   </div>
                   <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                     <div className="grid-header border-transparent mb-2 text-[10px] text-slate-500">Tally Distribution</div>
                     <div className="text-2xl font-bold text-white flex gap-2">
                       <span title="Variant A">{selectedExp.verdict?.majority_vote_tally?.A ?? 0}</span>
                       <span className="opacity-20">/</span>
                       <span title="Variant B">{selectedExp.verdict?.majority_vote_tally?.B ?? 0}</span>
                       <span className="opacity-20">/</span>
                       <span title="Tie" className="text-slate-500">{selectedExp.verdict?.majority_vote_tally?.Tie ?? 0}</span>
                     </div>
                   </div>
                   <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                     <div className="grid-header border-transparent mb-2 text-[10px] text-slate-500">Engine Profile</div>
                     <div className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
                       {selectedExp.verdict?.engine_version || 'JDAY_V1_PRO'}
                     </div>
                   </div>
                </div>
              </section>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-30 py-40 border-2 border-dashed border-[#141414]">
              <HistoryIcon size={48} className="mb-4 animate-pulse" />
              <p className="font-mono text-sm uppercase">No experiment selected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
