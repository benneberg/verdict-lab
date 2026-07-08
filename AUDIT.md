# AUDIT.md

## 1. Correctness
- **Evaluation Averaging**: The aggregate scores of Variant A and Variant B in `geminiService.ts` are successfully computed through averaging across multi-judge consensus panels. However, if a judge fails, the error is caught and `null` is returned. If all judges fail, an exception is thrown.
- **State Persistence**: Firestore acts as the source of truth. Offline-first queries operate on real-time snapshots (`onSnapshot`). This is very responsive, but can trigger infinite re-renders if listeners are bound improperly in dependency arrays (they are currently correctly managed in `useEffect` setups).
- **Consensus Logic**: The tally logic is correct. However, in `Arena.tsx`, winner evaluation is based on simple majority tally. If the tally of A equals the tally of B, it defaults to a 'Tie', which is correct.

## 2. Security Assessment
- **Critical Risk - API Key Leakage (CVSS 9.8)**: 
  - **Evidence**: `vite.config.ts` uses `define: { 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY) }`.
  - **Impact**: Anyone inspecting the client network tab, source files, or compiled JS bundles can retrieve the fully qualified `GEMINI_API_KEY`.
  - **Mitigation**: Introduce an Express backend (as referenced in `package.json` dependencies like `express`) and route `/api/judge` through it.
- **Medium Risk - Loose Security Rules**:
  - **Evidence**: `firestore.rules` allow direct reading/writing. Let's check `firestore.rules` content (will review later, but users have read access to some shared resources).
- **Low Risk - XSS on Markdown rendering**:
  - **Evidence**: `ReactMarkdown` is used in `Arena.tsx` to display model outputs. If a model output contains malicious script payloads, it might be executed if HTML parsing is enabled.

## 3. Dependencies
- **Status**: Stable.
- Uses **React 19.0.1** and **Vite 6.2.3**.
- Tailwind v4 is integrated via `@tailwindcss/vite`.
- Uses `@google/genai` v1.29.0 which is the modern recommended Google Gen AI SDK.
- Zustand v5.0.13 is utilized for global client-side store values.

## 4. Performance
- **Client Aggregations**: The `Leaderboard` page calculates statistics inside a client-side loop iterating over the entire `experiments` collection.
  - **Impact**: As the experiment volume grows past hundreds/thousands of documents, this calculation will block the main thread and lead to browser freezing.
  - **Mitigation**: Replace with a pre-computed or server-side aggregated structure updated on write.

## 5. Observability
- **Status**: Weak.
- Debug statements are written to `console.log` and `console.error`.
- There are no central structured logging frameworks or crash reporting hooks.

## 6. CI/CD
- **Status**: Not Applicable / Missing.
- No automated deployment pipelines or GitHub actions are defined in the workspace.

## 7. Code Quality
- **Review**: Excellent modular file structure.
  - Types are declared clearly in matching components.
  - Custom UI elements like `PromptEditor` utilize standard modular patterns and maintain sync scrolling with textarea.
  - Proper Tailwind styling is used consistently across the dashboard.

## 8. Incomplete Work / Stubs
- **Supabase Real-time**: Fully initialised but only used for completed experiment notifications rather than true collaborative real-time editor room cursors.
- **Advanced Parameter Stubs**: Temperature, topK, topP are defined in `DressingRoom.tsx` but are not fully piped down into the execution panel.
