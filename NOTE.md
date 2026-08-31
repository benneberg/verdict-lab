***Temp***
Add github issues
Issue: Add Evaluation Result Caching Layer

Description: Implement an LRU cache or Redis cache keyed on hash(promptA, promptB, rubric, models) to avoid redundant, costly LLM re-evaluations when identical prompts and rubrics are executed.

Issue: Implement Configurable Tiebreaker Logic

Description: Add an optional tiebreaker strategy in the Dressing Room settings (e.g., automated third judge invocation or fallback to higher-parameter models like gemini-3.1-pro-preview) when pairwise judge voting yields a tie.

Issue: Expand Automated Integration Test Suite

Description: Expand the test harness beyond the current unit tests (JDay.test.ts) to include mocked end-to-end integration tests for Express API gateway routes (/api/evaluate, /api/inference, and /api/leaderboard).

Issue: Supabase Presence Collaborative Cursors

Description: Extend existing Supabase Realtime channels to track live user presence and cursor states within active Test Lab protocol editing sessions.