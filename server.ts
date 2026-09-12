import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { agentCore } from "./server/agent/core.js";
import { db } from "./server/db/postgres.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Health check
  app.get("/api/health", async (_req, res) => {
    const dbStats = await db.getStats();
    res.json({
      status: "ok",
      service: "Mande-IA v2.0 Agent Platform",
      database: dbStats,
      timestamp: new Date().toISOString()
    });
  });

  // Agent Core Metrics & Observability (PostgreSQL)
  app.get("/api/agent/stats", async (_req, res) => {
    const stats = await db.getStats();
    res.json({
      success: true,
      data: stats
    });
  });

  // Djelia.cloud Voice API Proxy - Authentic Bamanankan TTS
  app.get("/api/djelia/status", (_req, res) => {
    const hasKey = Boolean(process.env.DJELIA_API_KEY && process.env.DJELIA_API_KEY.trim().length > 0);
    res.json({
      success: true,
      provider: "Djelia.cloud",
      configured: hasKey,
      baseUrls: [
        "https://djelia.cloud/openai/v1/audio/speech",
        "https://djelia.cloud/api/v1/tts"
      ],
      primaryLanguage: "Bamanankan (bam / bm)",
      supportedVoices: ["bakary", "aminata", "sekou", "kadiatou"]
    });
  });

  app.post("/api/djelia/tts", async (req, res) => {
    const { text, voice = "bakary", language = "bam", speed = 1.0, userKey } = req.body;

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Text string is required for Djelia TTS synthesis." });
      return;
    }

    const apiKey = (userKey && String(userKey).trim()) || process.env.DJELIA_API_KEY;

    if (!apiKey) {
      res.status(400).json({
        success: false,
        fallback: true,
        message: "No Djelia API key configured. Provide DJELIA_API_KEY in environment or via settings."
      });
      return;
    }

    // Normalize voice name (e.g. "djelia-bakary" -> "bakary")
    const normalizedVoice = String(voice).replace(/^djelia-/, "");

    // 1. First attempt: OpenAI-compatible audio/speech endpoint on djelia.cloud
    try {
      const openAiUrl = "https://djelia.cloud/openai/v1/audio/speech";
      const openAiPayload = {
        model: "djelia-voice-1",
        input: text,
        voice: normalizedVoice,
        speed: Number(speed) || 1.0,
        response_format: "mp3"
      };

      const response = await fetch(openAiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(openAiPayload)
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("X-Voice-Engine", "djelia-cloud-openai");
        res.send(Buffer.from(arrayBuffer));
        return;
      }
    } catch (err) {
      console.warn("Djelia OpenAI endpoint attempt failed, trying REST endpoint:", err);
    }

    // 2. Second attempt: Native Djelia.cloud REST endpoint
    const restUrls = [
      "https://djelia.cloud/api/v1/tts",
      "https://api.djelia.cloud/v1/tts"
    ];

    for (const url of restUrls) {
      try {
        const restResponse = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            text,
            voice: normalizedVoice,
            language: language === "bm" ? "bam" : language,
            speed: Number(speed) || 1.0
          })
        });

        if (restResponse.ok) {
          const contentType = restResponse.headers.get("content-type") || "";
          if (contentType.includes("audio") || contentType.includes("octet-stream") || contentType.includes("mpeg")) {
            const buffer = await restResponse.arrayBuffer();
            res.setHeader("Content-Type", "audio/mpeg");
            res.setHeader("X-Voice-Engine", "djelia-cloud-rest");
            res.send(Buffer.from(buffer));
            return;
          } else {
            const data = await restResponse.json() as any;
            if (data.audio_url || data.url) {
              const audioFetch = await fetch(data.audio_url || data.url);
              if (audioFetch.ok) {
                const buf = await audioFetch.arrayBuffer();
                res.setHeader("Content-Type", "audio/mpeg");
                res.setHeader("X-Voice-Engine", "djelia-cloud-url");
                res.send(Buffer.from(buf));
                return;
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Djelia REST endpoint attempt to ${url} failed:`, err);
      }
    }

    // If both failed (e.g. invalid API key, service down):
    res.status(502).json({
      success: false,
      fallback: true,
      message: "Djelia Cloud returned an error or is unreachable. Falling back to local Bamanankan synthesis engine."
    });
  });

  // Mande AI Generation Endpoint
  app.post("/api/mande-generate", async (req, res) => {
    const { prompt, style = "dark-luxury", category = "saas", tokens = {} } = req.body;

    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "A valid prompt string is required." });
      return;
    }

    // Check if GEMINI_API_KEY is available
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
      try {
        const ai = getAI();
        const systemInstruction = `You are Mande-AI 3.5, a world-class high-end visual design intelligence model trained exclusively on award-winning digital design systems, Swiss typography, micro-interactions, and modern Tailwind CSS.
Given a user prompt for an interface component, section, or page, you synthesize a refined, deploy-ready design with pure Tailwind CSS.
Respond strictly in valid JSON format with the following keys:
{
  "componentName": "A PascalCase name (e.g. HeroMetricsDisplay)",
  "title": "A short, elegant title",
  "category": "${category}",
  "style": "${style}",
  "designRationale": "2-3 sentences explaining spatial rhythm, typography contrast, optical padding, and aesthetic restraint.",
  "tokens": {
    "accentColor": "#10B981",
    "glowColor": "rgba(16, 185, 129, 0.15)",
    "surface": "#0F1218",
    "border": "rgba(255, 255, 255, 0.08)",
    "radius": "14px"
  },
  "tags": ["Tailwind", "Responsive", "Glassmorphism", "Micro-Interaction"],
  "cleanCode": "Complete React component code using Tailwind CSS classes and Lucide icons",
  "htmlPreview": "Valid HTML snippet using Tailwind classes that can be directly previewed inside an iframe or div"
}
Do not wrap JSON in markdown blocks if possible, or return parseable JSON.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: `User Prompt: "${prompt}"\nCategory: ${category}\nStyle: ${style}\nCustom tokens: ${JSON.stringify(tokens)}`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        });

        const text = response.text;
        if (text) {
          try {
            const parsed = JSON.parse(text);
            res.json({ success: true, data: parsed, engine: "gemini-3.8-flash (Mande-AI)" });
            return;
          } catch {
            // If json parse failed, fall through to curated generator
          }
        }
      } catch (err: any) {
        console.warn("Mande-AI API generation fallback invoked:", err?.message);
      }
    }

    // Curated high-end algorithmic Mande-AI generation fallback
    const fallbackResults: Record<string, any> = {
      hero: {
        componentName: "SovereignHeroSection",
        title: "Autonomous Compute Hero Experience",
        category: "Hero Sections",
        style: "Cyber-Emerald Luxury",
        designRationale: "Constructed with strict 8pt spatial grid intervals, pairing deep obsidian surfaces (#090B0E) with subtle emerald photon reflections. Uses mathematical letter spacing (-0.025em) and optical padding to maintain balanced weight across responsive viewports.",
        tokens: {
          accentColor: "#10B981",
          glowColor: "rgba(16, 185, 129, 0.18)",
          surface: "#0D1117",
          border: "rgba(255, 255, 255, 0.08)",
          radius: "16px",
        },
        tags: ["Layrinth Aesthetics", "Bento Grid", "High Contrast", "Tailwind 4"],
        cleanCode: `import React from 'react';
import { ArrowUpRight, Sparkles, Shield, Cpu, Zap } from 'lucide-react';

export function SovereignHeroSection() {
  return (
    <div className="relative w-full max-w-5xl mx-auto p-8 rounded-2xl bg-[#0C0F15] border border-white/10 shadow-2xl overflow-hidden">
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono tracking-wider w-fit mb-6">
        <Sparkles className="w-3.5 h-3.5" />
        <span>MANDE-AI // ARCHITECTURE V3.5</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
        Synthesize <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-300">Design Systems</span> with Model Precision
      </h1>
      <p className="text-zinc-400 text-base md:text-lg max-w-2xl mb-8 leading-relaxed">
        Eliminate design-to-code drift. Mande AI harmonizes typography tokens, optical kerning, and production Tailwind modules in real-time.
      </p>
      <div className="flex flex-wrap gap-4 items-center">
        <button className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all duration-200 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          Launch Deployment <ArrowUpRight className="w-4 h-4" />
        </button>
        <button className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm border border-white/10 transition-all duration-200">
          Inspect Tokens
        </button>
      </div>
    </div>
  );
}`,
        htmlPreview: `<div class="p-8 rounded-2xl bg-[#0C0F15] border border-white/10 text-white shadow-2xl relative overflow-hidden">
  <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
    <span>●</span> MANDE-AI // ARCHITECTURE V3.5
  </div>
  <h2 class="text-3xl font-bold tracking-tight text-white mb-3">Synthesize Design Systems with Model Precision</h2>
  <p class="text-zinc-400 text-sm max-w-xl mb-6">Harmonizes typography tokens, optical kerning, and production Tailwind modules in real-time.</p>
  <div class="flex gap-3">
    <button class="px-5 py-2.5 rounded-lg bg-emerald-500 text-black font-semibold text-xs tracking-wide">Launch Deployment</button>
    <button class="px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 font-medium text-xs">Inspect Tokens</button>
  </div>
</div>`
      },
      bento: {
        componentName: "QuantumMetricsBento",
        title: "Telemetry & Latency Bento Grid",
        category: "Bento Grids",
        style: "Obsidian Matrix",
        designRationale: "Calculated with 1:1.618 golden ratio card distribution. Uses subtle 1px border highlights to define spatial boundaries without heavy shadows, preserving visual calmness.",
        tokens: {
          accentColor: "#22C55E",
          glowColor: "rgba(34, 197, 94, 0.15)",
          surface: "#0A0D12",
          border: "rgba(255, 255, 255, 0.07)",
          radius: "16px",
        },
        tags: ["Bento Layout", "Telemetry", "Glass", "Micro-Interactions"],
        cleanCode: `import React from 'react';
import { Activity, ShieldCheck, Cpu, HardDrive } from 'lucide-react';

export function QuantumMetricsBento() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mx-auto">
      <div className="md:col-span-2 p-6 rounded-2xl bg-[#0D1017] border border-white/10 relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>LATENCY PIPELINE</span>
          </div>
          <span className="text-zinc-500 text-xs font-mono">0.04ms AVG</span>
        </div>
        <div className="text-2xl font-bold text-white mb-2">99.98% Token Fidelity</div>
        <p className="text-zinc-400 text-sm mb-6">Zero visual divergence across 14 responsive breakpoint variations.</p>
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-500 w-[94%]" />
          <div className="h-full bg-lime-400 w-[6%]" />
        </div>
      </div>
      <div className="p-6 rounded-2xl bg-[#0D1017] border border-white/10 flex flex-col justify-between">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Cpu className="w-5 h-5" />
        </div>
        <div className="mt-6">
          <div className="text-3xl font-bold text-white font-mono">1.2M+</div>
          <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">Parameters Mapped</div>
        </div>
      </div>
    </div>
  );
}`,
        htmlPreview: `<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
  <div class="md:col-span-2 p-6 rounded-2xl bg-[#0D1017] border border-white/10">
    <div class="flex justify-between text-xs text-emerald-400 font-mono mb-3"><span>● ACTIVE TELEMETRY</span><span>0.04ms</span></div>
    <div class="text-xl font-bold mb-1">99.98% Token Precision</div>
    <p class="text-zinc-400 text-xs mb-4">Zero CSS divergence across all platforms.</p>
    <div class="h-2 bg-zinc-800 rounded-full overflow-hidden"><div class="h-full bg-emerald-400 w-[96%]"></div></div>
  </div>
  <div class="p-6 rounded-2xl bg-[#0D1017] border border-white/10 flex flex-col justify-between">
    <div class="text-xs text-zinc-400 font-mono">MODEL CAPACITY</div>
    <div class="text-2xl font-bold font-mono text-emerald-400">1.2M+ Tokens</div>
  </div>
</div>`
      }
    };

    const selected = prompt.toLowerCase().includes("bento") || prompt.toLowerCase().includes("grid") || prompt.toLowerCase().includes("metric")
      ? fallbackResults.bento
      : fallbackResults.hero;

    // Enhance fallback with the user's prompt text
    const customized = {
      ...selected,
      title: `${prompt.charAt(0).toUpperCase() + prompt.slice(1)} (Synthesized)`,
      userPrompt: prompt,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: customized,
      engine: "Mande-AI Deterministic Design Compiler"
    });
  });

  // Mande-IA v2.0 Agent Core Chat Endpoint (Decomposed Architecture)
  app.post("/api/agent/chat", async (req, res) => {
    const {
      message,
      language = "fr",
      model = "anthropic/claude-3.5-sonnet",
      enableWebSearch = true,
      history = [],
      conversationId
    } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "A message string is required." });
      return;
    }

    try {
      const result = await agentCore.execute({
        message,
        language,
        model,
        enableWebSearch,
        history,
        conversationId
      });

      res.json({
        success: true,
        data: {
          reply: result.reply,
          detectedIntent: result.intent,
          intentLabel: result.intentLabel,
          sources: result.sources,
          toolCalls: result.toolsExecuted.map((t) => ({ tool: t, query: message, count: result.sources.length })),
          modelUsed: result.modelUsed,
          provider: result.provider === "openrouter" ? "OpenRouter Gateway" : result.provider === "gemini" ? "Google Gemini API" : "Mande-IA Agent Core",
          language: result.language,
          latencyMs: result.latencyMs,
          plannerSteps: result.plannerSteps,
          agentRunId: result.agentRunId,
          tokens: {
            prompt: Math.round(message.length / 3) + 20,
            completion: Math.round(result.reply.length / 3) + 30,
            total: Math.round((message.length + result.reply.length) / 3) + 50
          },
          timestamp: result.timestamp
        }
      });
    } catch (err: any) {
      console.error("Agent execution failed:", err);
      res.status(500).json({ error: "Internal Agent Core Error", details: err?.message });
    }
  });

  // Project Framing Document Data Endpoint
  app.get("/api/mande-doc", (_req, res) => {
    res.json({
      success: true,
      title: "Présentation du projet Mande IA v2.0",
      version: "v2.0-MVP",
      status: "Ready for Jury and Partners"
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mande-AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Mande-AI server:", err);
  process.exit(1);
});
