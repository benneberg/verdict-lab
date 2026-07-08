# TODO.md

## 🔍 Critical Code Audit Fixes
- [ ] **Secure API Key Storage**: Migrate the `GEMINI_API_KEY` from a frontend build-time replacement config (`define` in `vite.config.ts`) to a secure backend Express middleware route to prevent client-side secret exposure.
- [ ] **Server-Side Leaderboard Aggregation**: Replace client-side aggregation loops on the `experiments` collection with an asynchronous background calculation trigger (e.g. Firebase Cloud Function) to avoid browser main-thread blockage as data volume expands.
- [ ] **Automated Testing Suite**: Configure Vitest and `@testing-library/react` and implement test specs for critical state-management flows, JDay consensus tallies, and variable highlight regexes.
- [ ] **Error Boundaries**: Install React Error Boundaries around the Arena execution and API invocation layers to gracefully capture fetch errors and prevent whole-page crashes.

## 🚀 Near-Term Tasks (High Priority)
- [ ] **Differentiating Variables**: Support custom types/ranges for independent variables (e.g., specific float temperatures or system roles) instead of basic strings.
- [ ] **Visual Diff Viewer**: Integrate `react-diff-viewer` into the Test Lab version auditor to show actual inline diff highlight comparisons between current drafts and saved historical states.
- [ ] **CSV / JSON Batch Import**: Add utility to bulk import evaluation datasets into the Arena to execute hundreds of variations at once.

## 🛠 Feature Improvements
- [ ] **Multi-Judge Diversity**: Allow the user to specify distinct panel combinations (e.g., mixture of GPT models, Claude, and Gemini) in their judge consensus dashboard rather than only Gemini.
- [ ] **Rich Rubric Metrics**: Support non-integer grading rubrics, like sliders and checkboxes.
- [ ] **Prompt Linting Integration**: Embed standard security and instruction-inject linters in the `PromptEditor` component.

## 🐛 Known Stubs / Mockups
- [ ] **Supabase Real-time Collaboration**: The foundation `realtime.ts` is integrated and loaded, but collaborative multi-user sessions/cursors are not yet fully piped into the active Lab editors.
- [ ] **Advanced Dressing Room Parameters**: LLM configuration parameters (such as topK, topP, and custom stop sequences) are currently UI-only stubs and do not actively modify JDay API calls.
