# ARCHITECTURE.md

## 1. Components
- **Client SPA (React / Vite)**: Built on React 19 and Vite 6. Consists of a responsive layout wrapping pages: Arena, Test Lab, Registry, Benchmarks, History, and dressing room.
- **Zustand State Store**: Manages global logged-in user state and cached shared collections.
- **PromptEditor Component**: Custom modular rich-text view that parses variable strings (`{variable_name}`) dynamically and layers them inside an absolutely positioned highlighting viewport.
- **Judge Day (JDay) Service**: Client-side async coordinator that triggers parallel calls across selected models and outputs synthesized average scores.

## 2. Data Flow (Source of Truth)
- **Primary Database**: Firebase Firestore is the absolute source of truth.
  - Active draft updates are committed to the `test_cards` collection.
  - Immutable historical states are written to the `test_card_versions` collection.
  - Evaluation results, along with metrics and judge output logs, are written to `experiments`.
- **Real-Time Notification Pipe**: Supabase Broadcast Channels are used as a sidecar transaction notifications publisher. When an experiment is complete, a lightweight broadcast payload is pushed to all subscribed clients.

```text
[User Action: Run] ──> [Vite UI / Arena]
                           │
                           ├──> [Gemini AI API] (Multi-Judge Generation)
                           │         │
                           │         ▼ (Evaluation Metrics JSON)
                           ├──> [Firestore: "experiments"] (Commit Source of Truth)
                           │
                           └──> [Supabase Broadcast] ──> [Subscribed Clients]
```

## 3. Integrations
- **Google Gen AI (Gemini)**: Interacts with Gemini models (`gemini-1.5-pro-preview-0514`, `gemini-1.5-flash-preview-0514`, `gemini-3-flash-preview`) to perform prompt inference and rubric evaluation.
- **Supabase Real-time**: Connects as an anonymous broadcast network to alert sessions of completed runs.

## 4. Deployment Model
- Containerized Cloud Run instance served on port 3000 behind an Nginx reverse proxy. Static files are generated via `vite build` and served to clients.

## 5. Observability
- Observability is presently limited to standard runtime debug console statements (`console.log`, `console.warn`, `console.error`) capturing API anomalies and execution failures.

## 6. Risks & Security
- **Insecure Key Exposition**: Placing `GEMINI_API_KEY` inside `vite.config.ts`'s `define` results in the private key being printed into client-side build files. Anyone can inspect network resources or compiled script bundles to steal this credential.
- **Client Thread Starvation**: The leaderboard calculates averages on the client thread by loading all public documents, which will degrade in performance as document volume climbs.

## 7. Recommended Improvements
- Introduce an Express API gateway to proxy model inferences and evaluations. This keeps `GEMINI_API_KEY` fully server-side.
- Move performance aggregations to a scheduled Firebase Cloud Function that computes statistics once every hour and saves the result in a standalone `leaderboard_cache` Firestore collection.

## 8. Section Confidence Levels
- **Components**: High
- **Data Flow**: High
- **Integrations**: High
- **Deployment Model**: High
- **Observability**: High
- **Risks & Security**: High
- **Recommended Improvements**: High
