# Product Purpose & Strategy: Verdict Lab 🧪

---

## 1. Product Summary

**Verdict Lab** is a professional, full-stack workbench for prompt optimization and automated model evaluation. It converts qualitative prompt adjustments into an empirical, reproducible science by combining side-by-side (pairwise) output comparisons with a multi-judge model consensus jury (the JDay Engine).

---

## 2. Problem Statement

Standard prompt optimization workflows in modern AI application engineering suffer from critical failure modes:
1. **Position Bias**: Large Language Models serving as evaluators frequently favor whichever response is presented first in the context window.
2. **Rater Bias & Variance**: Relying on a single judge model leads to idiosyncratic style preferences, high hallucination rates, and scoring inconsistency.
3. **Prompt Regression**: Modifying system instructions or few-shot examples to fix an isolated edge-case frequently breaks dozens of other scenarios without a structured regression testing suite.
4. **API Secret Leakage**: Running evaluations directly from client-side SPAs exposes sensitive API keys in browser network traffic.

---

## 3. Target Audience

Based on verified system specifications (`src/pages/About.tsx`, `metadata.json`):
- **AI Researchers**: Studying model alignment, position bias, and inter-rater reliability.
- **Prompt Engineers**: Authoring, testing, and optimizing system instructions and dynamic prompt templates.
- **Product Managers**: Calibrating LLM outputs against weighted quality rubrics before production deployment.
- **Developer Agencies**: Benchmarking multiple model providers to select the most cost-effective and accurate solution.

---

## 4. Value Proposition

- **Scientific Rigor**: Replaces subjective "vibe-checking" with structured pairwise comparisons, weighted rubric evaluations, and majority-vote consensus juries.
- **Security by Design**: Complete isolation of private API credentials (`GEMINI_API_KEY`) behind an Express backend proxy.
- **Version Control & Traceability**: Version audit trees with Git-style visual line diffs to track evolution of prompt hypotheses and parameters.
- **High Throughput**: Bulk dataset evaluation via the JSON batch array runner.
- **Actionable Benchmarks**: Aggregated leaderboards tracking model win rates, rater confidence, and inter-rater agreement.

---

## 5. Feature Registry

### Verified Features (Directly Executing in Codebase)
- **Prompt Protocol Creator (`src/pages/TestLab.tsx`)**:
  - Independent variable designation and hypothesis authoring.
  - Weighted rubric configuration with custom min/max scales and numeric weights.
  - Real-time syntax-highlighting `PromptEditor` (`src/components/PromptEditor.tsx`) supporting variable tokens (e.g. `{variable_name}`).
- **Visual Diff Viewer (`src/pages/TestLab.tsx`)**:
  - Interactive line-by-line Git-style terminal diff viewer comparing saved versions against drafts.
- **Pairwise Consensus Arena (`src/pages/Arena.tsx`)**:
  - Side-by-side prompt execution (Variant A vs. Variant B).
  - Multi-judge consensus configuration selecting from Gemini 3.1 Pro, Gemini 3.5 Flash, and Gemini 2.5 Flash.
  - JSON Batch Array Importer for automated high-throughput evaluation runs.
  - Collateral logs with detailed judge reasoning, score breakdowns, and bias flags.
- **Backend API Gateway (`server.ts`)**:
  - `/api/evaluate`: Executes parallel judge evaluations with structured JSON schemas and majority tally aggregation.
  - `/api/inference`: Proxies model completions without exposing keys to the browser.
  - `/api/leaderboard`: Asynchronously aggregates model win rates and confidence from Firestore.
- **Persistence & Real-Time Sync**:
  - Firebase Firestore storage for test cards, immutable version records, and experiment history.
  - Supabase broadcast notifications alerted upon experiment completion.
- **Onboarding & Help**:
  - Step-by-step interactive onboarding guide (`src/components/OnboardingTour.tsx`) with keyboard navigation.
  - 3-tab Intel Deck (`src/pages/About.tsx`) covering System Brief, Workbench Manual, and Accordion FAQ.
- **Automated Verification**:
  - Vitest test suite (`src/tests/JDay.test.ts`) verifying tally math, consensus calculation, and variable regex parsing.

### Inferred Features (Simulated with Rule-Based Fallbacks / Partially Implemented)
- **Model Fallback Mapping (`server.ts`)**:
  - Automatically translates legacy or preview model identifiers to supported modern counterparts (`gemini-3.1-pro-preview`, `gemini-3.5-flash`).
- **Offline Protocol Access**:
  - Cached local state in Zustand store enabling offline template drafting.

### Future Features (Unimplemented Backlog / TODOs)
- **Multiplayer Real-Time Collaboration**:
  - Real-time collaborative co-editing with shared cursor presence via Supabase Presence channels.
- **Global Hyperparameter Synchronization**:
  - Binding Dressing Room temperature and top-k controls directly into Arena default execution configs.
- **CSV Data Exporter**:
  - One-click export of batch run outcomes to downloadable CSV tables.
