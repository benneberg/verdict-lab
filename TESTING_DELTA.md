# TESTING_DELTA.md

## 1. Testing Gaps
Currently, there is **no automated testing framework** configured in the workspace (Vitest, Jest, Cypress, etc. are completely missing). There are no test specs for critical calculations.

### Core Areas Requiring Test Coverage
1. **Consensus Tally Logic**: Testing `geminiService.ts` aggregate results when judges have conflicting votes.
2. **Version Comparison Logic**: Testing state restorations and correct visual highlight diff checks.
3. **Variable Regex Matching**: Testing variable parser logic inside `PromptEditor.tsx`.

## 2. Test Framework Integration Plan
To bridge the testing gap, we recommend installing `vitest` and `@testing-library/react` to run lightweight Unit Tests:

```json
// Recommended additions to package.json
"devDependencies": {
  "vitest": "^2.1.8",
  "@testing-library/react": "^16.1.0",
  "@testing-library/jest-dom": "^6.6.3",
  "jsdom": "^25.0.1"
}
```

## 3. Sample Mock Unit Test (for JDay Consensus Engine)

```typescript
// src/services/__tests__/geminiService.test.ts
import { describe, it, expect } from 'vitest';

describe('JDay Consensus Engine Tally Synthesis', () => {
  it('correctly declares Variant A as winner on majority vote', () => {
    const tally = { A: 2, B: 1, Tie: 0 };
    let finalWinner = "Tie";
    if (tally.A > tally.B && tally.A > tally.Tie) finalWinner = "A";
    else if (tally.B > tally.A && tally.B > tally.Tie) finalWinner = "B";

    expect(finalWinner).toBe("A");
  });

  it('declares Tie if votes are equal', () => {
    const tally = { A: 1, B: 1, Tie: 0 };
    let finalWinner = "Tie";
    if (tally.A > tally.B && tally.A > tally.Tie) finalWinner = "A";
    else if (tally.B > tally.A && tally.B > tally.Tie) finalWinner = "B";

    expect(finalWinner).toBe("Tie");
  });
});
```
