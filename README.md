# Verdict Lab

> **BEHAVIORAL_EVALUATION_INFRASTRUCTURE**
> Design experiments, isolate variables, and evaluate LLM outputs with chemical-grade precision.

Verdict Lab is a high-performance workbench for AI researchers and prompt engineers. It provides a structured environment to design pairwise experiments, manage experimental protocols (Test Cards), and execute semantic evaluations through integrated LLM-based "Judge" engines.

## 🧪 Core Architecture

Verdict Lab is built as a modular application focusing on three primary pillars of prompt engineering: **Protocol Design**, **Arena Execution**, and **Behavioral Archiving**.

### 1. Test Lab (Protocol Engineering)
Define the boundaries of your experiment. Create "Test Cards" that encapsulate:
- **Independent Variables**: Isolate changes in `model`, `system_persona`, `temperature`, or `prompt_structure`.
- **Structured Variants**: Define Variant A and Variant B with clear differentiation.
- **Evaluation Rubrics**: Design weighted metrics (Accuracy, Tone, Reasoning, etc.) that guide the evaluator.
- **Version Control**: Every save increments the protocol version, preserving the lineage of your logic.

### 2. The Arena (Live Evaluation)
Inject real-world inputs into your protocols and generate comparative outputs.
- **Dynamic Variable Injection**: Use `{curly_braces}` to swap context payloads into experiments.
- **Automated Judging**: Leverage the **JDay Judgment Engine** to analyze semantic differences, assign weighted scores, and declare a winner based on reasoning.
- **Majority Vote Tally**: Multi-judge synthesis for high-confidence verdicts.

### 3. Registry & Archive
- **Community Marketplace**: Browse and acquire verified experimental protocols from other researchers.
- **Experimental History**: A deep-time archive of every verdict, reasoning trace, and input/output pair generated in the lab.

## 🛠 Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) (Precision UI Utility)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) + Persistent Middleware
- **Real-time Pipeline**: [Supabase Real-time](https://supabase.com/realtime)
- **Persistence & Auth**: [Firebase](https://firebase.google.com/) (Firestore/Google Auth)
- **Animations**: [Motion](https://motion.dev/) (motion/react)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Google Cloud Project (for Gemini API / Firebase)
- A Supabase Project (optional, for real-time features)

### Installation
1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Configure environment variables in `.env`:
```env
# AI Engine Key
GEMINI_API_KEY=your_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Supabase (Optional for Federated Auth/Real-time)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Development
```bash
npm run dev
```

## 📂 Project Structure

```text
/src
  ├── components/    # Reusable "Lab" UI components (Grid, Layout, Icons)
  ├── data/          # Static experimental templates and schemas
  ├── lib/           # Core initializers (Firebase, Supabase, AI utils)
  ├── pages/         # Primary application views (TestLab, Arena, Registry)
  ├── store/         # Zustand state definitions
  └── types.ts       # Global TypeScript interfaces
```

## ⚖️ License

Verdict Lab is optimized for internal research and rapid prototyping. All data generated in the lab is owned by the designated session researcher.
