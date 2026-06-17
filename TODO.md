# Project Roadmap & Audit (TODO)

## 🔍 Critical Code Audit
- **Metric Aggregation**: Current `Leaderboard` aggregates on the client. For production, this MUST be moved to a Firebase Cloud Function for performance and to satisfy security rules (users shouldn't have read access to all global experiments).
- **Versioning Storage**: The versioning system currently saves a deep copy of the data. Implementation of a diff-based storage (e.g. JSON Patch) would be more efficient for large prompt templates.
- **Error Boundaries**: Lack of React Error Boundaries around the Arena execution layer. Network failures in the LLM proxy could lead to stale UI states.
- **Judge Diversity**: Currently hardcoded to use Gemini via the `/api/judge` proxy. Should be expanded to allow specific multi-model judging panels (e.g. GPT-4o vs Claude 3.5).

## 🚀 Near-Term Tasks (High Priority)
- [ ] **Server-Side Aggregation**: Move leaderboard calculations to a scheduled Cloud Function.
- [ ] **Collaborative Arenas**: Allow multiple users to join a live "Arena" session via Supabase Real-time.
- [ ] **CSV/JSON Bulk Import**: Enable uploading large evaluation datasets into the Arena at once.
- [ ] **Visual Diffing**: Integration of a library like `react-diff-viewer` for even clearer version comparisons in the Lab.

## 🛠 Feature Improvements
- [ ] **Rich Rubrics**: Add support for sliders and custom multi-choice metrics in the evaluation rubric.
- [ ] **Prompt Linting**: Integration of a linter to detect potential hallucination triggers in the PromptEditor.
- [ ] **Multi-Judge Majority Vote**: Update Arena to call 3+ models and return a majority-consensus verdict.

## 🐛 Known Stubs / Mockups
- **Supabase Real-time**: The foundation `realtime.ts` is integrated, but live collaborative editing isn't yet active in the `Arena`.
- **Dressing Room Settings**: Profile settings for advanced LLM parameters (streaming, stop sequences) are currently UI-only stubs.
