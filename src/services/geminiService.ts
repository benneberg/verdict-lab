import { auth } from '../lib/firebase';
import { useStore } from '../store/useStore';

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
  cached?: boolean;
  isMock?: boolean;
}

export interface EvaluationOptions {
  mockMode?: boolean;
  bypassCache?: boolean;
}

async function getAuthHeaders(options: EvaluationOptions = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const isMock = options.mockMode ?? useStore.getState().mockMode;
  if (isMock) {
    headers["X-Mock-Mode"] = "true";
  }

  if (options.bypassCache) {
    headers["X-Bypass-Cache"] = "true";
  }

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
  models: string[] = ["gemini-3.5-flash"],
  options: EvaluationOptions = {}
): Promise<EvaluationResult> {
  try {
    const headers = await getAuthHeaders(options);
    const isMock = options.mockMode ?? useStore.getState().mockMode;

    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers,
      body: JSON.stringify({
        variantA,
        variantB,
        rubric,
        hypothesis,
        models,
        mockMode: isMock,
        bypassCache: options.bypassCache,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server-side evaluation error (Status ${response.status})`);
    }

    const data = await response.json();
    const isCached = response.headers.get("X-Cache") === "HIT" || data.cached === true;

    return {
      ...data,
      cached: isCached,
    };
  } catch (error: any) {
    console.error("Failed to run secure evaluation:", error);
    throw error;
  }
}

export async function runInference(
  prompt: string,
  systemInstruction?: string,
  config?: any,
  options: EvaluationOptions = {}
): Promise<string> {
  try {
    const headers = await getAuthHeaders(options);
    const isMock = options.mockMode ?? useStore.getState().mockMode;

    const response = await fetch("/api/inference", {
      method: "POST",
      headers,
      body: JSON.stringify({
        prompt,
        systemInstruction,
        config,
        mockMode: isMock,
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

export async function getCacheStats() {
  const response = await fetch("/api/cache/stats");
  if (!response.ok) throw new Error("Failed to fetch cache statistics");
  return response.json();
}

export async function clearEvaluationCache() {
  const response = await fetch("/api/cache/clear", { method: "POST" });
  if (!response.ok) throw new Error("Failed to clear cache");
  return response.json();
}
