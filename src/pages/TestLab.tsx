import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, where, orderBy, deleteDoc, doc, serverTimestamp, updateDoc, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Save, X, FlaskConical, Quote, Share2, History, ChevronUp, ChevronDown, GripVertical, Library, CheckCircle2, Edit3, Code } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { TEMPLATES, TestCardTemplate } from '../data/templates';
import { PromptEditor } from '../components/PromptEditor';

interface RubricMetric {
  id: string;
  name: string;
  max: number;
  weight: number;
}

function DiffLines({ legacy, current }: { legacy: string; current: string }) {
  const legacyLines = (legacy || "").split('\n');
  const currentLines = (current || "").split('\n');
  
  const diffs = [];
  let i = 0;
  let j = 0;
  
  while (i < legacyLines.length || j < currentLines.length) {
    const lLine = legacyLines[i];
    const cLine = currentLines[j];
    
    if (lLine === cLine) {
      diffs.push({ type: 'unchanged', text: lLine, lineNum: i + 1 });
      i++;
      j++;
    } else {
      if (lLine !== undefined && (cLine === undefined || !currentLines.slice(j).includes(lLine))) {
        diffs.push({ type: 'removed', text: lLine, lineNum: i + 1 });
        i++;
      } else if (cLine !== undefined && (lLine === undefined || !legacyLines.slice(i).includes(cLine))) {
        diffs.push({ type: 'added', text: cLine, lineNum: j + 1 });
        j++;
      } else {
        diffs.push({ type: 'removed', text: lLine, lineNum: i + 1 });
        diffs.push({ type: 'added', text: cLine, lineNum: j + 1 });
        i++;
        j++;
      }
    }
  }

  return (
    <div className="font-mono text-[10px] leading-relaxed border border-slate-200 rounded-xl overflow-hidden bg-slate-950 text-slate-100 shadow-inner w-full">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-[9px] font-black uppercase text-slate-500 tracking-wider">
        Interactive Line-by-Line Code Diff
      </div>
      <div className="p-4 max-h-[350px] overflow-y-auto custom-scrollbar space-y-0.5">
        {diffs.map((d, idx) => (
          <div 
            key={idx} 
            className={cn(
              "flex gap-4 px-2 py-0.5 font-mono",
              d.type === 'added' ? "bg-emerald-950/70 text-emerald-400 border-l-4 border-emerald-500" :
              d.type === 'removed' ? "bg-rose-950/70 text-rose-400 border-l-4 border-rose-500 line-through" :
              "text-slate-400 opacity-80"
            )}
          >
            <span className="w-8 select-none text-slate-600 text-right">{d.lineNum}</span>
            <span className="select-none w-3 text-center">{d.type === 'added' ? '+' : d.type === 'removed' ? '-' : ' '}</span>
            <span className="whitespace-pre-wrap break-all">{d.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TestLab() {
  const { user } = useStore();
  const [testCards, setTestCards] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [comparingWith, setComparingWith] = useState<any | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [independentVar, setIndependentVar] = useState('prompt');
  const [rubric, setRubric] = useState<RubricMetric[]>([
    { id: '1', name: 'clarity', max: 10, weight: 1 },
    { id: '2', name: 'accuracy', max: 10, weight: 1 }
  ]);
  const [variants, setVariants] = useState<{ id: string; label: string; prompt_template: string }[]>([
    { id: 'A', label: 'Zero Shot', prompt_template: '' },
    { id: 'B', label: 'Few Shot', prompt_template: '' }
  ]);
  const [inputVariables, setInputVariables] = useState<string[]>(['idea']);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (!user) return;
    let unsub = () => {};

    if (auth.currentUser && auth.currentUser.uid === user.id) {
      const q = query(collection(db, 'test_cards'), where('ownerId', '==', user.id), orderBy('createdAt', 'desc'));
      unsub = onSnapshot(
        q, 
        (snapshot) => {
          const cards = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          if (cards.length > 0) {
            setTestCards(cards);
          } else {
            setTestCards(TEMPLATES as any);
          }
        },
        (err) => {
          console.warn('Firestore test_cards listener fallback:', err.message);
          setTestCards(TEMPLATES as any);
        }
      );
    } else {
      setTestCards(TEMPLATES as any);
    }
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!showHistory || !user) return;
    let unsub = () => {};

    if (auth.currentUser && auth.currentUser.uid === user.id) {
      const q = query(
        collection(db, 'test_card_versions'), 
        where('testCardId', '==', showHistory),
        where('ownerId', '==', user.id),
        orderBy('version', 'desc')
      );
      unsub = onSnapshot(
        q, 
        (snap) => {
          setVersions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        },
        (err) => {
          console.warn('Firestore test_card_versions listener fallback:', err.message);
          setVersions([]);
        }
      );
    }
    return unsub;
  }, [showHistory, user]);

  const handleSave = async () => {
    if (!name || !hypothesis) return;

    try {
      const rubricObj = rubric.reduce((acc, r) => ({ 
        ...acc, 
        [r.name]: { max: r.max, weight: r.weight } 
      }), {});
      
      const inputSchema = inputVariables.reduce((acc, v) => ({ ...acc, [v]: 'string' }), {});

      const cardData: any = {
        name,
        description,
        hypothesis,
        independent_variable: independentVar,
        variants,
        evaluation_rubric: rubricObj,
        input_schema: inputSchema,
        ownerId: user?.id,
        authorName: user?.email?.split('@')[0] || 'Unknown',
        isPublic,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        // Increment version and save
        const currentCard = testCards.find(c => c.id === editingId);
        const newVersion = (currentCard?.version || 1) + 1;
        
        // Save current card's state to versions collection first before making updates
        if (currentCard) {
          await addDoc(collection(db, 'test_card_versions'), {
            testCardId: editingId,
            version: currentCard.version || 1,
            ownerId: user?.id,
            data: {
              name: currentCard.name,
              description: currentCard.description || '',
              hypothesis: currentCard.hypothesis,
              independent_variable: currentCard.independent_variable,
              variants: currentCard.variants,
              evaluation_rubric: currentCard.evaluation_rubric,
              input_schema: currentCard.input_schema || {},
              isPublic: currentCard.isPublic || false,
            },
            createdAt: serverTimestamp()
          });
        }

        await updateDoc(doc(db, 'test_cards', editingId), {
          ...cardData,
          version: newVersion
        });
      } else {
        await addDoc(collection(db, 'test_cards'), {
          ...cardData,
          version: 1,
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
    } catch (error) {
      console.error('Failed to save test card:', error);
    }
  };

  const handleSelectTemplate = (template: TestCardTemplate) => {
    setName(template.name);
    setDescription(template.description);
    setHypothesis(template.hypothesis);
    setIndependentVar(template.independent_variable);
    setVariants(template.variants);
    
    const rubricArr = Object.entries(template.evaluation_rubric).map(([name, config], idx) => ({
      id: Math.random().toString(),
      name,
      max: config.max,
      weight: config.weight
    }));
    setRubric(rubricArr);
    
    const placeholders = Object.keys(template.input_schema);
    setInputVariables(placeholders);
    
    setShowTemplates(false);
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setDescription('');
    setHypothesis('');
    setRubric([{ id: '1', name: 'clarity', max: 10, weight: 1 }, { id: '2', name: 'accuracy', max: 10, weight: 1 }]);
    setVariants([
      { id: 'A', label: 'Variant A', prompt_template: '' },
      { id: 'B', label: 'Variant B', prompt_template: '' }
    ]);
    setIsPublic(false);
  };

  const handleEdit = (card: any) => {
    setEditingId(card.id);
    setName(card.name);
    setDescription(card.description || '');
    setHypothesis(card.hypothesis);
    setIndependentVar(card.independent_variable);
    setIsPublic(card.isPublic || false);
    setVariants(card.variants);
    
    // Convert rubric object back to array for UI
    const rubricArr = Object.entries(card.evaluation_rubric).map(([name, config]: [string, any], idx) => ({
      id: String(idx),
      name,
      max: config.max,
      weight: config.weight || 1
    }));
    setRubric(rubricArr);
    setIsAdding(true);
  };

  const handleRevert = async (versionData: any) => {
    if (!editingId) return;
    
    setName(versionData.name || '');
    setDescription(versionData.description || '');
    setHypothesis(versionData.hypothesis || '');
    setIndependentVar(versionData.independent_variable || 'prompt');
    setIsPublic(versionData.isPublic || false);
    setVariants(versionData.variants || []);
    
    // Rubric handling
    const rubricArr = Object.entries(versionData.evaluation_rubric || {}).map(([metricName, config]: [string, any], idx) => ({
      id: String(idx) + Math.random().toString(),
      name: metricName,
      max: config.max ?? 10,
      weight: config.weight ?? 1
    }));
    setRubric(rubricArr);
    
    // Input Schema handling
    const placeholders = Object.keys(versionData.input_schema || {});
    setInputVariables(placeholders.length > 0 ? placeholders : ['idea']);
    
    setShowHistory(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently decommission this protocol?')) {
      await deleteDoc(doc(db, 'test_cards', id));
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter uppercase italic">Test Lab</h2>
          <p className="text-xs font-mono opacity-60 uppercase">DESIGN_REPRODUCIBLE_EXPERIMENTAL_PROTOCOLS</p>
        </div>
        {!isAdding && !showTemplates && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setShowTemplates(true)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all text-xs font-bold uppercase tracking-tight flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
            >
              <Library size={16} />
              BROWSE_TEMPLATES
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              className="lab-button flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus size={16} />
              CREATE_NEW_PROTOCOL
            </button>
          </div>
        )}
      </header>

      <AnimatePresence>
        {showTemplates && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6 mb-12"
          >
            <div className="flex justify-between items-center mb-6">
               <div>
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                   <Library size={14} className="text-indigo-500" />
                   Protocol Blueprint Library
                 </h3>
                 <p className="text-[10px] text-slate-400 font-medium">SELECT_A_BLUEPRINT_TO_FAST_TRACK_RESEARCH</p>
               </div>
               <button onClick={() => setShowTemplates(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEMPLATES.map((template) => (
                <div 
                  key={template.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-400 transition-all group flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase rounded tracking-widest border border-indigo-100">
                      {template.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">{template.name}</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-6 flex-1 line-clamp-3 italic">"{template.description}"</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex -space-x-2">
                      {template.variants.map((v, i) => (
                        <div key={v.id} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-400">
                          {v.id}
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => handleSelectTemplate(template)}
                      className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      SELECT_PROTOCOL <ChevronUp size={12} className="rotate-90" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="md:col-span-2 lg:col-span-3 lab-card border-indigo-500/30 bg-white p-4 sm:p-6 lg:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="flex justify-between mb-8 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h3 className="text-xl font-bold uppercase tracking-tight text-slate-800">
                    {editingId ? 'Modify Protocol' : 'Protocol Configuration'}
                  </h3>
                  {editingId && (
                    <button 
                      onClick={() => setShowHistory(editingId)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-[10px] font-bold uppercase w-fit"
                    >
                      <History size={12} /> View Versions
                    </button>
                  )}
                </div>
                <button 
                  onClick={resetForm} 
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative z-10">
                <div className="space-y-6">
                  <div className="grid-header">Basic Definitions</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Protocol Name</label>
                      <input 
                        value={name} onChange={e => setName(e.target.value)}
                        className="lab-input" placeholder="e.g. PRD_GENERATOR_V1" 
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={cn(
                          "w-10 h-5 rounded-full transition-all relative border",
                          isPublic ? "bg-indigo-600 border-indigo-600" : "bg-slate-100 border-slate-200"
                        )}>
                          <div className={cn(
                            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                            isPublic ? "left-5.5" : "left-0.5"
                          )} />
                        </div>
                        <input 
                          type="checkbox" className="hidden"
                          checked={isPublic} onChange={e => setIsPublic(e.target.checked)}
                        />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Public Registry</span>
                          <span className="text-[8px] text-slate-400 italic">Allow others to import this protocol</span>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Hypothesis</label>
                    <textarea 
                      value={hypothesis} onChange={e => setHypothesis(e.target.value)}
                      className="lab-input min-h-[80px] font-medium italic text-slate-600" 
                      placeholder="e.g. Few-shot prompting improves structural cohesion..." 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Independent Variable</label>
                      <select 
                        value={independentVar} onChange={e => setIndependentVar(e.target.value)}
                        className="lab-input h-[42px] font-semibold text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%20viewBox%3D%270%200%2020%2020%27%3E%3Cpath%20stroke%3D%27%236b7280%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%271.5%27%20d%3D%27m6%208%204%204%204-4%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                      >
                        {['prompt', 'model', 'role', 'reasoning_strategy', 'parameter'].map(v => (
                          <option key={v} value={v}>{v.toUpperCase()}</option>
                        ))}
                      </select>
                      <div className="mt-2 text-[9px] text-indigo-600 font-bold leading-relaxed uppercase tracking-widest bg-indigo-50 border border-indigo-100/60 p-1.5 rounded-lg">
                        {independentVar === 'parameter' && "⚡ Custom Parameters: Temperature range [0.0 - 1.0], top_p, top_k, max_tokens."}
                        {independentVar === 'model' && "🧠 Contender Models: gemini-3.5-flash vs gemini-3.1-pro-preview."}
                        {independentVar === 'role' && "👤 Personas: Specific float temperature system behaviors and instruction sets."}
                        {independentVar === 'reasoning_strategy' && "🔍 Reasoning Levels: Low (low latency) vs High (high analytical logic)."}
                        {independentVar === 'prompt' && "✍️ Template Variations: Structured variants of instruction formatting."}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Input Placeholders</label>
                      <input 
                        value={inputVariables.join(',')} 
                        onChange={e => setInputVariables(e.target.value.split(',').map(s => s.trim()))}
                        className="lab-input" placeholder="idea, constraint..." 
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid-header flex justify-between items-center">
                      <span>Evaluation Rubric (Weighted)</span>
                      <button 
                        onClick={() => setRubric([...rubric, { id: Math.random().toString(), name: '', max: 10, weight: 1 }])} 
                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                      >
                        + ADD_METRIC
                      </button>
                    </div>

                    <Reorder.Group axis="y" values={rubric} onReorder={setRubric} className="space-y-2">
                      {rubric.map((r, i) => (
                        <Reorder.Item key={r.id} value={r} className="flex gap-2 group/metric items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="cursor-grab active:cursor-grabbing text-slate-300">
                            <GripVertical size={14} />
                          </div>
                          <input 
                            value={r.name} 
                            onChange={e => {
                              const newR = [...rubric];
                              newR[i].name = e.target.value;
                              setRubric(newR);
                            }}
                            className="lab-input text-[11px] font-bold uppercase tracking-tight flex-1" placeholder="Metric" 
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] font-bold text-slate-400">MAX</span>
                            <input 
                              type="number" value={r.max} 
                              onChange={e => {
                                const newR = [...rubric];
                                newR[i].max = Number(e.target.value);
                                setRubric(newR);
                              }}
                              className="lab-input w-14 text-[11px] font-bold" 
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] font-bold text-slate-400">WEIGHT</span>
                            <input 
                              type="number" value={r.weight} 
                              onChange={e => {
                                const newR = [...rubric];
                                newR[i].weight = Number(e.target.value);
                                setRubric(newR);
                              }}
                              className="lab-input w-14 text-[11px] font-bold" 
                            />
                          </div>
                          <button 
                            onClick={() => setRubric(rubric.filter((_, idx) => idx !== i))} 
                            className="text-slate-300 hover:text-red-500 transition-colors px-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="grid-header">Variant Definitions</div>
                    <div className="space-y-12">
                      {variants.map((v, i) => (
                        <PromptEditor 
                          key={v.id}
                          label={`Variant ${v.id}: ${v.label}`}
                          value={v.prompt_template}
                          knownVariables={inputVariables}
                          onChange={(val) => {
                            const newV = [...variants];
                            newV[i].prompt_template = val;
                            setVariants(newV);
                          }}
                          placeholder={`Enter baseline prompt for ${v.label}...`}
                        />
                      ))}
                    </div>
                  
                  <div className="pt-4 flex flex-col gap-3">
                    <button onClick={handleSave} className="lab-button flex-1 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 py-3 text-xs uppercase font-extrabold tracking-widest">
                      <Save size={16} />
                      {editingId ? 'COMMIT_CHANGES_AND_INCREMENT_VERSION' : 'CREATE_PROTOCOL'}
                    </button>
                    <button 
                      onClick={resetForm} 
                      className="w-full py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all uppercase tracking-widest"
                    >
                      Discard & Exit
                    </button>
                  </div>
                </div>
              </div>

              {/* Version History Sidebar */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div 
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    className="absolute inset-y-0 right-0 w-80 bg-slate-900 shadow-2xl z-50 p-6 flex flex-col border-l border-slate-800"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <h4 className="text-sm font-bold text-white uppercase tracking-widest">Version History</h4>
                      <button onClick={() => setShowHistory(null)} className="text-slate-500 hover:text-white"><X size={18} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                      {versions.map((v) => (
                        <div key={v.id} className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-indigo-400">VERSION {v.version}</span>
                            <span className="text-[9px] text-slate-500">{v.createdAt?.toDate().toLocaleDateString()}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2 italic">"{v.data.hypothesis}"</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => handleRevert(v.data)}
                              className="py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-[10px] font-bold text-white transition-all uppercase"
                            >
                              Restore
                            </button>
                            <button 
                              onClick={() => setComparingWith(v.data)}
                              className="py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white transition-all uppercase"
                            >
                              Compare
                            </button>
                          </div>
                        </div>
                      ))}
                      {versions.length === 0 && (
                        <div className="text-center py-20 opacity-30">
                          <History size={32} className="mx-auto mb-2" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">No versions found</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {testCards.map((card) => (
            <motion.div 
              layout
              key={card.id} 
              className="lab-card group relative hover:border-indigo-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5 text-[8px] font-bold uppercase rounded tracking-widest">
                    V{card.version || 1}
                  </div>
                  {card.isPublic && (
                    <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 text-[8px] font-bold uppercase rounded tracking-widest flex items-center gap-1">
                      <Share2 size={8} /> Public
                    </div>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(card)} className="text-slate-300 hover:text-indigo-600 transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(card.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <h3 className="text-[17px] font-bold text-slate-900 mb-1 truncate leading-tight">
                {card.name}
              </h3>
              <p className="text-[11px] font-medium text-slate-400 mb-6 h-8 line-clamp-2 overflow-hidden italic leading-relaxed">
                {card.description || 'No description provided.'}
              </p>

              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 italic text-[11px] font-medium text-slate-600 leading-relaxed shadow-inner">
                  <Quote size={12} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-3">{card.hypothesis}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Variable</div>
                  <div className="text-[10px] font-bold text-slate-700 mt-0.5">{card.independent_variable.toUpperCase()}</div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Weights Applied</div>
                  <div className="text-[10px] font-bold text-slate-700 mt-0.5">
                    {Object.values(card.evaluation_rubric).some((r: any) => r.weight > 1) ? 'COMPLEX' : 'STANDARD'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Comparison Modal */}
      <AnimatePresence>
        {comparingWith && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Protocol Auditor</div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight mt-1">Comparison: Current draft vs Version Registry</h3>
                </div>
                <button 
                  onClick={() => setComparingWith(null)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                <div className="space-y-8">
                  {/* Metadata Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">Legacy Hypothesis</div>
                      <p className="text-xs text-slate-500 italic leading-relaxed font-medium">"{comparingWith.hypothesis}"</p>
                    </div>
                    <div className={cn(
                      "p-4 rounded-xl border",
                      hypothesis !== comparingWith.hypothesis ? "bg-indigo-50/50 border-indigo-100 text-indigo-950" : "bg-slate-50 border-slate-200"
                    )}>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">Current Draft Hypothesis</div>
                      <p className={cn(
                        "text-xs leading-relaxed font-medium",
                        hypothesis !== comparingWith.hypothesis ? "font-bold text-indigo-700" : "text-slate-500 italic"
                      )}>
                        "{hypothesis}"
                      </p>
                    </div>
                  </div>

                  {/* Code Diff Row */}
                  <div className="space-y-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-2">
                      <Code size={12} /> Prompt Template Line-by-Line Code Diff
                    </div>
                    {variants.map((v, i) => {
                      const legacyV = comparingWith.variants?.find((lv: any) => lv.id === v.id) || comparingWith.variants?.[i];
                      const isChanged = v.prompt_template !== legacyV?.prompt_template;
                      return (
                        <div key={v.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-extrabold uppercase text-slate-700 tracking-wider">
                              Variant {v.id}: {v.label} Comparison
                            </span>
                            {isChanged ? (
                              <span className="px-2 py-0.5 bg-indigo-100 border border-indigo-200 rounded text-[9px] font-black text-indigo-700 uppercase tracking-widest">
                                MODIFIED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                UNCHANGED
                              </span>
                            )}
                          </div>
                          <DiffLines legacy={legacyV?.prompt_template || ""} current={v.prompt_template} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
                <button 
                  onClick={() => setComparingWith(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-bold transition-all uppercase tracking-widest"
                >
                  Close Auditor
                </button>
                <button 
                  onClick={() => {
                    handleRevert(comparingWith);
                    setComparingWith(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-slate-900 text-white text-xs font-extrabold transition-all shadow-lg shadow-indigo-200 uppercase tracking-widest"
                >
                  Overwrite Draft with This version
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
