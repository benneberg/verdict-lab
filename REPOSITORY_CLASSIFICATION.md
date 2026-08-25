schema:
  version: 1
  compatible_with:
    - CCC
  generated_by: Repository Bootstrap Prompt
  generated_at: "2026-08-25T04:20:02-07:00"
  repository: "Verdict Lab"

repository_type:
  value: WEB_APP
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json dependencies: express, react, react-dom, react-router-dom, vite"
    - "server.ts: Express application serving static SPA assets and API routes"
    - "src/App.tsx: React single-page application routing"
  notes: "Full-stack web application with React SPA client and Express server proxy"

repository_status:
  value: ACTIVE
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Working build system and dev server scripts in package.json"
    - "Passing test suite in src/tests/JDay.test.ts"
    - "Active UI pages in src/pages"
  notes: ""

complexity:
  value: MODERATE
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Full-stack architecture with Express backend and React 19 frontend"
    - "Firebase Firestore integration and Supabase Realtime broadcast integration"
    - "Multi-judge evaluation consensus engine with structured JSON schemas"
  notes: ""

primary_language:
  value: TypeScript
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "tsconfig.json"
    - "package.json devDependencies: typescript (~5.8.2), tsx"
    - "*.ts and *.tsx source files across server.ts and src/"
  notes: ""

secondary_languages:
  value:
    - JavaScript
    - CSS
    - HTML
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "index.html"
    - "src/index.css (Tailwind CSS v4)"
  notes: ""

primary_framework:
  value: React
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json dependencies: react (19.0.1), react-dom (19.0.1)"
    - "src/main.tsx and src/App.tsx"
  notes: "Paired with Express 4 on the backend"

build_system:
  value: Vite
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "vite.config.ts"
    - "package.json scripts: vite build, esbuild server.ts"
  notes: "Frontend built via Vite, server bundled via esbuild"

package_manager:
  value: npm
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json"
    - "package-lock.json"
  notes: "bun.lock also present in root"

test_framework:
  value: Vitest
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json devDependencies: vitest (^4.1.10)"
    - "package.json scripts: vitest run"
    - "src/tests/JDay.test.ts"
  notes: "Vitest test suite executing and passing 7 tests"

workspace_or_single_repository:
  value: Single Repository
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Single root package.json without npm/pnpm/yarn workspaces defined"
  notes: ""

repository_maturity:
  value: PROTOTYPE
  evidence_state: INFERRED
  confidence: MEDIUM
  evidence:
    - "package.json version: 0.0.0"
    - "metadata.json present"
    - "Functional core features implemented with in-memory/mock fallback capabilities"
  notes: ""

overall_confidence:
  value: HIGH
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Complete package manifests, server code, test suite, and UI pages observed"
  notes: ""

evidence_summary:
  value:
    - "Verified package.json scripts, dependencies, devDependencies"
    - "Verified TypeScript codebase in server.ts and src/"
    - "Verified test suite execution output (7 passed tests)"
    - "Verified linter execution (tsc --noEmit passed)"
    - "Verified production build compilation"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Live command executions and filesystem examination"
  notes: ""

unknown_areas:
  value:
    - "Production deployment target container configuration beyond Cloud Run dev container"
    - "Production CI/CD workflow definitions"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "No .github/workflows directory present in repository root"
  notes: ""
