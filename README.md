# Verdict Lab

> **BEHAVIORAL_EVALUATION_INFRASTRUCTURE**
> Design experiments, isolate variables, and evaluate LLM outputs with chemical-grade precision.

Verdict Lab is a high-performance workbench for AI researchers and prompt engineers. It provides a structured environment to design pairwise experiments, manage experimental protocols with robust version control, and execute semantic evaluations through a unified judging engine.

## 🧪 Core Architecture

Verdict Lab is built as a modular application focusing on three primary pillars of prompt engineering: **Protocol Design**, **Arena Execution**, and **Behavioral Archiving**.

### 1. Test Lab (Protocol Engineering)
Define the boundaries of your experiment. Create "Test Cards" that encapsulate:
- **Independent Variables**: Isolate changes in `model`, `system_persona`, `temperature`, or `prompt_structure`.
- **Version Control**: Full protocol lineage with side-by-side **Version Comparison** and instant restoration logic.
- **Evaluation Rubrics**: Design weighted metrics (Accuracy, Tone, Reasoning, etc.) that guide the evaluator.

### 2. The Arena (Live Evaluation)
Inject real-world inputs into your protocols and generate comparative outputs.
- **Dynamic Variable Injection**: Use `{curly_braces}` to swap context payloads into experiments.
- **Automated Judging**: Leverage the **JDay Judgment Engine** to analyze semantic differences, assign weighted scores, and declare a winner based on reasoning.

### 3. Registry & Metrics
- **Prompt Marketplace**: Browse and acquire verified experimental protocols from the community.
- **Public Benchmarks**: A live **Leaderboard** tracking model win rates, average confidence scores, and tiers across all public experiments.

## 🛠 Tech Stack

- **Authentication**: Supabase Auth (Sign-up, Email/Pass, Google)
- **Frontend**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) (Precision UI Utility)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Persistence**: [Firebase](https://firebase.google.com/) (Firestore)
- **Real-time**: [Supabase Real-time](https://supabase.com/realtime)
- **Animations**: [Motion](https://motion.dev/)

## 📂 Documentation

- [Architecture Overview](./src/ARCHITECTURE.md) - Deep dive into system data flows.
- [Project Roadmap (TODO)](./TODO.md) - Current audit, known limitations, and feature backlog.
