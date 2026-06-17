# Verdict Lab System Architecture

Verdict Lab is a multi-tier behavioral evaluation platform for Large Language Models (LLMs), designed for high-reproducibility experimental design.

## 🏗 System Design

### 1. Data Layer (Firebase & Supabase)
- **Firebase Firestore**: Primary transactional database for Test Cards (Protocols), Versions, and Historical Verdicts. 
  - `test_cards`: Core experimental blueprints.
  - `test_card_versions`: Immutable history of protocol changes for regression testing.
  - `experiments`: Execution logs containing input values, raw LLM outputs, and judge verdicts.
- **Supabase Auth & Real-time**: 
  - Comprehensive user lifecycle management (Signup, Login, Profiles).
  - Real-time event bus for collaborative evaluation synchronization (future roadmap).

### 2. The Logic Engine (Frontend & Backend)
- **Zustand Store**: manages global application state, including user sessions, shared laboratory registry data, and UI preferences.
- **Judge Day Synthesis**: Local synthesis service that parses rubric metrics and judge reasoning to generate a definitive "Verdict".
- **Prompt Marketplace Architecture**: A decentralized "Import/Export" flow that allows users to fork communal protocols while maintaining private ownership.

### 3. API Proxy Hierarchy
To maintain security, all LLM inference keys (Gemini, OpenAI, etc.) are proxied through a server-side route:
- `/api/judge`: Server-side endpoint that handles JDay Engine calls using the `GEMINI_API_KEY` stored securely in environment variables.

## 🔄 State Transitions

1. **Protocol Design**: User creates a `TestCard`. 
2. **Execution**: The `Arena` converts a `TestCard` + `Inputs` into an `Experiment`.
3. **Auditing**: `History` provides a deep-dive into the reasoning traces of the Judge.
4. **Benchmarking**: The `Leaderboard` periodically aggregates all `Experiment` data into global model performance coefficients.

## 🔐 Security & Privacy
- **Owner Isolation**: All Firestore documents are guarded by rules requiring `ownerId === request.auth.uid`.
- **Anonymization**: Leaderboard data is aggregated using only model identifiers and weighted scores; raw user prompts and identifiers are stripped during the aggregation phase.
- **Secret Management**: No client-side exposure of inference provider keys.
