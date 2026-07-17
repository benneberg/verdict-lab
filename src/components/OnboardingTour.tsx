import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Beaker, 
  FlaskConical, 
  HelpCircle, 
  Cpu, 
  FileJson, 
  Trophy, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Play
} from 'lucide-react';
import { cn } from '../lib/utils';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Keydown listener for arrow keys navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        handleFinish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('verdict_lab_tour_completed', 'true');
    setCurrentStep(0);
    onClose();
  };

  const steps = [
    {
      title: "SYSTEM_INTELLIGENCE_INITIATED",
      subtitle: "Welcome to Verdict Lab",
      icon: FlaskConical,
      color: "from-indigo-500 to-purple-600",
      content: "Verdict Lab is a professional prompt workbench designed to eliminate model output variability and subjective rating bias through rigorous, automated consensus.",
      bullets: [
        "Compare prompt variations (A vs. B) side-by-side.",
        "Secure server-side API proxying (zero key leakage).",
        "Persistent test card versioning stored in your lab."
      ]
    },
    {
      title: "PROTOCOL_CREATION_ENGINE",
      subtitle: "Design in the Test Lab",
      icon: Cpu,
      color: "from-purple-500 to-pink-600",
      content: "The Test Lab is your blueprint designer. Author clear hypotheses, define template variables using braces, and draft weighted rubrics.",
      bullets: [
        "Syntax highlighting & validation for dynamic variables (e.g. {idea}).",
        "Visual Git-style line diffs to audit changes across versions.",
        "Rubrics with custom weights for precise multi-dimensional scoring."
      ]
    },
    {
      title: "ARENA_CONSENSUS_JURY",
      subtitle: "Execute inside the Arena",
      icon: Beaker,
      color: "from-pink-500 to-rose-600",
      content: "The Arena executes prompts and generates evaluations. Use single inputs for quick experiments, or upload JSON datasets for high-throughput batching.",
      bullets: [
        "High-Throughput Batch Importer processes bulk variables automatically.",
        "JDay Consensus Engine utilizes multi-judge panels to eliminate bias.",
        "Blind randomized-order judge evaluations to mitigate position bias."
      ]
    },
    {
      title: "BENCHMARK_ANALYSIS_DECK",
      subtitle: "Calibrate & Optimize",
      icon: Trophy,
      color: "from-rose-500 to-amber-500",
      content: "Calibration doesn't stop at execution. The Benchmarks dashboard aggregates live win rates, inter-rater agreement statistics, and model statistics.",
      bullets: [
        "Compute win-loss distributions across all active prompt variants.",
        "Audit detailed inter-rater reliability agreement scores.",
        "Select the most accurate, lowest-cost model for production."
      ]
    }
  ];

  if (!isOpen) return null;

  const activeStepData = steps[currentStep];
  const StepIcon = activeStepData.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
        {/* Animated backdrop glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -15 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="relative max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Top Progress Line */}
          <div className="h-1.5 bg-slate-100 w-full flex">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "h-full flex-1 transition-all duration-300",
                  idx <= currentStep ? "bg-indigo-600" : "bg-slate-150"
                )}
              />
            ))}
          </div>

          {/* Close Trigger */}
          <button 
            onClick={handleFinish}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all duration-200 z-10"
          >
            <X size={16} />
          </button>

          {/* Step Body */}
          <div className="p-6 sm:p-8 flex-1 space-y-6">
            {/* Visual Icon Halo */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className={cn(
                "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg",
                activeStepData.color
              )}>
                <StepIcon size={24} />
              </div>
              <div>
                <span className="font-mono text-[9px] font-bold text-indigo-600 uppercase tracking-widest block">
                  {activeStepData.title}
                </span>
                <h2 className="text-base font-extrabold text-slate-900 uppercase">
                  {activeStepData.subtitle}
                </h2>
              </div>
            </div>

            {/* Explanatory content */}
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {activeStepData.content}
              </p>

              {/* Bullets list */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Highlighted Capabilities</span>
                {activeStepData.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-[11px] leading-relaxed text-slate-600 font-medium">
                    <CheckCircle2 size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            {/* Steps indicator dots */}
            <div className="flex gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    idx === currentStep 
                      ? "bg-indigo-600 w-5 shadow-sm" 
                      : "bg-slate-300 hover:bg-slate-400"
                  )}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={cn(
                  "p-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600 bg-white transition-all hover:bg-slate-50",
                  currentStep === 0 ? "opacity-30 cursor-not-allowed" : "hover:border-slate-300"
                )}
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="p-2.5 px-4 rounded-xl bg-slate-900 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-slate-800 flex items-center gap-1 shadow-md shadow-slate-900/10"
              >
                {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
