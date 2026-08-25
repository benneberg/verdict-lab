# Verdict Lab 🧪

Behavioral evaluation infrastructure for AI systems. Design pairwise prompt experiments, isolate variables, and evaluate LLM outputs with the JDay judgment engine.

---

## Overview

Verdict Lab is a full-stack web workbench built for prompt engineers, AI researchers, and developers. It allows users to:
- Design structured prompt test cards with dynamic variable parsing (e.g., `{topic}`).
- Compare prompt variants side-by-side (Pairwise Variant A vs. Variant B).
- Evaluate completions using the multi-judge **JDay Consensus Engine** across modern Gemini models (Gemini 3.1 Pro, Gemini 3.5 Flash, Gemini 2.5 Flash).
- Audit template changes with a visual Git-style line diff viewer.
- Execute bulk evaluations with the High-Throughput JSON Batch Importer.
- Track aggregated model win rates and inter-rater reliability scores.

---

## Requirements

- **Node.js**: Modern Node.js runtime supporting ES Modules and TypeScript execution.
- **Package Manager**: `npm` (package-lock.json included) or `bun`.
- **API Key**: `GEMINI_API_KEY` for server-side Google GenAI model invocations.
- **Firebase**: `firebase-applet-config.json` for Firestore persistence and authentication.

---

## Installation

1. Clone or open the workspace repository.
2. Install project dependencies:
   ```bash
   npm install
   ```

---

## Configuration

Create a `.env` file in the root directory (based on `.env.example`):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Configure Firebase credentials in `firebase-applet-config.json` at the root if connecting to a dedicated Firestore instance.

---

## Usage

### Development Server
Start the full-stack development server on **Port 3000**:
```bash
npm run dev
```
This boots the Express backend with integrated Vite middleware on `http://localhost:3000`.

### Core Application Views
- **Arena (`/arena`)**: Execute single or batch pairwise prompt comparisons with real-time multi-judge consensus voting.
- **Test Lab (`/lab`)**: Author prompt hypotheses, define independent variables, set weighted rubric metrics, and inspect version diffs.
- **Registry (`/registry`)**: Browse saved test cards and community blueprint templates.
- **Benchmarks (`/benchmarks`)**: View model win rates, average rater confidence, and inter-rater reliability.
- **History (`/history`)**: Inspect historical evaluation runs and raw judge reasoning.
- **Dressing Room (`/profile`)**: Manage user profile and parameter preferences.
- **Info & Manual (`/about`)**: Access the system brief, workbench manual, and accordion FAQ.

---

## Testing

Run the automated test suite with Vitest:
```bash
npm run test
```

Run static type checking with the TypeScript compiler:
```bash
npm run lint
```

---

## Build

Compile the React frontend static assets and bundle the Express server into `dist/server.cjs`:
```bash
npm run build
```

Clean build artifacts:
```bash
npm run clean
```

Start the compiled production server:
```bash
npm run start
```

---

## Deployment

Verdict Lab is packaged to run in containerized Cloud Run environments listening on **Port 3000** (`0.0.0.0:3000`).
The production build compiles the server into a standalone CommonJS bundle (`dist/server.cjs`) using `esbuild`, resolving all ESM imports at build-time.

---

## Repository Structure

```text
├── server.ts                    # Express API gateway & Vite middleware integration
├── vite.config.ts               # Vite configuration & Tailwind CSS plugin
├── package.json                 # Project dependencies and script definitions
├── tsconfig.json                # TypeScript compiler configuration
├── metadata.json                # Applet configuration metadata
├── firestore.rules              # Firestore security rules
├── firebase-applet-config.json  # Firebase project configuration
├── src/
│   ├── main.tsx                 # React application entry point
│   ├── App.tsx                  # Root router layout and route definitions
│   ├── index.css                # Global Tailwind CSS styles
│   ├── components/
│   │   ├── Layout.tsx           # Global navigation sidebar & header shell
│   │   ├── ErrorBoundary.tsx    # React error recovery boundary
│   │   ├── PromptEditor.tsx     # Syntax-highlighting template editor
│   │   └── OnboardingTour.tsx   # Interactive step-by-step tour modal
│   ├── pages/
│   │   ├── Arena.tsx            # Pairwise execution and batch runner
│   │   ├── TestLab.tsx          # Protocol authoring & version diff viewer
│   │   ├── Registry.tsx         # Template card browser
│   │   ├── Leaderboard.tsx      # Model benchmark statistics
│   │   ├── History.tsx          # Historical evaluation logs
│   │   ├── DressingRoom.tsx     # User profile and model settings
│   │   └── About.tsx            # System brief, manual, and FAQ
│   ├── services/
│   │   ├── geminiService.ts     # Client proxy for /api/evaluate & /api/inference
│   │   └── metricsService.ts    # Evaluation metric calculations
│   ├── store/
│   │   └── useStore.ts          # Zustand state store
│   ├── tests/
│   │   └── JDay.test.ts         # Vitest unit test specifications
│   └── lib/
│       ├── firebase.ts          # Firebase client SDK initialization
│       ├── realtime.ts          # Supabase real-time broadcast client
│       └── utils.ts             # Tailwind class merging utility (cn)
```
