# Verdict Lab Project Checklist

## 🔍 Critical Code Audit Fixes
- [x] **Secure API Key Storage**: Migrated `GEMINI_API_KEY` from frontend build replacement configuration to secure backend Express middleware route to prevent client-side secret leakage.
- [x] **Server-Side Leaderboard Aggregation**: Replaced high-complexity client-side loops with server-side aggregation (/api/leaderboard route) in Node.js, ensuring main-thread stability as the dataset grows.
- [x] **Automated Testing Suite**: Implemented robust Vitest spec tests (/src/tests/JDay.test.ts) covering model consensus math, regex extraction, and variable parsing.
- [x] **Error Boundaries**: Wrapped main layout and Arena invocation layers in a React Error Boundary (`ErrorBoundary.tsx`) to gracefully recover from any transient API failures.

## 🚀 Architectural Tasks (Completed)
- [x] **Differentiating Variables**: Added visual indicators and custom types supporting independent variable designations in the laboratory editor.
- [x] **Visual Diff Viewer**: Built custom line-by-line dark terminal git diff highlight comparisons inside the Test Lab protocol comparison modal, allowing side-by-side or stacked highlights of prompt changes.
- [x] **CSV / JSON Batch Import**: Added high-throughput JSON batch array input mode to the Arena with progressive execution trackers, collateral output logs, and unified consensus results.

## 🛠 Feature Improvements (Completed)
- [x] **Multi-Judge Diversity**: Enhanced the JDay Consensus Panel UI to support custom configurations of Gemini 3.1 Pro, Gemini 3.5 Flash, and Gemini 2.5 Flash to eliminate single-rater bias.
- [x] **Rich Rubric Metrics**: Supported non-integer weighted multi-variable rubric evaluation systems directly within the model judge prompting prompts.
- [x] **Prompt Linting Integration**: Embedded real-time syntax checking, live simulation templates, and variable validation triggers in the `PromptEditor` code field.

## 🐛 Known Stubs / Mockups (Synchronized & Resolved)
- [x] **Supabase Real-time Collaboration**: Connected real-time experiment channels to broadcast state synchronizations upon run finalizations.
- [x] **Advanced Dressing Room Parameters**: Configured secure environment-based model credentials proxying.

## 🛡️ Security Hardening Tasks (From Security Audit)

### Phase 1: Critical & High Priority
- [ ] **Harden Firestore Rules Ownership Check (SEC-001)**: Refactor `firestore.rules` so that `isOwner` verifies `request.auth != null && request.auth.uid == resource.data.ownerId` (and `request.resource.data.ownerId` on create) instead of merely checking for a non-empty string.
- [ ] **Restrict Public Reads in Firestore (SEC-002)**: Update `firestore.rules` so `/test_cards` only permits read access if `resource.data.isPublic == true` or if `resource.data.ownerId == request.auth.uid`. Restrict `/test_card_versions` and `/experiments` to authenticated owners only.
- [ ] **Enforce Backend API Authentication (SEC-003)**: Add authentication middleware to Express routes (`/api/evaluate`, `/api/inference`, `/api/leaderboard`) to verify incoming client authorization tokens before initiating LLM requests.
- [ ] **Implement Rate Limiting Middleware (SEC-004)**: Integrate `express-rate-limit` on `/api/evaluate` and `/api/inference` to prevent API quota exhaustion, DoS, and cost inflation attacks.
- [ ] **Add Request Schema & Boundary Validation (SEC-005)**: Implement strict boundary and type validations in `server.ts` (cap `models` array to max 3 items, constrain prompt lengths, allowlist generation config fields).

### Phase 2: Medium Priority
- [ ] **Cryptographic Guest Session Isolation (SEC-006)**: Replace the static `'guest_user'` ID in `App.tsx` with dynamic cryptographically unique IDs (e.g. `crypto.randomUUID()`) or Firebase Anonymous Authentication to eliminate multi-tenant data collisions.
- [ ] **Unify Client Authentication Architecture (SEC-007)**: Consolidate auth mechanisms to ensure Firebase client authentication tokens are present and aligned for Firestore rule evaluation.
- [ ] **Install Helmet & Configure Security Headers (SEC-008)**: Add `helmet` middleware in `server.ts` to configure Content-Security-Policy (CSP), HSTS, `X-Content-Type-Options`, and `X-Frame-Options`.
- [ ] **Escape Dynamic Regex Metacharacters (SEC-009)**: Sanitize template variable keys before creating `RegExp` objects in `Arena.tsx` and `PromptEditor.tsx` to prevent ReDoS and regex syntax errors.
- [ ] **Paginate and Limit Leaderboard Queries (SEC-010)**: Add query limits (`limit(200)`) to the Firestore read in `/api/leaderboard` to prevent unbounded memory usage and high read costs.

### Phase 3: Operational & Hygiene Improvements
- [ ] **Sanitize Server Error Responses (SEC-012)**: Mask internal error details and upstream exception messages in HTTP responses, returning user-safe status messages while maintaining server-side logs.
- [ ] **Adopt Structured JSON Logging (SEC-013)**: Replace raw `console.error` calls with structured logging incorporating timestamps and request correlation IDs.
- [ ] **Secure Client Local Storage (SEC-011)**: Audit sensitive state saved in Zustand `localStorage` persist to reduce exposed profile metadata in browser storage.

