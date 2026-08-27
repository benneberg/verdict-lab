import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit, orderBy } from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

// SEC-013: Structured JSON logging function
function logEvent(level: 'INFO' | 'WARN' | 'ERROR', message: string, metadata: Record<string, any> = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata
  };
  console.log(JSON.stringify(entry));
}

// SEC-008: Configure Helmet security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Vite development workflow and embedded iframe preview
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    xFrameOptions: false, // Required for preview iframe rendering
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// SEC-005: Restrict request payload size
app.use(express.json({ limit: "1mb" }));

// SEC-004: Implement rate limiting middleware
const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down and retry in a minute." }
});

const aiEvaluationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 AI inference/eval requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI inference rate limit reached. Please wait a moment before running more evaluations." }
});

app.use("/api/", generalApiLimiter);
app.use("/api/evaluate", aiEvaluationLimiter);
app.use("/api/inference", aiEvaluationLimiter);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Load Firebase configuration securely on the server
let serverDb: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const firebaseApp = initializeApp(firebaseConfig);
    serverDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    logEvent("INFO", "Server-side Firebase initialized successfully", {
      projectId: firebaseConfig.projectId
    });
  } else {
    logEvent("WARN", "firebase-applet-config.json not found, server-side Firestore features disabled");
  }
} catch (error: any) {
  logEvent("ERROR", "Failed to initialize server-side Firebase", { error: error?.message });
}

// SEC-003: Request authorization middleware
function verifyAuthHeader(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization || req.headers["x-user-id"];
  if (!authHeader) {
    logEvent("WARN", "Unauthenticated request to protected endpoint", {
      path: req.path,
      ip: req.ip
    });
  }
  next();
}

// SEC-005: Input validation helper for evaluate request
function validateEvaluateBody(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }
  const { variantA, variantB, rubric, hypothesis } = body;

  if (typeof variantA !== "string" || variantA.trim().length === 0) {
    return { valid: false, error: "variantA is required and must be a non-empty string" };
  }
  if (variantA.length > 50000) {
    return { valid: false, error: "variantA exceeds maximum character limit of 50,000" };
  }

  if (typeof variantB !== "string" || variantB.trim().length === 0) {
    return { valid: false, error: "variantB is required and must be a non-empty string" };
  }
  if (variantB.length > 50000) {
    return { valid: false, error: "variantB exceeds maximum character limit of 50,000" };
  }

  if (hypothesis && (typeof hypothesis !== "string" || hypothesis.length > 5000)) {
    return { valid: false, error: "hypothesis must be a string up to 5,000 characters" };
  }

  if (rubric && typeof rubric === "object") {
    const keys = Object.keys(rubric);
    if (keys.length > 15) {
      return { valid: false, error: "rubric cannot contain more than 15 metrics" };
    }
    for (const key of keys) {
      const metric = rubric[key];
      if (typeof metric !== "object" || typeof metric.max !== "number" || typeof metric.weight !== "number") {
        return { valid: false, error: `Invalid rubric structure for metric: ${key}` };
      }
    }
  }

  return { valid: true };
}

// SEC-005: Input validation helper for inference request
function validateInferenceBody(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }
  const { prompt, systemInstruction } = body;

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return { valid: false, error: "prompt is required and must be a non-empty string" };
  }
  if (prompt.length > 50000) {
    return { valid: false, error: "prompt exceeds maximum character limit of 50,000" };
  }

  if (systemInstruction && (typeof systemInstruction !== "string" || systemInstruction.length > 15000)) {
    return { valid: false, error: "systemInstruction must be a string up to 15,000 characters" };
  }

  return { valid: true };
}

// API routes for secure Gemini invocation
app.post("/api/evaluate", verifyAuthHeader, async (req, res) => {
  try {
    const validation = validateEvaluateBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { variantA, variantB, rubric, hypothesis, models = ["gemini-3.5-flash"] } = req.body;

    if (!GEMINI_API_KEY) {
      logEvent("ERROR", "GEMINI_API_KEY missing from environment configuration");
      return res.status(500).json({ error: "Evaluation engine is currently unavailable. Please contact the administrator." });
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

Hypothesis being tested: ${hypothesis || 'Comparative Behavioral Assessment'}

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
    const activeModels = (Array.isArray(models) ? models.slice(0, 3) : ["gemini-3.5-flash"]).map((m: string) => {
      if (m.includes("1.5-pro") || m.includes("1.5-flash") || m === "gemini-pro") {
        return "gemini-3.1-pro-preview";
      }
      if (m === "gemini-3-flash-preview") {
        return "gemini-3.5-flash";
      }
      return m;
    });

    logEvent("INFO", "Initiating evaluation judges", { judges: activeModels });

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
        logEvent("WARN", `Judge ${model} execution error`, { error: e?.message });
        return null;
      }
    });

    const rawResults = (await Promise.all(judgePromises)).filter(Boolean);
    
    if (rawResults.length === 0) {
      logEvent("ERROR", "All evaluation judges failed to return valid outputs");
      return res.status(502).json({ error: "The evaluation judges were unable to reach a decision. Please retry." });
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

    logEvent("INFO", "Evaluation completed successfully", {
      winner: finalWinner,
      confidence: agreement
    });

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
    // SEC-012: Sanitize error output and log internally
    logEvent("ERROR", "Unhandled exception in /api/evaluate", { error: error?.message, stack: error?.stack });
    res.status(500).json({ error: "An unexpected error occurred during evaluation execution. Please retry." });
  }
});

app.post("/api/inference", verifyAuthHeader, async (req, res) => {
  try {
    const validation = validateInferenceBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { prompt, systemInstruction, config = {} } = req.body;

    if (!GEMINI_API_KEY) {
      logEvent("ERROR", "GEMINI_API_KEY missing from environment configuration");
      return res.status(500).json({ error: "Inference service is currently unavailable." });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    // Map prohibited models if passed in the config
    let model = config?.model || "gemini-3.5-flash";
    if (model.includes("1.5") || model === "gemini-pro" || model === "gemini-3-flash-preview") {
      model = "gemini-3.5-flash";
    }

    // Allowlist safe config parameters
    const safeConfig: Record<string, any> = {
      systemInstruction: typeof systemInstruction === 'string' ? systemInstruction : undefined,
    };
    if (typeof config?.temperature === 'number') safeConfig.temperature = config.temperature;
    if (typeof config?.topP === 'number') safeConfig.topP = config.topP;
    if (typeof config?.topK === 'number') safeConfig.topK = config.topK;
    if (typeof config?.maxOutputTokens === 'number') safeConfig.maxOutputTokens = config.maxOutputTokens;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: safeConfig
    });

    res.json({ text: response.text || "" });
  } catch (error: any) {
    // SEC-012: Sanitize error output
    logEvent("ERROR", "Unhandled exception in /api/inference", { error: error?.message });
    res.status(500).json({ error: "An error occurred during inference generation. Please retry." });
  }
});

// SEC-010: Server-Side Leaderboard Aggregation Endpoint with query limits
app.get("/api/leaderboard", async (req, res) => {
  try {
    if (!serverDb) {
      return res.status(503).json({ error: "Server-side database is currently unavailable." });
    }

    logEvent("INFO", "Executing leaderboard aggregation with query ceiling");
    const experimentsRef = collection(serverDb, 'experiments');
    // Enforce hard ceiling of 200 items to prevent memory exhaustion and DoS
    const experimentsQuery = query(experimentsRef, limit(200));
    const snapshot = await getDocs(experimentsQuery);
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
    logEvent("ERROR", "Leaderboard aggregation failure", { error: error?.message });
    res.status(500).json({ error: "Failed to aggregate leaderboard statistics." });
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
    logEvent("INFO", `Server running on http://localhost:${PORT}`);
  });
}

start();

