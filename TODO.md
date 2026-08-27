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
- [x] **Harden Firestore Rules Ownership Check (SEC-001)**: Refactored `firestore.rules` so that `isOwner` verifies `request.auth != null && request.auth.uid == userId` and enforced across all create/update/delete actions.
- [x] **Restrict Public Reads in Firestore (SEC-002)**: Updated `firestore.rules` so `/test_cards` only permits read access if `resource.data.isPublic == true` or if `resource.data.ownerId == request.auth.uid`. Restricted `/test_card_versions` and `/experiments` to authenticated owners and verified public cards.
- [x] **Enforce Backend API Authentication (SEC-003)**: Added authentication header verification middleware and client token dispatching to `/api/evaluate` and `/api/inference`.
- [x] **Implement Rate Limiting Middleware (SEC-004)**: Integrated `express-rate-limit` across `/api/` with strict quotas on `/api/evaluate` and `/api/inference` to prevent API exhaustion and cost inflation.
- [x] **Add Request Schema & Boundary Validation (SEC-005)**: Implemented strict payload length, rubric structure, model allowlist, and body parameter boundary validation in `server.ts`.

### Phase 2: Medium Priority
- [x] **Cryptographic Guest Session Isolation (SEC-006)**: Replaced static guest user ID with Firebase Anonymous Authentication and cryptographic UUID fallbacks to eliminate multi-tenant state collisions.
- [x] **Unify Client Authentication Architecture (SEC-007)**: Integrated native Firebase Authentication for email/password, Google sign-in, and guest sessions with state synchronization.
- [x] **Install Helmet & Configure Security Headers (SEC-008)**: Added `helmet` security middleware in `server.ts` configuring cross-origin resource policies, referrer policies, and frame protections.
- [x] **Escape Dynamic Regex Metacharacters (SEC-009)**: Added regex metacharacter escaping and safe template replacement functions to prevent ReDoS attacks in prompt variable substitutions.
- [x] **Paginate and Limit Leaderboard Queries (SEC-010)**: Added query limits (`limit(200)`) on server-side Firestore operations in `/api/leaderboard` to prevent unbounded memory usage and DoS.

### Phase 3: Operational & Hygiene Improvements
- [x] **Sanitize Server Error Responses (SEC-012)**: Masked internal error details and upstream exception traces in HTTP responses, returning user-safe status messages while maintaining server logs.
- [x] **Adopt Structured JSON Logging (SEC-013)**: Implemented structured JSON logging with timestamps, log levels, and metadata context in `server.ts`.
- [x] **Secure Client Local Storage (SEC-011)**: Audited and restricted Zustand persistence to prevent exposing unencrypted profile data in browser `localStorage`.

