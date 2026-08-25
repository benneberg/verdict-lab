schema:
  version: 1
  compatible_with:
    - CCC
  generated_by: Repository Bootstrap Prompt
  generated_at: "2026-08-25T04:20:02-07:00"
  repository: "Verdict Lab"

overview:
  value: "Verdict Lab is a full-stack web application designed for prompt engineering, pairwise LLM behavioral testing, and automated consensus evaluation with weighted rubrics and multi-judge models."
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "metadata.json"
    - "README.md"
    - "package.json"
  notes: ""

purpose:
  value: "Provide an empirical workbench for researchers and engineers to systematically compare prompt variations, isolate independent variables, minimize rater bias, and calibrate LLMs for production deployment."
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "src/pages/About.tsx"
    - "server.ts JDay system instruction"
  notes: ""

scope:
  value: "Covers prompt template creation, version control with diff comparison, single and batch pairwise execution, multi-judge LLM evaluation, leaderboard aggregation, historical run auditing, user preferences, and workbench onboarding."
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Routes in src/App.tsx: /arena, /lab, /registry, /benchmarks, /history, /profile, /about"
  notes: ""

capabilities:
  value:
    - "Pairwise LLM output generation and side-by-side comparison"
    - "Multi-judge JDay consensus voting across Gemini models"
    - "Dynamic template variable extraction ({variable_name})"
    - "Weighted rubric scoring with bias normalization"
    - "Git-style visual line diff viewer for prompt versions"
    - "High-throughput JSON batch input evaluation"
    - "Server-side leaderboard metrics aggregation"
    - "Interactive onboarding tour and comprehensive system manual"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "src/pages/Arena.tsx, src/pages/TestLab.tsx, src/pages/Leaderboard.tsx, src/pages/About.tsx, src/components/OnboardingTour.tsx, server.ts"
  notes: ""

verified_features:
  value:
    - "Test Lab prompt protocol builder with independent variable tagger"
    - "PromptEditor with real-time variable syntax highlighting and linting"
    - "Protocol version comparison modal with line-by-line visual diffs"
    - "Arena single run and batch JSON array run execution"
    - "JDay Consensus judge selection (Gemini 3.1 Pro, Gemini 3.5 Flash, Gemini 2.5 Flash)"
    - "Server-side /api/evaluate endpoint with structured schema rater output"
    - "Server-side /api/inference endpoint for model completions"
    - "Server-side /api/leaderboard aggregation endpoint"
    - "Firebase Firestore persistence for test cards, versions, and experiments"
    - "Supabase Realtime channel broadcast on experiment completion"
    - "Onboarding stepper modal with keyboard navigation"
    - "3-tab Info & Manual page with system brief, workbench manual, and accordion FAQ"
    - "Vitest automated test suite for consensus math and placeholder regex"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Verified via test run (7/7 passed), code audit across src/ and server.ts"
  notes: ""

inferred_features:
  value:
    - "Multi-user collaborative protocol sharing via Firestore collections"
    - "Automated fallback to default judge models if custom configurations are unsupplied"
  evidence_state: INFERRED
  confidence: MEDIUM
  evidence:
    - "firestore.rules and server.ts model mapping fallback logic"
  notes: ""

future_indicators:
  value:
    - "Real-time collaborative multiplayer cursors via Supabase Presence"
    - "Piping advanced temperature and top_p hyperparameters from Dressing Room directly to all Arena executions"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "TODO.md and AUDIT.md comments regarding DressingRoom parameters and Supabase channels"
  notes: ""

technology_stack:
  value:
    frontend:
      framework: "React 19.0.1"
      routing: "react-router-dom 7.15.0"
      bundler: "Vite 6.2.3"
      styling: "Tailwind CSS 4.1.14 (@tailwindcss/vite)"
      animation: "motion 12.23.24"
      icons: "lucide-react 0.546.0"
      state: "Zustand 5.0.13"
      markdown: "react-markdown 10.1.0"
    backend:
      runtime: "Node.js with tsx"
      server: "Express 4.21.2"
      bundler: "esbuild 0.25.0"
      ai_sdk: "@google/genai 1.29.0"
      database: "Firebase Firestore 12.13.0"
      realtime: "@supabase/supabase-js 2.106.2"
    testing:
      framework: "Vitest 4.1.10"
      linter: "TypeScript compiler (tsc --noEmit)"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json dependencies and devDependencies"
    - "tsconfig.json"
    - "vite.config.ts"
  notes: ""

repository_structure:
  value:
    root:
      - "server.ts: Express API gateway and Vite middleware integration"
      - "vite.config.ts: Vite configuration with Tailwind CSS plugin"
      - "package.json: Project scripts and dependencies"
      - "tsconfig.json: TypeScript build configuration"
      - "metadata.json: Platform applet configuration"
      - "firestore.rules: Firestore security rules"
      - "firebase-blueprint.json & firebase-applet-config.json: Firebase configuration"
    src:
      components: "Reusable UI components (Layout, ErrorBoundary, PromptEditor, OnboardingTour)"
      pages: "Primary application routes (Arena, TestLab, Registry, Leaderboard, History, DressingRoom, About)"
      services: "Client-side API call services (geminiService, metricsService)"
      store: "Global Zustand state store (useStore)"
      tests: "Vitest unit tests (JDay.test.ts)"
      lib: "Firebase and Supabase client initializers and utility functions"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Filesystem directory listing and file inspection"
  notes: ""

configuration:
  value:
    - "GEMINI_API_KEY: Environment variable required on server-side for Gemini model inferences"
    - "firebase-applet-config.json: Firebase project credentials and database configuration"
    - "PORT: Bound to 3000 on host 0.0.0.0"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - ".env.example"
    - "server.ts"
  notes: ""

build_process:
  value:
    dev_command: "npm run dev (executes tsx server.ts on Port 3000)"
    build_command: "npm run build (executes vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs)"
    start_command: "npm run start (executes node dist/server.cjs)"
    lint_command: "npm run lint (executes tsc --noEmit)"
    test_command: "npm run test (executes vitest run)"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json scripts"
  notes: ""

deployment:
  value: "Containerized Cloud Run execution environment serving Port 3000 via reverse proxy"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "server.ts PORT binding (3000, 0.0.0.0)"
    - "Environment runtime constraints"
  notes: ""

repository_boundaries:
  value:
    - "Inference API keys are isolated to the server process and not sent to the browser"
    - "Client SPA routes all Gemini operations through /api/evaluate and /api/inference"
    - "Leaderboard calculations can be served via /api/leaderboard or computed from cached Firestore collections"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "server.ts"
    - "src/services/geminiService.ts"
  notes: ""

known_unknowns:
  value:
    - "Long-term production Firestore index provisioning rules for complex multi-variable compound queries"
  evidence_state: INFERRED
  confidence: MEDIUM
  evidence:
    - "firestore.rules"
  notes: ""

confidence_summary:
  value: HIGH
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "All sections extracted directly from filesystem evidence, build validation, and passing test suites"
  notes: ""
