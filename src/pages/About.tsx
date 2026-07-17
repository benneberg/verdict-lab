import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Info, 
  BookOpen, 
  HelpCircle, 
  ChevronDown, 
  HelpCircle as QuestionIcon, 
  Users, 
  Target, 
  Lightbulb, 
  ShieldAlert, 
  Zap, 
  FileJson, 
  Cpu, 
  GitBranch, 
  CheckCircle2, 
  Activity 
} from 'lucide-react';
import { cn } from '../lib/utils';

type TabType = 'brief' | 'manual' | 'faq';

export function About() {
  const [activeTab, setActiveTab] = useState<TabType>('brief');

  // Accordion FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "What is JDay Consensus voting?",
      a: "JDay Consensus is an algorithmic multi-judge rater system. Instead of relying on a single judge model—which introduces rater bias, position bias, and high-hallucination risks—Verdict Lab evaluates prompt variants A and B in parallel across a structured panel of distinct model sizes (e.g. Gemini 3.1 Pro, Gemini 3.5 Flash, Gemini 2.5 Flash). The rater engine checks for consensus, computes individual judge confidence ratings, checks for position bias, and produces a mathematically balanced jury verdict."
    },
    {
      q: "How do weights in rubrics affect the final outcome?",
      a: "When you configure an evaluation rubric, you designate custom non-integer weights to key performance indicators (e.g. Technical Accuracy: 1.5x, Tone Alignment: 0.8x). During the consensus check, the JDay Engine parses these weights directly into the structured judge directives. Judge scores are then scaled and aggregated based on these weights to ensure high-priority evaluation axes influence the verdict more heavily."
    },
    {
      q: "Can I run custom models or other third-party LLMs?",
      a: "Yes! While the core JDay engine utilizes Google's modern Gemini models (optimized for speed, cost efficiency, and large context windows), the platform's backend infrastructure is modularly engineered. Integrations can be bridged via secure server-side API proxy controllers, avoiding client-side exposure."
    },
    {
      q: "How does the High-Throughput JSON Batch Mode work?",
      a: "Instead of running test items one-by-one, Batch Mode allows you to paste a standard JSON array of data records directly into the Arena input. The workbench automatically parses each record, binds the keys to variables (such as {idea} or {constraint}) defined in your prompt template, executes inference sequentially, evaluates them via the selected consensus judges, compiles collateral logs, and writes them to the persistent Firestore historical ledger."
    },
    {
      q: "Why are API Keys kept secure server-side?",
      a: "Verdict Lab prioritizes absolute API key security. Any frontend exposure of an LLM key like GEMINI_API_KEY can lead to unauthorized rate-limit consumption and significant financial liability. All inference requests are routed through custom Node/Express endpoint controllers where the keys reside strictly in secure environment memory. The frontend never receives or contains secrets."
    },
    {
      q: "Does the workbench persist my history when I log out?",
      a: "Yes! Every single protocol, version, variant draft, and historical evaluation run (including individual inputs, model outputs, judge consensus, and inter-rater confidence) is stored securely inside Google Firebase Firestore, bound to your authenticated user account profile. When you return, your entire lab is perfectly intact."
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-[9px] font-bold tracking-widest uppercase">
              LAB_SYSTEM_MANUAL
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase italic">
            Laboratory Intel Deck
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed font-medium">
            A comprehensive guide and reference workbench manual explaining JDay Consensus, variable parsing, and structural prompt optimization.
          </p>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-2xl border shadow-sm">
        <button
          onClick={() => setActiveTab('brief')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200",
            activeTab === 'brief'
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Info size={14} />
          <span className="hidden sm:inline">System Brief</span>
          <span className="sm:hidden">Brief</span>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200",
            activeTab === 'manual'
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <BookOpen size={14} />
          <span className="hidden sm:inline">Workbench Manual</span>
          <span className="sm:hidden">Manual</span>
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200",
            activeTab === 'faq'
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <HelpCircle size={14} />
          <span className="hidden sm:inline">Frequently Asked Questions</span>
          <span className="sm:hidden">FAQ</span>
        </button>
      </div>

      {/* Content Container */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* TAB 1: SYSTEM BRIEF */}
            {activeTab === 'brief' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side: Overview & Core Philosophy */}
                <div className="space-y-6">
                  <div className="lab-card bg-white p-6 sm:p-8 space-y-4">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                        <Lightbulb size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Concept Definition</h3>
                        <h2 className="text-base font-extrabold text-slate-900 uppercase">What is Verdict Lab?</h2>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Verdict Lab is a systematic development workstation engineered specifically for prompt optimization and automated model evaluation. It converts subjective prompt-tuning from random guesswork into a reproducible, data-driven science. By comparing prompt variants side-by-side (pairwise matching), prompt engineers can immediately identify which templates maximize task performance.
                    </p>
                  </div>

                  <div className="lab-card bg-white p-6 sm:p-8 space-y-4">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                        <ShieldAlert size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">The Challenge</h3>
                        <h2 className="text-base font-extrabold text-slate-900 uppercase">What does it solve?</h2>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Standard prompt engineering suffers from three major flaws:
                    </p>
                    <ul className="space-y-2.5 text-xs text-slate-500 font-mono">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold shrink-0">1.</span>
                        <span><strong>Position Bias:</strong> Models acting as judges tend to favor whichever response is presented first (Response A vs. B).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold shrink-0">2.</span>
                        <span><strong>Rater Bias:</strong> Single-judge rater systems struggle with specific evaluation matrices and frequently hallucinate preferences.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold shrink-0">3.</span>
                        <span><strong>Regression:</strong> Changing a prompt to fix one edge-case frequently breaks dozens of other scenarios without a structured batch regression test suite.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right Side: Who, How, and Why */}
                <div className="space-y-6">
                  <div className="lab-card bg-white p-6 sm:p-8 space-y-4">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                        <Users size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Target Users</h3>
                        <h2 className="text-base font-extrabold text-slate-900 uppercase">Who uses it?</h2>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Our system is tailored for technical product teams who require predictable LLM outputs:
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        👨‍🔬 AI Researchers
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        🏗️ Prompt Engineers
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        💼 Product Managers
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        🏢 Developer Agencies
                      </div>
                    </div>
                  </div>

                  <div className="lab-card bg-white p-6 sm:p-8 space-y-4">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                        <Target size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Operational Pipeline</h3>
                        <h2 className="text-base font-extrabold text-slate-900 uppercase">How & Why is it used?</h2>
                      </div>
                    </div>
                    <div className="space-y-3 font-medium">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong>How:</strong> Researchers design structured experiments inside the <strong>Test Lab</strong>, setting up independent variables (e.g., system instructions, few-shot examples) and weighting criteria. They then execute individual or batch inputs in the <strong>Arena</strong>, letting rater panels score the matches in real-time.
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong>Why:</strong> Traditional manual auditing is incredibly slow, expensive, and non-scientific. Verdict Lab automates this process entirely, outputting detailed inter-rater agreement statistics and visual diff records to confidently select the most cost-effective model and stable prompt structure.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WORKBENCH MANUAL */}
            {activeTab === 'manual' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Variables */}
                  <div className="lab-card bg-white p-6 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 w-fit">
                        <FileJson size={18} />
                      </div>
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">01 / TEMPLATE SYNTAX</h3>
                      <h4 className="text-sm font-extrabold text-slate-900 uppercase">Dynamic Variable Parsing</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Define variables in your prompt templates using standard curly brackets: <code className="text-indigo-600 font-bold bg-indigo-50/50 px-1 py-0.5 rounded font-mono">{"{my_variable}"}</code>. 
                        The workbench parses these keys automatically to generate dynamic input fields inside the Arena.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[9px] leading-relaxed text-slate-400">
                      e.g., "Draft an email about <span className="text-indigo-600 font-bold">{"{topic}"}</span> with a tone of <span className="text-indigo-600 font-bold">{"{tone}"}</span>"
                    </div>
                  </div>

                  {/* Card 2: Consensus */}
                  <div className="lab-card bg-white p-6 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 w-fit">
                        <Cpu size={18} />
                      </div>
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">02 / JDAY CONSENSUS</h3>
                      <h4 className="text-sm font-extrabold text-slate-900 uppercase">Model Jury Protocols</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        The workbench supports multi-rater consensus. When you run an experiment, the system spawns selected judges (Gemini Pro, Flash, etc.) in parallel. Each judge votes on the winner (A, B, or Tie) and writes a comprehensive reasoning rationale.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[9px] leading-relaxed text-slate-400">
                      Judges evaluate accuracy, instruction adherence, formatting completeness, and hallucination safety.
                    </div>
                  </div>

                  {/* Card 3: Data Layers */}
                  <div className="lab-card bg-white p-6 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 w-fit">
                        <GitBranch size={18} />
                      </div>
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">03 / AUDITING TREE</h3>
                      <h4 className="text-sm font-extrabold text-slate-900 uppercase">Immutability & History</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Every single saved edit inside the Test Lab generates a brand new version node. Version records preserve legacy parameters, variants, hypotheses, and rubrics, letting you review historical git-style code diffs at any time.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[9px] leading-relaxed text-slate-400">
                      Maintains a secure, chronological ledger of all prompt modifications for regression mitigation.
                    </div>
                  </div>
                </div>

                {/* Deep-Dive Flow Panel */}
                <div className="lab-card bg-slate-900 border border-slate-800 text-slate-100 p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <Activity className="text-indigo-400 animate-pulse" size={18} />
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">OPERATIONAL_DATA_PIPELINE</h3>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400 uppercase font-black">Consensus Path</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs leading-relaxed font-medium">
                    <div className="space-y-2 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/60 relative">
                      <div className="text-[10px] font-mono text-indigo-400 font-bold mb-1">01. TEMPLATING</div>
                      <p className="text-slate-400">Compose Variant A and Variant B with custom system instructions, temperature, and dynamic variables.</p>
                      <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-10 text-indigo-500 font-bold text-base font-mono">→</div>
                    </div>
                    <div className="space-y-2 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/60 relative">
                      <div className="text-[10px] font-mono text-indigo-400 font-bold mb-1">02. BIND & RUN</div>
                      <p className="text-slate-400">Supply single values or upload a JSON dataset. The model generates variant completions in parallel.</p>
                      <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-10 text-indigo-500 font-bold text-base font-mono">→</div>
                    </div>
                    <div className="space-y-2 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/60 relative">
                      <div className="text-[10px] font-mono text-indigo-400 font-bold mb-1">03. CONSENSUS JURY</div>
                      <p className="text-slate-400">The JDay consensus engine runs parallel, randomized-order judge evaluations to eliminate position bias.</p>
                      <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-10 text-indigo-500 font-bold text-base font-mono">→</div>
                    </div>
                    <div className="space-y-2 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/60">
                      <div className="text-[10px] font-mono text-indigo-400 font-bold mb-1">04. METRIC REGISTRY</div>
                      <p className="text-slate-400">Results, votes, and bias flags are written to Firestore. Win rates and reliability score ratios update.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ACCORDION FAQ */}
            {activeTab === 'faq' && (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="text-center space-y-2 mb-8">
                  <div className="p-3 bg-indigo-50 rounded-full text-indigo-600 w-fit mx-auto">
                    <QuestionIcon size={22} />
                  </div>
                  <h2 className="text-lg font-extrabold uppercase text-slate-900">Knowledge Base</h2>
                  <p className="text-xs text-slate-500">Find answers to technical inquiries, operational structures, and security questions.</p>
                </div>

                <div className="space-y-3">
                  {faqs.map((faq, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div 
                        key={idx}
                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-300"
                      >
                        <button
                          onClick={() => toggleFaq(idx)}
                          className="w-full flex items-center justify-between p-5 text-left font-bold text-xs uppercase tracking-wide text-slate-800 hover:bg-slate-50 transition-colors"
                        >
                          <span className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-mono">
                              {idx + 1}
                            </span>
                            {faq.q}
                          </span>
                          <ChevronDown 
                            size={16} 
                            className={cn(
                              "text-slate-400 transition-transform duration-300",
                              isOpen ? "rotate-180 text-indigo-600" : ""
                            )}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                              <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed font-medium border-t border-slate-50 bg-slate-50/20">
                                {faq.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
