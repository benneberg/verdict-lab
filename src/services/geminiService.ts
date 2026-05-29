import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
  models: string[] = ["gemini-1.5-pro-preview-0514"]
): Promise<EvaluationResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  const metricsList = Object.entries(rubric)
    .map(([k, v]) => `- ${k} (Max: ${v.max}, Weight: ${v.weight})`)
    .join("\n");

  const systemInstruction = `You are a bias-aware evaluation judge for AI behavior experiments (JDay Engine).
Your goal is to evaluate two AI responses (Variant A and Variant B) against a specific weighted rubric.

STRATEGY:
1. STYLE NORMALIZATION: Do not reward a variant simply because it matches your preferred writing style or length. Evaluate purely on the metric definitions.
2. POSITION BIAS: Be aware that you might favor the first response you read. Read both critically twice.
3. VERBOSITY BIAS: Do not give higher scores to longer answers if the content is fluff.

Hypothesis being tested: ${hypothesis}

Rubric:
${metricsList}

Respond ONLY with a JSON object following the schema.`;

  const prompt = `Variant A:
${variantA}

---
Variant B:
${variantB}

Evaluate these two variants based on the weighted rubric. Provide scores, a clear winner (considering weights), and detailed cross-model reasoning.`;

  const evaluationSchema = {
    type: Type.OBJECT,
    properties: {
      winner: { type: Type.STRING, enum: ["A", "B", "Tie"] },
      confidence: { type: Type.NUMBER },
      scores: {
        type: Type.OBJECT,
        properties: {
          A: { type: Type.OBJECT },
          B: { type: Type.OBJECT }
        },
        required: ["A", "B"]
      },
      bias_flags: { type: Type.ARRAY, items: { type: Type.STRING } },
      reasoning: { type: Type.STRING }
    },
    required: ["winner", "confidence", "scores", "bias_flags", "reasoning"]
  };

  // Run multiple judges in parallel
  const judgePromises = models.map(async (model) => {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: evaluationSchema as any
        }
      });
      return JSON.parse(response.text);
    } catch (e) {
      console.error(`Judge ${model} failed:`, e);
      return null;
    }
  });

  const rawResults = (await Promise.all(judgePromises)).filter(Boolean);
  
  if (rawResults.length === 0) throw new Error("All judges failed to evaluate.");

  // Aggregate results (Majority Vote & Score Averaging)
  const tally = { A: 0, B: 0, Tie: 0 };
  const avgScores: any = { A: {}, B: {} };
  const allBiasFlags = new Set<string>();
  let compositeReasoning = "";

  rawResults.forEach((res: any, idx) => {
    tally[res.winner as keyof typeof tally]++;
    res.bias_flags.forEach((f: string) => allBiasFlags.add(f));
    compositeReasoning += `[Judge ${models[idx]}]: ${res.reasoning}\n\n`;
    
    // Sum scores for averaging
    ['A', 'B'].forEach(v => {
      Object.entries(res.scores[v]).forEach(([metric, score]) => {
        avgScores[v][metric] = (avgScores[v][metric] || 0) + Number(score);
      });
    });
  });

  // Final averaging
  ['A', 'B'].forEach(v => {
    Object.keys(avgScores[v]).forEach(metric => {
      avgScores[v][metric] = Number((avgScores[v][metric] / rawResults.length).toFixed(2));
    });
  });

  // Calculate Winner based on Tally
  let finalWinner: "A" | "B" | "Tie" = "Tie";
  if (tally.A > tally.B && tally.A > tally.Tie) finalWinner = "A";
  else if (tally.B > tally.A && tally.B > tally.Tie) finalWinner = "B";

  // Inter-rater reliability (simple agreement percentage)
  const agreement = Math.max(tally.A, tally.B, tally.Tie) / rawResults.length;

  return {
    winner: finalWinner,
    confidence: agreement, // Using agreement as confidence proxy in multi-judge
    majority_vote_tally: tally,
    scores: avgScores,
    bias_flags: Array.from(allBiasFlags),
    reasoning: compositeReasoning.trim(),
    inter_rater_reliability: agreement,
    judges: models
  };
}

export async function runInference(
  prompt: string,
  systemInstruction?: string,
  config?: any
) {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      ...config,
      systemInstruction,
    }
  });
  return response.text;
}
