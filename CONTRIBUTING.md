# Contributing to Verdict Lab 🧪

Thank you for your interest in contributing to **Verdict Lab**! We welcome contributions to help make empirical prompt engineering and LLM behavioral testing more robust, bias-aware, and reproducible.

---

## 1. Prerequisites

Ensure you have the following installed in your local environment:
- **Node.js**: Version 18.x or higher (LTS recommended)
- **npm**: Version 9.x or higher
- **Google Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/) for running local evaluation tests.

---

## 2. Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/verdict-lab.git
   cd verdict-lab
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The development server will boot at `http://localhost:3000`.

---

## 3. Architecture & Code Structure

Before making changes, please familiarize yourself with the codebase structure:

```
├── server.ts                    # Express API gateway & Vite dev middleware
├── index.html                   # Browser entry point
├── package.json                 # Project dependencies and lifecycle scripts
├── tsconfig.json                # TypeScript compiler configuration
├── firestore.rules              # Firebase Firestore security rules
├── src/
│   ├── main.tsx                 # React DOM client entry point
│   ├── App.tsx                  # Root router and layout shell
│   ├── index.css                # Global stylesheet (@import "tailwindcss";)
│   ├── components/              # Modular, reusable UI components
│   ├── pages/                   # Top-level view routes (/arena, /lab, etc.)
│   ├── services/                # Client API callers (geminiService, metricsService)
│   ├── store/                   # Global Zustand state management
│   ├── tests/                   # Vitest unit test specifications
│   └── lib/                     # Firebase, Supabase, and utility helpers
```

Please review **[ARCHITECTURE.md](./ARCHITECTURE.md)** for in-depth system diagrams, data schemas, and the JDay consensus algorithm.

---

## 4. Coding Conventions & Standards

### 4.1 TypeScript & Type Safety
- **Strict Typing**: Avoid `any` types whenever possible. Declare explicit TypeScript interfaces or types for all function signatures and component props.
- **Top-Level Named Imports**: Always use top-level named imports (e.g., `import { useState } from 'react'`).
- **Linter Cleanliness**: Verify there are no type check errors before submitting code:
  ```bash
  npm run lint
  ```

### 4.2 UI & Styling (Tailwind CSS v4)
- **Tailwind Utility Classes**: Use Tailwind utility classes directly on JSX elements. Avoid inline `style` tags or creating auxiliary CSS files.
- **Responsive Layouts**: Use mobile-first responsive prefixes (`sm:`, `md:`, `lg:`).
- **Icons**: All icons **MUST** be imported from `lucide-react`. Do not write raw SVG icon paths.
- **Animations**: Use `motion/react` for animations and transition effects.

### 4.3 Component Modularity
- Split complex page logic into focused sub-components inside `src/components/`.
- Wrap complex interactive routes with `<ErrorBoundary>` to prevent entire application crashes.
- Never update state directly in React render cycles; follow standard React hook lifecycle practices.

### 4.4 Backend & API Invariants
- **Port 3000 Invariant**: The server must always listen on `0.0.0.0:3000`. Do not change the port binding.
- **Secret Isolation**: `GEMINI_API_KEY` must **never** be exposed in client code or prefixed with `VITE_`. All model calls must go through `/api/evaluate` or `/api/inference`.
- **Input Validation**: All new endpoints must enforce strict input validation, length limits, and rate limiting.

---

## 5. Testing & Verification

All contributions modifying core evaluation logic, regex parsers, or tally algorithms must include automated test coverage:

```bash
# Run unit test suite
npm run test

# Run TypeScript type check
npm run lint

# Verify production build compilation
npm run build
```

Unit tests reside in `src/tests/` and are executed using **Vitest**. If you introduce a new scoring heuristic or variable parser, write corresponding tests in `src/tests/`.

---

## 6. Pull Request Guidelines

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/my-new-improvement
   ```
2. **Ensure Verification Checks Pass**:
   - `npm run lint` passes with 0 errors.
   - `npm run test` passes with all tests green.
   - `npm run build` generates `dist/` without errors.
3. **Commit Messages**: Write clear, descriptive commit messages describing what was changed and why.
4. **Submit PR**: Open a Pull Request against the `main` branch with a concise summary of the functional changes.
