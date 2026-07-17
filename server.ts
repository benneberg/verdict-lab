import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Load Firebase configuration securely on the server
let serverDb: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const firebaseApp = initializeApp(firebaseConfig);
    serverDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("Server-side Firebase initialized successfully.");
  } else {
    console.warn("firebase-applet-config.json not found, server-side database features will be disabled.");
  }
} catch (error) {
  console.error("Failed to initialize server-side Firebase:", error);
}

// API routes for secure Gemini invocation
app.post("/api/evaluate", async (req, res) => {
  try {
    const { variantA, variantB, rubric, hypothesis, models = ["gemini-3.5-flash"] } = req.body;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const metricsList = Object.entries(rubric || {})
      .map(([k, v]: [string, any]) => `- ${k} (Max: ${v.max}, Weight: ${v.weight})`)
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

    // Filter prohibited models to use valid ones
    const activeModels = models.map((m: string) => {
      if (m.includes("1.5-pro") || m.includes("1.5-flash") || m === "gemini-pro") {
        return "gemini-3.1-pro-preview"; // Upgrade to modern supported model
      }
      if (m === "gemini-3-flash-preview") {
        return "gemini-3.5-flash";
      }
      return m;
    });

    const judgePromises = activeModels.map(async (model: string) => {
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
        return JSON.parse(response.text || "{}");
      } catch (e: any) {
        console.error(`Judge ${model} failed:`, e);
        return null;
      }
    });

    const rawResults = (await Promise.all(judgePromises)).filter(Boolean);
    
    if (rawResults.length === 0) {
      return res.status(502).json({ error: "All server-side evaluation judges failed." });
    }

    // Aggregate results (Majority Vote & Score Averaging)
    const tally = { A: 0, B: 0, Tie: 0 };
    const avgScores: any = { A: {}, B: {} };
    const allBiasFlags = new Set<string>();
    let compositeReasoning = "";

    rawResults.forEach((result: any, idx: number) => {
      const winner = result.winner || "Tie";
      tally[winner as keyof typeof tally]++;
      
      if (Array.isArray(result.bias_flags)) {
        result.bias_flags.forEach((f: string) => allBiasFlags.add(f));
      }
      compositeReasoning += `[Judge ${activeModels[idx]}]: ${result.reasoning || "No reasoning provided."}\n\n`;
      
      // Sum scores for averaging
      ['A', 'B'].forEach(v => {
        if (result.scores && result.scores[v]) {
          Object.entries(result.scores[v]).forEach(([metric, score]) => {
            avgScores[v][metric] = (avgScores[v][metric] || 0) + Number(score);
          });
        }
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

    const agreement = Math.max(tally.A, tally.B, tally.Tie) / rawResults.length;

    res.json({
      winner: finalWinner,
      confidence: agreement,
      majority_vote_tally: tally,
      scores: avgScores,
      bias_flags: Array.from(allBiasFlags),
      reasoning: compositeReasoning.trim(),
      inter_rater_reliability: agreement,
      judges: activeModels
    });

  } catch (error: any) {
    console.error("Evaluate error:", error);
    res.status(500).json({ error: error?.message || "Internal server error during evaluation" });
  }
});

app.post("/api/inference", async (req, res) => {
  try {
    const { prompt, systemInstruction, config = {} } = req.body;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    // Map prohibited models if passed in the config
    let model = config?.model || "gemini-3.5-flash";
    if (model.includes("1.5") || model === "gemini-pro" || model === "gemini-3-flash-preview") {
      model = "gemini-3.5-flash";
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        ...config,
        model: undefined, // ensure we do not pass duplicate key
        systemInstruction,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Inference error:", error);
    res.status(500).json({ error: error?.message || "Internal server error during inference" });
  }
});

// Server-Side Leaderboard Aggregation Endpoint (satisfies TODO.md)
app.get("/api/leaderboard", async (req, res) => {
  try {
    if (!serverDb) {
      return res.status(503).json({ error: "Server-side database is not initialized." });
    }

    console.log("Performing server-side experiments aggregation...");
    const experimentsRef = collection(serverDb, 'experiments');
    const snapshot = await getDocs(experimentsRef);
    const experiments = snapshot.docs.map(doc => doc.data());

    const statsMap: Record<string, { wins: number; losses: number; ties: number; totalConf: number; maxConf: number; count: number }> = {};

    experiments.forEach(exp => {
      const winner = exp.verdict?.winner;
      const confidence = exp.verdict?.confidence || 0;
      const judges = exp.judges || [];

      judges.forEach((model: string) => {
        if (!statsMap[model]) {
          statsMap[model] = { wins: 0, losses: 0, ties: 0, totalConf: 0, maxConf: 0, count: 0 };
        }
        
        const stats = statsMap[model];
        stats.count++;
        stats.totalConf += confidence;
        if (confidence > stats.maxConf) stats.maxConf = confidence;

        if (winner === 'Tie') {
          stats.ties++;
        } else if (winner === 'A' || winner === 'B') {
          stats.wins++; 
        }
      });
    });

    const result = Object.entries(statsMap).map(([model, s]) => ({
      modelName: model,
      totalEvaluations: s.count,
      wins: s.wins,
      losses: s.losses,
      ties: s.ties,
      winRate: s.count > 0 ? (s.wins / s.count) * 100 : 0,
      averageConfidence: s.count > 0 ? (s.totalConf / s.count) : 0,
      peakConfidence: s.maxConf
    })).sort((a, b) => b.winRate - a.winRate);

    res.json(result);
  } catch (error: any) {
    console.error("Leaderboard aggregation error:", error);
    res.status(500).json({ error: error?.message || "Internal server error during leaderboard aggregation" });
  }
});

// Start express server with Vite integrated
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
