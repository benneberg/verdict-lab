# Verdict Lab — Architecture Specification 🏛️

> **Authoritative Technical Architecture Document**  
> *Last Updated*: August 2026  
> *System Target*: Verdict Lab (React 19 + Express 4 + Google GenAI + Firebase Firestore + Supabase Realtime)

---

## 1. System Overview

Verdict Lab is a full-stack, single-page application (SPA) backed by a dedicated Node.js/Express API gateway. It provides an empirical workbench for prompt engineering, pairwise LLM behavioral testing, and automated consensus evaluation with weighted rubrics and multi-judge models.

### High-Level Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Client Application                              │
│                                                                             │
│  React 19 SPA (Vite 6)                                                      │
│  ├── Global Navigation & Routing (react-router-dom)                         │
│  ├── Local Client State & Caching (Zustand: useStore)                       │
│  ├── Interactive Views (/arena, /lab, /registry, /benchmarks, /history)     │
│  └── Client Services (geminiService, metricsService)                        │
└─────────────────────────┬───────────────────────────────────┬───────────────┘
                          │ HTTP API                          │ Firestore SDK
                          │ (/api/*)                          │ (Direct Reads/Writes)
┌─────────────────────────▼──────────────────────────┐        │
│                Express API Gateway                 │        │
│                                                    │        │
│  Node.js Runtime (Port 3000, Host 0.0.0.0)         │        │
│  ├── Security Headers (helmet)                     │        │
│  ├── Rate Limiting (express-rate-limit)            │        │
│  ├── Input Schema Validation & Payload Limits      │        │
│  ├── Structured JSON Observability Logging         │        │
│  └── Vite Dev Middleware / Static Production Serve │        │
└──────────────┬───────────────────────────┬─────────┘        │
               │                           │ Server SDK       │
               │ Google GenAI              │ (Aggregations)   │
               │ SDK (@google/genai)       │                  │
┌──────────────▼──────────────┐ ┌──────────▼──────────────────▼───────────────┐
│     Google Gemini Engine    │ │             Firebase Firestore              │
│                             │ │                                             │
│  - gemini-3.1-pro-preview   │ │  Collections:                               │
│  - gemini-3.5-flash         │ │  ├── test_cards (protocols & rubrics)       │
│  - gemini-2.5-flash         │ │  ├── test_card_versions (audit diffs)       │
│                             │ │  └── experiments (evaluation runs)         │
│  Private GEMINI_API_KEY     │ │  Enforced by Cryptographic firestore.rules  │
└─────────────────────────────┘ └─────────────────────────────────────────────┘
```

---

## 2. System Components

### 2.1 Backend API Gateway (`server.ts`)
The backend is an Express 4 application running on Node.js that serves two core roles:
1. **API Gateway & Model Proxy**: Protects sensitive credentials (`GEMINI_API_KEY`) on the server. Clients never access Google GenAI credentials directly.
2. **Static Asset Host & Vite Middleware**: In development mode (`NODE_ENV !== "production"`), Vite middleware is mounted to handle HMR-less module resolution and SPA routing. In production, pre-compiled static assets in `dist/` are served with an SPA catch-all route.

**Network Invariants**:
- The server binds strictly to `0.0.0.0` on port `3000`. This is an unchangeable container ingress requirement.
- In production, `server.ts` is bundled into a single CommonJS artifact (`dist/server.cjs`) via `esbuild`.

### 2.2 Frontend SPA (`src/`)
Built with React 19 and bundled via Vite 6:
- **Routing**: Client-side routing managed by `react-router-dom` v7. Route changes render within a persistent application shell (`Layout.tsx`).
- **State Store**: Managed by Zustand (`src/store/useStore.ts`) with `localStorage` fallback persistence for offline continuity and session preservation.
- **Styling**: Tailwind CSS v4 using the modern `@tailwindcss/vite` plugin and utility classes.
- **Icons & Motion**: All icons are imported from `lucide-react`. Animations use `motion/react`.

### 2.3 Persistence & Real-Time Sync
- **Firebase Firestore**: Primary document database. Stores test card protocols, version snapshots, and completed evaluation runs. Access is regulated by object-level authorization in `firestore.rules`.
- **Supabase Realtime**: Used exclusively as a lightweight pub/sub event channel (`user-${userId}`) to broadcast completed experiments across multiple open tabs or collaborative clients.

---

## 3. The JDay Multi-Judge Evaluation Engine

The **JDay Consensus Engine** is the core analytical pipeline that evaluates candidate outputs against weighted rubrics.

### 3.1 Pipeline Flow

```
1. Client constructs evaluate payload
   (variantA, variantB, rubric, hypothesis, model list)
               │
               ▼
2. Client calls POST /api/evaluate with Auth Header
               │
               ▼
3. Server executes security checks:
   - Rate limit check (30 req/min)
   - Input schema validation (type, length <= 50,000 chars, model count <= 3)
               │
               ▼
4. Model List Mapping & Filtering
   (Replaces legacy/preview names with modern models: gemini-3.5-flash, gemini-3.1-pro-preview)
               │
               ▼
5. Concurrent Multi-Judge Invocation (Promise.all)
   - Dispatches evaluation prompt to each selected judge model
   - Structured JSON output enforced via Type.OBJECT schema
   - Judges evaluate: winner ("A" | "B" | "Tie"), confidence, metric scores, bias_flags, reasoning
               │
               ▼
6. Server-Side Result Synthesis & Tally:
   - Majority Vote Calculation: tally A vs. B vs. Tie
   - Score Normalization: arithmetic mean of scores per metric across all responding judges
   - Agreement / Reliability Index: max(tally) / total_valid_judges
   - Bias Flag Deduplication: collects unique flags identified across judges
   - Composite Reasoning Aggregation: combines per-judge justifications
               │
               ▼
7. Response returned to client and stored in Firestore experiments collection
```

### 3.2 Bias Mitigation Heuristics
The JDay system instruction embeds three active bias mitigation directives into every judge call:
1. **Style Normalization**: Directs judges to disregard personal stylistic preferences (e.g., Markdown table formatting, conversational tone) and evaluate strictly against rubric dimensions.
2. **Position Bias Awareness**: Directs judges to inspect both candidates twice before making a determination to counter primacy/recency bias.
3. **Verbosity Penalty**: Explicitly instructs judges not to reward longer responses if the additional tokens constitute fluff or padding.

### 3.3 Voting Resolution Invariants
- If `tally.A > tally.B` and `tally.A > tally.Tie`, winner is `"A"`.
- If `tally.B > tally.A` and `tally.B > tally.Tie`, winner is `"B"`.
- Otherwise (equal votes, or Tie has majority), winner is `"Tie"`.
- Consensus confidence is defined mathematically as `max(votes) / total_votes`.

---

## 4. Data Persistence & Firestore Schemas

All persistent records are stored in Firebase Firestore across three top-level collections:

### 4.1 Collection: `test_cards`
Represents an empirical testing protocol.
```typescript
interface TestCard {
  id: string;
  title: string;
  description: string;
  hypothesis: string;
  independentVariables: string[]; // e.g. ["persona", "tone", "output_format"]
  promptTemplate: string;         // May contain {variable} placeholders
  version: number;
  rubric: Record<string, { max: number; weight: number }>;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;              // ISO-8601
  updatedAt: string;              // ISO-8601
}
```

### 4.2 Collection: `test_card_versions`
Historical snapshots of test cards captured whenever a protocol is updated.
```typescript
interface TestCardVersion {
  id: string;
  cardId: string;
  version: number;
  promptTemplate: string;
  rubric: Record<string, { max: number; weight: number }>;
  hypothesis: string;
  changesSummary?: string;
  ownerId: string;
  createdAt: string;
}
```

### 4.3 Collection: `experiments`
Execution records of pairwise evaluation runs.
```typescript
interface Experiment {
  id: string;
  cardId?: string;
  variantA: { prompt: string; output: string };
  variantB: { prompt: string; output: string };
  judges: string[];
  verdict: {
    winner: "A" | "B" | "Tie";
    confidence: number;
    majority_vote_tally: { A: number; B: number; Tie: number };
    scores: {
      A: Record<string, number>;
      B: Record<string, number>;
    };
    bias_flags: string[];
    reasoning: string;
    inter_rater_reliability?: number;
  };
  inputs?: Record<string, any>;
  ownerId: string;
  createdAt: string;
}
```

---

## 5. Security Architecture

Verdict Lab implements defense-in-depth security across authorization, secret management, infrastructure, and input sanitization. Detailed policies are documented in [SECURITY.md](./SECURITY.md).

1. **Server-Side Key Isolation**: `GEMINI_API_KEY` is strictly confined to the Node.js runtime process and accessed only in `server.ts`. It is never provided to Vite or bundled into client code.
2. **Cryptographic Firestore Rules**: `firestore.rules` enforces `request.auth.uid == resource.data.ownerId` for document modifications and deletes. Read operations on `test_cards` are restricted to public cards or cards owned by the authenticated caller. Experiments are strictly private to their owner.
3. **API Rate Limiting**: The Express gateway applies `express-rate-limit`:
   - Global `/api/` ceiling: 120 requests per minute per IP.
   - Cost-intensive endpoints (`/api/evaluate`, `/api/inference`): 30 requests per minute per IP.
4. **Input Schema & Length Boundaries**: Requests to `/api/evaluate` and `/api/inference` validate types and enforce strict character ceilings (maximum 50,000 characters per variant/prompt, maximum 3 judge models, maximum 15 rubric metrics).
5. **ReDoS Resilience**: Prompt template variable interpolation uses explicit regular expression escaping (`escapeRegex`) before replacing placeholders, eliminating Regular Expression Denial of Service risks.
6. **Defensive HTTP Headers**: Configured with `helmet` for cross-origin resource protection and header hardening.

---

## 6. Architectural Invariants

The following constraints are non-negotiable architectural invariants:

1. **Port & Host Binding**: The backend server must bind to `0.0.0.0:3000`. Port 3000 is hardcoded in the deployment container routing infrastructure.
2. **No Client-Side AI API Keys**: Under no circumstances should `GEMINI_API_KEY` or any other LLM credential be prefixed with `VITE_` or read directly in browser components. All model interactions must pass through `/api/*` endpoints.
3. **Deterministic Tie Resolution**: When judge models disagree evenly (e.g., 1 vote A, 1 vote B), the system must produce a `"Tie"` verdict with proportional agreement confidence rather than arbitrarily favoring one variant.
4. **Single-Process Development & Production**: In development, `npm run dev` boots `server.ts` with tsx and embedded Vite. In production, `npm run build` compiles Vite assets to `dist/` and bundles `server.ts` to `dist/server.cjs` via esbuild, started via `node dist/server.cjs`.

---

## 7. Testing Strategy

The automated test suite in `src/tests/JDay.test.ts` uses **Vitest** to verify critical domain logic:

- **Consensus Tally Verification**: Validates majority determination, tie resolution, and agreement ratio calculations.
- **ReDoS & Injection Resilience**: Validates that prompt variable interpolation handles regex metacharacters (`.*+?^${}()|[]\`) safely without syntax exceptions or catastrophic backtracking.
- **Template Placeholder Parsing**: Validates extracting variable names (`{variable_name}`) without false positives on malformed or unclosed curly braces.

Run tests using:
```bash
npm run test
```
