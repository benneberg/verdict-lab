# Verdict Lab — AI Agent & LLM Context 🤖

This file provides critical, non-inferable context and operational constraints for AI coding agents working on the **Verdict Lab** repository.

---

## 1. Non-Negotiable Operational Constraints

1. **Port 3000 & Host 0.0.0.0 Invariant**:
   - The development and production servers **MUST** run on Port `3000` and host `0.0.0.0`.
   - External reverse proxy ingress only routes traffic through port 3000. Do **not** attempt to change the port or read alternative `PORT` environment variables.

2. **Server-Side API Key Isolation**:
   - `GEMINI_API_KEY` is loaded strictly in Node.js on the server (`server.ts`).
   - **Never** prefix `GEMINI_API_KEY` with `VITE_` or reference `process.env.GEMINI_API_KEY` in files under `src/`.
   - All AI interactions must pass through the Express gateway endpoints (`/api/evaluate` and `/api/inference`).

3. **No Hot Module Replacement (HMR)**:
   - HMR is intentionally disabled by the container platform environment (`DISABLE_HMR=true`).
   - Benign console notices such as `[vite] failed to connect to websocket` are normal and should not be "fixed".

---

## 2. Technology Stack & Coding Conventions

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Zustand, `react-router-dom` v7.
- **Styling**: Tailwind CSS v4 configured via `@tailwindcss/vite`.
  - Always use Tailwind utility classes directly.
  - Do **not** create auxiliary CSS files (e.g. `App.css`). Global styles reside in `src/index.css` via `@import "tailwindcss";`.
- **Icons**: Import **exclusively** from `lucide-react`. Do not create custom SVGs.
- **Animations**: Import **exclusively** from `motion/react` (e.g. `import { motion } from 'motion/react'`).
- **State Store**: Global application state is managed in `src/store/useStore.ts` with Zustand.
- **Testing**: Tests use `vitest` in `src/tests/JDay.test.ts`. Always verify changes with `npm run test` and `npm run lint`.

---

## 3. Core Architecture & Key Paths

| Path | Purpose |
|---|---|
| `/server.ts` | Express API Gateway, Google GenAI SDK integration, Vite middleware, rate limiting, and security headers |
| `/src/App.tsx` | Client router definitions, authentication provider integration, and layout wrappers |
| `/src/pages/Arena.tsx` | Pairwise execution laboratory, single and batch JSON runs |
| `/src/pages/TestLab.tsx` | Test protocol creator, independent variable tagger, and visual version diff viewer |
| `/src/pages/Leaderboard.tsx`| Model benchmark statistics and win-rate rankings |
| `/src/services/geminiService.ts` | Client proxy for `/api/evaluate` and `/api/inference` |
| `/src/store/useStore.ts` | Zustand store for test cards, active experiments, and user state |
| `/firestore.rules` | Security rules enforcing `request.auth.uid == resource.data.ownerId` |

---

## 4. JDay Consensus Engine Invariants

- **Prompt Variables**: Denoted by `{variable_name}` and replaced safely using regex-escaped metacharacters to prevent ReDoS.
- **Majority Vote Tally**:
  - `winner = "A"` if `tally.A > tally.B && tally.A > tally.Tie`
  - `winner = "B"` if `tally.B > tally.A && tally.B > tally.Tie`
  - `winner = "Tie"` otherwise
- **Agreement Metric**: Calculated as `max(tally) / total_valid_judges`.
