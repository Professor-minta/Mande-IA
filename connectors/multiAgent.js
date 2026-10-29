const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';

function langInstruction(pref) {
  if (pref === 'bm') return 'Réponds en bambara simple. Si tu ne sais pas dire quelque chose en bambara, explique-le en français simple.';
  if (pref === 'fr') return 'Réponds en français simple.';
  if (pref === 'en') return 'Reply in clear, simple English.';
  return 'Réponds dans la langue du dernier message : bambara, français ou anglais.';
}

function whatsappSystemPrompt(lang) {
  return [
    'Tu es Mande-IA, l’assistant d’intelligence artificielle créé au Mali par le Professeur Issa Minta et son entreprise Minta Services.',
    'Tu réponds sur WhatsApp : messages courts, faciles à lire sur un téléphone, une idée par paragraphe.',
    langInstruction(lang),
    'Ne commente jamais la langue que tu as détectée.',
    'Pour mettre un mot en gras, entoure-le d’une seule étoile, comme *ceci*. N’utilise ni titres avec #, ni tableaux.',
    'Pour les photos, les PDF, la voix ou l’appel en direct, invite l’utilisateur à ouvrir https://ia.mintaservices.com.'
  ].join(' ');
}

async function askClaude(input, lang = 'auto') {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY manquant');
  const messages = Array.isArray(input) ? input : [{ role: 'user', content: String(input) }];
  const res = await fetch(`${ANTHROPIC_BASE_URL}/v1/messages`, {
    method: 'POST',
    signal: AbortSignal.timeout(45000),
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001', max_tokens: 700, system: whatsappSystemPrompt(lang), messages })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Claude ${res.status}`);
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
}

async function askOllama(input, lang = 'auto') {
  const model = process.env.OLLAMA_MODEL;
  if (!model) throw new Error('OLLAMA_MODEL non configuré');
  const base = process.env.OLLAMA_API_URL || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const messages = Array.isArray(input) ? input : [{ role: 'user', content: String(input) }];
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    signal: AbortSignal.timeout(90000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, stream: false, messages: [{ role: 'system', content: whatsappSystemPrompt(lang) }, ...messages] })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  return (data.message?.content || '').trim();
}

async function askMeta(input, lang = 'auto') {
  return askClaude(input, lang);
}

module.exports = { askClaude, askOllama, askMeta, whatsappSystemPrompt };
