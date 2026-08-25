schema:
  version: 1
  compatible_with:
    - CCC
  generated_by: Repository Bootstrap Prompt
  generated_at: "2026-08-25T04:20:02-07:00"
  repository: "Verdict Lab"

name:
  value: "Verdict Lab"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "metadata.json: name: Verdict Lab"
    - "README.md: # Verdict Lab"
    - "src/components/Layout.tsx: header branding"
  notes: ""

short_description:
  value: "Behavioral evaluation infrastructure for AI systems to design pairwise prompt experiments, isolate variables, and evaluate LLM outputs with the JDay judgment engine."
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "metadata.json description field"
    - "src/pages/About.tsx content"
  notes: ""

category:
  value: "AI / Developer Tools / LLM Evaluation"
  evidence_state: INFERRED
  confidence: HIGH
  evidence:
    - "@google/genai dependency in package.json"
    - "Prompt evaluation components in src/pages/Arena.tsx, TestLab.tsx, Leaderboard.tsx"
  notes: ""

repository_type:
  value: WEB_APP
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json dependencies: express, react, react-dom, react-router-dom, vite"
    - "server.ts and src/App.tsx"
  notes: ""

repository_status:
  value: ACTIVE
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Passing builds and tests"
    - "Active page views in src/pages"
  notes: ""

complexity:
  value: MODERATE
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Full-stack React + Express architecture"
    - "Multi-judge evaluation consensus engine"
    - "Firebase Firestore and Supabase Realtime integration"
  notes: ""

primary_technologies:
  value:
    - TypeScript
    - React 19
    - Express 4
    - Vite 6
    - Tailwind CSS v4
    - Google GenAI SDK (@google/genai)
    - Firebase Firestore
    - Zustand
    - Vitest
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json dependencies and devDependencies"
    - "server.ts imports and src/ codebase"
  notes: ""

problem_solved:
  value: "Eliminates rater bias, position bias, and regression issues in LLM prompt optimization through structured multi-judge consensus and pairwise variant benchmarking."
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "src/pages/About.tsx: What does it solve section"
    - "server.ts: System instructions for JDay Engine style normalization, position bias, verbosity bias"
  notes: ""

target_audience:
  value:
    - "AI Researchers"
    - "Prompt Engineers"
    - "Product Managers"
    - "Developer Agencies"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "src/pages/About.tsx: Target Users section"
  notes: ""

primary_users:
  value:
    - "Prompt engineers optimizing LLM system instructions and templates"
    - "Developers auditing model variants and evaluating outputs against weighted rubrics"
  evidence_state: INFERRED
  confidence: HIGH
  evidence:
    - "src/pages/TestLab.tsx: protocol creation"
    - "src/pages/Arena.tsx: pairwise consensus execution"
    - "src/pages/Leaderboard.tsx: model benchmark tracking"
  notes: ""

unique_characteristics:
  value:
    - "JDay multi-judge consensus panel with configurable modern Gemini models"
    - "Dynamic template variable extraction with syntax-highlighted editor"
    - "Interactive Git-style visual line diff comparison across prompt versions"
    - "High-throughput JSON batch array evaluator"
    - "Server-side API key proxying preventing client secret exposure"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "src/pages/Arena.tsx, src/pages/TestLab.tsx, src/components/PromptEditor.tsx"
    - "server.ts: /api/evaluate, /api/inference, /api/leaderboard"
  notes: ""

primary_entry_points:
  value:
    - "server.ts (Backend entry point, Port 3000)"
    - "src/main.tsx (Frontend entry point)"
    - "src/App.tsx (Client route hierarchy)"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json scripts"
    - "server.ts and src/main.tsx"
  notes: ""

current_state:
  value: "Fully functional full-stack prototype with passing tests, working linter, compiled builds, and complete UI views for Arena, Test Lab, Registry, Benchmarks, History, Dressing Room, and System Manual."
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Verified via npm run test (7/7 passed), npm run lint (0 errors), and compile_applet"
    - "All routes registered in src/App.tsx"
  notes: ""

key_risks:
  value:
    - "Potential API quota exhaustion or latency spikes if running multiple large models concurrently in multi-judge consensus"
    - "Client-side Firestore rules require strict production validation"
    - "Absence of structured central observability or error monitoring integration"
  evidence_state: INFERRED
  confidence: HIGH
  evidence:
    - "server.ts: parallel Promise.all across active judge models"
    - "AUDIT.md: observability section"
  notes: ""

overall_confidence:
  value: HIGH
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Direct examination of entire source tree and operational command verification"
  notes: ""
