import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { Search, Globe, Download, User, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function Registry() {
  const { user } = useStore();
  const [cards, setCards] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [importedIds, setImportedIds] = useState<string[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'test_cards'), 
      where('isPublic', '==', true)
    );
    return onSnapshot(q, (snapshot) => {
      setCards(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleImport = async (card: any) => {
    if (!user) return;
    try {
      const { id, ownerId, createdAt, ...rest } = card;
      await addDoc(collection(db, 'test_cards'), {
        ...rest,
        ownerId: user.id,
        parentCardId: id,
        createdAt: serverTimestamp(),
        version: 1,
        isPublic: false // Personal copy is private by default
      });
      setImportedIds(prev => [...prev, id]);
    } catch (e) {
      console.error('Failed to import card:', e);
    }
  };

  const filteredCards = cards.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                         c.hypothesis.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || c.independent_variable === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter uppercase italic">Protocol Registry</h2>
          <p className="text-xs font-mono opacity-60">BROWSE_AND_IMPORT_COMMUNITY_EXPERIMENTAL_PROTOCOLS</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-4">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search experiments..."
              className="lab-input pl-10 h-[42px]"
             />
          </div>
          <select 
            value={category} onChange={e => setCategory(e.target.value)}
            className="lab-input w-40 h-[42px] appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%20viewBox%3D%270%200%2020%2020%27%3E%3Cpath%20stroke%3D%27%236b7280%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%271.5%27%20d%3D%27m6%208%204%204%204-4%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
          >
            <option value="all">ALL_VARIABLES</option>
            {['prompt', 'model', 'role', 'reasoning_strategy', 'parameter'].map(v => (
              <option key={v} value={v}>{v.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCards.map(card => (
          <motion.div 
            layout
            key={card.id}
            className="group lab-card hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/5 bg-white overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                    <User size={14} />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-800 tracking-tight">{card.authorName || 'Anonymous'}</span>
                   <span className="text-[8px] text-slate-400 font-mono italic">PUBLISHED_ON: {card.createdAt?.toDate().toLocaleDateString()}</span>
                 </div>
               </div>
               <div className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                 ID: {card.id.slice(0, 6)}
               </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2 truncate">
              {card.name}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed italic mb-6 line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
               "{card.hypothesis}"
            </p>

            <div className="space-y-4 mb-8 flex-1">
               <div className="flex flex-wrap gap-2">
                 <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-bold uppercase rounded">
                   {card.independent_variable}
                 </span>
                 <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-bold uppercase rounded">
                   {card.variants.length} VARIANTS
                 </span>
               </div>
               <div className="border-t border-dashed border-slate-200 pt-4">
                 <label className="text-[9px] font-bold text-slate-400 uppercase mb-2 block">Rubric Metrics</label>
                 <div className="flex flex-wrap gap-1.5 focus-within:">
                   {Object.keys(card.evaluation_rubric).map(m => (
                     <span key={m} className="px-1.5 py-0.5 bg-slate-50 text-[9px] font-medium text-slate-600 border border-slate-200 rounded">
                       {m}
                     </span>
                   ))}
                 </div>
               </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
               {importedIds.includes(card.id) ? (
                 <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 text-green-600 text-xs font-bold border border-green-200 shadow-sm transition-all" disabled>
                   <CheckCircle2 size={16} /> DATA_ACQUIRED
                 </button>
               ) : (
                 <button 
                  onClick={() => handleImport(card)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-lg hover:shadow-indigo-500/20 group/btn"
                 >
                   <Download size={16} className="group-hover/btn:translate-y-0.5 transition-transform" /> 
                   IMPORT_PROTOCOL
                 </button>
               )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {filteredCards.length === 0 && (
        <div className="text-center py-40 opacity-20">
          <Globe size={64} className="mx-auto mb-4" />
          <h3 className="text-xl font-bold uppercase tracking-widest">Global silence. No protocols match.</h3>
        </div>
      )}
    </div>
  );
}
