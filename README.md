# Verdict Lab 🧪

[![CI Pipeline](https://github.com/benneberg/verdict-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/benneberg/verdict-lab/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg?logo=express)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg?logo=vite)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6e9f18.svg?logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Empirical Prompt Engineering & LLM Behavioral Evaluation Workbench**

Verdict Lab is a full-stack developer workbench designed to bring scientific rigor, repeatable benchmarking, and bias-aware evaluation to prompt engineering and LLM application development. 

Rather than relying on informal "eyeball checks" or subjective qualitative impressions, Verdict Lab enables AI engineers and researchers to formulate testable hypotheses, isolate prompt variables, run side-by-side pairwise comparisons, and score model completions using a panel of automated LLM judges (the **JDay Consensus Engine**).

---

## Table of Contents

- [The Problem We Solve](#the-problem-we-solve)
- [Core Capabilities](#core-capabilities)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Quick Start](#quick-start)
- [Offline & Mock Mode](#offline--mock-evaluation-mode)
- [Evaluation Cache Layer](#evaluation-cache-layer)
- [Environment Configuration](#environment-configuration)
- [Application Views & Workflow](#application-views--workflow)
- [API Gateway Reference](#api-gateway-reference)
- [Verification & Testing](#verification--testing)
- [Local Firebase Emulator](#local-firebase-emulator)
- [Canonical Documentation](#canonical-documentation)

---

## The Problem We Solve

Optimizing system instructions and user prompt templates for production AI applications often suffers from several critical failure modes:

1. **Rater & Style Bias**: Individual evaluators (and individual LLM judges) frequently prefer outputs matching their own stylistic quirks or verbosity, obscuring true performance regressions.
2. **Position Bias**: Automated judges often favor whichever candidate response appears first in the evaluation prompt context.
3. **Uncontrolled Variables**: Changing multiple sentences, system instructions, and variables simultaneously prevents teams from identifying the root cause of an output improvement or regression.
4. **Lack of Repeatable Test Suites**: Without reusable test cards, teams struggle to re-run historical benchmarks when foundation models are updated or deprecated.

Verdict Lab solves these challenges through **structured test card authoring**, **independent variable tagging**, **Git-style prompt version diffing**, and **multi-judge consensus voting** with weighted multi-metric rubrics.

---

## Core Capabilities

### 1. Pairwise Execution Arena (`/arena`)
- Run candidate prompt variations (Variant A vs. Variant B) side-by-side in real time.
- Substitute template variables manually or run automated evaluations.
- Select from modern Gemini models (`gemini-3.1-pro-preview`, `gemini-3.5-flash`, `gemini-2.5-flash`).
- Built-in visual indicators for cached verdicts (0ms LLM latency) and simulated evaluations.

### 2. JDay Multi-Judge Consensus Engine
- Dispatch candidate responses to a configurable multi-model jury.
- Enforce structured JSON evaluation schemas (`winner`, `confidence`, `scores`, `bias_flags`, `reasoning`).
- Synthesize majority vote tallies and compute inter-rater agreement metrics.
- Active bias normalization: prompts actively instruct judges to avoid position bias, verbosity bias, and superficial formatting preference.

### 3. Test Lab & Protocol Studio (`/lab`)
- Design reusable test protocols ("Test Cards") with structured hypotheses, independent variable tags, and default prompt templates.
- Define weighted scoring rubrics across custom dimensions (e.g., Accuracy, Conciseness, Tone, Instruction Adherence).
- Real-time syntax-highlighting editor for `{variable}` extraction.

### 4. Git-Style Visual Version Comparison
- Inspect prompt iterations side-by-side with color-coded line-by-line diffs (additions, deletions, and modifications).
- Restore previous version snapshots with one click.

### 5. High-Throughput Batch Evaluator
- Upload or paste JSON array test cases directly into the Arena.
- Execute automated matrix evaluations across dozens of input variations sequentially with real-time progress indicators.

### 6. Evaluation Cache Layer & Latency Optimization
- Deterministic SHA-256 payload hashing of `(variantA, variantB, rubric, models)` tuples.
- In-memory LRU cache with configurable TTL (default: 1 hour) eliminating redundant LLM API calls and token spend.
- Telemetry endpoints (`GET /api/cache/stats`, `POST /api/cache/clear`) and cache bypass headers (`X-Bypass-Cache: true`).

### 7. Offline Demonstration & Mock Mode
- Complete feature exploration without requiring a live `GEMINI_API_KEY`.
- Heuristic-based mock engine returns realistic, schema-valid jury verdicts and synthetic responses.
- Interactive toggle in the UI Arena and Dressing Room settings.

### 8. Model Benchmark Leaderboard (`/benchmarks`)
- Server-side aggregated statistics across completed evaluation runs.
- Tracks win rates, loss rates, ties, average judge confidence, and peak confidence per model.

### 9. Historical Audit Trail (`/history`)
- Complete historical record of all evaluated runs with expandable verdict cards.
- Inspect exact judge reasoning, individual rater scores, and detected bias flags.

### 10. Real-Time Broadcast Sync
- Integrated Supabase Realtime broadcast channel (`experiment:complete`) to synchronize state updates across browser windows and team members.

---

## Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser Client                         │
│   React 19 (SPA) + Vite 6 + Tailwind CSS v4 + Zustand Store │
└───────────────┬───────────────────────────────┬─────────────┘
                │                               │
       HTTP API Requests                Firestore Reads /
     (/api/evaluate, /api/inference)     Realtime Sync
                │                               │
┌───────────────▼───────────────┐               │
│     Express API Gateway       │               │
│  (Node.js / tsx on Port 3000) │               │
│  - Helmet Security Headers    │               │
│  - Rate Limiting (express)    │               │
│  - Evaluation Cache Layer     │               │
│  - Offline Mock Engine        │               │
│  - Input Schema Validation    │               │
│  - Isolated GEMINI_API_KEY    │               │
└───────┬───────────────┬───────┘               │
        │               │                       │
 Google GenAI SDK  Mock Engine                  │
 (@google/genai)   (Offline)                    │
        │               │                       │
┌───────▼───────┐ ┌─────▼───────┐   ┌───────────▼─────────────┐
│ Gemini Models │ │ Mock Engine │   │    Firebase Firestore   │
│ - 3.1 Pro     │ │ Determin-   │   │  - test_cards           │
│ - 3.5 Flash   │ │ istic Eval  │   │  - test_card_versions   │
│ - 2.5 Flash   │ │ Schema      │   │  - experiments          │
└───────────────┘ └─────────────┘   └─────────────────────────┘
```

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion, Lucide Icons, Zustand
- **Backend Gateway**: Express 4, Node.js, `@google/genai` SDK, `helmet`, `express-rate-limit`, `crypto` SHA-256 caching
- **Persistence & Cloud**: Firebase Firestore (document store & security rules), Supabase (real-time broadcast)
- **Testing**: Vitest 4, Supertest (mocked gateway integration tests)

For comprehensive architectural specifications, consult [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root based on `.env.example`:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```
> **Security Note**: `GEMINI_API_KEY` is loaded exclusively by the backend Node.js process. It is never exposed to the client-side JavaScript bundle.

### 3. Start Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3000` (binding to `0.0.0.0:3000`).

---

## Offline / Mock Evaluation Mode

Verdict Lab includes a built-in deterministic simulation engine that allows testing and demonstrating the full application without requiring a Gemini API key.

- **Enable via UI**: Go to **Arena** or **Dressing Room** and toggle **MOCK EVALUATION MODE**.
- **Enable via Header**: Pass `X-Mock-Mode: true` on requests to `/api/evaluate` or `/api/inference`.
- **Enable via Query**: Add `?mock=true` to any API request.

---

## Evaluation Cache Layer

To avoid redundant LLM invocations and reduce costs during iterative prompt authoring, the Express gateway automatically computes a SHA-256 hash of each evaluation payload.

- **Cache Header**: Responses contain `X-Cache: HIT` or `X-Cache: MISS`.
- **Bypass Cache**: Send `X-Bypass-Cache: true` header to force a fresh model evaluation.
- **Cache Telemetry**: Accessible via `GET /api/cache/stats` and viewable in the **Dressing Room**.
- **Flush Cache**: Send `POST /api/cache/clear` or click "Flush Cache" in the Dressing Room.

---

## Environment Configuration

| Variable | Location | Description |
|---|---|---|
| `GEMINI_API_KEY` | Server (`.env`) | **Required for live mode**. Google Gemini API key used by backend evaluation and inference endpoints. |
| `VITE_SUPABASE_URL` | Client (optional) | Supabase project URL for optional cross-window real-time event broadcasting. |
| `VITE_SUPABASE_ANON_KEY` | Client (optional) | Supabase public anon key for real-time pub/sub channels. |

---

## Application Views & Workflow

| Route | View Name | Description |
|---|---|---|
| `/arena` | **Arena** | Pairwise execution laboratory. Execute Variant A and B, run batch JSON sets, and trigger JDay consensus evaluation. |
| `/lab` | **Test Lab** | Author and update test protocols with hypothesis statements, independent variables, and weighted rubrics. |
| `/registry` | **Protocol Registry** | Browse, filter, and clone existing test card protocols and benchmark suites. |
| `/benchmarks` | **Leaderboard** | View aggregated model performance metrics, win rates, and inter-rater agreement statistics. |
| `/history` | **Run History** | Detailed audit logs of all past experiment evaluations, verdicts, and bias flags. |
| `/profile` | **Dressing Room** | Configure workspace preferences, Mock Mode toggle, view Evaluation Cache stats, and flush cache. |
| `/about` | **System Manual** | Comprehensive guide explaining JDay engine mechanics, protocol design best practices, and FAQ. |

---

## API Gateway Reference

The Express server exposes dedicated API endpoints under `/api/` protected by rate limiting, validation, and caching:

### 1. `POST /api/evaluate`
Executes multi-judge consensus evaluation across two prompt completions.
- **Rate Limit**: 30 requests/minute per IP
- **Cache Behavior**: Checks SHA-256 in-memory cache; returns `X-Cache: HIT` on identical evaluations.
- **Request Body**:
  ```json
  {
    "variantA": "Output text from prompt version A...",
    "variantB": "Output text from prompt version B...",
    "hypothesis": "Structured JSON format reduces hallucination",
    "rubric": {
      "Accuracy": { "max": 10, "weight": 0.5 },
      "Conciseness": { "max": 10, "weight": 0.5 }
    },
    "models": ["gemini-3.5-flash", "gemini-3.1-pro-preview"],
    "mockMode": false
  }
  ```
- **Response**:
  ```json
  {
    "winner": "A",
    "confidence": 1.0,
    "majority_vote_tally": { "A": 2, "B": 0, "Tie": 0 },
    "scores": {
      "A": { "Accuracy": 9.5, "Conciseness": 9.0 },
      "B": { "Accuracy": 7.0, "Conciseness": 6.5 }
    },
    "bias_flags": [],
    "reasoning": "[Judge gemini-3.5-flash]: Variant A strictly adhered to...",
    "inter_rater_reliability": 1.0,
    "judges": ["gemini-3.5-flash", "gemini-3.1-pro-preview"],
    "cached": false,
    "isMock": false
  }
  ```

### 2. `POST /api/inference`
Executes single-model completion with safe hyperparameter allowlisting.

### 3. `GET /api/cache/stats`
Returns cache metrics (`hits`, `misses`, `size`, `hitRatio`, `evictions`).

### 4. `POST /api/cache/clear`
Flushes the in-memory evaluation cache.

---

## Verification & Testing

Verdict Lab includes a comprehensive test suite powered by Vitest and Supertest:

```bash
# Run all tests (unit + gateway integration)
npm run test

# Run Supertest API gateway integration tests only
npm run test:integration

# Run JDay consensus math unit tests only
npm run test:unit

# Run TypeScript type check / linting
npm run lint

# Compile production build
npm run build

# Start production server
npm run start
```

---

## Local Firebase Emulator

For offline development and Firestore security rules verification:

```bash
# Start local Firestore and Auth emulators with UI
npm run emulators:start

# Execute tests against the local emulator
npm run emulators:exec
```

---

## Canonical Documentation

For detailed information, please consult the authoritative documents:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: System design, cache layer specifications, data flow, and architectural invariants.
- **[CONTRIBUTING.md](./CONTRIBUTING.md)**: Development guidelines, coding standards, and testing procedures.
- **[SECURITY.md](./SECURITY.md)**: Security boundaries, secret key isolation, rate limits, and vulnerability reporting.
- **[REPOSITORY_STATUS.md](./REPOSITORY_STATUS.md)**: Comprehensive repository audit and production-readiness status.
- **[.llm-context/context.md](./.llm-context/context.md)**: Operational rules and architectural constraints for AI coding agents.
