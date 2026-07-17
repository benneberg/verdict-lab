export interface RubricMetric {
  max: number;
  weight: number;
}

export interface EvaluationResult {
  winner: "A" | "B" | "Tie";
  confidence: number;
  majority_vote_tally: {
    A: number;
    B: number;
    Tie: number;
  };
  scores: {
    A: Record<string, number>;
    B: Record<string, number>;
  };
  bias_flags: string[];
  reasoning: string;
  inter_rater_reliability?: number;
  judges?: string[];
}

export async function evaluateResponses(
  variantA: string,
  variantB: string,
  rubric: Record<string, RubricMetric>,
  hypothesis: string,
  models: string[] = ["gemini-3.5-flash"]
): Promise<EvaluationResult> {
  try {
    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variantA,
        variantB,
        rubric,
        hypothesis,
        models,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server-side evaluation error (Status ${response.status})`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Failed to run secure evaluation:", error);
    throw error;
  }
}

export async function runInference(
  prompt: string,
  systemInstruction?: string,
  config?: any
): Promise<string> {
  try {
    const response = await fetch("/api/inference", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        systemInstruction,
        config,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server-side inference error (Status ${response.status})`);
    }

    const data = await response.json();
    return data.text || "";
  } catch (error: any) {
    console.error("Failed to run secure inference:", error);
    throw error;
  }
}
