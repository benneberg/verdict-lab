# Verdict Lab 🧪

Verdict Lab is a professional, high-performance workbench for AI researchers and prompt engineers. It provides a structured, full-stack environment to design pairwise model experiments, manage prompt templates with robust version control, and execute semantic evaluations through a unified multi-judge consensus engine.

---

## 🎨 Core Pillars of Verdict Lab

1. **Protocol Design & Linting (Test Lab)**
   - Isolate independent variables (e.g. prompt variants, temperature parameters).
   - Configure weighted evaluation rubrics.
   - **Modern Prompt Template Editor**: Real-time syntax highlighting for variables (e.g., `{idea}`), line number indicators, and template validation/linting.
   - **Visual Diff Viewer**: Interactive, line-by-line Git-style terminal diff viewer inside the version auditor to instantly compare legacy revisions against the current draft.

2. **Consensus Evaluation (Arena)**
   - **High-Throughput Batch Importer**: Paste bulk evaluation datasets in standard JSON array format to run dozens of pairwise runs sequentially.
   - **JDay Consensus Panel**: Select combinations of modern models (Gemini 3.1 Pro, Gemini 3.5 Flash, Gemini 2.5 Flash) as independent rater panels to reduce position bias and mitigate hallucinations.
   - Progressive queue counters, individual collateral logs, and raw response exports.

3. **Registry & Aggregation (Leaderboard)**
   - **Server-Side Aggregation**: Compute overall model win rates, average rater confidence, and inter-rater reliability scores via the secure backend Express proxy layer.
   - Interactive, searchable registry of user-authored protocols and community blueprints.

---

## 🏗️ Secure Full-Stack Architecture

Verdict Lab is engineered as a secure, full-stack Express + Vite application:
- **Zero API Key Exposure**: All inference requests and consensus checks route through secure backend proxy controllers (`/server.ts`). Secrets like `GEMINI_API_KEY` are read strictly server-side.
- **Asynchronous Data Layer**: Leaderboard metrics are aggregated asynchronously on the backend database layer, avoiding browser main-thread freezes.
- **State Synchrony**: Utilizes client-side Zustand state management and Firebase Firestore for real-time local persistence.

---

## 🚀 Installation & Setup

1. **Clone the Workspace** to your local system or container host.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (based on `.env.example`):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. **Initialize Firebase Config**:
   Place your standard Firebase web credentials configuration inside `firebase-applet-config.json` at the root.

---

## 💻 Development Commands

- **Start Full-Stack Dev Server**:
  ```bash
  npm run dev
  ```
  Runs the custom Express server (using `tsx`) on **Port 3000** with integrated Vite SPA middleware.

- **Run Automated Test Suite**:
  ```bash
  npm run test
  ```
  Runs Vitest unit tests verifying state, JDay consensus algorithms, and regex extraction logic.

- **Linter Static Check**:
  ```bash
  npm run lint
  ```

- **Build Production Bundle**:
  ```bash
  npm run build
  ```
  Compiles the React frontend into static assets in `dist/`, and bundles the backend TypeScript server into a self-contained CommonJS file (`dist/server.cjs`) using `esbuild`.

- **Start Production Build**:
  ```bash
  npm run start
  ```
