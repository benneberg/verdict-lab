import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { evaluateResponses, runInference } from '../services/geminiService';
import { TEMPLATES } from '../data/templates';
import { Play, Loader2, CheckCircle2, ChevronRight, FlaskConical, AlertTriangle, Radio, Bell, Zap, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { broadcastExperimentUpdate, subscribeToExperimentUpdates, supabase } from '../lib/realtime';

interface TestCard {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  independent_variable: string;
  variants: Array<{ id: string; label: string; prompt_template: string }>;
  evaluation_rubric: Record<string, number>;
  input_schema: Record<string, any>;
}

// SEC-009: Escape regex metacharacters in user variables to prevent ReDoS
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderPromptTemplate(template: string, variableMap: Record<string, any>): string {
  let rendered = template || '';
  Object.entries(variableMap || {}).forEach(([key, val]) => {
    rendered = rendered.replace(new RegExp(`\\{${escapeRegex(key)}\\}`, 'g'), String(val ?? ''));
  });
  return rendered;
}

export function Arena() {
  const { user, mockMode, toggleMockMode } = useStore();
  const [testCards, setTestCards] = useState<TestCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<TestCard | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [verdict, setVerdict] = useState<any>(null);
  const [step, setStep] = useState<'IDLE' | 'EXECUTING' | 'EVALUATING' | 'COMPLETED'>('IDLE');
  const [selectedJudges, setSelectedJudges] = useState<string[]>(["gemini-3.5-flash"]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // High-throughput Batch Mode state variables
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchRawData, setBatchRawData] = useState<string>(`[
  { "idea": "Self-cleaning titanium water bottle with integrated purification", "constraint": "Targeting elite mountain athletes" },
  { "idea": "AI-powered hands-free kitchen cooking voice assistant", "constraint": "Works completely offline for privacy" }
]`);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [batchStep, setBatchStep] = useState<number>(0);
  const [batchTotal, setBatchTotal] = useState<number>(0);

  const judgeModels = [
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Preview)', type: 'PRO' },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', type: 'FLASH' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', type: 'LIGHTWEIGHT' }
  ];

  useEffect(() => {
    if (!user) return;
    let unsubFirestore = () => {};

    if (auth.currentUser && auth.currentUser.uid === user.id) {
      const q = query(collection(db, 'test_cards'), where('ownerId', '==', user.id), orderBy('createdAt', 'desc'));
      unsubFirestore = onSnapshot(
        q, 
        (snapshot) => {
          const cards = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TestCard));
          if (cards.length > 0) {
            setTestCards(cards);
          } else {
            setTestCards(TEMPLATES as any);
          }
        },
        (error) => {
          console.warn('Firestore test_cards snapshot permission fallback:', error.message);
          setTestCards(TEMPLATES as any);
        }
      );
    } else {
      setTestCards(TEMPLATES as any);
    }

    // Supabase Real-time Subscription
    const unsubRealtime = subscribeToExperimentUpdates(user.id, (data) => {
      setNotification({ message: `Synchronized update: ${data.protocolName} complete`, type: 'info' });
    });

    return () => {
      unsubFirestore();
      unsubRealtime();
    };
  }, [user]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleRun = async () => {
    if (!selectedCard || isRunning) return;
    
    setIsRunning(true);
    setStep('EXECUTING');
    setOutputs({});
    setVerdict(null);

    try {
      const results: Record<string, string> = {};
      
      for (const variant of selectedCard.variants) {
        const renderedPrompt = renderPromptTemplate(variant.prompt_template, inputs);
        
        const response = await runInference(renderedPrompt, undefined, undefined, { mockMode });
        results[variant.id] = response;
        setOutputs(prev => ({ ...prev, [variant.id]: response }));
      }

      setStep('EVALUATING');
      const evaluation = await evaluateResponses(
        results['A'],
        results['B'],
        selectedCard.evaluation_rubric as any,
        selectedCard.hypothesis,
        selectedJudges,
        { mockMode }
      );
      
      setVerdict(evaluation);

      if (auth.currentUser && user?.id === auth.currentUser.uid) {
        try {
          await addDoc(collection(db, 'experiments'), {
            testCardId: selectedCard.id,
            input: inputs,
            results: results,
            verdict: evaluation,
            ownerId: user?.id,
            createdAt: serverTimestamp(),
            judges: selectedJudges
          });
        } catch (dbErr) {
          console.warn('Could not persist experiment to Firestore:', dbErr);
        }
      }

      // Broadcast update via Supabase if possible
      if (user) {
        broadcastExperimentUpdate(user.id, {
          testCardId: selectedCard.id,
          protocolName: selectedCard.name,
          timestamp: Date.now()
        });
      }

      setNotification({ message: 'Experiment protocol finalized and synchronized.', type: 'success' });
      setStep('COMPLETED');
    } catch (error) {
      console.error('Experiment failed:', error);
      alert('Experiment failed. Check console for details.');
      setStep('IDLE');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunBatch = async () => {
    if (!selectedCard || isRunning) return;
    
    let parsedData: any[] = [];
    try {
      parsedData = JSON.parse(batchRawData);
      if (!Array.isArray(parsedData)) {
        throw new Error("Batch data must be a JSON array of objects.");
      }
    } catch (e: any) {
      alert(`Invalid batch JSON format: ${e.message}`);
      return;
    }

    setIsRunning(true);
    setBatchTotal(parsedData.length);
    setBatchStep(0);
    setBatchResults([]);
    setStep('EXECUTING');

    try {
      const resultsAccumulator = [];

      for (let index = 0; index < parsedData.length; index++) {
        setBatchStep(index + 1);
        const rowInputs = parsedData[index];
        
        const outputsMap: Record<string, string> = {};
        for (const variant of selectedCard.variants) {
          const renderedPrompt = renderPromptTemplate(variant.prompt_template, rowInputs);
          
          const response = await runInference(renderedPrompt, undefined, undefined, { mockMode });
          outputsMap[variant.id] = response;
        }

        setStep('EVALUATING');
        const evaluation = await evaluateResponses(
          outputsMap['A'],
          outputsMap['B'],
          selectedCard.evaluation_rubric as any,
          selectedCard.hypothesis,
          selectedJudges,
          { mockMode }
        );

        const record = {
          input: rowInputs,
          results: outputsMap,
          verdict: evaluation,
          judges: selectedJudges
        };

        resultsAccumulator.push(record);
        setBatchResults([...resultsAccumulator]);

        // Save to firestore if authenticated
        if (auth.currentUser && user?.id === auth.currentUser.uid) {
          try {
            await addDoc(collection(db, 'experiments'), {
              testCardId: selectedCard.id,
              input: rowInputs,
              results: outputsMap,
              verdict: evaluation,
              ownerId: user?.id,
              createdAt: serverTimestamp(),
              judges: selectedJudges,
              batchIndex: index
            });
          } catch (dbErr) {
            console.warn('Could not persist batch experiment to Firestore:', dbErr);
          }
        }
      }

      setStep('COMPLETED');
      setNotification({ message: `Successfully completed batch of ${parsedData.length} experiments!`, type: 'success' });
    } catch (error: any) {
      console.error("Batch failed:", error);
      alert(`Batch processing interrupted: ${error?.message || error}`);
      setStep('IDLE');
    } finally {
      setIsRunning(false);
    }
  };

  const toggleJudge = (id: string) => {
    setSelectedJudges(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id) 
        : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              "fixed top-6 left-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest border",
              notification.type === 'success' ? "bg-slate-900 text-white border-slate-800" : "bg-indigo-600 text-white border-indigo-500"
            )}
          >
            <Bell size={14} className="animate-bounce" />
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Mock Mode Banner */}
      {mockMode && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs font-mono text-amber-800">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-amber-600" />
            <span><strong>MOCK EVALUATION MODE ACTIVE</strong> — Experiments run deterministically without consuming Gemini API tokens.</span>
          </div>
          <button 
            onClick={toggleMockMode}
            className="px-2.5 py-1 bg-amber-600 text-white rounded text-[10px] font-bold uppercase cursor-pointer hover:bg-amber-700"
          >
            Switch to Live API
          </button>
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter uppercase italic">Arena</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
            <p className="text-xs font-mono opacity-60 uppercase">TEST_VARIABLES_UNDER_CONTROLLED_CONDITIONS</p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 w-fit">
              <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", supabase ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-slate-300")} />
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">
                {supabase ? 'Real-time Linked' : 'Standard Feed'}
              </span>
            </div>
          </div>
        </div>
        
        {selectedCard && (
          <button 
            onClick={isBatchMode ? handleRunBatch : handleRun}
            disabled={isRunning || (!isBatchMode && Object.keys(inputs).length === 0) || (isBatchMode && !batchRawData)}
            className={cn(
              "lab-button flex items-center justify-center gap-2 w-full sm:w-auto",
              (isRunning || (!isBatchMode && Object.keys(inputs).length === 0) || (isBatchMode && !batchRawData)) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isRunning ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
            {isBatchMode ? "EXECUTE_BATCH_PROTOCOL" : "EXECUTE_PROTOCOL"}
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <section className="lab-card">
            <div className="grid-header mb-4">Select Protocol</div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {testCards.map(card => (
                <button
                  key={card.id}
                  onClick={() => {
                    setSelectedCard(card);
                    // Autofill initial inputs schema keys
                    const initialInputs: Record<string, string> = {};
                    Object.keys(card.input_schema || {}).forEach(k => {
                      initialInputs[k] = card.input_schema[k]?.default || '';
                    });
                    setInputs(initialInputs);
                    setVerdict(null);
                    setOutputs({});
                    setBatchResults([]);
                  }}
                  className={cn(
                    "w-full text-left p-3 border transition-all text-xs font-mono flex items-center justify-between",
                    selectedCard?.id === card.id 
                      ? "border-[#141414] bg-[#141414] text-white shadow-[2px_2px_0_#141414]" 
                      : "border-[#141414]/10 hover:border-[#141414] bg-white"
                  )}
                >
                  <div className="truncate pr-2">
                    <div className="font-bold truncate">{card.name}</div>
                    <div className="text-[10px] opacity-60 truncate">{card.independent_variable}</div>
                  </div>
                  <ChevronRight size={14} className={selectedCard?.id === card.id ? "opacity-100" : "opacity-20"} />
                </button>
              ))}
            </div>
          </section>

          {selectedCard && (
            <>
              {/* Batch Mode Switcher */}
              <div className="lab-card flex items-center justify-between bg-slate-50 border-dashed">
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider">Evaluation Mode</div>
                  <div className="text-[9px] font-mono opacity-60">Toggle single or batch executions</div>
                </div>
                <div className="flex border border-[#141414] p-0.5 bg-white">
                  <button
                    onClick={() => { setIsBatchMode(false); setBatchResults([]); }}
                    className={cn(
                      "px-2.5 py-1 text-[9px] font-mono font-bold uppercase transition-all",
                      !isBatchMode ? "bg-[#141414] text-white" : "text-[#141414] hover:bg-slate-100"
                    )}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => { setIsBatchMode(true); setVerdict(null); }}
                    className={cn(
                      "px-2.5 py-1 text-[9px] font-mono font-bold uppercase transition-all",
                      isBatchMode ? "bg-[#141414] text-white" : "text-[#141414] hover:bg-slate-100"
                    )}
                  >
                    Batch (JSON)
                  </button>
                </div>
              </div>

              {!isBatchMode ? (
                /* Single Run Inputs */
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lab-card space-y-4">
                  <div className="grid-header">Inject Variables</div>
                  {Object.entries(selectedCard.input_schema || {}).map(([key, schema]: [string, any]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-mono uppercase font-bold flex justify-between">
                        <span>{key}</span>
                        <span className="opacity-40">{schema.type || 'string'}</span>
                      </label>
                      <textarea
                        value={inputs[key] || ''}
                        onChange={e => setInputs(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={schema.description || `Input value for ${key}...`}
                        className="w-full text-xs font-mono p-2 border border-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414] min-h-[60px] resize-y bg-slate-50"
                      />
                    </div>
                  ))}
                </motion.div>
              ) : (
                /* High-Throughput Batch Payload Editor */
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lab-card space-y-4 border-indigo-200 bg-indigo-50/20">
                  <div className="flex justify-between items-center">
                    <div className="grid-header text-indigo-950">JSON Batch Dataset</div>
                    <span className="text-[9px] font-mono text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded font-bold">Array format</span>
                  </div>
                  <p className="text-[10px] font-mono opacity-70">
                    Paste an array of objects matching the test variables: <code>{Object.keys(selectedCard.input_schema || {}).join(', ')}</code>
                  </p>
                  <textarea
                    value={batchRawData}
                    onChange={(e) => setBatchRawData(e.target.value)}
                    rows={8}
                    className="w-full text-[10px] font-mono p-3 border border-indigo-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y shadow-inner text-slate-800"
                    placeholder="[ { ... }, { ... } ]"
                  />
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                    <span>Variable Schema: {Object.keys(selectedCard.input_schema || {}).join(' | ')}</span>
                    <button 
                      onClick={() => {
                        const example = [
                          { idea: "Autonomous AI coffee maker with recipe learning", constraint: "Zero-latency local microcontroller" },
                          { idea: "Solar-powered drone for agricultural crop monitoring", constraint: "Must fly in high-wind conditions" }
                        ];
                        setBatchRawData(JSON.stringify(example, null, 2));
                      }}
                      className="text-indigo-600 hover:underline font-bold"
                    >
                      Reset Example
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Multi-Judge Selector Component */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lab-card space-y-3">
                <div className="flex justify-between items-center">
                  <div className="grid-header">Consensus Judges</div>
                  <span className="text-[9px] font-mono opacity-50">{selectedJudges.length} Active</span>
                </div>
                <div className="space-y-1.5">
                  {judgeModels.map(m => (
                    <button
                      key={m.id}
                      onClick={() => toggleJudge(m.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 border rounded text-xs font-mono flex items-center justify-between transition-all",
                        selectedJudges.includes(m.id)
                          ? "border-slate-800 bg-slate-900 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400"
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">{m.name}</span>
                        <span className="text-[8px] opacity-60">{m.type}</span>
                      </div>
                      {selectedJudges.includes(m.id) && <CheckCircle2 size={12} />}
                    </button>
                  ))}
                  <p className="text-[9px] font-bold text-slate-400 px-1 italic">
                    Cross-model evaluation reduces position bias and hallucination risk.
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </aside>

        <div className="lg:col-span-2 space-y-8">
            {!selectedCard ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 py-20 border-2 border-dashed border-slate-200">
                <FlaskConical size={48} className="mb-4" />
                <p className="text-sm font-bold">AWAITING_PROTOCOL_SELECTION</p>
              </div>
            ) : isBatchMode ? (
              <div className="space-y-8">
                {/* Batch Metadata Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="lab-card bg-slate-50">
                    <div className="grid-header mb-2 text-[9px]">Batch Hypothesis</div>
                    <p className="text-xs italic text-slate-600">"{selectedCard.hypothesis}"</p>
                  </div>
                  <div className="lab-card bg-slate-50">
                    <div className="grid-header mb-2 text-[9px]">Progress Status</div>
                    {isRunning ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-600">
                          <span>Running {batchStep} / {batchTotal}</span>
                          <span>{Math.round((batchStep / (batchTotal || 1)) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${(batchStep / (batchTotal || 1)) * 100}%` }} />
                        </div>
                      </div>
                    ) : batchResults.length > 0 ? (
                      <div className="text-xs font-bold text-emerald-600 flex items-center gap-2">
                        <CheckCircle2 size={14} /> Completed {batchResults.length} / {batchTotal} Experiments
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-slate-400">
                        Idle — Press 'Execute Batch Protocol' to begin.
                      </div>
                    )}
                  </div>
                </div>

                {/* Batch Results Feed */}
                <div className="space-y-6">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                    Batch Execution Queue ({batchResults.length} Finalized)
                  </div>

                  {batchResults.length === 0 && !isRunning && (
                    <div className="py-20 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl opacity-40">
                      <Radio size={32} className="mb-4 text-indigo-600 animate-pulse" />
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">BATCH_PIPELINE_STANDBY</p>
                      <p className="text-[10px] text-slate-400 mt-1">Configure your JSON array on the left and tap the execute button to run.</p>
                    </div>
                  )}

                  {isRunning && batchResults.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl">
                      <Loader2 size={32} className="mb-4 text-indigo-600 animate-spin" />
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-700">Spinning up Gemini Consensus Judges...</p>
                      <p className="text-[10px] text-slate-400 mt-1">Batch running model consensus. Please keep this tab active.</p>
                    </div>
                  )}

                  {batchResults.map((res, index) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={index}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      {/* Header */}
                      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-mono font-bold">
                            {index + 1}
                          </span>
                          <div className="text-xs font-bold text-slate-900">
                            {Object.entries(res.input).map(([k, v]) => `${k}: "${String(v).substring(0, 40)}${String(v).length > 40 ? '...' : ''}"`).join(' | ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {res.verdict?.cached && (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[8px] font-bold uppercase flex items-center gap-1">
                              <Zap size={8} /> Cached
                            </span>
                          )}
                          <span className="text-[9px] font-black uppercase text-slate-400">Winner:</span>
                          <span className={cn(
                            "px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider",
                            res.verdict?.winner === 'Tie' ? "bg-slate-100 text-slate-600" : "bg-indigo-600 text-white shadow-sm"
                          )}>
                            {res.verdict?.winner === 'Tie' ? 'Equilibrium' : `Variant ${res.verdict?.winner}`}
                          </span>
                        </div>
                      </div>

                      {/* Content Comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        {['A', 'B'].map((variantKey) => (
                          <div key={variantKey} className="p-4 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                              <span className="text-slate-500 uppercase">Output {variantKey}</span>
                              {res.verdict?.winner === variantKey && (
                                <span className="text-emerald-600 font-black">WINNER</span>
                              )}
                            </div>
                            <div className="text-xs leading-relaxed text-slate-700 bg-slate-50/50 p-3 rounded-lg border border-slate-100 max-h-48 overflow-y-auto font-sans">
                              {res.results[variantKey] || "No output"}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer Consensus Metrics */}
                      <div className="px-6 py-3 bg-slate-900 text-slate-300 text-[10px] font-mono flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-4">
                          <span>Confidence: <strong className="text-indigo-400">{Math.round((res.verdict?.confidence || 0) * 100)}%</strong></span>
                          <span>Tally: A({res.verdict?.majority_vote_tally?.A || 0}) B({res.verdict?.majority_vote_tally?.B || 0}) Tie({res.verdict?.majority_vote_tally?.Tie || 0})</span>
                        </div>
                        <div className="text-[9px] text-slate-400 truncate max-w-md italic">
                          {res.verdict?.reasoning?.substring(0, 100)}...
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Single Run Active Protocol Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="lab-card bg-slate-50">
                    <div className="grid-header mb-1 text-[9px]">Hypothesis</div>
                    <p className="text-xs italic text-slate-600">"{selectedCard.hypothesis}"</p>
                  </div>
                  <div className="lab-card bg-slate-50">
                    <div className="grid-header mb-1 text-[9px]">Independent Variable</div>
                    <p className="text-xs font-bold text-slate-900">{selectedCard.independent_variable}</p>
                  </div>
                  <div className="lab-card bg-slate-50">
                    <div className="grid-header mb-1 text-[9px]">Execution Pipeline</div>
                    <div className="flex items-center gap-2 text-xs font-bold font-mono">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        step === 'IDLE' && "bg-slate-300",
                        step === 'EXECUTING' && "bg-amber-500 animate-ping",
                        step === 'EVALUATING' && "bg-indigo-500 animate-pulse",
                        step === 'COMPLETED' && "bg-green-500"
                      )} />
                      <span className="uppercase text-[10px]">{step}</span>
                    </div>
                  </div>
                </div>

                {/* Outputs Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedCard.variants.map((v) => (
                    <div key={v.id} className={cn(
                      "flex flex-col bg-white rounded-xl border overflow-hidden transition-all duration-300",
                      outputs[v.id] ? "border-slate-200 shadow-sm" : "border-slate-100 opacity-60",
                      verdict?.winner === v.id && "ring-2 ring-indigo-500 border-indigo-500 shadow-lg shadow-indigo-100"
                    )}>
                      <div className={cn(
                        "px-4 py-3 border-b flex justify-between items-center",
                        verdict?.winner === v.id ? "bg-indigo-50/50 border-indigo-100" : "bg-slate-50 border-slate-100"
                      )}>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Variant {v.id}</span>
                        {verdict?.winner === v.id && (
                           <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold uppercase">Winner</span>
                        )}
                      </div>
                      <div className="p-6 min-h-[300px] max-h-[500px] overflow-y-auto text-sm leading-relaxed text-slate-700 prose prose-slate prose-sm max-w-none">
                        {outputs[v.id] ? (
                          <ReactMarkdown>{outputs[v.id]}</ReactMarkdown>
                        ) : (
                          <div className="h-full py-20 flex flex-col items-center justify-center opacity-20">
                            <Loader2 size={24} className={cn("mb-4", isRunning ? "animate-spin" : "opacity-0")} />
                            <p className="font-bold text-[11px] uppercase">
                              {isRunning ? 'Receiving_Data...' : 'Awaiting_Execution'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {verdict && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
                  >
                    <div className="p-8 border-b border-slate-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">JDay Consensus Verdict</label>
                            {verdict.cached && (
                              <span className="px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <Zap size={10} /> Cached (0ms Latency)
                              </span>
                            )}
                            {verdict.isMock && (
                              <span className="px-2 py-0.5 rounded bg-amber-900/80 text-amber-300 border border-amber-500/40 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <Cpu size={10} /> Simulated Offline Mode
                              </span>
                            )}
                          </div>
                          <div className="text-3xl font-bold text-white tracking-tight">
                             {verdict.winner === 'Tie' ? 'Equilibrium' : `Variant ${verdict.winner}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Inter-Rater Reliability</label>
                          <div className="text-xl font-bold text-indigo-400">
                            {((verdict.inter_rater_reliability || 0) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-slate-800">
                      <div className="p-8 border-b md:border-b-0 md:border-r border-slate-800">
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Rationale</label>
                         <p className="text-sm text-slate-300 leading-relaxed italic whitespace-pre-line">{verdict.reasoning}</p>
                      </div>
                      <div className="p-8 border-b md:border-b-0 md:border-r border-slate-800">
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Meta Analysis</label>
                         <div className="space-y-4">
                           {['A', 'B'].map(vId => (
                             <div key={vId} className="space-y-1">
                               <div className="flex justify-between text-[11px] font-bold text-slate-400">
                                 <span>VARIANT_{vId}</span>
                                 <span>{((verdict.confidence || 0) * 100).toFixed(0)}%</span>
                                </div>
                               <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                  <div className={cn("h-full", verdict.winner === vId ? "bg-indigo-500" : "bg-slate-600")} style={{ width: `${(verdict.confidence || 0) * 100}%` }} />
                               </div>
                             </div>
                           ))}
                         </div>
                      </div>
                      <div className="p-8">
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Signals & Bias Flags</label>
                         <div className="space-y-2">
                           {verdict.bias_flags?.map((f: string) => (
                             <div key={f} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase">
                                <AlertTriangle size={12} /> {f}
                             </div>
                           ))}
                           {!verdict.bias_flags?.length && (
                             <div className="text-xs font-mono text-slate-500">No bias anomalies detected.</div>
                           )}
                         </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
