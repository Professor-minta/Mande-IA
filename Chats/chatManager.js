// chats/chatManager.js - Routes to best agent based on language
const { askClaude, askOllama, askMeta } = require('../connectors/multiAgent');
let bambaraTools = { detectLang: (t) => 'auto', toBambara: (t) => t };
try { bambaraTools = require('../bambara_phrase'); } catch {}

const chatHistory = {};

async function handleChat(userId, message) {
  const detect = bambaraTools.detectLang || (() => 'auto');
  const lang = detect(message) || 'auto';

  if (!chatHistory[userId]) chatHistory[userId] = [];
  chatHistory[userId].push({ role: 'user', text: message, lang, at: new Date().toISOString() });
  if (chatHistory[userId].length > 20) chatHistory[userId].shift();

  let reply = '';
  try {
    if (process.env.OLLAMA_API_URL && lang!== 'bm') {
      reply = await askOllama(message);
    } else {
      reply = await askClaude(message, lang);
    }
    if (!reply) reply = await askMeta(message);
  } catch (e) {
    console.error('MultiAgent error:', e.message);
    try { reply = await askClaude(message, lang); } catch { reply = "Mande-IA est indisponible, réessayez."; }
  }

  chatHistory[userId].push({ role: 'assistant', text: reply, at: new Date().toISOString() });
  console.log(`[CHAT] ${userId} (${lang}): ${message.slice(0,50)} -> ${reply.slice(0,50)}`);
  return { reply, lang, history: chatHistory[userId] };
}

module.exports = { handleChat, chatHistory };