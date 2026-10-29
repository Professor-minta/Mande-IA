const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const WHATSAPP = '22377295259';
const MAX_RECORDING_MS = 10000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const LANGS = ['auto', 'bm', 'fr', 'en'];

const store = {
  get(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch {} }
};

const state = {
  user: null, usage: null, conversationId: null, messages: [], conversations: [],
  djelia: false, voiceEnabled: false, canStream: false, filesEnabled: false, liveEnabled: false,
  installEvent: null, busy: false, streamController: null, attachment: null,
  recorder: null, chunks: [], recordingStartedAt: 0, recordingTimer: null, transcribing: false,
  speechCache: new Map(), activeAudio: null, activeSpeechButton: null, speechLoading: false,
  audioCtx: null, meterFrame: 0, call: null
};

const savedLanguage = store.get('mande-language', 'auto');
const preferences = {
  theme: store.get('mande-theme', 'dark') === 'light' ? 'light' : 'dark',
  language: LANGS.includes(savedLanguage) ? savedLanguage : 'auto',
  voice: store.get('mande-voice', 'false') === 'true'
};

function apiError(data, status) {
  const error = new Error(data?.error || 'Le serveur ne répond pas correctement. Réessayez dans un instant.');
  error.payload = data || {}; error.status = status; error.detail = data?.detail || '';
  return error;
}
async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) throw apiError(data, response.status);
  return data;
}
const postJSON = (url, body) => api(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

let statusTimer = 0;
function setStatus(message, { timeout = 0 } = {}) {
  clearTimeout(statusTimer);
  $('#status').textContent = message || '';
  if (timeout) statusTimer = setTimeout(() => { $('#status').textContent = ''; }, timeout);
}
function setMode(mode) {
  document.body.dataset.mode = mode;
  if (mode !== 'listening' && mode !== 'speaking') resetLevels();
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function inlineMarkdown(value) {
  return escapeHTML(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
function renderMarkdown(source) {
  const lines = String(source).replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let paragraph = [];
  let list = null;
  let code = null;
  const flushParagraph = () => { if (paragraph.length) { html.push(`<p>${paragraph.map(inlineMarkdown).join('<br>')}</p>`); paragraph = []; } };
  const flushList = () => { if (list) { html.push(`<${list.type}>${list.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</${list.type}>`); list = null; } };
  for (const line of lines) {
    if (code !== null) {
      if (/^\s*```/.test(line)) { html.push(`<pre><code>${escapeHTML(code.join('\n'))}</code></pre>`); code = null; }
      else code.push(line);
      continue;
    }
    if (/^\s*```/.test(line)) { flushParagraph(); flushList(); code = []; continue; }
    const heading = line.match(/^\s*#{1,6}\s+(.*)$/);
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    if (heading) { flushParagraph(); flushList(); html.push(`<p class="md-h">${inlineMarkdown(heading[1])}</p>`); continue; }
    if (bullet || numbered) {
      flushParagraph();
      const type = bullet ? 'ul' : 'ol';
      if (list && list.type !== type) flushList();
      if (!list) list = { type, items: [] };
      list.items.push((bullet || numbered)[1]);
      continue;
    }
    flushList();
    paragraph.push(line.trim());
  }
  if (code !== null) html.push(`<pre><code>${escapeHTML(code.join('\n'))}</code></pre>`);
  flushParagraph(); flushList();
  return html.join('');
}
function plainText(source) {
  return String(source)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^📎 .*$/gm, '')
    .replace(/[*_`#>]+/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  svg.setAttribute('aria-hidden', 'true');
  return svg;
}
function actionButton(iconName, label, handler) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'msg-action';
  button.setAttribute('aria-label', label); button.title = label;
  button.append(icon(iconName), Object.assign(document.createElement('span'), { textContent: label }));
  button.onclick = () => handler(button);
  return button;
}
function setButtonLabel(button, iconName, label) {
  if (!button) return;
  button.replaceChildren(icon(iconName), Object.assign(document.createElement('span'), { textContent: label }));
  button.setAttribute('aria-label', label); button.title = label;
}

const chatView = () => $('#view-home');
function nearBottom() { const view = chatView(); return view.scrollHeight - view.scrollTop - view.clientHeight < 140; }
function scrollToEnd(smooth = true) { const view = chatView(); view.scrollTo({ top: view.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }); }

function splitAttachment(content) {
  const match = String(content).match(/^📎 (.+)(?:\n([\s\S]*))?$/);
  return match ? { name: match[1], text: match[2] || '' } : null;
}
function addMessage(role, content, { pending = false, error = false, preview = null } = {}) {
  document.body.classList.add('has-chat');
  $('#new-chat').hidden = false;
  const item = document.createElement('article');
  item.className = `msg ${role}${pending ? ' pending' : ''}${error ? ' error' : ''}`;
  if (role === 'user') {
    const bubble = document.createElement('div'); bubble.className = 'bubble';
    const file = splitAttachment(content);
    if (file) {
      const pill = document.createElement('div'); pill.className = 'file-pill';
      if (preview) pill.append(Object.assign(document.createElement('img'), { src: preview, alt: file.name }));
      else pill.append(icon('file'), Object.assign(document.createElement('span'), { textContent: file.name }));
      bubble.append(pill);
      if (file.text) bubble.append(document.createTextNode(file.text));
    } else bubble.textContent = content;
    item.append(bubble);
  } else {
    const avatar = Object.assign(document.createElement('img'), { className: 'avatar', src: '/icons/mande-ia.svg', alt: '' });
    const body = document.createElement('div'); body.className = 'msg-body';
    const md = document.createElement('div'); md.className = 'md';
    if (pending) md.innerHTML = '<span class="mini-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><span>Mande-IA réfléchit…</span>';
    else if (error) md.textContent = content;
    else md.innerHTML = renderMarkdown(content);
    body.append(md);
    item.append(avatar, body);
    if (!pending && !error) addActions(item, content);
  }
  $('#messages').append(item);
  requestAnimationFrame(() => scrollToEnd());
  return item;
}
function addActions(item, content) {
  const body = $('.msg-body', item);
  if (!body || $('.msg-actions', body)) return;
  const actions = document.createElement('div'); actions.className = 'msg-actions';
  const buttons = [actionButton('copy', 'Copier', (button) => copyText(content, button)), actionButton('share', 'Partager', (button) => shareText(content, button))];
  if (state.voiceEnabled) buttons.unshift(actionButton('speaker', 'Écouter', (button) => say(content, button)));
  actions.append(...buttons);
  body.append(actions);
}
function renderAssistant(item, text, streaming) {
  const stick = nearBottom();
  item.classList.remove('pending');
  const md = $('.md', item);
  md.innerHTML = renderMarkdown(text) || '<p></p>';
  md.classList.toggle('is-streaming', streaming);
  if (stick) scrollToEnd(false);
}
function renderMessages() {
  $('#messages').replaceChildren();
  const hasChat = state.messages.length > 0;
  document.body.classList.toggle('has-chat', hasChat);
  $('#new-chat').hidden = !hasChat;
  state.messages.forEach((message) => addMessage(message.role, message.content));
  if (!hasChat) chatView().scrollTop = 0;
}

function createTypewriter(onUpdate) {
  let shown = '';
  let queue = '';
  let finished = false;
  let resolveDone;
  const done = new Promise((resolve) => { resolveDone = resolve; });
  const tick = () => {
    if (queue) {
      const step = Math.max(2, Math.ceil(queue.length / 12));
      shown += queue.slice(0, step);
      queue = queue.slice(step);
      onUpdate(shown, true);
    }
    if (queue || !finished) requestAnimationFrame(tick);
    else { onUpdate(shown, false); resolveDone(shown); }
  };
  requestAnimationFrame(tick);
  return {
    push(text) { queue += text; },
    finish() { finished = true; },
    flush() { shown += queue; queue = ''; finished = true; },
    get text() { return shown + queue; },
    done
  };
}
async function readEvents(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
    let index;
    while ((index = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      const data = block.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
      if (!data) continue;
      try { onEvent(JSON.parse(data)); } catch {}
    }
  }
}

async function copyText(content, button) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(content);
    else {
      const helper = Object.assign(document.createElement('textarea'), { value: content });
      helper.style.position = 'fixed'; helper.style.opacity = '0';
      document.body.append(helper); helper.select(); document.execCommand('copy'); helper.remove();
    }
    if (button) { setButtonLabel(button, 'check', 'Copié'); setTimeout(() => setButtonLabel(button, 'copy', 'Copier'), 1500); }
  } catch { setStatus('La copie a échoué. Sélectionnez le texte pour le copier.', { timeout: 4000 }); }
}
async function shareText(content, button) {
  if (navigator.share) {
    try { await navigator.share({ title: 'Mande-IA', text: content }); return; } catch (error) { if (error.name === 'AbortError') return; }
  }
  await copyText(content, button);
}

function renderUsage() {
  const usage = state.usage;
  const remaining = Number(usage?.remaining);
  const isPro = state.user?.plan === 'pro';
  const limitReached = !isPro && Boolean(usage?.limit) && Number.isFinite(remaining) && remaining <= 0;
  $('#composer').hidden = limitReached;
  $('#attachment').hidden = limitReached || !state.attachment;
  $('#upgrade-gate').hidden = !limitReached;
  const line = $('#usage');
  line.replaceChildren();
  if (isPro) line.textContent = 'Plan Pro : questions illimitées.';
  else if (usage?.limit && !limitReached) {
    line.append(`${remaining} question${remaining === 1 ? '' : 's'} gratuite${remaining === 1 ? '' : 's'} restante${remaining === 1 ? '' : 's'} aujourd'hui. `);
    const upgrade = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Passer à Pro' });
    upgrade.onclick = openUpgrade;
    line.append(upgrade);
  }
  const label = state.user ? state.user.email : 'Se connecter';
  $$('.account-label').forEach((el) => { el.textContent = label; });
  $('#settings-account').textContent = state.user ? state.user.email : 'Invité';
  $('#settings-plan').textContent = isPro ? 'Plan Pro' : 'Plan gratuit : 5 questions par jour';
  $('#settings-auth').textContent = state.user ? 'Gérer' : 'Se connecter';
  $('#settings-upgrade').hidden = isPro;
  $('#delete-conversation').disabled = !state.user || !state.conversationId;
}

function applyPreferences() {
  document.documentElement.dataset.theme = preferences.theme;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', preferences.theme === 'dark' ? '#061229' : '#f2f6fc');
  $('#theme-toggle').checked = preferences.theme === 'dark';
  $('#language-select').value = preferences.language;
  $('#voice-toggle').checked = preferences.voice;
  $('#voice-toggle').disabled = !state.voiceEnabled;
  $('#voice-description').textContent = state.voiceEnabled ? 'Bambara avec Djelia, français et anglais avec une voix naturelle' : 'La voix sera bientôt disponible';
}
function applyCapabilities() {
  $('#attach-button').hidden = !state.filesEnabled;
  $('#camera-button').hidden = !state.filesEnabled;
  $('#dictate-button').hidden = !state.djelia;
  updateRoundAction();
}

function showView(name) {
  document.body.dataset.view = name;
  $$('.view').forEach((view) => { view.hidden = view.dataset.viewName !== name; });
  $$('.tab').forEach((tab) => { if (tab.dataset.target === name) tab.setAttribute('aria-current', 'page'); else tab.removeAttribute('aria-current'); });
  if (name === 'conversations') loadConversations().catch(() => {});
  if (name === 'settings') renderUsage();
}

async function checkHealth() {
  const data = await api('/api/health');
  state.djelia = Boolean(data.djelia);
  state.voiceEnabled = data.voice === undefined ? state.djelia : Boolean(data.voice);
  state.canStream = data.stream === true;
  state.filesEnabled = state.canStream && data.files !== false;
  state.liveEnabled = data.live === true;
  applyPreferences();
  applyCapabilities();
}
async function checkAuth() {
  const data = await postJSON('/api/auth', { action: 'check' });
  state.user = data.user; state.usage = data.usage;
  renderUsage();
  if (state.user) await loadConversations();
}

function openAuth() {
  $('#auth-error').textContent = '';
  $('#email').value = state.user?.email || '';
  $('#password').value = '';
  const signedIn = Boolean(state.user);
  $('#auth-title').textContent = signedIn ? 'Mon compte' : 'Gardez vos conversations';
  $('#account-state').textContent = signedIn ? `Connecté avec ${state.user.email}.` : 'Créez un compte gratuit ou connectez-vous. Vous pouvez aussi continuer sans compte.';
  $('#auth-form').hidden = signedIn;
  $('#logout').hidden = !signedIn;
  $('#auth-dialog').showModal();
}
async function submitAuth(action) {
  const email = $('#email').value.trim();
  const password = $('#password').value;
  if (!email || !password) { $('#auth-error').textContent = 'Entrez votre adresse e-mail et votre mot de passe.'; return; }
  try {
    const data = await postJSON('/api/auth', { action, email, password });
    state.user = data.user; state.usage = data.usage;
    $('#auth-dialog').close();
    renderUsage();
    await loadConversations();
    setStatus(action === 'register' ? 'Compte créé. Vos discussions sont maintenant sauvegardées.' : 'Vous êtes connecté.', { timeout: 4000 });
  } catch (error) { $('#auth-error').textContent = error.message; }
}
async function logout() {
  await postJSON('/api/auth', { action: 'logout' });
  $('#auth-dialog').close();
  state.user = null; state.conversationId = null; state.messages = []; state.conversations = [];
  renderMessages();
  await checkAuth();
  renderConversations();
}

function relativeDay(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
function renderConversations() {
  const list = $('#conversation-list');
  list.replaceChildren();
  const empty = $('#history-empty');
  if (!state.user) {
    empty.hidden = false;
    $('#history-empty-text').textContent = 'Connectez-vous pour retrouver vos discussions sur tous vos appareils.';
    $('#history-empty-action').textContent = 'Se connecter';
    $('#history-empty-action').onclick = openAuth;
    return;
  }
  if (!state.conversations.length) {
    empty.hidden = false;
    $('#history-empty-text').textContent = "Aucune discussion pour l'instant. Posez votre première question depuis l'accueil.";
    $('#history-empty-action').textContent = 'Commencer';
    $('#history-empty-action').onclick = () => newConversation();
    return;
  }
  empty.hidden = true;
  state.conversations.forEach((conversation) => {
    const button = document.createElement('button');
    button.className = `conversation${conversation.id === state.conversationId ? ' is-active' : ''}`;
    const title = Object.assign(document.createElement('strong'), { textContent: conversation.title });
    const meta = document.createElement('small');
    meta.textContent = [relativeDay(conversation.updated_at), plainText(conversation.preview || '').slice(0, 90)].filter(Boolean).join(' – ');
    button.append(title, meta);
    button.onclick = () => openConversation(conversation.id).catch((error) => setStatus(error.message, { timeout: 5000 }));
    list.append(button);
  });
}
async function loadConversations() {
  if (!state.user) { state.conversations = []; renderConversations(); return; }
  const data = await api('/api/conversations');
  state.conversations = data.conversations.filter((c) => c.title !== 'Nouvelle conversation' && Boolean(c.preview));
  renderConversations();
}
function newConversation() {
  stopSpeech();
  state.streamController?.abort();
  state.messages = []; state.conversationId = null;
  clearAttachment();
  renderMessages(); renderUsage(); renderConversations();
  showView('home');
  $('#prompt').focus();
}
async function openConversation(id) {
  const data = await api(`/api/conversations/${id}`);
  stopSpeech();
  state.conversationId = id;
  state.messages = data.messages.map(({ role, content }) => ({ role, content }));
  showView('home');
  renderMessages(); renderUsage(); renderConversations();
}
async function deleteConversation() {
  if (!state.user || !state.conversationId) return;
  if (!confirm('Effacer définitivement cette discussion ?')) return;
  await api(`/api/conversations/${state.conversationId}`, { method: 'DELETE' });
  state.conversationId = null; state.messages = [];
  renderMessages(); renderUsage();
  await loadConversations();
  setStatus('Discussion effacée.', { timeout: 3000 });
}

function autoresize() {
  const input = $('#prompt');
  input.style.height = 'auto';
  if (input.value) input.style.height = `${Math.min(input.scrollHeight, 132)}px`;
  updateRoundAction();
}
function updateRoundAction() {
  const button = $('#round-action');
  const recording = state.recorder?.state === 'recording';
  const hasInput = $('#prompt').value.trim().length > 0 || Boolean(state.attachment);
  let mode = 'live';
  if (state.streamController) mode = 'stop';
  else if (hasInput || !state.liveEnabled) mode = 'send';
  button.dataset.state = mode;
  $('.composer').classList.toggle('has-text', $('#prompt').value.length > 0);
  const labels = { live: 'Appeler Mande-IA en direct', send: 'Envoyer le message', stop: 'Arrêter la réponse' };
  button.setAttribute('aria-label', labels[mode]); button.title = labels[mode];
  button.disabled = recording || state.transcribing || (mode === 'send' && (!hasInput || state.busy));
  const dictate = $('#dictate-button');
  dictate.classList.toggle('is-recording', recording);
  dictate.replaceChildren(icon(recording ? 'stop' : 'mic'));
  dictate.setAttribute('aria-label', recording ? 'Arrêter et transcrire' : 'Dicter votre message');
  dictate.title = dictate.getAttribute('aria-label');
  dictate.disabled = state.transcribing || state.busy;
  $('#attach-button').disabled = recording || state.busy;
  $('#camera-button').disabled = recording || state.busy;
}

function formatBytes(bytes) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} Ko` : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`; }
async function decodeImage(file) {
  if ('createImageBitmap' in window) { try { return await createImageBitmap(file); } catch {} }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
async function compressImage(file) {
  const image = await decodeImage(file);
  const width = image.width || image.naturalWidth;
  const height = image.height || image.naturalHeight;
  const scale = Math.min(1, 1600 / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close?.();
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('compress'))), 'image/jpeg', 0.85));
}
async function pickFile(file) {
  if (!file) return;
  const isPdf = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name);
  if (!isPdf && !isImage) { setStatus('Envoyez une photo ou un fichier PDF.', { timeout: 5000 }); return; }
  let blob = file;
  let name = file.name || (isPdf ? 'document.pdf' : 'photo.jpg');
  if (isImage) {
    setStatus('Préparation de la photo…');
    try { blob = await compressImage(file); name = `${name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`; }
    catch {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setStatus('Ce format de photo n’est pas accepté. Choisissez une photo JPG ou PNG.', { timeout: 6000 }); return; }
    }
    setStatus('');
  }
  if (blob.size > MAX_FILE_BYTES) { setStatus('Ce fichier dépasse 10 Mo. Choisissez un fichier plus léger.', { timeout: 6000 }); return; }
  clearAttachment();
  state.attachment = { blob, name, kind: isPdf ? 'pdf' : 'image', previewUrl: isPdf ? null : URL.createObjectURL(blob), size: blob.size };
  renderAttachment();
  $('#prompt').focus();
}
function renderAttachment() {
  const box = $('#attachment');
  const attachment = state.attachment;
  box.hidden = !attachment;
  if (attachment) {
    const thumb = $('#attachment-thumb');
    thumb.replaceChildren();
    thumb.style.backgroundImage = attachment.previewUrl ? `url("${attachment.previewUrl}")` : '';
    if (!attachment.previewUrl) thumb.append(icon('file'));
    $('#attachment-name').textContent = attachment.name;
    $('#attachment-meta').textContent = `${attachment.kind === 'pdf' ? 'PDF' : 'Photo'} · ${formatBytes(attachment.size)}`;
  }
  updateRoundAction();
}
function clearAttachment({ keepPreview = false } = {}) {
  if (state.attachment?.previewUrl && !keepPreview) URL.revokeObjectURL(state.attachment.previewUrl);
  state.attachment = null;
  $('#file-input').value = '';
  $('#camera-input').value = '';
  renderAttachment();
}

async function send(prefill) {
  const fromInput = prefill === undefined;
  const typed = (fromInput ? $('#prompt').value : prefill).trim();
  const attachment = fromInput ? state.attachment : null;
  if ((!typed && !attachment) || state.busy) return;
  showView('home');
  stopSpeech();
  state.busy = true;
  updateRoundAction();
  try {
    if (state.user && !state.conversationId) {
      const data = await api('/api/conversations', { method: 'POST' });
      state.conversationId = data.conversation.id;
    }
  } catch (error) {
    state.busy = false; updateRoundAction();
    setStatus(error.message, { timeout: 5000 });
    return;
  }
  const question = typed || (attachment?.kind === 'pdf' ? 'Résume ce document en quelques points.' : 'Décris cette photo et dis-moi ce qui est important.');
  const content = attachment ? `📎 ${attachment.name}\n${question}` : question;
  if (fromInput) { $('#prompt').value = ''; autoresize(); }
  if (attachment) clearAttachment({ keepPreview: true });
  state.messages.push({ role: 'user', content });
  const userItem = addMessage('user', content, { preview: attachment?.previewUrl });
  const item = addMessage('assistant', '', { pending: true });
  setMode('thinking');
  const controller = new AbortController();
  state.streamController = controller;
  updateRoundAction();
  const writer = createTypewriter((text, streaming) => renderAssistant(item, text, streaming));
  let failure = null;
  try {
    if (state.canStream) {
      const options = { method: 'POST', credentials: 'same-origin', signal: controller.signal };
      if (attachment) {
        const form = new FormData();
        form.append('messages', JSON.stringify(state.messages));
        form.append('language', preferences.language);
        if (state.conversationId) form.append('conversationId', state.conversationId);
        form.append('file', attachment.blob, attachment.name);
        options.body = form;
      } else {
        options.headers = { 'content-type': 'application/json' };
        options.body = JSON.stringify({ messages: state.messages, conversationId: state.conversationId, language: preferences.language });
      }
      const response = await fetch('/api/ai/stream', options);
      if (!response.ok) { let data = {}; try { data = await response.json(); } catch {} throw apiError(data, response.status); }
      await readEvents(response, (event) => {
        if (event.type === 'delta') { setMode('idle'); writer.push(event.text); }
        else if (event.type === 'start' || event.type === 'done') { state.usage = event.usage; renderUsage(); }
        else if (event.type === 'error') { failure = event; if (event.usage) state.usage = event.usage; }
      });
    } else {
      const data = await postJSON('/api/ai', { messages: state.messages, conversationId: state.conversationId, language: preferences.language });
      state.usage = data.usage;
      setMode('idle');
      writer.push(data.reply);
    }
    writer.finish();
  } catch (error) {
    if (error.name === 'AbortError') writer.flush();
    else { writer.finish(); failure = { error: error.message, status: error.status, usage: error.payload?.usage }; if (failure.usage) state.usage = failure.usage; }
  }
  const reply = (await writer.done).trim();
  state.streamController = null;
  state.busy = false;
  setMode('idle');
  if (reply) {
    state.messages.push({ role: 'assistant', content: reply });
    renderAssistant(item, reply, false);
    addActions(item, reply);
    if (failure) setStatus('La réponse a été coupée. Vous pouvez reposer la question.', { timeout: 6000 });
    else if (preferences.voice && state.voiceEnabled) say(reply);
  } else {
    item.remove();
    if (failure) {
      state.messages.pop();
      userItem.remove();
      if (fromInput && !$('#prompt').value) { $('#prompt').value = typed; autoresize(); }
      const limit = failure.status === 429 && failure.usage;
      if (!limit) addMessage('assistant', failure.error || 'Mande-IA n’a pas pu répondre. Réessayez.', { error: true });
    } else {
      state.messages.pop();
      userItem.remove();
      if (fromInput && !$('#prompt').value) { $('#prompt').value = typed; autoresize(); }
      postJSON('/api/auth', { action: 'check' }).then((data) => { state.usage = data.usage; renderUsage(); }).catch(() => {});
    }
    if (!state.messages.length) renderMessages();
  }
  renderUsage();
  updateRoundAction();
  if (state.user) loadConversations().catch(() => {});
}
function stopReply() { state.streamController?.abort(); }

function audioContext() {
  if (!state.audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    state.audioCtx = new Ctx();
  }
  if (state.audioCtx.state === 'suspended') state.audioCtx.resume().catch(() => {});
  return state.audioCtx;
}
function makeAnalyser(stream) {
  const ctx = audioContext();
  if (!ctx) return null;
  try {
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    return { source, analyser, data: new Uint8Array(analyser.fftSize) };
  } catch { return null; }
}
function levelOf(meter) {
  if (!meter) return 0;
  meter.analyser.getByteTimeDomainData(meter.data);
  let sum = 0;
  for (let i = 0; i < meter.data.length; i += 1) { const v = (meter.data[i] - 128) / 128; sum += v * v; }
  return Math.min(1, Math.sqrt(sum / meter.data.length) * 5);
}
function paintBars(bars, level, base = 0.5) {
  bars.forEach((bar) => { bar.style.transform = `scaleY(${base + level * (0.4 + Math.random() * 0.5)})`; });
}
function resetLevels() {
  cancelAnimationFrame(state.meterFrame);
  $$('#welcome .orb-bars i, #recording .mini-bars i').forEach((bar) => { bar.style.transform = ''; });
}
function startRecordingMeter(meter) {
  const orb = $$('#welcome .orb-bars i');
  const mini = $$('#recording .mini-bars i');
  const tick = () => {
    const level = levelOf(meter);
    paintBars(orb, level);
    paintBars(mini, level, 0.2);
    state.meterFrame = requestAnimationFrame(tick);
  };
  cancelAnimationFrame(state.meterFrame);
  tick();
}

function formatClock(seconds) { const s = Math.max(0, Math.floor(seconds)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
function setRecordingUI(on) {
  $('#prompt').hidden = on;
  $('#recording').hidden = !on;
  updateRoundAction();
}
async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setStatus("Ce navigateur ne permet pas d'enregistrer la voix. Écrivez votre message.", { timeout: 5000 }); return; }
  stopSpeech();
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
  catch { setStatus('Autorisez le microphone dans votre navigateur pour dicter votre message.', { timeout: 6000 }); return; }
  state.chunks = [];
  const mimeType = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((type) => MediaRecorder.isTypeSupported(type));
  state.recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  state.recorder.ondataavailable = (event) => { if (event.data.size) state.chunks.push(event.data); };
  state.recorder.onstop = () => finishRecording(stream);
  const meter = makeAnalyser(stream);
  state.recorder.meter = meter;
  if (meter) startRecordingMeter(meter);
  state.recordingStartedAt = Date.now();
  state.recorder.start();
  setMode('listening');
  setRecordingUI(true);
  setStatus("J'écoute… Touchez le bouton rouge pour finir.");
  const tickTimer = () => {
    const elapsed = Date.now() - state.recordingStartedAt;
    $('#recording-time').textContent = `${formatClock(Math.max(1, Math.ceil(elapsed / 1000)))} / 0:10`;
    if (elapsed >= MAX_RECORDING_MS && state.recorder?.state === 'recording') state.recorder.stop();
  };
  tickTimer();
  state.recordingTimer = setInterval(tickTimer, 250);
  if ('vibrate' in navigator) navigator.vibrate(30);
}
function stopRecording() { if (state.recorder?.state === 'recording') state.recorder.stop(); }
async function finishRecording(stream) {
  clearInterval(state.recordingTimer);
  stream.getTracks().forEach((track) => track.stop());
  try { state.recorder.meter?.source.disconnect(); } catch {}
  setMode('idle');
  setRecordingUI(false);
  const duration = Date.now() - state.recordingStartedAt;
  if (duration < 700) { setStatus('Parlez au moins une seconde, puis réessayez.', { timeout: 4000 }); return; }
  state.transcribing = true; updateRoundAction();
  setMode('thinking');
  setStatus('Transcription de votre voix…');
  const mime = state.recorder.mimeType || 'audio/webm';
  const form = new FormData();
  form.append('audio', new Blob(state.chunks, { type: mime }), `mande-ia-audio.${mime.includes('mp4') ? 'm4a' : 'webm'}`);
  try {
    const data = await api('/api/voice/transcribe', { method: 'POST', body: form });
    const transcript = data.text?.trim();
    if (!transcript) throw new Error('Aucun mot reconnu. Parlez plus près du microphone et réessayez.');
    const input = $('#prompt');
    input.value = input.value.trim() ? `${input.value.trim()} ${transcript}` : transcript;
    autoresize();
    setStatus('Vérifiez le texte, puis appuyez sur la flèche pour envoyer.', { timeout: 6000 });
    input.focus();
  } catch (error) {
    setStatus(error.status >= 500 ? 'La transcription est momentanément indisponible. Écrivez votre message.' : error.message, { timeout: 6000 });
  } finally {
    state.transcribing = false;
    setMode('idle'); updateRoundAction();
  }
}

function stopSpeech() {
  if (!state.activeAudio) return false;
  state.activeAudio.pause();
  state.activeAudio.currentTime = 0;
  setButtonLabel(state.activeSpeechButton, 'speaker', 'Écouter');
  state.activeSpeechButton?.classList.remove('is-active');
  state.activeAudio = null; state.activeSpeechButton = null;
  return true;
}
async function playAudio(player, url) {
  try { await player.play(); }
  catch (error) {
    if (error.name === 'NotAllowedError') throw error;
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) { let data = {}; try { data = await response.json(); } catch {} throw apiError(data, response.status); }
    player.src = URL.createObjectURL(await response.blob());
    await player.play();
  }
}
async function say(content, button) {
  if (!state.voiceEnabled) { setStatus("La lecture à voix haute n'est pas encore activée.", { timeout: 4000 }); return; }
  if (state.speechLoading) return;
  if (state.activeAudio) { const same = state.activeSpeechButton === button; stopSpeech(); if (same) return; }
  state.speechLoading = true;
  if (button) { button.disabled = true; setButtonLabel(button, 'speaker', 'Chargement…'); }
  const text = plainText(content);
  try {
    let url = state.speechCache.get(text);
    if (!url) {
      const data = await postJSON('/api/voice/prepare', { text, language: preferences.language });
      url = data.url;
      state.speechCache.set(text, url);
    }
    const player = new Audio();
    player.preload = 'auto';
    player.src = url;
    state.activeAudio = player; state.activeSpeechButton = button;
    player.onended = () => { if (state.activeAudio === player) stopSpeech(); };
    await playAudio(player, url);
    if (state.activeAudio !== player) { player.pause(); return; }
    if (button) { setButtonLabel(button, 'stop', 'Arrêter'); button.classList.add('is-active'); }
  } catch (error) {
    state.speechCache.delete(text);
    state.activeAudio = null; state.activeSpeechButton = null;
    setButtonLabel(button, 'speaker', 'Écouter');
    setStatus(error.name === 'NotAllowedError' ? 'Touchez Écouter pour lancer la lecture.' : error.message && error.status ? error.message : 'La lecture à voix haute est momentanément indisponible.', { timeout: 6000 });
  } finally {
    state.speechLoading = false;
    if (button) button.disabled = false;
  }
}

function setCallState(mode, status, note = '') {
  const screen = $('#call');
  screen.dataset.state = mode;
  $('#call-status').textContent = status;
  $('#call-note').textContent = note;
  const over = mode === 'error' || mode === 'ended';
  $('#call-mute').disabled = mode !== 'live';
  const hangup = $('#call-hangup');
  hangup.replaceChildren(icon(over ? 'close' : 'phone-down'), Object.assign(document.createElement('span'), { textContent: over ? 'Fermer' : 'Raccrocher' }));
  hangup.setAttribute('aria-label', over ? 'Fermer' : 'Raccrocher');
  hangup.classList.toggle('is-hangup', !over);
  if (!over) $('#call-upgrade').hidden = true;
  $$('#call .orb-bars i').forEach((bar) => { bar.style.transform = ''; });
}
function openCallScreen() {
  const screen = $('#call');
  screen.hidden = false;
  $('#call-timer').textContent = '0:00';
  $('#call-mute').setAttribute('aria-pressed', 'false');
  $('#call-mute').replaceChildren(icon('mic'), Object.assign(document.createElement('span'), { textContent: 'Micro' }));
  document.body.style.overflow = 'hidden';
  $('#call-hangup').focus();
}
function closeCallScreen() {
  $('#call').hidden = true;
  document.body.style.overflow = '';
  $('#round-action').focus();
}
function cleanupCall(call) {
  if (!call) return;
  clearInterval(call.timer);
  cancelAnimationFrame(call.frame);
  try { call.channel?.close(); } catch {}
  try { call.pc?.close(); } catch {}
  call.mic?.getTracks().forEach((track) => track.stop());
  try { call.micMeter?.source.disconnect(); } catch {}
  try { call.aiMeter?.source.disconnect(); } catch {}
  if (call.audio) { call.audio.pause(); call.audio.srcObject = null; }
  if (state.call === call) state.call = null;
}
function greeting(language) {
  if (language === 'en') return 'Greet the user in one short, warm sentence and say you are listening.';
  return 'Salue l’utilisateur en une phrase courte et chaleureuse, par exemple « I ni ce ! Je suis Mande-IA, je vous écoute. »';
}
function runCallMeter(call) {
  const bars = $$('#call .orb-bars i');
  let lastAiAt = 0;
  let label = '';
  const tick = () => {
    if (state.call !== call) return;
    const ai = levelOf(call.aiMeter);
    const mic = call.muted ? 0 : levelOf(call.micMeter);
    if (ai > 0.06) lastAiAt = Date.now();
    const speaking = Date.now() - lastAiAt < 450;
    paintBars(bars, Math.max(ai, mic * 0.75), 0.45);
    const next = speaking ? 'Mande-IA parle' : call.muted ? 'Micro coupé' : 'Je vous écoute';
    if (next !== label) { label = next; $('#call-status').textContent = next; }
    call.frame = requestAnimationFrame(tick);
  };
  tick();
}
function endCall(message) {
  const call = state.call;
  cleanupCall(call);
  if (message) setCallState('ended', 'Appel terminé', message);
  else closeCallScreen();
  setMode('idle');
}
async function startCall() {
  if (state.call) return;
  if (!state.liveEnabled) { setStatus("L'appel en direct n'est pas encore activé.", { timeout: 4000 }); return; }
  stopSpeech();
  const call = { muted: false, maxSeconds: 180 };
  state.call = call;
  call.audio = new Audio();
  call.audio.autoplay = true;
  call.audio.playsInline = true;
  audioContext();
  openCallScreen();
  setCallState('connecting', 'Connexion…');
  try {
    const session = await postJSON('/api/live/session', { language: preferences.language });
    if (state.call !== call) return;
    state.usage = session.usage; renderUsage();
    call.maxSeconds = Number(session.maxSeconds) || 180;
    call.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    if (state.call !== call) { call.mic.getTracks().forEach((track) => track.stop()); return; }
    const pc = new RTCPeerConnection();
    call.pc = pc;
    pc.ontrack = (event) => {
      call.audio.srcObject = event.streams[0];
      call.audio.play().catch(() => {});
      call.aiMeter = makeAnalyser(event.streams[0]);
    };
    call.mic.getTracks().forEach((track) => pc.addTrack(track, call.mic));
    call.micMeter = makeAnalyser(call.mic);
    const channel = pc.createDataChannel('oai-events');
    call.channel = channel;
    channel.onopen = () => {
      channel.send(JSON.stringify({ type: 'session.update', session: { type: 'realtime', instructions: session.instructions } }));
      channel.send(JSON.stringify({ type: 'response.create', response: { instructions: greeting(preferences.language) } }));
    };
    channel.onmessage = (event) => {
      let data; try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === 'error') console.warn('Mande-IA appel :', data.error?.message || data.error);
    };
    pc.onconnectionstatechange = () => {
      if (state.call === call && pc.connectionState === 'failed') endCall('La connexion a été coupée. Vérifiez votre réseau, puis rappelez.');
    };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    let answer;
    try { answer = await fetch(session.callsUrl, { method: 'POST', body: offer.sdp, signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${session.clientSecret}`, 'Content-Type': 'application/sdp' } }); }
    catch { throw new Error('La connexion à Mande-IA prend trop de temps. Vérifiez votre réseau, puis rappelez.'); }
    if (!answer.ok) throw new Error(`L’appel n’a pas pu démarrer. Réessayez dans un instant. (code realtime-${answer.status})`);
    await pc.setRemoteDescription({ type: 'answer', sdp: await answer.text() });
    if (state.call !== call) return;
    call.startedAt = Date.now();
    setCallState('live', 'Je vous écoute', call.maxSeconds < 600 ? `Appel gratuit : ${formatClock(call.maxSeconds)} maximum.` : '');
    const tickClock = () => {
      const elapsed = (Date.now() - call.startedAt) / 1000;
      $('#call-timer').textContent = `${formatClock(elapsed)} / ${formatClock(call.maxSeconds)}`;
      if (elapsed >= call.maxSeconds) endCall(call.maxSeconds < 600 ? 'Les appels gratuits durent 3 minutes. Passez à Pro pour parler jusqu’à 15 minutes.' : 'Durée maximale de l’appel atteinte.');
    };
    tickClock();
    call.timer = setInterval(tickClock, 500);
    runCallMeter(call);
    setTimeout(() => { if (state.call === call && !call.aiMeter && pc.connectionState !== 'connected') endCall('La voix de Mande-IA n’arrive pas. Vérifiez votre réseau, puis rappelez.'); }, 25000);
    if ('vibrate' in navigator) navigator.vibrate(40);
  } catch (error) {
    if (state.call !== call) return;
    cleanupCall(call);
    if (error.payload?.usage) { state.usage = error.payload.usage; renderUsage(); }
    const limit = error.status === 429;
    const message = limit ? "Vos 5 questions gratuites d'aujourd'hui sont utilisées. Revenez demain, ou passez à Pro."
      : error.name === 'NotAllowedError' ? 'Autorisez le microphone dans votre navigateur pour appeler Mande-IA.'
      : error.message || 'L’appel n’a pas pu démarrer. Réessayez dans un instant.';
    setCallState('error', 'Appel impossible', message);
    $('#call-upgrade').hidden = !limit;
  }
}
function hangUp() {
  const mode = $('#call').dataset.state;
  if (mode === 'error' || mode === 'ended') { closeCallScreen(); return; }
  endCall();
}
function toggleMute() {
  const call = state.call;
  if (!call?.mic) return;
  call.muted = !call.muted;
  call.mic.getAudioTracks().forEach((track) => { track.enabled = !call.muted; });
  const button = $('#call-mute');
  button.setAttribute('aria-pressed', String(call.muted));
  button.setAttribute('aria-label', call.muted ? 'Réactiver le micro' : 'Couper le micro');
  button.replaceChildren(icon(call.muted ? 'mic-off' : 'mic'), Object.assign(document.createElement('span'), { textContent: call.muted ? 'Micro coupé' : 'Micro' }));
}

function waLink(message) { return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`; }
const UPGRADE_MESSAGE = 'Bonjour, je souhaite passer à Mande-IA Pro. Quels sont les moyens de paiement disponibles ?';
function openUpgrade() { window.open(waLink(UPGRADE_MESSAGE), '_blank', 'noopener'); }
function shareApp() {
  const share = { title: 'Mande-IA', text: 'Parlez avec Mande-IA, l\'assistant IA qui parle bambara.', url: location.origin };
  if (navigator.share) navigator.share(share).catch(() => {});
  else navigator.clipboard?.writeText(location.origin).then(() => setStatus('Lien copié.', { timeout: 3000 }));
}

const aboutText = {
  bm: { title: 'Mande-IA kɔrɔ', paragraphs: ['Aw ni ce. Mande-IA ye Minta Services ka baara ye. A dabɔra Issa Minta fɛ, teknoloji karamɔgɔ ani Minta Services dabaga.', 'Mande-IA bɛ mɔgɔw dɛmɛ ka miiri kuraw sɔrɔ, ka baara kɛ ka ɲɛ, ani ka teknoloji nafa faamu. A laɲini ye ka teknoloji lase mɔgɔ bɛɛ ma, u ka kan na.', 'Aw ka miiri kura bɛ daminɛ yan, ni Mande-IA ye.'] },
  fr: { title: 'À propos de Mande-IA', paragraphs: ['Mande-IA est un assistant d\'intelligence artificielle pensé pour le Mali : il comprend et répond en bambara, en français et en anglais.', 'Il a été créé par Issa Minta, professeur de technologie et fondateur de Minta Services, et il est développé et hébergé au Mali.', 'Utilisez-le pour apprendre, trouver des idées, préparer vos projets et découvrir l\'intelligence artificielle dans votre langue.'] },
  en: { title: 'About Mande-IA', paragraphs: ['Mande-IA is an artificial intelligence assistant built for Mali: it understands and answers in Bambara, French and English.', 'It was created by Issa Minta, technology teacher and founder of Minta Services, and it is developed and hosted in Mali.', 'Use it to learn, find ideas, prepare your projects and discover artificial intelligence in your own language.'] }
};
function renderAbout(lang) {
  const copy = aboutText[lang];
  $('#about-title').textContent = copy.title;
  $('#about-content').replaceChildren(...copy.paragraphs.map((p) => Object.assign(document.createElement('p'), { textContent: p })));
  $$('.segmented button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.about === lang)));
}
const NEWS_KEY = 'mande-news-seen';
let news = null;
function formatDay(iso) {
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function renderNews() {
  const list = $('#news-list');
  list.replaceChildren(...news.entries.map((entry) => {
    const article = Object.assign(document.createElement('article'), { className: 'news-entry' });
    const time = Object.assign(document.createElement('time'), { dateTime: entry.date, textContent: formatDay(entry.date) });
    const items = document.createElement('ul');
    items.append(...(entry.points || []).map((point) => Object.assign(document.createElement('li'), { textContent: point })));
    article.append(Object.assign(document.createElement('h3'), { textContent: entry.titre }), time, items);
    return article;
  }));
}
function hideNewsBanner() {
  $('#news-banner').hidden = true;
  if (news) store.set(NEWS_KEY, news.version);
}
function openNews() {
  if (!news) return;
  renderNews();
  hideNewsBanner();
  $('#news-dialog').showModal();
}
async function loadNews() {
  const response = await fetch('/nouveautes.json', { cache: 'no-store' });
  if (!response.ok) return;
  news = await response.json();
  if (!news?.version || !Array.isArray(news.entries) || !news.entries.length) { news = null; return; }
  const latest = news.entries[0];
  $('#discover-news-date').textContent = `${latest.titre} – ${formatDay(latest.date)}`;
  if (store.get(NEWS_KEY, '') !== news.version) {
    $('#news-banner-title').textContent = `Nouveau : ${latest.titre}`;
    $('#news-banner-summary').textContent = latest.points?.[0] || '';
    $('#news-banner').hidden = false;
  }
}

function openAbout() { renderAbout(preferences.language === 'bm' ? 'bm' : preferences.language === 'en' ? 'en' : 'fr'); $('#about-dialog').showModal(); }

$('#composer').addEventListener('submit', (event) => {
  event.preventDefault();
  const mode = $('#round-action').dataset.state;
  if (mode === 'stop') return stopReply();
  if (mode === 'send') return send();
  return startCall();
});
$('#prompt').addEventListener('input', autoresize);
$('#prompt').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    if (!state.streamController && ($('#prompt').value.trim() || state.attachment)) send();
  }
});
$('#prompt').addEventListener('paste', (event) => {
  const file = [...(event.clipboardData?.files || [])].find((f) => f.type.startsWith('image/') || f.type === 'application/pdf');
  if (file && state.filesEnabled) { event.preventDefault(); pickFile(file); }
});
$('#dictate-button').onclick = () => (state.recorder?.state === 'recording' ? stopRecording() : startRecording());
$('#attach-button').onclick = () => $('#file-input').click();
$('#camera-button').onclick = () => $('#camera-input').click();
$('#file-input').onchange = (event) => pickFile(event.target.files[0]);
$('#camera-input').onchange = (event) => pickFile(event.target.files[0]);
$('#attachment-remove').onclick = () => { clearAttachment(); $('#prompt').focus(); };
$('#call-hangup').onclick = hangUp;
$('#call-mute').onclick = toggleMute;
$('#call-upgrade').href = waLink(UPGRADE_MESSAGE);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !$('#call').hidden) hangUp(); });
$$('[data-prompt]').forEach((el) => { el.addEventListener('click', () => send(el.dataset.prompt)); });
$$('.tab').forEach((tab) => { tab.onclick = () => showView(tab.dataset.target); });
$$('.account-button').forEach((b) => { b.onclick = openAuth; });
$('#open-history').onclick = () => showView('conversations');
$('#new-chat').onclick = newConversation;
$('#history-new').onclick = newConversation;
$('#close-auth').onclick = () => $('#auth-dialog').close();
$('#auth-form').addEventListener('submit', (event) => { event.preventDefault(); submitAuth('login'); });
$('#register').onclick = () => submitAuth('register');
$('#logout').onclick = () => logout().catch((error) => setStatus(error.message, { timeout: 5000 }));
$('#settings-auth').onclick = openAuth;
$('#settings-upgrade').onclick = openUpgrade;
$('#upgrade-link').href = waLink(UPGRADE_MESSAGE);
$('#theme-toggle').onchange = (event) => { preferences.theme = event.target.checked ? 'dark' : 'light'; store.set('mande-theme', preferences.theme); applyPreferences(); };
$('#language-select').onchange = (event) => { preferences.language = event.target.value; store.set('mande-language', preferences.language); };
$('#voice-toggle').onchange = (event) => { preferences.voice = event.target.checked; store.set('mande-voice', String(preferences.voice)); };
$('#share-app').onclick = shareApp;
$('#support-link').href = waLink("Bonjour, j'ai besoin d'aide avec Mande-IA.");
$('#feedback-link').href = waLink('Bonjour, voici mon avis sur Mande-IA : ');
$('#meet-link').href = waLink('Bonjour Professor Minta, je souhaite échanger avec vous au sujet de Mande-IA.');
$('#about-app').onclick = openAbout;
$('#discover-about').onclick = openAbout;
$('#discover-news').onclick = openNews;
$('#news-banner-open').onclick = openNews;
$('#news-banner-close').onclick = hideNewsBanner;
$('#close-news').onclick = () => $('#news-dialog').close();
$('#close-about').onclick = () => $('#about-dialog').close();
$$('.segmented button').forEach((b) => { b.onclick = () => renderAbout(b.dataset.about); });
$('#delete-conversation').onclick = () => deleteConversation().catch((error) => setStatus(error.message, { timeout: 5000 }));
$$('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); }));

window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); state.installEvent = event; $('#install-app').hidden = false; });
$('#install-app').onclick = async () => {
  if (!state.installEvent) return;
  state.installEvent.prompt();
  await state.installEvent.userChoice;
  state.installEvent = null;
  $('#install-app').hidden = true;
};

applyPreferences();
applyCapabilities();
renderMessages();
checkHealth().catch(() => {});
loadNews().catch(() => {});
checkAuth().catch(() => setStatus('Impossible de joindre le serveur. Vérifiez votre connexion, puis rechargez la page.'));
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(() => {});
