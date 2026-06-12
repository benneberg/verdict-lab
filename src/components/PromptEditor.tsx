import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { Info, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  knownVariables?: string[];
  label?: string;
}

export function PromptEditor({ value, onChange, placeholder, knownVariables = [], label }: PromptEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  // Sync scroll between textarea and highlight pre
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const renderHighlightedText = (text: string) => {
    // Regex to find {variable_name}
    const parts = text.split(/({[^{}]+})/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        const varName = part.slice(1, -1);
        const isValid = knownVariables.includes(varName);
        
        return (
          <span 
            key={index} 
            className={cn(
              "px-1 py-0.5 rounded-md font-bold transition-all inline-block mx-0.5",
              isValid 
                ? "bg-indigo-100 text-indigo-700 border border-indigo-200" 
                : "bg-amber-50 text-amber-600 border border-amber-200 border-dashed"
            )}
            title={isValid ? `Known variable: ${varName}` : `Unknown placeholder: ${varName}`}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const insertVariable = (varName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + `{${varName}}` + value.substring(end);
    
    onChange(newValue);
    
    // Focus back and set cursor
    setTimeout(() => {
      textarea.focus();
      const cursorPos = start + varName.length + 2;
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  return (
    <div className="space-y-2 group/editor">
      {label && (
        <div className="flex justify-between items-center px-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
          <div className="flex gap-2">
             {knownVariables.map(v => (
               <button 
                 key={v}
                 onClick={() => insertVariable(v)}
                 className="text-[9px] font-extrabold text-indigo-500 hover:text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 hover:border-indigo-300 transition-all flex items-center gap-1"
               >
                 <PlusCircle size={8} /> {v}
               </button>
             ))}
          </div>
        </div>
      )}
      
      <div className={cn(
        "relative rounded-xl border-2 transition-all duration-300 overflow-hidden bg-white shadow-inner",
        isFocused ? "border-indigo-500 ring-4 ring-indigo-500/5 shadow-lg" : "border-slate-100"
      )}>
        {/* Syntax Highlighting Layer */}
        <pre
          ref={highlightRef}
          aria-hidden="true"
          className="absolute inset-0 p-4 m-0 pointer-events-none whitespace-pre-wrap break-words text-xs font-mono text-transparent leading-relaxed custom-scrollbar overflow-auto select-none"
        >
          {renderHighlightedText(value + ' ')}
        </pre>

        {/* Editing Layer */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          spellCheck={false}
          className="relative block w-full min-h-[220px] p-4 bg-transparent border-none text-xs font-mono text-slate-700 leading-relaxed focus:ring-0 resize-none z-10 custom-scrollbar caret-indigo-600"
        />

        {/* Footer/Meta Info */}
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-4">
          <AnimatePresence>
            {value.includes('{') && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1.5 px-2 py-1 bg-white/80 backdrop-blur-md rounded-lg border border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-tight shadow-sm"
              >
                <Info size={10} className="text-indigo-500" />
                Variables Detected
              </motion.div>
            )}
          </AnimatePresence>
          <div className="text-[9px] font-mono text-slate-300 pointer-events-none">
            {value.length} CHR
          </div>
        </div>
      </div>

      <p className="text-[9px] text-slate-400 italic px-1 flex items-center gap-1">
        <Info size={10} /> Tip: Use curly braces like <code className="text-indigo-500 font-bold">{"{variable}"}</code> to designate input injection points.
      </p>
    </div>
  );
}
