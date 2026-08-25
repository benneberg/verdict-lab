schema:
  version: 1
  compatible_with:
    - CCC
  generated_by: Repository Bootstrap Prompt
  generated_at: "2026-08-25T04:20:02-07:00"
  repository: "Verdict Lab"

architecture_style:
  value: "Full-Stack Single-Page Application (SPA) with Embedded Node/Express Backend Proxy Gateway"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "server.ts: Express application hosting API routes and serving Vite dev middleware/production static bundle"
    - "src/App.tsx: React 19 Client SPA with React Router v7"
  notes: ""

major_components:
  value:
    - "Client UI & View Layer: React 19, Tailwind CSS v4, Motion, Lucide icons"
    - "Prompt Editor Engine: PromptEditor component with syntax tokenization, line numbers, and dynamic variable parsing"
    - "Visual Diff Engine: Line-by-line Git-style diff comparison tool in TestLab version inspector"
    - "JDay Consensus Engine: Multi-judge consensus rater pipeline implemented in server.ts /api/evaluate"
    - "Backend Gateway API: Express 4 server hosting /api/evaluate, /api/inference, and /api/leaderboard"
    - "Persistence Layer: Firebase Firestore (test_cards, test_card_versions, experiments, user profiles)"
    - "Real-Time Broadcaster: Supabase client broadcasting experiment completion events across active browser tabs"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "src/components/PromptEditor.tsx"
    - "src/pages/TestLab.tsx"
    - "src/pages/Arena.tsx"
    - "server.ts"
  notes: ""

responsibilities:
  value:
    server.ts: "Isolates GEMINI_API_KEY, handles structured JSON evaluation schemas across multiple Gemini models, aggregates leaderboard statistics, and serves the frontend application"
    PromptEditor.tsx: "Provides real-time syntax highlighting for variables {variable_name}, enforces linting rules, and synchronizes backdrop text with input textarea"
    Arena.tsx: "Orchestrates single and batch pairwise prompt runs, manages judge consensus panels, and submits evaluation records to Firestore"
    TestLab.tsx: "Enables creating and versioning test card protocols with hypotheses, variant drafts, independent variable definitions, and weighted rubrics"
    Leaderboard.tsx: "Renders model win rates, average confidence scores, and rater consistency metrics"
    About.tsx: "Delivers comprehensive system brief, workbench manual, and interactive FAQ"
    OnboardingTour.tsx: "Provides step-by-step interactive onboarding with keyboard shortcuts"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Source code across server.ts, src/components, and src/pages"
  notes: ""

dependency_flow:
  value: "UI Components -> Zustand Store / Services -> Fetch API -> Express Gateway (/api/*) -> @google/genai SDK / Firebase Admin / Firestore"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "src/services/geminiService.ts calls /api/evaluate and /api/inference"
    - "server.ts imports @google/genai and invokes ai.models.generateContent"
  notes: ""

data_flow:
  value:
    pairwise_run: "User inputs variables/batch in Arena -> Client sends payload to /api/evaluate -> Express invokes Gemini models in parallel -> Structured verdicts returned -> Client computes winner/scores -> Payload saved to Firestore -> Supabase broadcast notified"
    protocol_save: "User edits protocol in TestLab -> Payload saved to Firestore test_cards and test_card_versions -> Version history available for diff inspection"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "src/pages/Arena.tsx runEvaluation flow"
    - "src/pages/TestLab.tsx saveProtocol flow"
  notes: ""

source_of_truth:
  value:
    database: "Firebase Firestore collections (test_cards, test_card_versions, experiments)"
    client_cache: "Zustand store (useStore) for active session state"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "src/store/useStore.ts"
    - "server.ts Firebase initialization"
  notes: ""

entry_points:
  value:
    backend: "server.ts"
    frontend: "src/main.tsx"
    html_root: "index.html"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json scripts"
    - "index.html"
    - "server.ts"
  notes: ""

external_systems:
  value:
    - "Google Gemini API (via @google/genai SDK on server)"
    - "Firebase Firestore (database & authentication)"
    - "Supabase Realtime (real-time broadcast channel)"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json dependencies"
    - "server.ts"
    - "src/lib/firebase.ts"
    - "src/lib/realtime.ts"
  notes: ""

extension_points:
  value:
    - "Custom judge models can be registered in server.ts activeModels mapping"
    - "Rubric metrics and weights can be extended arbitrarily in TestLab"
    - "Batch JSON import format allows arbitrary key-value mappings to prompt template variables"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "server.ts /api/evaluate endpoint"
    - "src/pages/Arena.tsx batch processing"
  notes: ""

configuration:
  value:
    - "GEMINI_API_KEY: Server environment secret"
    - "PORT: 3000 (0.0.0.0)"
    - "firebase-applet-config.json: Firebase initialization parameters"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - ".env.example"
    - "server.ts"
  notes: ""

constraints:
  value:
    - "External web traffic strictly restricted to Port 3000"
    - "API keys must not be exposed to the browser client"
    - "React 19 compatibility across third-party dependencies"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Environment constraints and server.ts port binding"
    - "package.json"
  notes: ""

architecture_risks:
  value:
    - "Parallel multi-judge requests multiply API latency and rate-limit consumption"
    - "If serverDb is unconfigured, leaderboard endpoint falls back to client aggregation"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "server.ts /api/evaluate and /api/leaderboard error handling"
  notes: ""

improvement_opportunities:
  value:
    - "Introduce Redis/in-memory cache for repeated identical evaluations"
    - "Add WebSocket streaming for real-time judge token generation in Arena"
  evidence_state: INFERRED
  confidence: MEDIUM
  evidence:
    - "server.ts generateContent non-streaming implementation"
  notes: ""

unknown_areas:
  value:
    - "Long-term concurrency limits of server-side Firestore connection pooling under heavy load"
  evidence_state: UNSET
  confidence: LOW
  evidence: []
  notes: "No load testing scripts detected in codebase"
