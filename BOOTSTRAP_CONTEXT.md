schema:
  version: 1
  compatible_with:
    - CCC
  generated_by: Repository Bootstrap Prompt
  generated_at: "2026-08-25T04:20:02-07:00"
  repository: "Verdict Lab"

repository_summary:
  value: "Verdict Lab is an empirical prompt engineering and LLM behavioral evaluation platform. It enables researchers to build test cards with variables and weighted rubrics, compare prompt variants side-by-side, evaluate completions with a multi-judge consensus jury (JDay Engine), and view model leaderboards."
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "metadata.json"
    - "src/pages/About.tsx"
    - "README.md"
  notes: ""

technology_summary:
  value: "Full-stack TypeScript (React 19 + Express 4 + Vite 6 + Tailwind CSS v4). Uses @google/genai SDK for Gemini models, Firebase Firestore for data persistence, Supabase for real-time broadcasts, Zustand for state management, and Vitest for testing."
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json dependencies and devDependencies"
  notes: ""

architecture_summary:
  value: "Express server (Port 3000) serves Vite SPA and hosts secure backend API routes (/api/evaluate, /api/inference, /api/leaderboard). Private API keys (GEMINI_API_KEY) are kept strictly server-side. React client communicates via HTTP JSON requests and subscribes to Firestore real-time snapshots."
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "server.ts"
    - "src/services/geminiService.ts"
  notes: ""

coding_patterns:
  value:
    - "Functional React components with typed props and hooks"
    - "Modular sub-components separated from page views"
    - "Tailwind CSS utility classes for styling with cn() utility"
    - "Structured JSON schema validation for LLM responses using Type from @google/genai"
    - "React ErrorBoundary protecting page renders"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "src/components/"
    - "src/pages/"
    - "server.ts"
  notes: ""

naming_patterns:
  value:
    - "PascalCase for React components and page files (*.tsx)"
    - "camelCase for services, utilities, hooks, and helper functions (*.ts)"
    - "UPPER_SNAKE_CASE for environment variables (e.g. GEMINI_API_KEY)"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Directory listings in src/ and server.ts"
  notes: ""

important_conventions:
  value:
    - "Never expose GEMINI_API_KEY in client code; always use /api/* endpoints"
    - "Port 3000 on host 0.0.0.0 is mandatory for the dev and production server"
    - "Prompt template variables are denoted with curly brackets {variable_name}"
    - "Icons must be imported from lucide-react"
    - "Animations must use motion/react"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "server.ts"
    - "src/components/PromptEditor.tsx"
    - "package.json dependencies"
  notes: ""

critical_files:
  value:
    - "server.ts: Backend API gateway and Gemini SDK caller"
    - "src/App.tsx: Router layout and route definitions"
    - "src/pages/Arena.tsx: Pairwise execution and batch import orchestrator"
    - "src/pages/TestLab.tsx: Protocol creator, variable validator, and version diff viewer"
    - "src/components/PromptEditor.tsx: Syntax-highlighting prompt editor"
    - "src/services/geminiService.ts: Client proxy caller for inference and evaluation"
    - "src/tests/JDay.test.ts: Vitest specification tests"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Code analysis of project core flows"
  notes: ""

primary_entry_points:
  value:
    - "server.ts (Node.js runtime, Port 3000)"
    - "src/main.tsx (Browser client bootstrap)"
    - "index.html (HTML root container)"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json scripts"
    - "index.html"
  notes: ""

dangerous_areas:
  value:
    - "Modifying server.ts port or host configuration (breaks external proxy routing)"
    - "Exposing raw API keys directly in frontend environment defines"
    - "Disabling ErrorBoundary wrappers in page routes"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "server.ts PORT 3000 binding"
    - "AUDIT.md"
  notes: ""

files_likely_to_change:
  value:
    - "src/pages/Arena.tsx (execution controls, judge configuration)"
    - "src/pages/TestLab.tsx (protocol schemas, variable editors)"
    - "server.ts (new AI models, new API endpoints)"
    - "src/pages/Leaderboard.tsx (aggregate metric visualizers)"
  evidence_state: INFERRED
  confidence: HIGH
  evidence:
    - "Feature roadmap in TODO.md and active development pages"
  notes: ""

generated_files:
  value:
    - "dist/ (compiled static assets and bundled server.cjs)"
    - "dist/server.cjs (bundled CommonJS server output)"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json build script: vite build && esbuild server.ts --outfile=dist/server.cjs"
  notes: ""

repository_gaps:
  value:
    - "No automated CI/CD GitHub Actions workflows currently defined"
    - "No centralized remote error tracking service (e.g. Sentry)"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "No .github directory present in repository root"
  notes: ""

known_unknowns:
  value:
    - "Future expansion of third-party non-Gemini LLM judge provider endpoints"
  evidence_state: INFERRED
  confidence: MEDIUM
  evidence:
    - "TODO.md and DressingRoom.tsx options"
  notes: ""

overall_confidence:
  value: HIGH
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Full codebase verified through static inspection, passing tests, and successful build compilation"
  notes: ""
