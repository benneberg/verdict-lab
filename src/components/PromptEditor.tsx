import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { Info, PlusCircle, Eye, Edit3, AlertTriangle, CheckCircle2, Sparkles, RefreshCw, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  knownVariables?: string[];
  label?: string;
}

interface LintIssue {
  type: 'info' | 'warning' | 'success';
  message: string;
}

export function PromptEditor({ value, onChange, placeholder, knownVariables = [], label }: PromptEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'simulate'>('edit');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  // Simulation state
  const [mockValues, setMockValues] = useState<Record<string, string>>({});

  // Parse variables from the template string: anything matching {variable_name}
  const detectVariables = (text: string): string[] => {
    const regex = /\{([^{}]+)\}/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }
    return Array.from(new Set(matches));
  };

  const detectedVars = detectVariables(value);

  // Initialize mock values for newly detected variables
  useEffect(() => {
    setMockValues((prev) => {
      const next = { ...prev };
      let updated = false;
      detectedVars.forEach((v) => {
        if (next[v] === undefined) {
          next[v] = `[${v.toUpperCase()}_VALUE]`;
          updated = true;
        }
      });
      return updated ? next : prev;
    });
  }, [value, detectedVars]);

  // Sync scroll between textarea and highlight pre
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Synchronize scroll on state changes
  useEffect(() => {
    handleScroll();
  }, [value]);

  const renderHighlightedText = (text: string) => {
    // Regex to find {variable_name} split safely
    const parts = text.split(/({[^{}]+})/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        const varName = part.slice(1, -1).trim();
        const isValid = knownVariables.length === 0 || knownVariables.includes(varName);
        
        return (
          <span 
            key={index} 
            className={cn(
              "px-1 rounded font-mono font-bold transition-all inline-block mx-0.5",
              isValid 
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" 
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30 border-dashed"
            )}
          >
            {part}
          </span>
        );
      }
      return <span key={index} className="text-slate-300">{part}</span>;
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

  // Compile template for simulation
  const getCompiledPrompt = () => {
    let compiled = value;
    detectedVars.forEach((v) => {
      const val = mockValues[v] || `{${v}}`;
      // Replace all instances of {v}
      compiled = compiled.replaceAll(`{${v}}`, val);
    });
    return compiled;
  };

  // Static Prompt Linter
  const getLintIssues = (): LintIssue[] => {
    const issues: LintIssue[] = [];
    
    if (!value) {
      return [{ type: 'info', message: 'Ready for prompt instruction design.' }];
    }

    // Check for unbalanced braces
    const openCount = (value.match(/\{/g) || []).length;
    const closeCount = (value.match(/\}/g) || []).length;
    if (openCount !== closeCount) {
      issues.push({ 
        type: 'warning', 
        message: `Syntax Error: Unbalanced curly braces detected (${openCount} open, ${closeCount} close).` 
      });
    }

    // Unknown variables check
    if (knownVariables.length > 0) {
      const unknowns = detectedVars.filter(v => !knownVariables.includes(v));
      if (unknowns.length > 0) {
        issues.push({
          type: 'warning',
          message: `Parameter Scope Warning: Variables [${unknowns.join(', ')}] are not declared in the global input variables list.`
        });
      }
    }

    // Length check
    if (value.length > 0 && value.length < 50) {
      issues.push({
        type: 'info',
        message: 'Prompt detail: Under 50 chars. Highly descriptive instructions yield better outputs.'
      });
    }

    // Prompt injection hazards
    const hazards = ['ignore previous', 'ignore the above', 'override system', 'bypass rules', 'system prompt', 'you are now forced'];
    const textLower = value.toLowerCase();
    const foundHazards = hazards.filter(h => textLower.includes(h));
    if (foundHazards.length > 0) {
      issues.push({
        type: 'warning',
        message: `Security Audit: Potential system instruction bypass risk words detected: "${foundHazards.join(', ')}".`
      });
    }

    if (issues.length === 0) {
      issues.push({
        type: 'success',
        message: 'Syntax validation clear. Template fully compliant with Arena injection system.'
      });
    }

    return issues;
  };

  const lintIssues = getLintIssues();

  return (
    <div id="prompt-template-editor" className="space-y-3 group/editor">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        {label && (
          <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">{label}</label>
        )}
        
        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
              activeTab === 'edit'
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Edit3 size={11} /> Write Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulate')}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
              activeTab === 'simulate'
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Eye size={11} /> Live Simulation
          </button>
        </div>
      </div>

      {activeTab === 'edit' ? (
        <div className="space-y-3">
          {/* Editor Mode */}
          <div className={cn(
            "relative rounded-xl border-2 transition-all duration-300 overflow-hidden bg-slate-950 shadow-2xl",
            isFocused ? "border-indigo-500 ring-4 ring-indigo-500/10 shadow-indigo-950/20" : "border-slate-800"
          )}>
            
            {/* Sync Header with Quick Variable Injectors */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Template Viewport</span>
              
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Inject Parameter:</span>
                {knownVariables.length > 0 ? (
                  knownVariables.map(v => (
                    <button 
                      type="button"
                      key={v}
                      onClick={() => insertVariable(v)}
                      className="text-[9px] font-bold text-indigo-400 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-800/40 hover:border-indigo-700/60 transition-all flex items-center gap-1 font-mono"
                    >
                      <PlusCircle size={9} /> {v}
                    </button>
                  ))
                ) : (
                  <span className="text-[9px] text-slate-500 font-medium">Declare variables above to activate</span>
                )}
              </div>
            </div>

            {/* Editing Layers */}
            <div className="relative min-h-[220px]">
              {/* Syntax Highlighting Layer */}
              <pre
                ref={highlightRef}
                aria-hidden="true"
                className="absolute inset-0 p-4 m-0 pointer-events-none whitespace-pre-wrap break-words text-xs font-mono leading-relaxed overflow-auto select-none custom-scrollbar"
                style={{ color: 'transparent' }}
              >
                {renderHighlightedText(value + ' ')}
              </pre>

              {/* Text Area Input */}
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder || "Enter prompt template..."}
                spellCheck={false}
                className="relative block w-full min-h-[220px] p-4 bg-transparent border-none text-xs font-mono text-slate-100 leading-relaxed focus:ring-0 resize-y z-10 custom-scrollbar caret-indigo-400 focus:outline-none"
              />
            </div>

            {/* Footer with counts & details */}
            <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between text-slate-400 font-mono text-[9px]">
              <div className="flex items-center gap-4">
                <span>{value.length} CHARS</span>
                <span>{value.split(/\s+/).filter(Boolean).length} WORDS</span>
                <span>{detectedVars.length} VARIABLES DETECTED</span>
              </div>
              <div className="text-slate-500">
                UTF-8 COMPLIANT
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Live Simulation View Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-900/5 p-4 rounded-xl border border-slate-200">
          
          {/* Left Panel: Variable Fill-In Form */}
          <div className="lg:col-span-1 space-y-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                <h4 className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Dynamic Sandbox</h4>
              </div>
              
              {detectedVars.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[9px] text-slate-400">Fill variable definitions to evaluate context interpolation:</p>
                  {detectedVars.map((v) => (
                    <div key={v} className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase font-mono flex items-center justify-between">
                        <span>{v}</span>
                        {knownVariables.includes(v) ? (
                          <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1 rounded border border-indigo-100">Scope Verified</span>
                        ) : (
                          <span className="text-[8px] bg-amber-50 text-amber-600 px-1 rounded border border-amber-100">Implicit</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={mockValues[v] || ''}
                        onChange={(e) => setMockValues({ ...mockValues, [v]: e.target.value })}
                        placeholder={`Value for {${v}}`}
                        className="w-full text-xs p-2 rounded-md border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono bg-slate-50 text-slate-800 transition-all shadow-inner"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <HelpCircle size={24} className="mx-auto opacity-30" />
                  <p className="text-[9px] font-bold uppercase tracking-wider">No Variables Found</p>
                  <p className="text-[8px] italic">Add braces like {"{variable}"} in your raw code to build interactive templates.</p>
                </div>
              )}
            </div>

            {detectedVars.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const resets: Record<string, string> = {};
                  detectedVars.forEach(v => { resets[v] = `[${v.toUpperCase()}_VALUE]`; });
                  setMockValues(resets);
                }}
                className="w-full py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-[9px] font-extrabold text-slate-500 uppercase tracking-widest transition-all hover:bg-slate-50 flex items-center justify-center gap-1"
              >
                <RefreshCw size={10} /> Reset Sandbox
              </button>
            )}
          </div>

          {/* Right Panel: Live Compiled Output Rendering */}
          <div className="lg:col-span-2 space-y-2 flex flex-col">
            <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">Compiled Output String</span>
                <span className="text-[8px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wide">Live Compiled</span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto max-h-[260px] custom-scrollbar bg-slate-50/50">
                <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                  {getCompiledPrompt()}
                </pre>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Real-time Validation & Linter Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-start gap-2.5">
        <div className="mt-0.5">
          {lintIssues[0]?.type === 'warning' ? (
            <AlertTriangle className="text-amber-500" size={14} />
          ) : lintIssues[0]?.type === 'success' ? (
            <CheckCircle2 className="text-emerald-500 animate-bounce" size={14} />
          ) : (
            <Info className="text-blue-500" size={14} />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest font-mono flex items-center gap-1.5">
            <span>Validator Protocol</span>
            <span className="text-[8px] text-indigo-500 font-extrabold bg-indigo-50 border border-indigo-100 px-1 rounded">Active</span>
          </div>
          <div className="space-y-1">
            {lintIssues.map((issue, idx) => (
              <p 
                key={idx} 
                className={cn(
                  "text-[10px] leading-relaxed font-medium",
                  issue.type === 'warning' ? "text-amber-600 font-semibold" : issue.type === 'success' ? "text-emerald-600" : "text-slate-500"
                )}
              >
                {issue.message}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
