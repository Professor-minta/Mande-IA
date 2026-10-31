const crypto = require('crypto');
const { streamChat } = require('../chats/chatManager');

const GRAPH_BASE_URL = process.env.META_GRAPH_BASE_URL || 'https://graph.facebook.com';
const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v26.0';
const TEST_MODE = process.env.WHATSAPP_TEST_MODE !== 'false';
const limitSetting = Number.parseInt(process.env.WHATSAPP_DAILY_LIMIT ?? '5', 10);
const DAILY_LIMIT = Number.isFinite(limitSetting) && limitSetting >= 0 ? limitSetting : 5;
const MAX_TEXT = 4000;
const MIN_PARAGRAPH_SEND = 350;
const MAX_PARTIAL_SENDS = 3;
const GITHUB_REPO = 'Professor-minta/Mande-IA';
const WEBHOOK_PATHS = ['/whatsapp/webhook', '/api/whatsapp/webhook', '/webhook/whatsapp', '/api/webhook', '/webhook'];
const WELCOME_IMAGE = process.env.WHATSAPP_WELCOME_IMAGE ?? 'https://ia.mintaservices.com/icons/whatsapp-accueil.jpg';

function isWebhookPath(url) {
  return WEBHOOK_PATHS.includes(String(url).split('?')[0].replace(/(.)\/+$/, '$1'));
}
function digits(value) { return String(value || '').replace(/\D/g, ''); }
function testNumbers() { return String(process.env.WHATSAPP_TEST_RECIPIENT || '').split(',').map(digits).filter(Boolean); }

const TEXT = {
  notText: 'Pour l’instant, Mande-IA répond aux messages écrits sur WhatsApp. Pour envoyer une photo, un PDF ou parler à voix haute, ouvrez https://ia.mintaservices.com',
  limit: `Vos ${DAILY_LIMIT} messages gratuits d’aujourd’hui sont utilisés. Revenez demain. Pour un accès illimité, passez à Pro en écrivant au +223 77 29 52 59.`,
  unavailable: 'Mande-IA est momentanément indisponible. Réessayez dans quelques minutes.',
  unknownChoice: 'Ce choix n’est plus disponible. Tapez *menu* pour voir les sujets.'
};

const MENU = [
  {
    title: 'Demander à Mande-IA',
    rows: [
      { id: 'conseil', title: 'Conseil entrepreneurial', description: 'Lancer une activité au Mali avec peu de moyens', prompt: 'Donne-moi un conseil entrepreneurial concret pour lancer une petite entreprise au Mali avec peu de moyens.' },
      { id: 'ecole', title: 'École malienne expliquée', description: 'Du fondamental à l’université, expliqué simplement', prompt: 'Explique-moi simplement comment fonctionne l’école au Mali, du fondamental jusqu’à l’université.' },
      { id: 'lecon', title: 'Leçon du jour', description: 'Une phrase en bambara, traduite et expliquée', prompt: 'Donne-moi une courte leçon du jour en bambara, avec la traduction en français et un exemple.' },
      { id: 'ia', title: 'Crée ton propre IA', description: 'Débuter avec l’IA locale, pas à pas', prompt: 'Comment créer ma propre IA locale avec Ollama, étape par étape, pour un débutant ?' },
      { id: 'mali', title: 'À propos du Mali', description: 'Géographie, régions, langues et histoire', prompt: 'Présente-moi le Mali : sa géographie, ses régions, ses langues et son histoire.' }
    ]
  },
  {
    title: 'Minta Services',
    rows: [
      { id: 'github', title: 'Mande-IA sur GitHub', description: 'Le code ouvert du projet' },
      { id: 'createur', title: 'Qui a créé Mande-IA', description: 'Le Professeur Issa Minta et Minta Services' },
      { id: 'academy', title: 'Rejoindre Minta Academy', description: 'Cours gratuits : cloud, serveurs et IA locale' },
      { id: 'entrepreneuriat', title: 'Minta Entrepreneurship', description: 'Le programme pour les porteurs de projets' },
      { id: 'professeur', title: 'Rencontrer Pr Issa Minta', description: 'Écrire au Professeur sur WhatsApp' }
    ]
  }
];
const ROWS = Object.fromEntries(MENU.flatMap((section) => section.rows).map((row) => [row.id, row]));

const STATIC_REPLIES = {
  createur: '*Mande-IA* a été créé au Mali par le Professeur *Issa Minta*, professeur de technologie et fondateur de *Minta Services*.\n\nSon objectif : rendre l’intelligence artificielle accessible en bambara, en français et en anglais.\n\nEssayez aussi Mande-IA sur le web : https://ia.mintaservices.com',
  academy: '*Minta Academy* est une formation *gratuite* en 10 modules : nom de domaine, serveur VPS, aaPanel, Node.js, Python et intelligence artificielle sans internet avec Mande-IA v3.\n\nCommencez ici : https://mintaservices.com/academy/\n\nPour essayer Mande-IA sur votre ordinateur : installez Ollama puis tapez `ollama run professor-minta/mande-ia.v3`',
  entrepreneuriat: '*Minta Entrepreneurship* accompagne les entrepreneurs maliens et africains, de l’idée au premier client : incubation, outils numériques, intelligence artificielle et réseau.\n\nPrésentez votre projet : https://mintaservices.com/entrepreneuriat/\nE-mail : entrepreneuriat@mintaservices.com',
  professeur: 'Pour écrire directement au Professeur Issa Minta : https://wa.me/22377295259'
};

const MENU_WORDS = /^\/?(menu|aide|help)$/;
const GREETING = /^(\/?menu|\/?aide|help|start|commencer|bonjour|bonsoir|salut|slt|hello|hi|hey|coucou|(i|aw|an) ni (ce|sogoma|tile|wula|su))( (mande ?ia|mande ?ai))?$/;
function normalize(text) {
  return String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9/ ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function isMenuRequest(text) { return GREETING.test(normalize(text)); }
function firstName(name) {
  const first = String(name || '').replace(/[*_~`]/g, '').trim().split(/\s+/)[0] || '';
  return /^[\p{L}][\p{L}'’-]{1,19}$/u.test(first) ? first : '';
}
function welcomeText(name) {
  return `I ni ce${name ? `, ${name}` : ''} ! Je suis *Mande-IA*, votre assistant en bambara, en français et en anglais.\n\nComment puis-je vous aider aujourd’hui ? Écrivez votre question, ou choisissez un sujet.`;
}

function whatsappFormat(text) {
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .replace(/__(.+?)__/g, '*$1*')
    .replace(/^\s*#{1,6}\s+(.+)$/gm, '*$1*')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1 ($2)')
    .trim();
}
function maskNumber(number) { return `${number.slice(0, -4).replace(/\d/g, '•')}${number.slice(-4)}`; }

async function graphPost(phoneId, path, body) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_ROOT_TOKEN;
  const phoneNumberId = phoneId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) { console.error('WhatsApp : WHATSAPP_ACCESS_TOKEN ou WHATSAPP_PHONE_NUMBER_ID manquant.'); return false; }
  try {
    const response = await fetch(`${GRAPH_BASE_URL}/${GRAPH_VERSION}/${phoneNumberId}/${path}`, { method: 'POST', signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', ...body }) });
    if (response.ok) return true;
    const data = await response.json().catch(() => ({}));
    console.error(`WhatsApp ${body.type || body.status || 'requête'} refusé :`, response.status, data?.error?.code || '', data?.error?.message || '');
  } catch (error) { console.error('WhatsApp injoignable :', error.message); }
  return false;
}

async function sendText(phoneId, to, text) {
  let rest = whatsappFormat(text);
  let sent = true;
  while (rest) {
    let part = rest;
    if (part.length > MAX_TEXT) {
      const cut = Math.max(part.lastIndexOf('\n\n', MAX_TEXT), part.lastIndexOf('\n', MAX_TEXT), part.lastIndexOf(' ', MAX_TEXT));
      part = part.slice(0, cut > MAX_TEXT / 2 ? cut : MAX_TEXT);
    }
    rest = rest.slice(part.length).trim();
    sent = (await graphPost(phoneId, 'messages', { recipient_type: 'individual', to, type: 'text', text: { preview_url: false, body: part.trim() } })) && sent;
  }
  return sent;
}

function showTyping(phoneId, messageId) {
  return graphPost(phoneId, 'messages', { status: 'read', message_id: messageId, typing_indicator: { type: 'text' } });
}

function sendMenu(phoneId, to, name = '') {
  return graphPost(phoneId, 'messages', {
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: { type: 'text', text: 'Mande-IA' },
      body: { text: welcomeText(name) },
      footer: { text: 'Tapez menu pour revoir ce choix' },
      action: {
        button: 'Voir le menu',
        sections: MENU.map((section) => ({ title: section.title, rows: section.rows.map(({ id, title, description }) => ({ id, title, description })) }))
      }
    }
  });
}

async function sendWelcome(phoneId, to, name) {
  if (WELCOME_IMAGE) {
    const sent = await graphPost(phoneId, 'messages', {
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: { type: 'image', image: { link: WELCOME_IMAGE } },
        body: { text: welcomeText(name) },
        footer: { text: 'Tapez menu à tout moment' },
        action: { buttons: [
          { type: 'reply', reply: { id: 'menu', title: 'Voir tout le menu' } },
          { type: 'reply', reply: { id: 'lecon', title: 'Leçon du jour' } },
          { type: 'reply', reply: { id: 'conseil', title: 'Conseil d’entreprise' } }
        ] }
      }
    });
    if (sent) return true;
  }
  return sendMenu(phoneId, to, name);
}

let githubCache = { at: 0, text: '' };
async function githubReply() {
  if (Date.now() - githubCache.at < 10 * 60 * 1000 && githubCache.text) return githubCache.text;
  const link = `https://github.com/${GITHUB_REPO}`;
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, { signal: AbortSignal.timeout(8000), headers: { 'user-agent': 'Mande-IA', accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error(`GitHub ${response.status}`);
    const repo = await response.json();
    const updated = new Date(repo.pushed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const text = [`*Mande-IA sur GitHub*`, repo.description || 'Le code de l’assistant IA en bambara, français et anglais.', `Étoiles : ${repo.stargazers_count} · Dernière mise à jour : ${updated}`, `Code source : ${repo.html_url || link}`].join('\n\n');
    githubCache = { at: Date.now(), text };
    return text;
  } catch (error) {
    console.error('GitHub :', error.message);
    return `*Mande-IA sur GitHub*\n\nLe code de Mande-IA est ouvert : ${link}`;
  }
}

function setupWhatsApp(app, { db, day, now }) {
  const envPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  if (!TEST_MODE && !process.env.META_APP_SECRET) console.warn('WhatsApp : META_APP_SECRET manquant, les messages WhatsApp seront refusés tant qu’il n’est pas dans .env.');
  if (envPhoneId && envPhoneId === process.env.META_APP_ID) console.warn('WhatsApp : WHATSAPP_PHONE_NUMBER_ID contient l’App ID. Les réponses partent quand même du numéro qui reçoit le message, mais « configurer » a besoin du vrai Phone number ID.');
  if (TEST_MODE) console.log(testNumbers().length ? `WhatsApp : mode test, réponses seulement au ${testNumbers().map(maskNumber).join(', ')}.` : 'WhatsApp : mode test sans WHATSAPP_TEST_RECIPIENT, Mande-IA ne répondra à personne.');
  else console.log('WhatsApp : mode public.');
  console.log(`WhatsApp : webhook sur ${WEBHOOK_PATHS.slice(0, 2).join(' et ')}.`);

  function validSignature(req) {
    if (!process.env.META_APP_SECRET) return TEST_MODE;
    const received = req.get('x-hub-signature-256') || '';
    const expected = `sha256=${crypto.createHmac('sha256', process.env.META_APP_SECRET).update(req.rawBody || Buffer.from('')).digest('hex')}`;
    return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  }

  function takeQuota(from) {
    if (!DAILY_LIMIT || testNumbers().includes(from)) return 'ok';
    const identity = `wa:${from}`;
    const used = db.prepare('SELECT count FROM daily_usage WHERE identity = ? AND day = ?').get(identity, day())?.count || 0;
    if (used > DAILY_LIMIT) return 'silent';
    db.prepare('INSERT INTO daily_usage(identity, day, count) VALUES (?, ?, 1) ON CONFLICT(identity, day) DO UPDATE SET count = count + 1').run(identity, day());
    return used >= DAILY_LIMIT ? 'limit' : 'ok';
  }
  function refundQuota(from) {
    db.prepare('UPDATE daily_usage SET count = MAX(0, count - 1) WHERE identity = ? AND day = ?').run(`wa:${from}`, day());
  }

  async function answer(phoneId, from, question, messageId) {
    const quota = takeQuota(from);
    if (quota === 'silent') return;
    if (quota === 'limit') { await sendText(phoneId, from, TEXT.limit); return; }
    let pending = '';
    let partials = 0;
    const flushParagraphs = async () => {
      if (partials >= MAX_PARTIAL_SENDS) return;
      const cut = pending.lastIndexOf('\n\n');
      if (cut < MIN_PARAGRAPH_SEND) return;
      const part = pending.slice(0, cut);
      if ((part.match(/```/g) || []).length % 2) return;
      pending = pending.slice(cut + 2);
      partials += 1;
      await sendText(phoneId, from, part);
      showTyping(phoneId, messageId);
    };
    const reply = await streamChat(from, question, async (text) => { pending += text; await flushParagraphs(); });
    if (!reply) { refundQuota(from); await sendText(phoneId, from, TEXT.unavailable); return; }
    if (pending.trim()) await sendText(phoneId, from, pending);
  }

  async function handleMessage(message, phoneId, name) {
    const from = String(message.from || '');
    const messageId = String(message.id || '');
    if (!messageId || !from) return;
    if (TEST_MODE && !testNumbers().includes(from)) { console.log(`WhatsApp (mode test) : message de ${maskNumber(from)} ignoré. Ajoutez ce numéro dans WHATSAPP_TEST_RECIPIENT ou passez WHATSAPP_TEST_MODE=false.`); return; }
    try { db.prepare('INSERT INTO whatsapp_inbound (message_id, created_at) VALUES (?, ?)').run(messageId, now()); }
    catch (error) { if (String(error.message).includes('UNIQUE constraint failed')) return; throw error; }
    console.log(`WhatsApp [${maskNumber(from)}] : ${message.type} reçu`);

    if (message.type === 'request_welcome') { await sendWelcome(phoneId, from, name); return; }
    await showTyping(phoneId, messageId);

    if (message.type === 'interactive') {
      const choice = message.interactive?.list_reply || message.interactive?.button_reply;
      if (choice?.id === 'menu') { await sendMenu(phoneId, from, name); return; }
      const row = ROWS[choice?.id];
      if (!row) { await sendText(phoneId, from, TEXT.unknownChoice); return; }
      if (row.prompt) { await answer(phoneId, from, row.prompt, messageId); return; }
      await sendText(phoneId, from, row.id === 'github' ? await githubReply() : STATIC_REPLIES[row.id]);
      return;
    }
    if (message.type !== 'text' || !message.text?.body) { await sendText(phoneId, from, TEXT.notText); return; }
    const text = String(message.text.body).trim().slice(0, 4000);
    if (isMenuRequest(text)) { await (MENU_WORDS.test(normalize(text)) ? sendMenu(phoneId, from, name) : sendWelcome(phoneId, from, name)); return; }
    await answer(phoneId, from, text, messageId);
  }

  const queues = new Map();
  function enqueue(message, phoneId, name) {
    const key = String(message.from || '');
    const previous = queues.get(key) || Promise.resolve();
    const next = previous.then(() => handleMessage(message, phoneId, name)).catch((error) => console.error('WhatsApp :', error.message));
    queues.set(key, next);
    next.finally(() => { if (queues.get(key) === next) queues.delete(key); });
  }

  app.get(WEBHOOK_PATHS, (req, res) => {
    const mode = req.query['hub.mode']; const token = req.query['hub.verify_token']; const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token && process.env.WHATSAPP_VERIFY_TOKEN && token === process.env.WHATSAPP_VERIFY_TOKEN) return res.status(200).send(String(challenge || ''));
    return res.sendStatus(403);
  });

  app.post(WEBHOOK_PATHS, (req, res) => {
    if (!validSignature(req)) { console.warn('WhatsApp : signature refusée. Vérifiez META_APP_SECRET.'); return res.sendStatus(403); }
    res.sendStatus(200);
    for (const change of (req.body?.entry || []).flatMap((entry) => entry.changes || [])) {
      const phoneId = change.value?.metadata?.phone_number_id;
      const contacts = change.value?.contacts || [];
      for (const message of change.value?.messages || []) enqueue(message, phoneId, firstName(contacts.find((c) => c.wa_id === message.from)?.profile?.name));
    }
  });
}

module.exports = { setupWhatsApp, MENU, WEBHOOK_PATHS, isWebhookPath, isMenuRequest, whatsappFormat, firstName };
