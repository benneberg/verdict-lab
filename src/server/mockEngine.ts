export interface MockEvaluationParams {
  variantA: string;
  variantB: string;
  rubric?: Record<string, { max: number; weight: number }>;
  hypothesis?: string;
  models?: string[];
}

/**
 * Deterministically generates a realistic multi-judge consensus verdict
 * without requiring external LLM API calls.
 */
export function generateMockEvaluation(params: MockEvaluationParams) {
  const { variantA, variantB, rubric = {}, hypothesis = "General Quality Assessment", models = ["gemini-3.5-flash"] } = params;

  const activeModels = (Array.isArray(models) ? models.slice(0, 3) : ["gemini-3.5-flash"]);

  // Calculate heuristic metrics based on text attributes
  const lengthA = variantA.length;
  const lengthB = variantB.length;
  const hasFormattingA = /[-*#>`]/.test(variantA);
  const hasFormattingB = /[-*#>`]/.test(variantB);
  const wordsA = variantA.split(/\s+/).filter(Boolean).length;
  const wordsB = variantB.split(/\s+/).filter(Boolean).length;

  const scoresA: Record<string, number> = {};
  const scoresB: Record<string, number> = {};
  let totalWeightedA = 0;
  let totalWeightedB = 0;
  let totalWeight = 0;

  const rubricEntries = Object.entries(rubric);
  if (rubricEntries.length === 0) {
    scoresA["General_Quality"] = 8.5;
    scoresB["General_Quality"] = 8.0;
    totalWeightedA = 8.5;
    totalWeightedB = 8.0;
    totalWeight = 1.0;
  } else {
    rubricEntries.forEach(([metricName, config]) => {
      const max = config.max || 10;
      const weight = config.weight || 1;
      totalWeight += weight;

      // Base heuristic scoring
      let scoreA = max * 0.75;
      let scoreB = max * 0.75;

      const lowerMetric = metricName.toLowerCase();
      if (lowerMetric.includes("concise") || lowerMetric.includes("brevity")) {
        scoreA += (lengthA < lengthB ? 1.5 : -0.5);
        scoreB += (lengthB < lengthA ? 1.5 : -0.5);
      } else if (lowerMetric.includes("structure") || lowerMetric.includes("format") || lowerMetric.includes("clarity")) {
        scoreA += hasFormattingA ? 1.5 : -0.5;
        scoreB += hasFormattingB ? 1.5 : -0.5;
      } else if (lowerMetric.includes("detail") || lowerMetric.includes("completeness") || lowerMetric.includes("accuracy")) {
        scoreA += wordsA >= 20 ? 1.2 : -0.8;
        scoreB += wordsB >= 20 ? 1.2 : -0.8;
      }

      // Clamp within 1.0 to max
      scoreA = Math.max(1, Math.min(max, Number(scoreA.toFixed(1))));
      scoreB = Math.max(1, Math.min(max, Number(scoreB.toFixed(1))));

      scoresA[metricName] = scoreA;
      scoresB[metricName] = scoreB;

      totalWeightedA += (scoreA / max) * weight;
      totalWeightedB += (scoreB / max) * weight;
    });
  }

  const normalizedScoreA = totalWeight > 0 ? totalWeightedA / totalWeight : 0.8;
  const normalizedScoreB = totalWeight > 0 ? totalWeightedB / totalWeight : 0.75;

  let winner: "A" | "B" | "Tie" = "Tie";
  const scoreDiff = normalizedScoreA - normalizedScoreB;

  if (scoreDiff > 0.05) {
    winner = "A";
  } else if (scoreDiff < -0.05) {
    winner = "B";
  } else {
    winner = "Tie";
  }

  const tally = {
    A: winner === "A" ? activeModels.length : (winner === "Tie" ? 0 : 0),
    B: winner === "B" ? activeModels.length : (winner === "Tie" ? 0 : 0),
    Tie: winner === "Tie" ? activeModels.length : 0
  };

  // If multiple judges, provide slight variation in tally for realism
  if (activeModels.length === 3 && winner !== "Tie") {
    tally[winner] = 2;
    tally[winner === "A" ? "B" : "A"] = 1;
  }

  const confidence = Number((Math.max(tally.A, tally.B, tally.Tie) / activeModels.length).toFixed(2));

  const bias_flags: string[] = [];
  if (Math.abs(lengthA - lengthB) > 300) {
    bias_flags.push("Verbosity Disparity Detected");
  }
  if (hasFormattingA !== hasFormattingB) {
    bias_flags.push("Structural Markdown Asymmetry");
  }

  const reasoning = activeModels.map((m) => {
    if (winner === "A") {
      return `[Judge ${m} (Simulation)]: Variant A demonstrated superior alignment with the hypothesis ("${hypothesis}"). It exhibited stronger adherence to rubric criteria with a weighted performance score of ${(normalizedScoreA * 100).toFixed(0)}%.`;
    } else if (winner === "B") {
      return `[Judge ${m} (Simulation)]: Variant B was evaluated as more effective against the stated hypothesis ("${hypothesis}"). It demonstrated higher structural clarity and rubric score of ${(normalizedScoreB * 100).toFixed(0)}%.`;
    } else {
      return `[Judge ${m} (Simulation)]: Both variants achieved comparable rubric evaluations (${(normalizedScoreA * 100).toFixed(0)}% vs ${(normalizedScoreB * 100).toFixed(0)}%). No clear statistical divergence detected.`;
    }
  }).join("\n\n");

  return {
    winner,
    confidence,
    majority_vote_tally: tally,
    scores: {
      A: scoresA,
      B: scoresB
    },
    bias_flags,
    reasoning,
    inter_rater_reliability: confidence,
    judges: activeModels,
    isMock: true,
  };
}

/**
 * Generates a mock prompt inference response for offline testing and demos.
 */
export function generateMockInference(prompt: string, systemInstruction?: string) {
  const preview = prompt.length > 120 ? `${prompt.slice(0, 120)}...` : prompt;
  return `[Simulation / Offline Mode Completion]

Generated in response to prompt:
> "${preview}"

${systemInstruction ? `*Configured Persona*: ${systemInstruction}\n\n` : ''}### Analytical Overview
- **Key Insight**: The provided inputs indicate a target prompt variation under evaluation.
- **Synthesized Output**: High-quality structured simulation response meeting standard schema expectations.
- **Execution Mode**: Local Offline Mock (Zero LLM API Quota Consumed).`;
}
