(() => {
  const $ = (selector) => document.querySelector(selector);
  const SVG = 'http://www.w3.org/2000/svg';
  const CX = 500;
  const CY = 330;
  const LANGS = { auto: 'Automatique', fr: 'Français', bm: 'Bambara', en: 'Anglais' };
  const SERVICES = [
    ['live', 'Voix en direct'],
    ['claude', 'Agents spécialistes'],
    ['djelia', 'Lecture en bambara'],
    ['files', 'Photos et PDF'],
    ['whatsapp', 'WhatsApp'],
    ['ollama', 'IA locale hors ligne']
  ];

  const state = { agents: [], nodes: new Map(), call: null, pro: false, count: 0, totalMs: 0, audioCtx: null };

  const svg = (tag, attrs = {}) => {
    const el = document.createElementNS(SVG, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    return el;
  };
  const clock = (seconds) => { const s = Math.max(0, Math.floor(seconds)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const setState = (value, label) => { document.body.dataset.state = value; if (label) $('#status-text').textContent = label; };
  const notice = (text) => { $('#notice').textContent = text || ''; $('#notice').hidden = !text; };

  function drawStrands() {
    const group = $('#strands');
    for (let i = 0; i < 40; i += 1) {
      const angle = (i / 40) * Math.PI * 2 + (i % 3) * 0.05;
      const r1 = 222 + (i % 4) * 6;
      const r2 = 420 + (i % 5) * 45;
      const bend = (i % 2 ? 1 : -1) * (30 + (i % 7) * 6);
      const x1 = CX + r1 * Math.cos(angle);
      const y1 = CY + r1 * Math.sin(angle) * 0.82;
      const x2 = CX + r2 * Math.cos(angle);
      const y2 = CY + r2 * Math.sin(angle) * 0.62;
      const mx = (x1 + x2) / 2 - Math.sin(angle) * bend;
      const my = (y1 + y2) / 2 + Math.cos(angle) * bend;
      group.append(svg('path', { d: `M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`, style: `animation-delay:${-(i % 9) * 0.6}s` }));
      group.append(svg('circle', { cx: x2, cy: y2, r: 1.8 }));
    }
  }

  function drawBars() {
    const group = $('#orb-bars');
    const heights = [0.36, 0.56, 0.8, 1, 0.8, 0.56, 0.36];
    const colors = ['#1fbf5b', '#1fbf5b', '#fcd116', '#fcd116', '#fcd116', '#e63b3f', '#e63b3f'];
    state.bars = heights.map((h, i) => {
      const height = 96 * h;
      const rect = svg('rect', { x: CX - 87 + i * 24, y: CY - height / 2, width: 14, height, rx: 7, fill: colors[i] });
      group.append(rect);
      return rect;
    });
  }

  function drawAgents(agents) {
    const links = $('#links');
    const nodes = $('#nodes');
    links.replaceChildren();
    nodes.replaceChildren();
    state.nodes.clear();
    agents.forEach((agent, i) => {
      const angle = ((-90 + 180 / agents.length + (i * 360) / agents.length) * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const x = CX + 372 * cos;
      const y = CY + 238 * sin;
      const sx = CX + 128 * cos;
      const sy = CY + 128 * sin;
      const ex = x - 16 * cos;
      const ey = y - 16 * sin;
      const bend = i % 2 ? 26 : -26;
      const mx = (sx + ex) / 2 - sin * bend;
      const my = (sy + ey) / 2 + cos * bend;
      const link = svg('path', { class: 'link', d: `M${sx} ${sy}Q${mx} ${my} ${ex} ${ey}` });
      links.append(link);
      const node = svg('g', { class: 'node' });
      const right = cos >= 0;
      const tx = right ? x + 26 : x - 26;
      const anchor = right ? 'start' : 'end';
      node.append(svg('circle', { class: 'halo', cx: x, cy: y, r: 15 }));
      node.append(svg('circle', { class: 'core', cx: x, cy: y, r: 8 }));
      const name = svg('text', { class: 'name', x: tx, y: y + 3, 'text-anchor': anchor });
      name.textContent = agent.nom;
      const status = svg('text', { class: 'state', x: tx, y: y + 27, 'text-anchor': anchor });
      status.textContent = 'prêt';
      node.append(name, status);
      nodes.append(node);
      state.nodes.set(agent.id, { node, link, status, timer: 0 });
    });
  }

  function markAgent(id, mode, text) {
    const entry = state.nodes.get(id);
    if (!entry) return;
    clearTimeout(entry.timer);
    for (const el of [entry.node, entry.link]) el.classList.remove('is-working', 'is-done', 'is-error');
    if (mode) { entry.node.classList.add(`is-${mode}`); entry.link.classList.add(`is-${mode}`); }
    entry.status.textContent = text || 'prêt';
    if (mode === 'done' || mode === 'error') entry.timer = setTimeout(() => markAgent(id, null), 9000);
  }

  function logEntry(agent, demande) {
    $('#log-empty').hidden = true;
    const item = document.createElement('li');
    item.className = 'is-working';
    const head = document.createElement('div');
    head.className = 'log-head';
    const name = document.createElement('strong');
    name.textContent = agent.nom;
    const meta = document.createElement('span');
    meta.textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    head.append(name, meta);
    const ask = document.createElement('p');
    ask.className = 'log-ask';
    ask.textContent = demande;
    const answer = document.createElement('p');
    answer.className = 'log-answer';
    answer.textContent = 'Au travail…';
    item.append(head, ask, answer);
    $('#log').prepend(item);
    return { item, meta, answer };
  }

  function updateStats() {
    $('#stat-count').textContent = String(state.count);
    $('#stat-avg').textContent = state.count ? `${(state.totalMs / state.count / 1000).toFixed(1).replace('.', ',')} s` : '–';
  }

  function tickClock() {
    const now = new Date();
    $('#clock').textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Bamako' });
    $('#date').textContent = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Bamako' });
  }

  async function loadServices() {
    try {
      const health = await (await fetch('/api/health')).json();
      $('#services').replaceChildren(...SERVICES.map(([key, label]) => {
        const li = document.createElement('li');
        li.className = health[key] ? 'on' : 'off';
        li.textContent = health[key] ? label : `${label} · non branché`;
        return li;
      }));
    } catch { $('#services').replaceChildren(); }
  }

  async function loadAccount() {
    try {
      const response = await fetch('/api/auth', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'check' }) });
      const data = await response.json();
      state.pro = data.user?.plan === 'pro';
      if (!data.user) notice('Mode scène : connectez-vous avec votre compte Pro sur ia.mintaservices.com, puis rechargez cette page.');
      else if (!state.pro) notice('Mode scène : ce compte n’est pas Pro. Activez Pro pour lancer la démonstration.');
    } catch { notice('Le serveur ne répond pas. Vérifiez la connexion internet.'); }
  }

  function audioContext() {
    if (!state.audioCtx) { const Ctx = window.AudioContext || window.webkitAudioContext; if (Ctx) state.audioCtx = new Ctx(); }
    if (state.audioCtx?.state === 'suspended') state.audioCtx.resume().catch(() => {});
    return state.audioCtx;
  }
  function meter(stream) {
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
  function level(m) {
    if (!m) return 0;
    m.analyser.getByteTimeDomainData(m.data);
    let sum = 0;
    for (let i = 0; i < m.data.length; i += 1) { const v = (m.data[i] - 128) / 128; sum += v * v; }
    return Math.min(1, Math.sqrt(sum / m.data.length) * 5);
  }

  function animate(call) {
    let lastAi = 0;
    let label = '';
    const tick = () => {
      if (state.call !== call) return;
      const ai = level(call.aiMeter);
      const mic = call.muted ? 0 : level(call.micMeter);
      if (ai > 0.06) lastAi = Date.now();
      const value = Math.max(ai, mic * 0.8);
      $('#orb').style.transform = `scale(${1 + value * 0.07})`;
      state.bars.forEach((bar, i) => { bar.style.transform = `scaleY(${0.5 + value * (0.5 + ((i * 37) % 10) / 14)})`; });
      const working = call.pending > 0;
      const next = working ? 'AGENTS AU TRAVAIL' : Date.now() - lastAi < 450 ? 'MANDE-IA PARLE' : call.muted ? 'MICRO COUPÉ' : 'EN ÉCOUTE';
      if (next !== label) { label = next; $('#orb-label').textContent = next; }
      call.frame = requestAnimationFrame(tick);
    };
    tick();
  }

  function send(call, payload) { if (call.channel?.readyState === 'open') call.channel.send(JSON.stringify(payload)); }

  async function runAgent(call, callId, rawArgs) {
    call.handled = call.handled || new Set();
    if (call.handled.has(callId)) return;
    call.handled.add(callId);
    let args = {};
    try { args = JSON.parse(rawArgs || '{}'); } catch {}
    const agent = state.agents.find((a) => a.id === args.agent);
    const demande = String(args.demande || '').trim();
    if (!agent || !demande) {
      send(call, { type: 'conversation.item.create', item: { type: 'function_call_output', call_id: callId, output: JSON.stringify({ erreur: 'Agent inconnu ou demande vide. Réponds toi-même, simplement.' }) } });
      send(call, { type: 'response.create' });
      return;
    }
    call.pending += 1;
    setState('working', 'Agents au travail');
    markAgent(agent.id, 'working', 'au travail…');
    const log = logEntry(agent, demande);
    let output;
    try {
      const response = await fetch('/api/scene/agent', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ agent: agent.id, demande, langue: $('#lang').value }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Cet agent ne répond pas.');
      state.count += 1;
      state.totalMs += data.ms || 0;
      updateStats();
      const seconds = `${((data.ms || 0) / 1000).toFixed(1).replace('.', ',')} s`;
      markAgent(agent.id, 'done', `répondu en ${seconds}`);
      log.item.className = '';
      log.meta.textContent = seconds;
      log.answer.textContent = data.texte;
      output = { agent: agent.nom, reponse: data.texte };
    } catch (error) {
      markAgent(agent.id, 'error', 'indisponible');
      log.item.className = 'is-error';
      log.answer.textContent = error.message;
      output = { agent: agent.nom, erreur: error.message, consigne: 'Dis simplement que cet agent ne répond pas pour le moment, et propose de réessayer.' };
    }
    call.pending -= 1;
    if (state.call !== call) return;
    if (!call.pending) setState('live', 'En direct');
    send(call, { type: 'conversation.item.create', item: { type: 'function_call_output', call_id: callId, output: JSON.stringify(output) } });
    send(call, { type: 'response.create' });
  }

  async function runDrive(call, callId, rawArgs) {
    call.handled = call.handled || new Set();
    if (call.handled.has(callId)) return;
    call.handled.add(callId);
    let args = {};
    try { args = JSON.parse(rawArgs || '{}'); } catch {}
    const titre = String(args.titre || 'Document Mande-IA').trim();
    const log = logEntry({ id: 'drive', nom: 'Google Drive' }, `Enregistrer « ${titre.slice(0, 80)} »`);
    let output;
    try {
      const response = await fetch('/api/drive/enregistrer', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ titre, contenu: args.contenu }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'L’enregistrement dans le Drive a échoué.');
      log.item.className = '';
      log.meta.textContent = 'enregistré';
      log.answer.textContent = `Document « ${data.titre} » ajouté au Drive.`;
      output = { enregistre: true, titre: data.titre };
    } catch (error) {
      log.item.className = 'is-error';
      log.answer.textContent = error.message;
      output = { enregistre: false, erreur: error.message, consigne: 'Dis simplement que l’enregistrement dans le Drive n’a pas marché.' };
    }
    if (state.call !== call) return;
    send(call, { type: 'conversation.item.create', item: { type: 'function_call_output', call_id: callId, output: JSON.stringify(output) } });
    send(call, { type: 'response.create' });
  }

  function onEvent(call, data) {
    switch (data.type) {
      case 'input_audio_buffer.speech_started':
        call.userText = '';
        $('#said-user').textContent = '…';
        break;
      case 'conversation.item.input_audio_transcription.delta':
        call.userText = (call.userText || '') + (data.delta || '');
        $('#said-user').textContent = call.userText;
        break;
      case 'conversation.item.input_audio_transcription.completed':
        if (data.transcript?.trim()) $('#said-user').textContent = data.transcript.trim();
        break;
      case 'response.created':
        call.aiText = '';
        break;
      case 'response.output_audio_transcript.delta':
      case 'response.audio_transcript.delta':
        call.aiText = (call.aiText || '') + (data.delta || '');
        $('#said-ai').textContent = call.aiText.length > 260 ? `…${call.aiText.slice(-260)}` : call.aiText;
        break;
      case 'response.output_item.done':
        if (data.item?.type === 'function_call' && data.item.name === 'consulter_agent') runAgent(call, data.item.call_id, data.item.arguments);
        if (data.item?.type === 'function_call' && data.item.name === 'enregistrer_dans_drive') runDrive(call, data.item.call_id, data.item.arguments);
        break;
      case 'response.function_call_arguments.done':
        if (data.name === 'consulter_agent') runAgent(call, data.call_id, data.arguments);
        if (data.name === 'enregistrer_dans_drive') runDrive(call, data.call_id, data.arguments);
        break;
      case 'error':
        console.warn('Mande-IA scène :', data.error?.message || data.error);
        break;
      default:
    }
  }

  function cleanup(call) {
    if (!call) return;
    clearInterval(call.timer);
    cancelAnimationFrame(call.frame);
    try { call.channel?.close(); } catch {}
    try { call.pc?.close(); } catch {}
    call.mic?.getTracks().forEach((track) => track.stop());
    try { call.micMeter?.source.disconnect(); } catch {}
    try { call.aiMeter?.source.disconnect(); } catch {}
    if (call.audio) { call.audio.pause(); call.audio.srcObject = null; }
    if (call.billed) { call.billed = false; if (!navigator.sendBeacon?.('/api/live/end')) fetch('/api/live/end', { method: 'POST', credentials: 'same-origin', keepalive: true }).catch(() => {}); }
    call.wakeLock?.release?.().catch(() => {});
    if (state.call === call) state.call = null;
    $('#orb').style.transform = '';
    state.bars.forEach((bar) => { bar.style.transform = ''; });
    $('#orb-label').textContent = 'EN ATTENTE';
    $('#call').textContent = 'Démarrer (Espace)';
    $('#mute').disabled = true;
    $('#mute').setAttribute('aria-pressed', 'false');
    $('#lang').disabled = false;
    setState('idle', 'Prêt');
  }

  function endCall(message) {
    cleanup(state.call);
    if (message) notice(message);
  }

  async function startCall() {
    if (state.call) return;
    if (!state.pro) { await loadAccount(); if (!state.pro) return; }
    notice('');
    const call = { muted: false, pending: 0, audio: new Audio() };
    call.audio.autoplay = true;
    call.audio.playsInline = true;
    state.call = call;
    audioContext();
    setState('connecting', 'Connexion…');
    $('#orb-label').textContent = 'CONNEXION';
    $('#call').textContent = 'Raccrocher (Espace)';
    $('#lang').disabled = true;
    try {
      const response = await fetch('/api/live/session', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language: $('#lang').value, mode: 'scene' }) });
      const session = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(session.error || 'L’appel n’a pas pu démarrer.');
      if (state.call !== call) return;
      call.billed = true;
      call.maxSeconds = Number(session.maxSeconds) || 900;
      call.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (state.call !== call) { call.mic.getTracks().forEach((track) => track.stop()); return; }
      const pc = new RTCPeerConnection();
      call.pc = pc;
      pc.ontrack = (event) => { call.audio.srcObject = event.streams[0]; call.audio.play().catch(() => {}); call.aiMeter = meter(event.streams[0]); };
      call.mic.getTracks().forEach((track) => pc.addTrack(track, call.mic));
      call.micMeter = meter(call.mic);
      const channel = pc.createDataChannel('oai-events');
      call.channel = channel;
      channel.onopen = () => {
        send(call, { type: 'session.update', session: { type: 'realtime', instructions: session.instructions, tools: session.tools || [], tool_choice: 'auto' } });
        send(call, { type: 'response.create', response: { instructions: 'Salue le public en une ou deux phrases : présente-toi comme Mande-IA, créé au Mali par le Professeur Issa Minta, et dis que ton équipe d’agents est prête.' } });
      };
      channel.onmessage = (event) => { let data; try { data = JSON.parse(event.data); } catch { return; } onEvent(call, data); };
      pc.onconnectionstatechange = () => { if (state.call === call && pc.connectionState === 'failed') endCall('La connexion a été coupée. Vérifiez le réseau, puis relancez.'); };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const answer = await fetch(session.callsUrl, { method: 'POST', body: offer.sdp, signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${session.clientSecret}`, 'Content-Type': 'application/sdp' } });
      if (!answer.ok) throw new Error(`L’appel n’a pas pu démarrer. (code realtime-${answer.status})`);
      await pc.setRemoteDescription({ type: 'answer', sdp: await answer.text() });
      if (state.call !== call) return;
      call.startedAt = Date.now();
      setState('live', 'En direct');
      $('#mute').disabled = false;
      $('#said-user').textContent = '';
      $('#said-ai').textContent = '';
      $('#stat-lang').textContent = LANGS[$('#lang').value];
      try { call.wakeLock = await navigator.wakeLock?.request('screen'); } catch {}
      const tick = () => {
        const elapsed = (Date.now() - call.startedAt) / 1000;
        $('#stat-time').textContent = `${clock(elapsed)} / ${clock(call.maxSeconds)}`;
        if (elapsed >= call.maxSeconds) endCall('Durée maximale de l’appel atteinte. Relancez pour continuer.');
      };
      tick();
      call.timer = setInterval(tick, 500);
      animate(call);
    } catch (error) {
      if (state.call !== call) return;
      cleanup(call);
      notice(error.name === 'NotAllowedError' ? 'Autorisez le microphone dans le navigateur, puis relancez.' : error.message);
    }
  }

  function toggleCall() { if (state.call) endCall(); else startCall(); }
  function toggleMute() {
    const call = state.call;
    if (!call?.mic) return;
    call.muted = !call.muted;
    call.mic.getAudioTracks().forEach((track) => { track.enabled = !call.muted; });
    $('#mute').setAttribute('aria-pressed', String(call.muted));
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  const onClick = (action) => (event) => { event.currentTarget.blur(); action(); };
  $('#call').addEventListener('click', onClick(toggleCall));
  $('#mute').addEventListener('click', onClick(toggleMute));
  $('#full').addEventListener('click', onClick(toggleFullscreen));
  $('#lang').addEventListener('change', () => { $('#stat-lang').textContent = LANGS[$('#lang').value]; });
  document.addEventListener('keydown', (event) => {
    if (event.target.closest('select') || event.repeat) return;
    if (event.code === 'Space') { event.preventDefault(); toggleCall(); }
    else if (event.key === 'm' || event.key === 'M') toggleMute();
    else if (event.key === 'f' || event.key === 'F') toggleFullscreen();
  });
  window.addEventListener('pagehide', () => cleanup(state.call));

  setState('idle', 'Prêt');
  drawStrands();
  drawBars();
  tickClock();
  setInterval(tickClock, 1000);
  loadServices();
  loadAccount();
  fetch('/api/scene/agents').then((r) => r.json()).then((data) => { state.agents = data.agents || []; drawAgents(state.agents); }).catch(() => notice('Impossible de charger les agents. Rechargez la page.'));
})();
