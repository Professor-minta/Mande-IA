import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "100kb" }));
app.use(express.static("public"));

const systemPrompt = `You are Mande-IA, a warm, practical voice assistant for people in Mali.
Reply first in simple Bambara (Bamanankan), using Latin spelling. If the user writes in French,
you may add a brief French clarification after the Bambara answer. Be concise, respectful, and
honest when uncertain. Never invent emergency, health, legal, or financial facts. For emergencies,
tell the person to contact local emergency services or a trusted nearby person immediately.`;

app.post("/api/chat", async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message || message.length > 2_000) {
    return res.status(400).json({ error: "Send a message between 1 and 2000 characters." });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "The assistant is not configured yet. Add OPENAI_API_KEY on the server." });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }],
      temperature: 0.5,
      max_tokens: 350
    });
    return res.json({ reply: response.choices[0]?.message?.content || "Hakili, a fɔ kɔfɛ." });
  } catch (error) {
    console.error("OpenAI request failed:", error.message);
    return res.status(502).json({ error: "Mande-IA could not answer right now. Please try again." });
  }
});

app.listen(port, "0.0.0.0", () => console.log(`Mande-IA is listening on port ${port}`));
