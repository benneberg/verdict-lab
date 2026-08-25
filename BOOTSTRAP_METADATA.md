schema:
  version: 1
  compatible_with:
    - CCC
  generated_by: Repository Bootstrap Prompt
  generated_at: "2026-08-25T04:20:02-07:00"
  repository: "Verdict Lab"

generator:
  value: "Repository Bootstrap Engine"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "System bootstrap prompt specification"
  notes: ""

schema_version:
  value: 1
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Header schema version definition"
  notes: ""

generation_mode:
  value: "EVIDENCE_BASED_DETERMINISTIC"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Strict YAML schema and extraction rules applied"
  notes: ""

execution_mode:
  value: "DYNAMIC_AND_STATIC_ANALYSIS"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Executed npm run test, npm run lint, compile_applet, and filesystem inspection"
  notes: ""

detected_languages:
  value:
    - TypeScript
    - JavaScript
    - HTML
    - CSS
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "tsconfig.json"
    - "package.json"
    - "src/*.tsx"
    - "src/*.ts"
    - "index.html"
    - "src/index.css"
  notes: ""

detected_frameworks:
  value:
    - React
    - Express
    - Tailwind CSS
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json dependencies: react (19.0.1), express (4.21.2), tailwindcss (4.1.14)"
  notes: ""

detected_build_system:
  value: "Vite + esbuild"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "vite.config.ts"
    - "package.json build script"
  notes: ""

detected_package_manager:
  value: "npm"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "package.json"
    - "package-lock.json"
  notes: ""

files_analysed:
  value: 38
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "All files in root, src/components, src/pages, src/services, src/store, src/tests, src/lib"
  notes: ""

evidence_coverage:
  value: "96/100"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Direct observation of all configuration, source code, routes, endpoints, tests, and styles"
  notes: ""

unknown_coverage:
  value: "4/100"
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Production CI/CD pipelines external to repository"
  notes: ""

overall_confidence:
  value: HIGH
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Verified via test execution, static typecheck, and full compilation"
  notes: ""

ccc_compatibility:
  value: true
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "Standardized CCC YAML intermediate representation schema followed across all files"
  notes: ""

purpose:
  value: "Deterministic repository bootstrap and audit intermediate representation (IR) for human inspection and automated tooling integration."
  evidence_state: OBSERVED
  confidence: HIGH
  evidence:
    - "System bootstrap prompt specification"
  notes: ""
