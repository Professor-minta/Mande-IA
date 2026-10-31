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
    'Pour les photos, les PDF, la voix ou l’appel en direct, invite l’utilisateur à ouvrir https://ia.mintaservices.com.',
    'Liens officiels, à donner tels quels et sans jamais en inventer d’autres : Minta Academy, formation gratuite en 10 modules (cloud, serveurs, IA locale avec Ollama et le modèle professor-minta/mande-ia.v3) https://mintaservices.com/academy/ ; pack Mande-IA hors ligne pour les entreprises https://mintaservices.com/academy/entreprises.html ; Minta Services Entrepreneurship https://mintaservices.com/entrepreneuriat/ ; site de Minta Services https://mintaservices.com ; application Mande-IA https://ia.mintaservices.com ; code source https://github.com/Professor-minta/Mande-IA.'
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

async function* streamClaude(input, lang = 'auto', signal) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY manquant');
  const messages = Array.isArray(input) ? input : [{ role: 'user', content: String(input) }];
  const res = await fetch(`${ANTHROPIC_BASE_URL}/v1/messages`, {
    method: 'POST',
    signal: signal || AbortSignal.timeout(90000),
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001', max_tokens: 900, stream: true, system: whatsappSystemPrompt(lang), messages })
  });
  if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data?.error?.message || `Claude ${res.status}`); }
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true }).replace(/\r\n/g, '\n');
    let index;
    while ((index = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, index); buffer = buffer.slice(index + 2);
      const data = block.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
      if (!data) continue;
      let event; try { event = JSON.parse(data); } catch { continue; }
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') yield event.delta.text;
      else if (event.type === 'error') throw new Error(event.error?.message || 'Claude stream error');
    }
  }
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

module.exports = { askClaude, streamClaude, askOllama, askMeta, whatsappSystemPrompt };
