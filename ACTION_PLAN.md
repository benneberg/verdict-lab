schema:
  version: 1
  compatible_with:
    - CCC
  generated_by: Repository Bootstrap Prompt
  generated_at: "2026-08-25T04:20:02-07:00"
  repository: "Verdict Lab"

immediate:
  value:
    - title: "Verify Backend API Proxy Stability"
      description: "Ensure that /api/evaluate and /api/inference handle network timeouts gracefully when external LLM endpoints experience latency spikes."
      priority: HIGH
      expected_benefit: "Prevents hanging client requests and returns structured 504/502 errors if judge models timeout."
      difficulty: LOW
      evidence:
        - "server.ts lines 104-120: judgePromises uses Promise.all without individual timeout wrapper"
      confidence: HIGH
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "server.ts error handling analysis"
  notes: ""

high_priority:
  value:
    - title: "Tiebreaker Configuration for JDay Consensus"
      description: "Implement continuous rubric score aggregation as a configurable secondary tiebreaker when discrete judge vote counts are equal."
      priority: HIGH
      expected_benefit: "Reduces ambiguous 'Tie' verdicts in high-stakes protocol evaluations."
      difficulty: MEDIUM
      evidence:
        - "server.ts lines 160-165: winner selection defaults to 'Tie' on equal vote count"
      confidence: HIGH
    - title: "Automated Integration Tests for API Routes"
      description: "Add Vitest integration tests for /api/evaluate, /api/inference, and /api/leaderboard with mocked Google GenAI responses."
      priority: HIGH
      expected_benefit: "Ensures backend routes remain stable against future refactors without consuming live API credits."
      difficulty: MEDIUM
      evidence:
        - "src/tests/JDay.test.ts currently covers unit math functions only"
      confidence: HIGH
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "server.ts and src/tests/"
  notes: ""

medium_priority:
  value:
    - title: "Propagate Dressing Room Global Parameters to Arena"
      description: "Connect the temperature, topK, and topP sliders in DressingRoom.tsx to the global Zustand store and use them as defaults in the Arena."
      priority: MEDIUM
      expected_benefit: "Seamless user experience when customizing model hyperparameters."
      difficulty: LOW
      evidence:
        - "src/pages/DressingRoom.tsx and src/pages/Arena.tsx"
      confidence: HIGH
    - title: "Response Caching for Repeated Inferences"
      description: "Implement an in-memory or Redis-compatible cache for deterministic evaluation requests with identical prompt variants and rubrics."
      priority: MEDIUM
      expected_benefit: "Saves API costs and drastically speeds up repeated batch test runs."
      difficulty: MEDIUM
      evidence:
        - "server.ts /api/evaluate runs full inference on every call"
      confidence: HIGH
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "src/pages/DressingRoom.tsx and server.ts"
  notes: ""

low_priority:
  value:
    - title: "CSV Export for Evaluation Batches"
      description: "Add a button to download historical and batch run results as standard CSV tables in addition to JSON."
      priority: LOW
      expected_benefit: "Allows data scientists to analyze evaluation metrics in external tools like Excel, Pandas, or R."
      difficulty: LOW
      evidence:
        - "src/pages/Arena.tsx has batch import but currently lacks dedicated CSV export trigger"
      confidence: HIGH
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "src/pages/Arena.tsx"
  notes: ""

quick_wins:
  value:
    - title: "Add Leaderboard Response Header Caching"
      description: "Set short Cache-Control headers on the /api/leaderboard route to prevent redundant database queries on rapid page reloads."
      priority: MEDIUM
      expected_benefit: "Instant response times for users browsing model benchmark statistics."
      difficulty: LOW
      evidence:
        - "server.ts: /api/leaderboard endpoint queries Firestore collection on every GET request"
      confidence: HIGH
    - title: "Add Keyboard Shortcut Hints in UI Tooltips"
      description: "Display keyboard navigation shortcuts (e.g. Left/Right arrows, Escape) in the Onboarding Tour and prompt modal dialogs."
      priority: LOW
      expected_benefit: "Improved accessibility and faster power-user workflow."
      difficulty: LOW
      evidence:
        - "src/components/OnboardingTour.tsx already implements ArrowRight/ArrowLeft listeners"
      confidence: HIGH
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "server.ts and src/components/OnboardingTour.tsx"
  notes: ""

long_term:
  value:
    - title: "Multiplayer Real-Time Collaboration"
      description: "Leverage Supabase Presence channels to show active collaborator cursors and live protocol editing in TestLab."
      priority: LOW
      expected_benefit: "Enables distributed prompt engineering teams to co-author templates in real time."
      difficulty: HIGH
      evidence:
        - "src/lib/realtime.ts contains initialized Supabase client"
      confidence: HIGH
    - title: "Support for Additional LLM Providers"
      description: "Expand backend proxy gateway to support optional third-party model inference providers via modular adapter interfaces."
      priority: MEDIUM
      expected_benefit: "Allows cross-provider pairwise benchmarking (e.g. comparing models from different labs)."
      difficulty: HIGH
      evidence:
        - "server.ts modular judgePromises structure"
      confidence: HIGH
  evidence_state: INFERRED
  confidence: MEDIUM
  evidence:
    - "server.ts and src/lib/realtime.ts"
  notes: ""
