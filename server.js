require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const SQLiteStoreFactory = require('connect-sqlite3');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const { handleChat } = require('./chats/chatManager');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DJELIA_BASE_URL = 'https://api.djelia.cloud/openai/v1';

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, 'backups'), { recursive: true });
const db = new Database(path.join(DATA_DIR, 'mande-ia.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free', 'pro')), created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, role TEXT NOT NULL CHECK(role IN ('user', 'assistant')), content TEXT NOT NULL, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS daily_usage (identity TEXT NOT NULL, day TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(identity, day)); CREATE TABLE IF NOT EXISTS whatsapp_inbound (message_id TEXT PRIMARY KEY, created_at TEXT NOT NULL);`);
const now = () => new Date().toISOString(); const day = () => new Date().toISOString().slice(0, 10); const id = () => crypto.randomUUID();
const emailIsValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const getUser = (userId) => db.prepare('SELECT id, email, plan FROM users WHERE id = ?').get(userId);
const usageIdentity = (req) => { if (req.session.userId) return `user:${req.session.userId}`; if (!req.session.guestId) req.session.guestId = id(); return `guest:${req.session.guestId}`; };
function usageFor(req, user) { if (user?.plan === 'pro') return { used: 0, remaining: null, limit: null }; const key = usageIdentity(req); const row = db.prepare('SELECT count FROM daily_usage WHERE identity = ? AND day = ?').get(key, day()); const used = row?.count || 0; return { used, remaining: Math.max(0, 5 - used), limit: 5 }; }
function consumeQuestion(req, user) { if (user?.plan === 'pro') return usageFor(req, user); const usage = usageFor(req, user); if (usage.used >= 5) return null; db.prepare(`INSERT INTO daily_usage(identity, day, count) VALUES (?, ?, 1) ON CONFLICT(identity, day) DO UPDATE SET count = count + 1`).run(usageIdentity(req), day()); return usageFor(req, user); }

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '1mb', verify: (req, res, buffer) => { if (req.originalUrl === '/api/whatsapp/webhook') req.rawBody = buffer; }}));
app.use(express.urlencoded({ extended: false }));
app.use(session({ store: new (SQLiteStoreFactory(session))({ db: 'sessions.db', dir: DATA_DIR }), secret: process.env.SESSION_SECRET || 'change-this-before-launch', proxy: true, resave: false, saveUninitialized: false, cookie: { httpOnly: true, secure: 'auto', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 } }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false }));
const aiLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 25, standardHeaders: true, legacyHeaders: false });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function sessionInfo(req) { const user = req.session.userId ? getUser(req.session.userId) : null; if (!user && !req.session.guestId) req.session.guestId = id(); const usage = usageFor(req, user); return { success: true, user: user ? { email: user.email, plan: user.plan } : null, is_guest: !user, usage }; }
function saveSessionInfo(req, res, next) { req.session.save((error) => { if (error) return next(error); return res.json(sessionInfo(req)); }); }

app.post('/api/auth', async (req, res, next) => {
  try {
    const action = req.body?.action; if (action === 'guest') return res.json(sessionInfo(req)); if (action === 'check') return saveSessionInfo(req, res, next); if (action === 'logout') return req.session.destroy(() => res.json({ success: true }));
    const email = String(req.body?.email || '').trim().toLowerCase(); const password = String(req.body?.password || '');
    if (action === 'register') { if (!emailIsValid(email)) return res.status(400).json({ error: 'Adresse e-mail invalide.' }); if (password.length < 8) return res.status(400).json({ error: 'Le mot de passe doit avoir au moins 8 caractères.' }); if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) return res.status(409).json({ error: 'Cette adresse e-mail existe déjà.' }); const userId = id(); db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(userId, email, await bcrypt.hash(password, 12), now()); req.session.userId = userId; return saveSessionInfo(req, res, next); }
    if (action === 'login') { const account = db.prepare('SELECT * FROM users WHERE email = ?').get(email); if (!account || !(await bcrypt.compare(password, account.password_hash))) return res.status(401).json({ error: 'E-mail ou mot de passe incorrect.' }); req.session.userId = account.id; return saveSessionInfo(req, res, next); }
    return res.status(400).json({ error: 'Action inconnue.' });
  } catch (error) { next(error); }
});
function requireUser(req, res, next) { const user = req.session.userId ? getUser(req.session.userId) : null; if (!user) return res.status(401).json({ error: 'Connectez-vous pour accéder à vos conversations.' }); req.user = user; next(); }
app.get('/api/conversations', requireUser, (req, res) => { const rows = db.prepare(`SELECT c.id, c.title, c.created_at, c.updated_at, (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS preview FROM conversations c WHERE c.user_id = ? ORDER BY c.updated_at DESC`).all(req.user.id); res.json({ conversations: rows }); });
app.post('/api/conversations', requireUser, (req, res) => { const conversation = { id: id(), title: 'Nouvelle conversation', created_at: now(), updated_at: now() }; db.prepare('INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(conversation.id, req.user.id, conversation.title, conversation.created_at, conversation.updated_at); res.status(201).json({ conversation }); });
app.get('/api/conversations/:id', requireUser, (req, res) => { const conversation = db.prepare('SELECT id, title FROM conversations WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id); if (!conversation) return res.status(404).json({ error: 'Conversation introuvable.' }); const messages = db.prepare('SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at').all(conversation.id); res.json({ conversation, messages }); });
app.delete('/api/conversations/:id', requireUser, (req, res) => { const result = db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id); if (!result.changes) return res.status(404).json({ error: 'Conversation introuvable.' }); res.json({ success: true }); });

function selectedConversation(req, conversationId) { if (!req.session.userId || !conversationId) return null; return db.prepare('SELECT id, title FROM conversations WHERE id = ? AND user_id = ?').get(conversationId, req.session.userId); }
function languageInstruction(p) { if (p === 'bm') return 'Réponds uniquement en Bambara (bamanankan), simple et court.'; if (p === 'fr') return 'Réponds uniquement en français simple et court.'; if (p === 'en') return 'Reply only in clear, concise English.'; return 'Détecte la langue du dernier message et réponds dans cette même langue: Bambara, français ou anglais.'; }
async function askClaude(messages, preference = 'auto', maxTokens = 300) {
  if (!process.env.ANTHROPIC_API_KEY) { const error = new Error('Clé Claude non configurée.'); error.status = 503; throw error; }
  const response = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001', max_tokens: maxTokens, system: `Tu es Mande-IA, assistant pour le Mali. ${languageInstruction(preference)}`, messages }) });
  const data = await response.json(); if (!response.ok) { const error = new Error(data?.error?.message || 'Erreur externe.'); error.status = 502; throw error; }
  const reply = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim(); if (!reply) { const error = new Error('Réponse vide.'); error.status = 502; throw error; } return reply;
}

app.post('/api/ai', aiLimit, async (req, res, next) => {
  try {
    const user = req.session.userId ? getUser(req.session.userId) : null; const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-12) : []; if (!messages.length) return res.status(400).json({ error: 'Message invalide.' });
    const usage = consumeQuestion(req, user); if (!usage) return res.status(429).json({ error: 'Limite atteinte.', usage: usageFor(req, user) });
    const preference = ['auto', 'bm', 'fr', 'en'].includes(req.body?.language) ? req.body.language : 'auto';
    let reply; try { reply = await askClaude(messages, preference); } catch (error) { return res.status(error.status || 502).json({ error: error.message }); }
    const conversation = selectedConversation(req, req.body?.conversationId);
    if (conversation) { const lastUser = messages[messages.length - 1]; const created = now(); const insert = db.prepare('INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'); const save = db.transaction(() => { insert.run(id(), conversation.id, 'user', lastUser.content, created); insert.run(id(), conversation.id, 'assistant', reply, created); const title = conversation.title === 'Nouvelle conversation' ? lastUser.content.slice(0, 60) || conversation.title : conversation.title; db.prepare('UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?').run(title, created, conversation.id); }); save(); }
    res.json({ reply, usage, plan: user?.plan || 'free' });
  } catch (error) { next(error); }
});

// --- OLLAMA LOCAL ROUTE (BACK) ---
app.post('/api/ollama-chat', async (req, res) => {
    const userMessage = req.body.message;
    const ollamaBase = process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2';
    try {
        const response = await fetch(`${ollamaBase}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: ollamaModel, messages: [{ role: 'user', content: userMessage }], stream: false }) });
        const data = await response.json();
        res.json({ reply: data.message.content });
    } catch (error) { console.error("Erreur Ollama local:", error); res.status(500).json({ error: "Impossible de joindre le modèle local." }); }
});

app.post('/api/voice/transcribe', upload.single('audio'), async (req, res, next) => {
  try { if (!req.file) return res.status(400).json({ error: 'Aucun audio reçu.' }); if (!process.env.DJELIA_API_KEY) return res.status(503).json({ error: 'Clé Djelía non configurée.' }); const form = new FormData(); form.append('file', new Blob([req.file.buffer], { type: req.file.mimetype || 'audio/mp4' }), req.file.originalname || 'audio.m4a'); form.append('model', 'sunjata-1'); const response = await fetch(`${DJELIA_BASE_URL}/audio/transcriptions`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.DJELIA_API_KEY}` }, body: form }); const raw = await response.text(); let data = {}; try { data = JSON.parse(raw || '{}'); } catch { data = {}; } if (!response.ok) return res.status(502).json({ error: 'Transcription échouée.' }); res.json({ text: data.text || '' }); } catch (error) { next(error); }
});
app.post('/api/voice/speak', async (req, res, next) => { try { const text = String(req.body?.text || '').trim(); if (!text) return res.status(400).json({ error: 'Texte manquant.' }); if (!process.env.DJELIA_API_KEY) return res.status(503).json({ error: 'Clé Djelía non configurée.' }); const response = await fetch(`${DJELIA_BASE_URL}/audio/speech`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.DJELIA_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ model: 'jifili-1', input: text.slice(0, 3000), voice: 'moussa', response_format: 'mp3' }) }); if (!response.ok) return res.status(502).json({ error: 'Djelía ne peut pas lire.' }); res.json({ audio: Buffer.from(await response.arrayBuffer()).toString('base64') }); } catch (error) { next(error); } });

function validMetaSignature(req) { if (!process.env.META_APP_SECRET) return true; const received = req.get('x-hub-signature-256') || ''; const expected = `sha256=${crypto.createHmac('sha256', process.env.META_APP_SECRET).update(req.rawBody || Buffer.from('')).digest('hex')}`; return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected)); }
async function sendWhatsAppText(to, body) { const token = process.env.WHATSAPP_ACCESS_TOKEN; const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID; if (!token || !phoneNumberId) return; const graphVersion = process.env.META_GRAPH_API_VERSION || 'v23.0'; const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { preview_url: false, body } }) }); if (!response.ok) console.error('WhatsApp échoué:', response.status); }

app.get('/api/whatsapp/webhook', (req, res) => { const mode = req.query['hub.mode']; const token = req.query['hub.verify_token']; const challenge = req.query['hub.challenge']; if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) return res.status(200).send(String(challenge || '')); return res.sendStatus(403); });
app.post('/api/whatsapp/webhook', (req, res) => {
  if (!validMetaSignature(req)) return res.sendStatus(403); res.sendStatus(200);
  Promise.resolve().then(async () => {
    const changes = (req.body?.entry || []).flatMap((e) => e.changes || []);
    for (const change of changes) { for (const message of change.value?.messages || []) {
        const from = String(message.from || ''); const messageId = String(message.id || ''); if (!messageId || message.type !== 'text' || !message.text?.body) continue;
        if (process.env.WHATSAPP_TEST_MODE !== 'false' && from !== String(process.env.WHATSAPP_TEST_RECIPIENT || '')) continue;
        try { db.prepare('INSERT INTO whatsapp_inbound (message_id, created_at) VALUES (?, ?)').run(messageId, now()); } catch (e) { if (String(e.message).includes('UNIQUE constraint failed')) continue; throw e; }
        const incomingText = String(message.text.body).trim(); console.log(`WhatsApp Multi-Agent [${from}]: ${incomingText}`);
        let replyText; try { const result = await handleChat(from, incomingText); replyText = result.reply; } catch (error) { console.error('chatManager failed:', error.message); try { replyText = await askClaude([{ role: 'user', content: incomingText.slice(0, 4000) }], 'auto', 220); } catch (e) { replyText = 'Mande-IA est indisponible pour le moment.'; } }
        await sendWhatsAppText(from, replyText.slice(0, 3500));
    } }
  }).catch((error) => console.error('WhatsApp error:', error.message));
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'mande-ia.v2', multiAgent: true, chatManager: true, ollama: true, claude: Boolean(process.env.ANTHROPIC_API_KEY), djelia: Boolean(process.env.DJELIA_API_KEY) }));
app.get('/sitemap.xml', (req, res) => { res.type('application/xml'); res.sendFile(path.join(PUBLIC_DIR, 'sitemap.xml')); });
app.get('/robots.txt', (req, res) => { res.type('text/plain'); res.sendFile(path.join(PUBLIC_DIR, 'robots.txt')); });
app.use(express.static(PUBLIC_DIR));
app.get(/.*/, (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
app.use((error, req, res, next) => { console.error(error); res.status(500).json({ error: 'Erreur interne.' }); });
app.listen(PORT, () => console.log(`Mande-IA v2 Multi-Agent + Ollama écoute sur le port ${PORT}`));