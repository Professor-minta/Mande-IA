const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const WHATSAPP = '22377295259';
const MAX_RECORDING_MS = 10000;
const LANGS = ['auto', 'bm', 'fr', 'en'];
const LANG_LABELS = { auto: 'Auto', bm: 'BM', fr: 'FR', en: 'EN' };
const LANG_NAMES = { auto: 'automatique', bm: 'bambara', fr: 'français', en: 'anglais' };
const DEFAULT_STATUS = '';

const store = {
  get(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch {} }
};

const state = {
  user: null, usage: null, conversationId: null, messages: [], conversations: [],
  djelia: false, installEvent: null, busy: false,
  recorder: null, chunks: [], recordingStartedAt: 0, recordingTimer: null, transcribing: false,
  speechCache: new Map(), activeAudio: null, activeSpeechButton: null, speechLoading: false,
  audioCtx: null, meterFrame: 0, aboutLang: 'fr'
};

const savedLanguage = store.get('mande-language', 'auto');
const preferences = {
  theme: store.get('mande-theme', 'dark') === 'light' ? 'light' : 'dark',
  language: LANGS.includes(savedLanguage) ? savedLanguage : 'auto',
  voice: store.get('mande-voice', 'false') === 'true'
};

async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(data.error || 'Le serveur ne répond pas correctement. Réessayez dans un instant.');
    error.payload = data; error.status = response.status; error.detail = data.detail || '';
    throw error;
  }
  return data;
}
const postJSON = (url, body) => api(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

let statusTimer = 0;
function setStatus(message, { timeout = 0 } = {}) {
  clearTimeout(statusTimer);
  $('#status').textContent = message || DEFAULT_STATUS;
  if (timeout) statusTimer = setTimeout(() => { $('#status').textContent = DEFAULT_STATUS; }, timeout);
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
  const text = document.createElement('span'); text.textContent = label;
  button.append(icon(iconName), text);
  button.onclick = () => handler(button);
  return button;
}
function setButtonLabel(button, iconName, label) {
  if (!button) return;
  button.replaceChildren(icon(iconName), Object.assign(document.createElement('span'), { textContent: label }));
  button.setAttribute('aria-label', label); button.title = label;
}

function addMessage(role, content, { pending = false, error = false } = {}) {
  document.body.classList.add('has-chat');
  $('#new-chat').hidden = false;
  const item = document.createElement('article');
  item.className = `msg ${role}${pending ? ' pending' : ''}${error ? ' error' : ''}`;
  if (role === 'user') {
    const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.textContent = content;
    item.append(bubble);
  } else {
    const avatar = document.createElement('img'); avatar.className = 'avatar'; avatar.src = '/icons/mande-ia.svg'; avatar.alt = '';
    const body = document.createElement('div');
    const md = document.createElement('div'); md.className = 'md';
    if (pending) {
      md.innerHTML = '<span class="mini-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><span>Mande-IA réfléchit…</span>';
    } else if (error) {
      md.textContent = content;
    } else {
      md.innerHTML = renderMarkdown(content);
    }
    body.append(md);
    if (!pending && !error) {
      const actions = document.createElement('div'); actions.className = 'msg-actions';
      actions.append(
        actionButton('speaker', 'Écouter', (button) => say(content, button)),
        actionButton('copy', 'Copier', (button) => copyText(content, button)),
        actionButton('share', 'Partager', (button) => shareText(content, button))
      );
      body.append(actions);
    }
    item.append(avatar, body);
  }
  $('#messages').append(item);
  requestAnimationFrame(() => item.scrollIntoView({ block: 'end', behavior: 'smooth' }));
  return item;
}
function renderMessages() {
  $('#messages').replaceChildren();
  const hasChat = state.messages.length > 0;
  document.body.classList.toggle('has-chat', hasChat);
  $('#new-chat').hidden = !hasChat;
  state.messages.forEach((message) => addMessage(message.role, message.content));
  if (!hasChat) $('#view-home').scrollTop = 0;
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
  $('#upgrade-gate').hidden = !limitReached;
  const line = $('#usage');
  line.replaceChildren();
  if (isPro) line.textContent = 'Plan Pro : questions illimitées.';
  else if (usage?.limit && !limitReached) {
    line.append(`${remaining} question${remaining === 1 ? '' : 's'} gratuite${remaining === 1 ? '' : 's'} restante${remaining === 1 ? '' : 's'} aujourd'hui. `);
    const upgrade = document.createElement('button'); upgrade.type = 'button'; upgrade.textContent = 'Passer à Pro'; upgrade.onclick = openUpgrade;
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
  $('#voice-toggle').disabled = !state.djelia;
  $('#voice-description').textContent = state.djelia ? 'Voix Moussa, par Djelia' : 'La voix sera bientôt disponible';
  const chip = $('#lang-chip');
  chip.textContent = LANG_LABELS[preferences.language];
  chip.setAttribute('aria-label', `Langue des réponses : ${LANG_NAMES[preferences.language]}. Appuyez pour changer.`);
  chip.title = `Langue des réponses : ${LANG_NAMES[preferences.language]}`;
}
function setLanguage(language) {
  preferences.language = language;
  store.set('mande-language', language);
  applyPreferences();
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
  applyPreferences();
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
    $('#history-empty-action').onclick = () => { newConversation(); };
    return;
  }
  empty.hidden = true;
  state.conversations.forEach((conversation) => {
    const button = document.createElement('button');
    button.className = `conversation${conversation.id === state.conversationId ? ' is-active' : ''}`;
    const title = document.createElement('strong'); title.textContent = conversation.title;
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
  state.messages = []; state.conversationId = null;
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
  input.style.height = `${Math.min(input.scrollHeight, 132)}px`;
  updatePrimaryAction();
}
function updatePrimaryAction() {
  const button = $('#primary-action');
  const recording = state.recorder?.state === 'recording';
  const hasText = $('#prompt').value.trim().length > 0;
  button.classList.toggle('is-stop', recording);
  const [name, label] = recording ? ['stop', 'Arrêter et transcrire'] : hasText ? ['send', 'Envoyer le message'] : ['mic', 'Parler à Mande-IA'];
  if (button.dataset.icon !== name) { button.replaceChildren(icon(name)); button.dataset.icon = name; }
  button.setAttribute('aria-label', label); button.title = label;
  button.disabled = state.transcribing || state.busy;
}

async function send(content = $('#prompt').value.trim()) {
  if (!content || state.busy) return;
  showView('home');
  state.busy = true;
  try {
    if (state.user && !state.conversationId) {
      const data = await api('/api/conversations', { method: 'POST' });
      state.conversationId = data.conversation.id;
    }
    $('#prompt').value = ''; autoresize();
    state.messages.push({ role: 'user', content });
    addMessage('user', content);
    const waiting = addMessage('assistant', '', { pending: true });
    setMode('thinking'); updatePrimaryAction();
    try {
      const data = await postJSON('/api/ai', { messages: state.messages, conversationId: state.conversationId, language: preferences.language });
      waiting.remove();
      state.messages.push({ role: 'assistant', content: data.reply });
      addMessage('assistant', data.reply);
      state.usage = data.usage;
      renderUsage();
      if (state.user) loadConversations().catch(() => {});
      if (preferences.voice && state.djelia) say(data.reply);
    } catch (error) {
      waiting.remove();
      state.messages.pop();
      if (error.payload?.usage) { state.usage = error.payload.usage; renderUsage(); }
      addMessage('assistant', error.status === 429 && error.payload?.usage ? 'Vos 5 questions gratuites d\'aujourd\'hui sont utilisées.' : error.message, { error: true });
    }
  } catch (error) {
    setStatus(error.message, { timeout: 5000 });
  } finally {
    state.busy = false;
    setMode('idle'); updatePrimaryAction();
  }
}

function audioContext() {
  if (!state.audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    state.audioCtx = new Ctx();
  }
  if (state.audioCtx.state === 'suspended') state.audioCtx.resume().catch(() => {});
  return state.audioCtx;
}
const orbBars = () => $$('.orb-bars i');
const miniBars = () => $$('#recording .mini-bars i');
function resetLevels() {
  cancelAnimationFrame(state.meterFrame);
  orbBars().forEach((bar) => { bar.style.transform = ''; });
  miniBars().forEach((bar) => { bar.style.transform = ''; });
}
function startMeter(analyser) {
  const data = new Uint8Array(analyser.fftSize);
  const orb = orbBars(); const mini = miniBars();
  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) { const v = (data[i] - 128) / 128; sum += v * v; }
    const level = Math.min(1, Math.sqrt(sum / data.length) * 5);
    orb.forEach((bar) => { bar.style.transform = `scaleY(${0.5 + level * (0.4 + Math.random() * 0.5)})`; });
    mini.forEach((bar) => { bar.style.transform = `scaleY(${0.2 + level * (0.5 + Math.random() * 0.5)})`; });
    state.meterFrame = requestAnimationFrame(tick);
  };
  cancelAnimationFrame(state.meterFrame);
  tick();
}

function formatSeconds(ms) { const s = Math.max(1, Math.ceil(ms / 1000)); return `0:${String(s).padStart(2, '0')}`; }
function setRecordingUI(on) {
  $('#prompt').hidden = on;
  $('#recording').hidden = !on;
  $('#lang-chip').disabled = on;
  updatePrimaryAction();
}
async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    setStatus("Ce navigateur ne permet pas d'enregistrer la voix. Écrivez votre message.", { timeout: 5000 });
    return;
  }
  if (!state.djelia) { setStatus("La voix n'est pas encore activée. Écrivez votre message.", { timeout: 5000 }); return; }
  stopSpeech();
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
  catch { setStatus('Autorisez le microphone dans votre navigateur pour parler à Mande-IA.', { timeout: 6000 }); return; }
  state.chunks = [];
  const mimeType = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((type) => MediaRecorder.isTypeSupported(type));
  state.recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  state.recorder.ondataavailable = (event) => { if (event.data.size) state.chunks.push(event.data); };
  state.recorder.onstop = () => finishRecording(stream);
  const ctx = audioContext();
  if (ctx) {
    try { const source = ctx.createMediaStreamSource(stream); const analyser = ctx.createAnalyser(); analyser.fftSize = 512; source.connect(analyser); state.recorder.analyserSource = source; startMeter(analyser); } catch {}
  }
  state.recordingStartedAt = Date.now();
  state.recorder.start();
  setMode('listening');
  setRecordingUI(true);
  setStatus("J'écoute… Touchez le bouton rouge pour finir.");
  const tickTimer = () => {
    const elapsed = Date.now() - state.recordingStartedAt;
    $('#recording-time').textContent = `${formatSeconds(elapsed)} / 0:10`;
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
  try { state.recorder.analyserSource?.disconnect(); } catch {}
  setMode('idle');
  setRecordingUI(false);
  const duration = Date.now() - state.recordingStartedAt;
  if (duration < 700) { setStatus('Parlez au moins une seconde, puis réessayez.', { timeout: 4000 }); return; }
  state.transcribing = true; updatePrimaryAction();
  setMode('thinking');
  setStatus('Transcription de votre voix…');
  const mime = state.recorder.mimeType || 'audio/webm';
  const extension = mime.includes('mp4') ? 'm4a' : 'webm';
  const form = new FormData();
  form.append('audio', new Blob(state.chunks, { type: mime }), `mande-ia-audio.${extension}`);
  try {
    const data = await api('/api/voice/transcribe', { method: 'POST', body: form });
    const transcript = data.text?.trim();
    if (!transcript) throw new Error("Aucun mot reconnu. Parlez plus près du microphone et réessayez.");
    $('#prompt').value = transcript;
    autoresize();
    setStatus('Vérifiez le texte, puis appuyez sur la flèche pour envoyer.', { timeout: 6000 });
    $('#prompt').focus();
  } catch (error) {
    setStatus(error.status >= 500 ? 'La transcription est momentanément indisponible. Écrivez votre message.' : error.message, { timeout: 6000 });
  } finally {
    state.transcribing = false;
    setMode('idle'); updatePrimaryAction();
  }
}

function stopSpeech() {
  if (!state.activeAudio) return false;
  state.activeAudio.pause();
  state.activeAudio.currentTime = 0;
  setButtonLabel(state.activeSpeechButton, 'speaker', 'Écouter');
  state.activeSpeechButton?.classList.remove('is-active');
  state.activeAudio = null; state.activeSpeechButton = null;
  setMode('idle'); setStatus('');
  return true;
}
async function say(content, button) {
  if (!state.djelia) { setStatus("La lecture à voix haute n'est pas encore activée.", { timeout: 4000 }); return; }
  if (state.speechLoading) return;
  if (state.activeAudio) { const same = state.activeSpeechButton === button; stopSpeech(); if (same) return; }
  state.speechLoading = true;
  if (button) { button.disabled = true; setButtonLabel(button, 'speaker', 'Chargement…'); }
  try {
    const text = plainText(content);
    let audio = state.speechCache.get(text);
    if (!audio) {
      setStatus('Préparation de la voix…');
      const data = await postJSON('/api/voice/speak', { text });
      audio = `data:audio/mp3;base64,${data.audio}`;
      state.speechCache.set(text, audio);
    }
    const player = new Audio(audio);
    state.activeAudio = player; state.activeSpeechButton = button;
    player.onended = () => { if (state.activeAudio === player) stopSpeech(); };
    await player.play();
    setMode('speaking');
    if (button) { setButtonLabel(button, 'stop', 'Arrêter'); button.classList.add('is-active'); }
    setStatus('');
  } catch (error) {
    state.activeAudio = null; state.activeSpeechButton = null;
    setButtonLabel(button, 'speaker', 'Écouter');
    setMode('idle');
    setStatus('La lecture à voix haute est momentanément indisponible.', { timeout: 5000 });
  } finally {
    state.speechLoading = false;
    if (button) button.disabled = false;
  }
}

function waLink(message) { return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`; }
function openUpgrade() { window.open(waLink('Bonjour, je souhaite passer à Mande-IA Pro. Quels sont les moyens de paiement disponibles ?'), '_blank', 'noopener'); }
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
  state.aboutLang = lang;
  const copy = aboutText[lang];
  $('#about-title').textContent = copy.title;
  $('#about-content').replaceChildren(...copy.paragraphs.map((p) => Object.assign(document.createElement('p'), { textContent: p })));
  $$('.segmented button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.about === lang)));
}
function openAbout() { renderAbout(preferences.language === 'bm' ? 'bm' : preferences.language === 'en' ? 'en' : 'fr'); $('#about-dialog').showModal(); }

$('#composer').addEventListener('submit', (event) => {
  event.preventDefault();
  if (state.recorder?.state === 'recording') return stopRecording();
  if ($('#prompt').value.trim()) return send();
  return startRecording();
});
$('#prompt').addEventListener('input', autoresize);
$('#prompt').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); if ($('#prompt').value.trim()) send(); }
});
$('#lang-chip').onclick = () => {
  const next = LANGS[(LANGS.indexOf(preferences.language) + 1) % LANGS.length];
  setLanguage(next);
  setStatus(`Mande-IA répondra en ${LANG_NAMES[next] === 'automatique' ? 'détectant votre langue' : LANG_NAMES[next]}.`, { timeout: 2500 });
};
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
$('#upgrade-link').href = waLink('Bonjour, je souhaite passer à Mande-IA Pro. Quels sont les moyens de paiement disponibles ?');
$('#theme-toggle').onchange = (event) => { preferences.theme = event.target.checked ? 'dark' : 'light'; store.set('mande-theme', preferences.theme); applyPreferences(); };
$('#language-select').onchange = (event) => setLanguage(event.target.value);
$('#voice-toggle').onchange = (event) => { preferences.voice = event.target.checked; store.set('mande-voice', String(preferences.voice)); };
$('#share-app').onclick = shareApp;
$('#support-link').href = waLink("Bonjour, j'ai besoin d'aide avec Mande-IA.");
$('#feedback-link').href = waLink('Bonjour, voici mon avis sur Mande-IA : ');
$('#meet-link').href = waLink('Bonjour Professor Minta, je souhaite échanger avec vous au sujet de Mande-IA.');
$('#about-app').onclick = openAbout;
$('#discover-about').onclick = openAbout;
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
renderMessages();
updatePrimaryAction();
checkHealth().catch(() => {});
checkAuth().catch(() => setStatus('Impossible de joindre le serveur. Vérifiez votre connexion, puis rechargez la page.'));
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(() => {});
