# Verdict Lab

Verdict Lab is a high-performance workbench for AI researchers and prompt engineers. It provides a structured environment to design pairwise experiments, manage experimental protocols with robust version control, and execute semantic evaluations through a unified judging engine.

## 1. Overview
Verdict Lab is built as a modular full-stack-ready React 19 application focusing on three primary pillars of prompt engineering:
- **Protocol Design (Test Lab)**: Isolate variables, configure weighted rubrics, and track version histories side-by-side.
- **Arena Execution (Live Evaluation)**: Inject parameters into variable slots and execute parallel multi-model judge panels (JDay Engine) with bias flags.
- **Registry & Benchmarks (Public Leaderboard)**: Browse the community marketplace and observe model win rates.

## 2. Installation
To set up Verdict Lab locally, perform the following steps:

1. Clone the repository to your workspace.
2. Install the necessary dependencies from your package manager:
   ```bash
   npm install
   ```
3. Copy `.env.example` to create a `.env` file and define the required parameters:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Place your Firebase app configuration into `firebase-applet-config.json` at the root directory.

## 3. Usage
- **Start Development Server**:
  ```bash
  npm run dev
  ```
  The application will be served on `http://localhost:3000`.
- **Protocol Management**: Use the **Test Lab** tab to design templates. Every revision increments the version registry, enabling side-by-side auditing and reversion.
- **Run Live Battles**: In the **Arena** tab, select a protocol, input your test inputs, and hit `EXECUTE_PROTOCOL` to run comparison tests across your choice of JDay judges.

## 4. Testing
Currently, the codebase does not have automated testing runners configured. To run static analysis and verify compilation before committing:
```bash
# Run TypeScript compiler typechecks
npm run lint

# Build the production bundle
npm run build
```

## 5. Build and Deploy
To compile the application assets for deployment:
```bash
npm run build
```
This script runs `vite build`, generating static HTML, CSS, and JS bundles inside the `dist/` directory, which can then be deployed to any static host or container engine.
