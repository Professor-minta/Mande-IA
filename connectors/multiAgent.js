// connectors/multiAgent.js - Mande-IA v2 Multi-Agent Core
// Works with your.env: ANTHROPIC_API_KEY, OLLAMA_API_URL, DJELIA_API_KEY

function langInstruction(pref) {
  if (pref === 'bm') return 'Réponds uniquement en Bambara malien simple et court.';
  if (pref === 'fr') return 'Réponds en français simple et court.';
  if (pref === 'en') return 'Reply in clear, concise English.';
  return 'Détecte la langue (bm/fr/en) et réponds dans la même langue.';
}

async function askClaude(message, lang = 'auto') {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY manquant');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `Tu es Mande-IA v2 pour le Mali. ${langInstruction(lang)}`,
      messages: [{ role: 'user', content: message }]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Claude error');
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
}

async function askOllama(message) {
  const base = process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3';
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: message }], stream: false })
  });
  const data = await res.json();
  return data.message?.content || data.response || '';
}

async function askMeta(message) {
  // Fallback: if Djelia available use it, else use Claude
  try { return await askClaude(message); } catch { return "N'faamu. I ka to kuma joona?"; }
}

module.exports = { askClaude, askOllama, askMeta };