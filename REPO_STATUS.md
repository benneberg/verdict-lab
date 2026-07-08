# REPO_STATUS.md

- **One-line summary**: Verdict Lab is a highly responsive, feature-rich React SPA workbench for LLM behavior evaluations and prompt testing.
- **Persona/Use Case**: AI engineers, researchers, and prompt engineers designing pairwise prompt testing protocols and executing LLM judges.
- **Scores (0–100)**:
  - Core Functionality: **92/100** (fully interactive arena, test lab, prompt variables highlight editor, marketplace, history, and benchmarks)
  - Security: **45/100** (High/Critical risk of API Key exposure as `GEMINI_API_KEY` is compiled directly into the client-side bundle via Vite config `define`)
  - Documentation: **85/100** (Architecture and roadmaps are present, but developer onboarding commands are sparse)
  - Minimal Testing: **5/100** (No unit or automated integration tests are present in the repository)
  - TODOs/Stubs: **85/100** (Stubs are clearly identified in `TODO.md`, with clear roadmap plans)
  - Single-use Clarity: **95/100** (Laser-focused workbench design)
- **Security Notes**: The `GEMINI_API_KEY` is baked into the browser bundle at compile-time using Vite's `define` property. This leaks the secret API key to the client. This should be refactored to use a server-side proxy endpoint.
- **Full Audit Needed?**: Yes, because of the key security leak and lack of automated tests.
- **Top 3 Actions**:
  1. Move model inference and JDay judging logic to a server-side route (e.g. Express endpoint) to safeguard `GEMINI_API_KEY`.
  2. Implement an automated testing harness using Vitest / Testing Library.
  3. Migrate leaderboard stats calculation from client-side runtime aggregation to a server-side/Cloud Function background schedule.
- **Unknowns**: Exact behavior of the Supabase real-time connection across multi-user instances when authentication states change.
