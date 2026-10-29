const { askClaude, streamClaude, askOllama } = require('../connectors/multiAgent');

const MAX_TURNS = 8;
const MAX_USERS = 500;
const chatHistory = new Map();

function detectLanguage(message) {
  if (/[ɛɔɲŋ]/i.test(message) || /\b(i ni ce|aw ni ce|i ka kɛnɛ|i ka kene|n bɛ|n be)\b/i.test(message)) return 'bm';
  return 'auto';
}

function historyFor(userId) {
  if (!chatHistory.has(userId)) {
    if (chatHistory.size >= MAX_USERS) chatHistory.delete(chatHistory.keys().next().value);
    chatHistory.set(userId, []);
  }
  return chatHistory.get(userId);
}

async function handleChat(userId, message) {
  const lang = detectLanguage(message);
  const history = historyFor(userId);
  const messages = [...history, { role: 'user', content: message }];
  let reply = '';
  try {
    reply = await askClaude(messages, lang);
  } catch (error) {
    console.error('WhatsApp Claude:', error.message);
    if (process.env.OLLAMA_MODEL) {
      try { reply = await askOllama(messages, lang); } catch (e) { console.error('WhatsApp Ollama:', e.message); }
    }
  }
  if (!reply) reply = 'Mande-IA est momentanément indisponible. Réessayez dans quelques minutes.';
  else {
    history.push({ role: 'user', content: message }, { role: 'assistant', content: reply });
    while (history.length > MAX_TURNS * 2) history.shift();
  }
  return { reply, lang, history };
}

async function streamChat(userId, message, onText) {
  const lang = detectLanguage(message);
  const history = historyFor(userId);
  const messages = [...history, { role: 'user', content: message }];
  let reply = '';
  try {
    for await (const text of streamClaude(messages, lang)) { reply += text; await onText(text); }
  } catch (error) {
    console.error('WhatsApp Claude:', error.message);
    if (!reply && process.env.OLLAMA_MODEL) {
      try { const local = await askOllama(messages, lang); if (local) { reply = local; await onText(local); } }
      catch (e) { console.error('WhatsApp Ollama:', e.message); }
    }
  }
  if (reply) {
    history.push({ role: 'user', content: message }, { role: 'assistant', content: reply });
    while (history.length > MAX_TURNS * 2) history.shift();
  }
  return reply;
}

module.exports = { handleChat, streamChat, chatHistory };
