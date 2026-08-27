import { auth } from '../lib/firebase';

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

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (auth.currentUser?.uid) {
      headers["X-User-Id"] = auth.currentUser.uid;
    }
  } catch (err) {
    console.warn("Could not retrieve auth token for request headers:", err);
  }
  return headers;
}

export async function evaluateResponses(
  variantA: string,
  variantB: string,
  rubric: Record<string, RubricMetric>,
  hypothesis: string,
  models: string[] = ["gemini-3.5-flash"]
): Promise<EvaluationResult> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers,
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
    const headers = await getAuthHeaders();
    const response = await fetch("/api/inference", {
      method: "POST",
      headers,
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
