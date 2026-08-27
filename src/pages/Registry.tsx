import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { TEMPLATES } from '../data/templates';
import { Search, Globe, Download, User, Info, CheckCircle2, Eye, Flame, Award, Cpu, X, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function Registry() {
  const { user } = useStore();
  const [cards, setCards] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [previewCard, setPreviewCard] = useState<any | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'test_cards'), 
      where('isPublic', '==', true)
    );

    const defaultTemplates = TEMPLATES.map(t => ({
      ...t,
      isPublic: true,
      downloads: 124,
      authorName: 'Verdict Core Research'
    }));

    return onSnapshot(
      q, 
      (snapshot) => {
        const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const combined: any[] = [...defaultTemplates];
        fetched.forEach(f => {
          if (!combined.some(c => c.id === f.id)) {
            combined.push(f);
          }
        });
        setCards(combined);
      },
      (error) => {
        console.warn('Firestore registry query error, using curated library templates:', error.message);
        setCards(defaultTemplates);
      }
    );
  }, []);

  const handleImport = async (card: any) => {
    if (!user) return;
    try {
      const { id, ownerId, createdAt, downloads, ...rest } = card;
      
      if (auth.currentUser && auth.currentUser.uid === user.id) {
        // Save deep copy to active user's cards in Firestore
        await addDoc(collection(db, 'test_cards'), {
          ...rest,
          ownerId: user.id,
          parentCardId: id,
          createdAt: serverTimestamp(),
          version: 1,
          isPublic: false
        });

        // Update downloads count in source document for real-time popularity if public
        try {
          await updateDoc(doc(db, 'test_cards', id), {
            downloads: (downloads || 0) + 1
          });
        } catch (err) {
          console.warn('Could not increment downloads (likely security rules/ownership limit)', err);
        }
      }

      setImportedIds(prev => [...prev, id]);
    } catch (e) {
      console.error('Failed to import card:', e);
    }
  };

  const exportJSON = (card: any) => {
    const cleanCard = {
      name: card.name,
      description: card.description,
      hypothesis: card.hypothesis,
      independent_variable: card.independent_variable,
      variants: card.variants,
      evaluation_rubric: card.evaluation_rubric,
      input_schema: card.input_schema || {}
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanCard, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `protocol_${card.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const filteredCards = cards.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.hypothesis.toLowerCase().includes(search.toLowerCase()) ||
                          (c.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || c.independent_variable === category;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats for top HUD
  const totalProtocols = cards.length;
  const popularProtocol = cards.reduce((prev, current) => {
    return ((prev?.downloads || 0) > (current?.downloads || 0)) ? prev : current;
  }, null);
  const totalDownloads = cards.reduce((sum, current) => sum + (current.downloads || 0), 0);

  return (
    <div className="space-y-8 pb-20">
      {/* Marketplace Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter uppercase italic">Prompt Marketplace</h2>
          <p className="text-xs font-mono opacity-60">ACQUIRE_VERIFIED_BEHAVIORAL_TEMPLATES_FROM_THE_COMMUNITY</p>
        </div>

        <div className="flex w-full md:w-auto gap-4">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search public templates..."
              className="lab-input pl-10 h-[42px] text-xs"
             />
          </div>
          <select 
            value={category} onChange={e => setCategory(e.target.value)}
            className="lab-input w-44 h-[42px] text-xs appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%20viewBox%3D%270%200%2020%2020%27%3E%3Cpath%20stroke%3D%27%236b7280%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%271.5%27%20d%3D%27m6%208%204%204%204-4%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
          >
            <option value="all">ALL_VARIABLES</option>
            {['prompt', 'model', 'role', 'reasoning_strategy', 'parameter'].map(v => (
              <option key={v} value={v}>{v.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Top HUD Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Shared Recipes</div>
            <div className="text-2xl font-extrabold text-slate-900">{totalProtocols} Protocols</div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Flame size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Trending Protocol</div>
            <div className="text-sm font-extrabold text-slate-900 truncate" title={popularProtocol?.name || 'None'}>
              {popularProtocol ? popularProtocol.name : 'Awaiting imports'}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Award size={20} />
          </div>
          <div>
            <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Marketplace Imports</div>
            <div className="text-2xl font-extrabold text-slate-900">{totalDownloads} Imports</div>
          </div>
        </div>
      </section>

      {/* Grid of Shared Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCards.map(card => {
          const isImported = importedIds.includes(card.id);
          return (
            <motion.div 
              layout
              key={card.id}
              className="group bg-white border border-slate-200 hover:border-indigo-500/50 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col h-full justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 text-[10px] font-extrabold uppercase">
                      {card.authorName ? card.authorName.slice(0, 2) : 'AN'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-extrabold text-slate-800 tracking-tight">{card.authorName || 'Anonymous'}</span>
                      <span className="text-[8px] text-slate-400 font-mono">
                        {card.createdAt?.toDate ? card.createdAt.toDate().toLocaleDateString() : 'Awaiting date'}
                      </span>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[8px] font-bold text-slate-400 font-mono">
                    #{card.id.slice(0, 6)}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2 hover:text-indigo-600 transition-colors line-clamp-1">
                  {card.name}
                </h3>
                
                <p className="text-[11px] text-slate-500 line-clamp-2 mb-4 leading-relaxed h-8">
                  {card.description || 'No description provided.'}
                </p>

                <div className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 line-clamp-2 h-14">
                  "{card.hypothesis}"
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-bold uppercase rounded-md tracking-wider">
                    {card.independent_variable}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold uppercase rounded-md">
                    {card.variants?.length || 0} VARIANTS
                  </span>
                  {card.downloads > 0 && (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold uppercase rounded-md flex items-center gap-1">
                      <Flame size={10} /> {card.downloads} IMPORTS
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex gap-3">
                <button 
                  onClick={() => setPreviewCard(card)}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
                  title="Preview layout details"
                >
                  <Eye size={14} /> Preview
                </button>

                {isImported ? (
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-200 shadow-sm" disabled>
                    <CheckCircle2 size={14} /> IMPORTED
                  </button>
                ) : (
                  <button 
                    onClick={() => handleImport(card)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-all hover:shadow-lg hover:shadow-indigo-500/15"
                  >
                    <Download size={14} />
                    IMPORT_CARD
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center py-40 bg-slate-50 border border-slate-200 border-dashed rounded-3xl opacity-60">
          <Globe size={48} className="mx-auto mb-4 text-slate-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">No shared templates matched your criteria.</h3>
          <p className="text-xs text-slate-400">Try modifying your search or independent variable filter preset.</p>
        </div>
      )}

      {/* Preview Modal Overlay */}
      <AnimatePresence>
        {previewCard && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Community Protocol Specs</div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight mt-1 truncate max-w-md">
                    {previewCard.name}
                  </h3>
                </div>
                <button 
                  onClick={() => setPreviewCard(null)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 max-h-[calc(90vh-160px)] custom-scrollbar">
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Theoretical Hypothesis</label>
                  <div className="bg-indigo-50/50 border border-indigo-100 text-indigo-950 p-4 rounded-xl text-xs italic font-semibold leading-relaxed">
                    "{previewCard.hypothesis}"
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Independent Variable</label>
                    <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 capitalize">
                      {previewCard.independent_variable}
                    </span>
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Author Contributor</label>
                    <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                      {previewCard.authorName || 'Anonymous'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-3">Experimental Prompt Variants</label>
                  <div className="space-y-4">
                    {previewCard.variants?.map((v: any) => (
                      <div key={v.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">Variant {v.id}: {v.label}</span>
                        </div>
                        <pre className="text-[11px] font-mono whitespace-pre-wrap text-slate-700 leading-relaxed bg-white border border-slate-100 rounded-lg p-3 custom-scrollbar max-h-32 overflow-y-auto">
                          {v.prompt_template}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-3">Evaluation Rubric Scheme</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(previewCard.evaluation_rubric || {}).map(([metricName, config]: [string, any]) => (
                      <div key={metricName} className="p-3 bg-white border border-slate-150 rounded-xl flex justify-between items-center shadow-sm">
                        <span className="text-xs font-semibold text-slate-800 capitalize">{metricName}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-400 uppercase font-mono">Max:</span>
                          <span className="text-xs font-bold text-indigo-600">{config.max}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-mono ml-1">W:</span>
                          <span className="text-xs font-bold text-slate-700">{config.weight || 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
                <button 
                  onClick={() => exportJSON(previewCard)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-400 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Download size={14} /> EXPORT_JSON
                </button>

                {importedIds.includes(previewCard.id) ? (
                  <button className="flex-1 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-2" disabled>
                    <CheckCircle2 size={16} /> DATA_PORTED_SUCCESSFULLY
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      handleImport(previewCard);
                      setPreviewCard(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-slate-900 text-white text-xs font-extrabold transition-all"
                  >
                    ACQUIRE & IMPORT INSTANTLY
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
