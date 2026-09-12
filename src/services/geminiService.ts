import { auth } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { generateMockEvaluation, generateMockInference } from '../server/mockEngine';

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
  const isMock = options.mockMode ?? useStore.getState().mockMode;

  try {
    const headers = await getAuthHeaders(options);

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

    if (response.ok) {
      const data = await response.json();
      const isCached = response.headers.get("X-Cache") === "HIT" || data.cached === true;
      return {
        ...data,
        cached: isCached,
      };
    }

    // On static hosting (like GitHub Pages) where /api/evaluate returns 404,
    // or if mock mode is active, gracefully run deterministic client-side mock evaluation
    if (response.status === 404 || isMock) {
      console.info("Using client-side mock evaluation engine (static demo mode).");
      return generateMockEvaluation({ variantA, variantB, rubric, hypothesis, models });
    }

    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server-side evaluation error (Status ${response.status})`);
  } catch (error: any) {
    // If running on static host with no backend (fetch network error or 404)
    if (isMock || error?.message?.includes("Failed to fetch") || error?.name === "TypeError") {
      console.info("Static host detected. Executing client-side JDay simulation.");
      return generateMockEvaluation({ variantA, variantB, rubric, hypothesis, models });
    }
    console.error("Failed to run evaluation:", error);
    throw error;
  }
}

export async function runInference(
  prompt: string,
  systemInstruction?: string,
  config?: any,
  options: EvaluationOptions = {}
): Promise<string> {
  const isMock = options.mockMode ?? useStore.getState().mockMode;

  try {
    const headers = await getAuthHeaders(options);

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

    if (response.ok) {
      const data = await response.json();
      return data.text || "";
    }

    // Fallback to client mock generation for static demo environments
    if (response.status === 404 || isMock) {
      return generateMockInference(prompt, systemInstruction);
    }

    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server-side inference error (Status ${response.status})`);
  } catch (error: any) {
    if (isMock || error?.message?.includes("Failed to fetch") || error?.name === "TypeError") {
      return generateMockInference(prompt, systemInstruction);
    }
    console.error("Failed to run inference:", error);
    throw error;
  }
}

export async function getCacheStats() {
  try {
    const response = await fetch("/api/cache/stats");
    if (response.ok) return await response.json();
  } catch {
    // Fallback for static demo environments
  }
  return {
    hits: 24,
    misses: 5,
    size: 7,
    hitRatio: 0.828,
    evictions: 0,
    isStaticDemo: true,
  };
}

export async function clearEvaluationCache() {
  try {
    const response = await fetch("/api/cache/clear", { method: "POST" });
    if (response.ok) return await response.json();
  } catch {
    // Fallback for static demo environments
  }
  return { success: true, message: "Client demo cache reset successfully." };
}
