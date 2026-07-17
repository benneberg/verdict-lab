import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { evaluateResponses, runInference } from '../services/geminiService';
import { Play, Loader2, CheckCircle2, ChevronRight, FlaskConical, AlertTriangle, Radio, Bell } from 'lucide-react';
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

export function Arena() {
  const { user } = useStore();
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
    const q = query(collection(db, 'test_cards'), where('ownerId', '==', user.id), orderBy('createdAt', 'desc'));
    const unsubFirestore = onSnapshot(q, (snapshot) => {
      setTestCards(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TestCard)));
    });

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
        let renderedPrompt = variant.prompt_template;
        Object.entries(inputs).forEach(([key, val]) => {
          renderedPrompt = renderedPrompt.replace(new RegExp(`{${key}}`, 'g'), val);
        });
        
        const response = await runInference(renderedPrompt);
        results[variant.id] = response;
        setOutputs(prev => ({ ...prev, [variant.id]: response }));
      }

      setStep('EVALUATING');
      const evaluation = await evaluateResponses(
        results['A'],
        results['B'],
        selectedCard.evaluation_rubric as any,
        selectedCard.hypothesis,
        selectedJudges
      );
      
      setVerdict(evaluation);

      await addDoc(collection(db, 'experiments'), {
        testCardId: selectedCard.id,
        input: inputs,
        results: results,
        verdict: evaluation,
        ownerId: user?.id,
        createdAt: serverTimestamp(),
        judges: selectedJudges
      });

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
          let renderedPrompt = variant.prompt_template;
          Object.entries(rowInputs).forEach(([key, val]) => {
            renderedPrompt = renderedPrompt.replace(new RegExp(`{${key}}`, 'g'), String(val));
          });
          
          const response = await runInference(renderedPrompt);
          outputsMap[variant.id] = response;
        }

        setStep('EVALUATING');
        const evaluation = await evaluateResponses(
          outputsMap['A'],
          outputsMap['B'],
          selectedCard.evaluation_rubric as any,
          selectedCard.hypothesis,
          selectedJudges
        );

        const record = {
          input: rowInputs,
          results: outputsMap,
          verdict: evaluation
        };
        resultsAccumulator.push(record);
        setBatchResults([...resultsAccumulator]);

        await addDoc(collection(db, 'experiments'), {
          testCardId: selectedCard.id,
          input: rowInputs,
          results: outputsMap,
          verdict: evaluation,
          ownerId: user?.id,
          createdAt: serverTimestamp(),
          judges: selectedJudges
        });
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
                      initialInputs[k] = '';
                    });
                    setInputs(initialInputs);
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg text-[11px] font-bold transition-all duration-200 border",
                    selectedCard?.id === card.id 
                      ? "bg-indigo-600 text-white border-indigo-600" 
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{card.name.toUpperCase()}</span>
                    {selectedCard?.id === card.id && <CheckCircle2 size={14} />}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {selectedCard && (
            <>
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lab-card">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <div className="grid-header">Dataset Inputs</div>
                <div className="flex gap-1.5 p-0.5 bg-slate-100 rounded-lg border border-slate-200/50">
                  <button 
                    onClick={() => setIsBatchMode(false)}
                    className={cn(
                      "px-2.5 py-1 text-[9px] font-black uppercase tracking-tight rounded-md transition-all",
                      !isBatchMode ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Single
                  </button>
                  <button 
                    onClick={() => setIsBatchMode(true)}
                    className={cn(
                      "px-2.5 py-1 text-[9px] font-black uppercase tracking-tight rounded-md transition-all",
                      isBatchMode ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Batch
                  </button>
                </div>
              </div>

              {!isBatchMode ? (
                <div className="space-y-4">
                  {Object.keys(selectedCard.input_schema || {}).map(key => (
                    <div key={key}>
                      <label className="text-[10px] font-mono uppercase block mb-1 opacity-60">{key}</label>
                      <textarea
                        value={inputs[key] || ''}
                        onChange={(e) => setInputs(prev => ({ ...prev, [key]: e.target.value }))}
                        className="lab-input min-h-[100px] text-xs"
                        placeholder={`Enter variable value for {${key}}`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      JSON Dataset Paste (Array of Objects)
                    </label>
                    <textarea
                      value={batchRawData}
                      onChange={(e) => setBatchRawData(e.target.value)}
                      className="lab-input font-mono text-[10px] min-h-[180px]"
                      placeholder={`[\n  { "key1": "value", "key2": "value" }\n]`}
                    />
                  </div>
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[9px] font-medium text-indigo-600 leading-relaxed uppercase tracking-tight">
                    💡 Variables in your template must match JSON keys (e.g., "{Object.keys(selectedCard.input_schema || {}).join(', ')}").
                  </div>
                </div>
              )}
            </motion.section>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lab-card">
              <div className="grid-header mb-4">JDay Consensus Panel</div>
              <div className="space-y-3">
                {judgeModels.map(m => (
                  <button
                    key={m.id}
                    onClick={() => toggleJudge(m.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-[11px] font-bold",
                      selectedJudges.includes(m.id) 
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm" 
                        : "bg-white border-slate-100 text-slate-400 opacity-60 grayscale"
                    )}
                  >
                    <div className="flex flex-col items-start px-1">
                      <span>{m.name}</span>
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
                        <span className="text-[9px] font-black uppercase text-slate-400">Winner:</span>
                        <span className={cn(
                          "px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider",
                          res.verdict?.winner === 'Tie' ? "bg-slate-100 text-slate-600" : "bg-indigo-600 text-white shadow-sm"
                        )}>
                          {res.verdict?.winner === 'Tie' ? 'Equilibrium' : `Variant ${res.verdict?.winner}`}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible output / content panels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 border-b border-slate-50 bg-slate-50/10">
                      {selectedCard.variants.map((v) => (
                        <div key={v.id} className="space-y-1 bg-white p-4 rounded-xl border border-slate-100">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Variant {v.id} Response</label>
                          <div className="text-xs text-slate-700 leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar prose prose-slate prose-sm">
                            <ReactMarkdown>{res.results[v.id] || ""}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Verdict Reasoning */}
                    <div className="p-6 bg-slate-950 text-slate-300 border-t border-slate-900 flex gap-4">
                      <div className="flex-1 space-y-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 font-mono block">JDay Consensus Rationale</span>
                        <p className="text-[11px] leading-relaxed text-slate-400 italic">"{res.verdict?.reasoning}"</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 font-mono block">Confidence</span>
                        <span className="text-sm font-mono font-bold text-indigo-400">{(res.verdict?.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="lab-card bg-slate-50">
                  <div className="grid-header mb-2 text-[9px]">Hypothesis</div>
                  <p className="text-xs italic text-slate-600">"{selectedCard.hypothesis}"</p>
                </div>
                <div className="lab-card bg-slate-50">
                  <div className="grid-header mb-2 text-[9px]">Evaluation Rubric</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedCard.evaluation_rubric).map(([k, v]) => (
                      <span key={k} className="bg-white px-2 py-0.5 border border-slate-200 text-[9px] font-bold">
                        {k.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

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
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">JDay Consensus Verdict</label>
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
                       <p className="text-sm text-slate-300 leading-relaxed italic">{verdict.reasoning}</p>
                    </div>
                    <div className="p-8 border-b md:border-b-0 md:border-r border-slate-800">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Meta Analysis</label>
                       <div className="space-y-4">
                         {['A', 'B'].map(vId => (
                           <div key={vId} className="space-y-1">
                             <div className="flex justify-between text-[11px] font-bold text-slate-400">
                               <span>VARIANT_{vId}</span>
                               <span>{(verdict.confidence * 100).toFixed(0)}%</span>
                             </div>
                             <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className={cn("h-full", verdict.winner === vId ? "bg-indigo-500" : "bg-slate-600")} style={{ width: `${verdict.confidence * 100}%` }} />
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                    <div className="p-8">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Signals</label>
                       <div className="space-y-2">
                         {verdict.bias_flags?.map((f: string) => (
                           <div key={f} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase">
                              <AlertTriangle size={12} /> {f}
                           </div>
                         ))}
                         {!verdict.bias_flags?.length && (
                           <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase">
                              <CheckCircle2 size={12} /> POS_STABLE
                           </div>
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
