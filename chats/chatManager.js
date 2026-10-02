const { askClaude, askOllama, askMeta } = require('../connectors/multiAgent');
const chatHistory = {};
async function handleChat(userId, message) {
  let lang = 'auto';
  try {
    if (message.match(/[ɛɔɲ]/i) || message.toLowerCase().includes('i ni ce')) lang = 'bm';
  } catch {}
  if (!chatHistory[userId]) chatHistory[userId] = [];
  chatHistory[userId].push({ role: 'user', text: message, lang, at: new Date().toISOString() });
  let reply = '';
  try {
    if (process.env.OLLAMA_API_URL) { try { reply = await askOllama(message); } catch { reply = ''; } }
    if (!reply) reply = await askClaude(message, lang);
  } catch (e) { reply = "Mande-IA est indisponible, réessayez."; }
  chatHistory[userId].push({ role: 'assistant', text: reply, at: new Date().toISOString() });
  return { reply, lang, history: chatHistory[userId] };
}
module.exports = { handleChat, chatHistory };
