# System Architecture Design 🧪

Verdict Lab is a secure, full-stack, distributed application engineered for prompt evaluation and model consensus. It isolates private keys, performs high-concurrency judge scoring, and ensures real-time feedback with minimum main-thread impact.

---

## 1. Core Component Mapping

- **Client SPA (React + Vite)**: Configured with React 19 and Vite 6. Serves the responsive multi-view workbench dashboard: Arena, Test Lab, Registry, Benchmarks, History, and Dressing Room.
- **Zustand State Store**: Coordinates reactive client state, user authentication properties, and cached blueprinted templates.
- **PromptEditor Component**: Custom modular input deck that supports real-time syntax highlighting for variables (e.g. `{idea}`), line counters, and prompt linting.
- **Secure Backend API Gateway (Express / Node.js)**: Runs server-side on Port 3000. It proxies all Gemini model inferences and consensus checks, keeping secrets invisible to the user agent.
- **JDay Consensus Engine**: Orchestrates parallel model inference requests across selected model raters (Gemini 3.1 Pro, Gemini 3.5 Flash, Gemini 2.5 Flash), compiles the score matrices, checks for position biases, and synthesizes consensus ratios.

---

## 2. Secure Data Flow (Source of Truth)

- **Primary Database**: Firebase Firestore acts as the persistence layer:
  - `test_cards`: Draft and configuration states for active templates.
  - `test_card_versions`: Immutable, chronological records of saved template versions.
  - `experiments`: Detailed logs of individual runs containing inputs, outputs, consensus verdicts, and inter-rater reliability.
- **Real-Time Notification Channel**: Supabase Broadcast Channels publish real-time signals. When an experiment finishes, a thin transactional event payload is published to keep concurrent browser tabs synchronized.

### Transaction Path Flow Diagram:
```text
[Browser: User Run Action] ──> [Express Endpoint: /api/evaluate]
                                       │
                                       ├──> [Gemini Server SDK] (Private Keys Hidden)
                                       │          │
                                       │          ▼ (Consensus Result JSON)
                                       ├──> [Firestore: "experiments"] (Written Server-Side)
                                       │
                                       └──> [Supabase Broadcast] ──> [Synchronized UI Tabs]
```

---

## 3. Integrations & API Safety

- **Google Gen AI Server SDK (`@google/genai`)**: Configured strictly server-side inside `server.ts`. Calls the official models with structured JSON schemas for rater voting alignment.
- **Supabase Real-time sidecar**: Functions as an anonymous broadcast network to alert concurrent sessions of complete experiment cycles.

---

## 4. Deployment & Build Architecture

- **Production Bundle Pipeline**: 
  - The client React SPA compiles to static assets inside `dist/`.
  - The custom Node Express server compiles via `esbuild` to a single, self-contained, CommonJS file (`dist/server.cjs`). This bypasses any runtime Node relative ESM imports issues and ensures super-fast cold starts.
- **Runtime Environment**: Executed as a secure containerized Cloud Run service listening exclusively on **Port 3000** behind the platform Nginx gateway.

---

## 5. Risk Mitigation & Audit Ledger

- **Mitigated Key Exposition**: `GEMINI_API_KEY` has been completely removed from frontend build targets and moved to backend-only memory.
- **Mitigated Thread Starvation**: High-complexity aggregation computations (such as model win rates, average scores, and confidence) are performed off the browser main-thread on the Express `/api/leaderboard` route.
- **Fault Recovery**: Critical rendering screens and network invocation pipelines are guarded by a robust custom React Error Boundary layout to capture fetch errors without page crashes.
