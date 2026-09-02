# Verdict Lab — Architecture Specification 🏛️

> **Authoritative Technical Architecture Document**  
> *Last Updated*: September 2026  
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
│  ├── Local Client State & Mock Toggle (Zustand: useStore)                   │
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
│  ├── Evaluation Cache Layer (SHA-256 LRU Store)    │        │
│  ├── Offline Mock Engine (Deterministic Sim)       │        │
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
The backend is an Express 4 application running on Node.js that serves core operational roles:
1. **API Gateway & Model Proxy**: Protects sensitive credentials (`GEMINI_API_KEY`) on the server. Clients never access Google GenAI credentials directly.
2. **Evaluation Cache Layer (`evalCache.ts`)**: Generates deterministic SHA-256 digests of `(variantA, variantB, rubric, models)` payloads, returning instant cached responses (`X-Cache: HIT`) to eliminate redundant LLM token spend.
3. **Offline Mock Engine (`mockEngine.ts`)**: Evaluates responses using heuristic algorithms when `mockMode` or `X-Mock-Mode` is enabled or when `GEMINI_API_KEY` is not present, allowing full end-to-end demonstrations offline.
4. **Static Asset Host & Vite Middleware**: In development mode (`NODE_ENV !== "production"`), Vite middleware is mounted to handle HMR-less module resolution and SPA routing. In production, pre-compiled static assets in `dist/` are served with an SPA catch-all route.

**Network Invariants**:
- The server binds strictly to `0.0.0.0` on port `3000`. This is an unchangeable container ingress requirement.
- In production, `server.ts` is bundled into a single CommonJS artifact (`dist/server.cjs`) via `esbuild`.

### 2.2 Frontend SPA (`src/`)
Built with React 19 and bundled via Vite 6:
- **Routing**: Client-side routing managed by `react-router-dom` v7. Route changes render within a persistent application shell (`Layout.tsx`).
- **State Store**: Managed by Zustand (`src/store/useStore.ts`) with `localStorage` persistence for preferences and mock mode status.
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
3. Server executes security & cache checks:
   - Rate limit check (30 req/min)
   - Input schema validation (type, length <= 50,000 chars, model count <= 3)
   - SHA-256 Cache Lookup: If match found & !X-Bypass-Cache -> Return X-Cache: HIT
               │
               ▼
4. Mode Check: If mockMode / X-Mock-Mode -> Execute Deterministic Mock Engine
               │
               ▼
5. Model List Mapping & Filtering
   (Replaces legacy/preview names with modern models: gemini-3.5-flash, gemini-3.1-pro-preview)
               │
               ▼
6. Concurrent Multi-Judge Invocation (Promise.all)
   - Dispatches evaluation prompt to each selected judge model
   - Structured JSON output enforced via Type.OBJECT schema
   - Judges evaluate: winner ("A" | "B" | "Tie"), confidence, metric scores, bias_flags, reasoning
               │
               ▼
7. Server-Side Result Synthesis & Tally:
   - Majority Vote Calculation: tally A vs. B vs. Tie
   - Score Normalization: arithmetic mean of scores per metric across all responding judges
   - Agreement / Reliability Index: max(tally) / total_valid_judges
   - Bias Flag Deduplication: collects unique flags identified across judges
   - Composite Reasoning Aggregation: combines per-judge justifications
   - Stores synthesized result in Evaluation Cache
               │
               ▼
8. Response returned to client and stored in Firestore experiments collection
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

## 4. Evaluation Cache Architecture (`evalCache.ts`)

To optimize latency and prevent unnecessary token consumption, Verdict Lab implements a dedicated SHA-256 in-memory evaluation cache:

- **Canonical Key Generation**:
  Payload attributes `variantA`, `variantB`, `hypothesis`, sorted `rubric` keys, and sorted `models` are serialized into a canonical JSON string and hashed using SHA-256.
- **LRU Eviction**:
  Maintains a default capacity of 500 entries with a 1-hour time-to-live (TTL). When capacity is exceeded, least recently accessed entries are automatically evicted.
- **Telemetry & Management**:
  - `GET /api/cache/stats`: Exposes cache hits, misses, active size, hit ratio, and evictions.
  - `POST /api/cache/clear`: Flushes all cache keys.
  - `X-Bypass-Cache: true`: Header to force re-evaluation from live LLM models.

---

## 5. Offline Demonstration & Mock Engine (`mockEngine.ts`)

The offline engine provides a deterministic, zero-dependency environment for testing, demonstrations, and CI test pipelines:

- **Heuristic Quality Scoring**: Analyzes structural clarity, presence of markdown lists, word count density, and keyword match with the test hypothesis.
- **Strict Schema Compliance**: Emits complete payload structures conforming to `EvaluationResult` (winner, confidence, scores, reasoning, bias flags).
- **Synthetic Inference**: Responds to `/api/inference` requests with context-aware responses incorporating prompt parameters.

---

## 6. Data Persistence & Firestore Schemas

All persistent records are stored in Firebase Firestore across three top-level collections:

### 6.1 Collection: `test_cards`
```typescript
interface TestCard {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  independent_variable: string;
  variants: Array<{ id: string; label: string; prompt_template: string }>;
  evaluation_rubric: Record<string, { max: number; weight: number }>;
  input_schema: Record<string, any>;
  ownerId: string;
  createdAt: any;
}
```

### 6.2 Collection: `test_card_versions`
```typescript
interface TestCardVersion {
  id: string;
  cardId: string;
  version: number;
  prompt_template: string;
  evaluation_rubric: Record<string, any>;
  hypothesis: string;
  changes_summary?: string;
  ownerId: string;
  createdAt: any;
}
```

### 6.3 Collection: `experiments`
```typescript
interface Experiment {
  id: string;
  testCardId?: string;
  input: Record<string, any>;
  results: Record<string, string>; // { A: outputA, B: outputB }
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
    cached?: boolean;
    isMock?: boolean;
  };
  judges: string[];
  ownerId: string;
  createdAt: any;
}
```

---

## 7. Security Architecture

Verdict Lab implements defense-in-depth security:

1. **Server-Side Key Isolation**: `GEMINI_API_KEY` is strictly confined to the Node.js runtime process and accessed only in `server.ts`. It is never provided to Vite or bundled into client code.
2. **Cryptographic Firestore Rules**: `firestore.rules` enforces `request.auth.uid == resource.data.ownerId` for document modifications and deletes. Read operations on `test_cards` are restricted to public cards or cards owned by the authenticated caller. Experiments are strictly private to their owner.
3. **API Rate Limiting**: The Express gateway applies `express-rate-limit`:
   - Global `/api/` ceiling: 120 requests per minute per IP.
   - Cost-intensive endpoints (`/api/evaluate`, `/api/inference`): 30 requests per minute per IP.
4. **Input Schema & Length Boundaries**: Requests to `/api/evaluate` and `/api/inference` validate types and enforce strict character ceilings (maximum 50,000 characters per variant/prompt, maximum 3 judge models, maximum 15 rubric metrics).
5. **ReDoS Resilience**: Prompt template variable interpolation uses explicit regular expression escaping (`escapeRegex`) before replacing placeholders.
6. **Defensive HTTP Headers**: Configured with `helmet` for cross-origin resource protection and header hardening.

---

## 8. Testing Strategy

The automated test suite in `src/tests/` uses **Vitest** and **Supertest**:

- **API Gateway Integration Tests (`src/tests/api.test.ts`)**: Validates input validation error branches, character limits, mock evaluation mode, cache hits/misses, telemetry, and bypass headers with Supertest.
- **Consensus Tally Verification (`src/tests/JDay.test.ts`)**: Validates majority determination, tie resolution, and agreement ratio calculations.
- **ReDoS & Injection Resilience**: Validates that prompt variable interpolation handles regex metacharacters safely without catastrophic backtracking.
- **Template Placeholder Parsing**: Validates extracting variable names without false positives on malformed curly braces.

Run tests using:
```bash
npm run test
```
