(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const state = { passes: [], moi: null, options: null, consigne: { voix: null, traduction: null }, element: null, mode: 'voix', val: 'voix', periode: 'mois' };
  const nf = new Intl.NumberFormat('fr-FR');
  const COLORS = ['#14b8a6', '#f97316', '#e8604c', '#8b5cf6', '#22c55e', '#eab308'];

  async function api(url, options = {}) {
    const res = await fetch(url, { credentials: 'same-origin', ...options });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) { const e = new Error(data.error || 'Le serveur ne répond pas. Réessayez dans un instant.'); e.status = res.status; throw e; }
    return data;
  }
  const post = (url, body) => api(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  function say(el, text, kind = '') { el.textContent = text; el.className = `status ${kind}`; }
  const initial = (name) => (String(name || '?').trim()[0] || '?').toUpperCase();

  async function loadMoi() {
    const data = await api('/api/moi');
    state.moi = data.contributeur ? data : null;
    $('#avatar').textContent = state.moi ? initial(state.moi.contributeur.pseudo) : '?';
  }

  async function renderTableau() {
    try {
      const s = await api('/api/stats');
      $('#s-phrases').textContent = nf.format(s.phrases);
      $('#s-voix').textContent = nf.format(s.voix);
      $('#s-validees').textContent = nf.format(s.validees);
      $('#s-contributeurs').textContent = nf.format(s.contributeurs);
      const pct = Math.min(100, Math.round((s.validees / s.objectif) * 1000) / 10);
      $('#p-pct').textContent = `${String(pct).replace('.', ',')} %`;
      $('#p-fill').style.width = `${pct}%`;
      $('#p-bar').setAttribute('aria-valuenow', String(pct));
      $('#p-texte').textContent = `Objectif : ${nf.format(s.objectif)} contributions validées. Encore ${nf.format(Math.max(0, s.objectif - s.validees))} pour l'atteindre.`;
      $('#c-qualite').textContent = s.qualite == null ? 'Qualité de validation : à venir' : `Qualité de validation : ${String(s.qualite).replace('.', ',')} %`;
      $('#c-minutes').textContent = `Voix validées : ${nf.format(s.minutesValidees)} min`;
      $('#val-n').textContent = String(s.votesRequis);
    } catch {}
    try {
      const top = await api('/api/classement?periode=mois');
      $('#top-mois').textContent = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const list = $('#top-list');
      list.replaceChildren(...top.contributeurs.slice(0, 5).map((c, i) => {
        const li = document.createElement('li');
        const ini = Object.assign(document.createElement('span'), { className: 'ini', textContent: initial(c.pseudo) });
        ini.style.background = COLORS[i % COLORS.length];
        const txt = document.createElement('span');
        txt.append(Object.assign(document.createElement('strong'), { textContent: c.pseudo }), Object.assign(document.createElement('small'), { textContent: `${nf.format(c.contributions)} contribution${c.contributions > 1 ? 's' : ''}` }));
        li.append(ini, txt);
        return li;
      }));
      $('#top-vide').hidden = top.contributeurs.length > 0;
    } catch {}
  }

  function needProfile(statusEl) {
    if (state.moi) return false;
    say(statusEl, 'Créez d’abord votre profil de contributeur : cela prend 20 secondes.', 'err');
    setTimeout(() => { location.hash = '#compte'; }, 1400);
    return true;
  }

  // Contribuer
  function setMode(mode) {
    state.mode = mode;
    $$('[data-mode]').forEach((el) => {
      if (el.tagName === 'BUTTON') el.setAttribute('aria-selected', String(el.dataset.mode === mode));
      else el.hidden = el.dataset.mode !== mode;
    });
    say($('#c-status'), '');
    if (needProfile($('#c-status'))) return;
    if (mode === 'voix' && !state.consigne.voix) nextConsigne('voix');
    if (mode === 'traduction' && !state.consigne.traduction) nextConsigne('traduction');
  }
  async function nextConsigne(mode) {
    try {
      const data = await api(`/api/consigne?type=${mode === 'voix' ? 'lire' : 'traduire'}`);
      state.consigne[mode] = data.consigne;
      if (mode === 'voix') {
        $('#v-bm').textContent = data.consigne ? data.consigne.bm : 'Vous avez lu toutes les phrases. Merci ! Écrivez de nouvelles phrases pour en ajouter.';
        $('#v-fr').textContent = data.consigne?.fr || '';
        resetRecording();
        $('#v-rec').disabled = !data.consigne;
      } else {
        $('#t-fr').textContent = data.consigne ? data.consigne.fr : 'Vous avez traduit toutes les phrases. Merci !';
        $('#t-bm').value = '';
      }
    } catch (e) { say($('#c-status'), e.message, 'err'); }
  }

  const rec = { media: null, chunks: [], blob: null, start: 0, timer: 0, ms: 0 };
  const MAX_MS = 15000;
  function fmt(ms) { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
  function resetRecording() {
    clearInterval(rec.timer);
    rec.blob = null; rec.ms = 0;
    $('#v-time').textContent = `0:00 / ${fmt(MAX_MS)}`;
    const player = $('#v-player'); if (player.src) URL.revokeObjectURL(player.src); player.removeAttribute('src'); player.hidden = true;
    $('#v-send').disabled = true; $('#v-redo').hidden = true; $('#v-rec').hidden = false;
    $('#v-rec').classList.remove('is-rec'); $('#v-rec').setAttribute('aria-label', 'Enregistrer');
  }
  function pickType() {
    for (const t of ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm']) if (window.MediaRecorder?.isTypeSupported?.(t)) return t;
    return '';
  }
  async function toggleRecording() {
    if (rec.media && rec.media.state === 'recording') { rec.media.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { say($('#c-status'), 'Ce navigateur ne peut pas enregistrer. Essayez avec Chrome.', 'err'); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } }); }
    catch { say($('#c-status'), 'Autorisez le microphone dans votre navigateur pour enregistrer.', 'err'); return; }
    const type = pickType();
    rec.media = new MediaRecorder(stream, { ...(type ? { mimeType: type } : {}), audioBitsPerSecond: 32000 });
    rec.chunks = [];
    rec.media.ondataavailable = (e) => { if (e.data.size) rec.chunks.push(e.data); };
    rec.media.onstop = () => {
      clearInterval(rec.timer);
      stream.getTracks().forEach((t) => t.stop());
      rec.ms = Date.now() - rec.start;
      rec.blob = new Blob(rec.chunks, { type: rec.media.mimeType || type || 'audio/webm' });
      const player = $('#v-player'); player.src = URL.createObjectURL(rec.blob); player.hidden = false;
      $('#v-rec').classList.remove('is-rec'); $('#v-rec').hidden = true;
      $('#v-redo').hidden = false;
      const ok = rec.ms >= 1000;
      $('#v-send').disabled = !ok;
      say($('#c-status'), ok ? 'Écoutez-vous, puis envoyez ou recommencez.' : 'Trop court : lisez toute la phrase.', ok ? '' : 'err');
    };
    rec.start = Date.now();
    rec.media.start();
    $('#v-rec').classList.add('is-rec'); $('#v-rec').setAttribute('aria-label', 'Arrêter');
    say($('#c-status'), 'Enregistrement… Touchez encore pour arrêter.');
    rec.timer = setInterval(() => {
      const ms = Date.now() - rec.start;
      $('#v-time').textContent = `${fmt(ms)} / ${fmt(MAX_MS)}`;
      if (ms >= MAX_MS && rec.media.state === 'recording') rec.media.stop();
    }, 200);
  }
  async function sendVoice() {
    const c = state.consigne.voix;
    if (!rec.blob || !c) return;
    const form = new FormData();
    const ext = rec.blob.type.includes('mp4') ? 'm4a' : rec.blob.type.includes('ogg') ? 'ogg' : 'webm';
    form.append('audio', rec.blob, `voix.${ext}`);
    form.append('consigne', String(c.id));
    form.append('duree', String(Math.min(rec.ms, 16000)));
    $('#v-send').disabled = true;
    say($('#c-status'), 'Envoi…');
    try {
      await api('/api/voix', { method: 'POST', body: form });
      say($('#c-status'), 'Merci ! Votre voix est envoyée. Voici la phrase suivante.', 'ok');
      await loadMoi();
      nextConsigne('voix');
    } catch (e) { say($('#c-status'), e.message, 'err'); $('#v-send').disabled = false; }
  }

  // Valider
  function setVal(kind) {
    state.val = kind;
    $$('[data-val]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.val === kind)));
    say($('#val-status'), '');
    if (needProfile($('#val-status'))) return;
    nextElement();
  }
  async function nextElement() {
    try {
      const data = await api(`/api/a-valider?type=${state.val}&sauf=${state.passes.slice(-50).join(',')}`);
      state.element = data.element;
      $('#val-card').hidden = !data.element;
      $('#val-vide').hidden = Boolean(data.element);
      if (!data.element) return;
      const e = data.element;
      $('#val-q').textContent = e.type === 'voix' ? 'Cette voix lit-elle bien la phrase, de façon claire ?' : e.type === 'traduction' ? 'Cette traduction en bambara est-elle juste ?' : 'Cette phrase est-elle du bambara correct et naturel ?';
      $('#val-bm').textContent = e.bm || '';
      $('#val-fr').textContent = e.fr || '';
      const audio = $('#val-audio');
      audio.hidden = !e.audio;
      if (e.audio) audio.src = e.audio; else audio.removeAttribute('src');
    } catch (e) { say($('#val-status'), e.message, 'err'); }
  }
  async function vote(value) {
    if (!state.element) return;
    try {
      if (value) await post('/api/vote', { element: state.element.id, valeur: value });
      else state.passes.push(state.element.id);
      say($('#val-status'), value ? 'Merci pour votre avis.' : '', 'ok');
      nextElement();
    } catch (e) { say($('#val-status'), e.message, 'err'); }
  }

  // Classement
  async function renderClassement(periode = state.periode) {
    state.periode = periode;
    $$('[data-periode]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.periode === periode)));
    try {
      const data = await api(`/api/classement?periode=${periode}`);
      $('#rank').replaceChildren(...data.contributeurs.map((c) => {
        const li = document.createElement('li');
        const who = document.createElement('span');
        who.append(Object.assign(document.createElement('strong'), { textContent: c.pseudo }), Object.assign(document.createElement('small'), { textContent: [c.region, `${nf.format(c.validees || 0)} validée${c.validees > 1 ? 's' : ''}`].filter(Boolean).join(', ') }));
        li.append(who, Object.assign(document.createElement('b'), { textContent: nf.format(c.contributions) }));
        return li;
      }));
      $('#rank-vide').hidden = data.contributeurs.length > 0;
    } catch {}
  }

  // Compte
  async function renderCompte() {
    if (!state.options) {
      state.options = await api('/api/options');
      const fill = (sel, list) => sel.append(...list.map((v) => Object.assign(document.createElement('option'), { value: v, textContent: v })));
      fill($('#pr-region'), state.options.regions); fill($('#pr-age'), state.options.ages); fill($('#pr-genre'), state.options.genres);
    }
    await loadMoi();
    const m = state.moi;
    $('#co-moi').hidden = !m; $('#co-danger').hidden = !m; $('#pr-consent').hidden = Boolean(m);
    $('#pr-submit').textContent = m ? 'Enregistrer les changements' : 'Créer mon profil';
    $('#co-intro').hidden = Boolean(m);
    if (m) {
      const c = m.contributeur; const n = m.compteurs;
      $('#co-pseudo').textContent = c.pseudo;
      $('#pr-pseudo').value = c.pseudo; $('#pr-region').value = c.region || ''; $('#pr-age').value = c.age || ''; $('#pr-genre').value = c.genre || '';
      const items = [['Voix', n.voix], ['Phrases', n.phrases], ['Traductions', n.traductions], ['Validées', n.validees], ['Votes donnés', n.votes]];
      $('#co-compteurs').replaceChildren(...items.map(([label, v]) => { const li = document.createElement('li'); li.append(Object.assign(document.createElement('b'), { textContent: nf.format(v || 0) }), label); return li; }));
    }
  }
  async function saveProfile(event) {
    event.preventDefault();
    const body = { pseudo: $('#pr-pseudo').value, region: $('#pr-region').value, age: $('#pr-age').value, genre: $('#pr-genre').value, majeur: $('#pr-majeur').checked, consentement: $('#pr-ok').checked };
    const first = !state.moi;
    try {
      await post('/api/moi', body);
      await renderCompte();
      say($('#co-status'), first ? 'Profil créé. Vous pouvez contribuer !' : 'Changements enregistrés.', 'ok');
      if (first) setTimeout(() => { location.hash = '#contribuer/voix'; }, 900);
    } catch (e) { say($('#co-status'), e.message, 'err'); }
  }
  async function deleteAll() {
    if (!confirm('Supprimer définitivement votre profil, vos enregistrements, vos phrases et vos votes ?')) return;
    try { await api('/api/moi', { method: 'DELETE' }); state.moi = null; state.consigne = { voix: null, traduction: null }; await renderCompte(); say($('#co-status'), 'Toutes vos données sont supprimées.', 'ok'); }
    catch (e) { say($('#co-status'), e.message, 'err'); }
  }

  function insertChar(button) {
    const area = button.closest('form').querySelector('textarea:focus') || button.closest('form').querySelector('textarea');
    const { selectionStart: a, selectionEnd: b, value } = area;
    area.value = value.slice(0, a) + button.dataset.car + value.slice(b);
    area.focus(); area.selectionStart = area.selectionEnd = a + 1;
  }

  async function route() {
    const [vue, sub] = (location.hash.slice(1) || 'tableau').split('/');
    const name = ['tableau', 'contribuer', 'valider', 'classement', 'compte'].includes(vue) ? vue : 'tableau';
    $$('section.vue').forEach((s) => { s.hidden = s.dataset.vue !== name; });
    $$('.tabs a').forEach((a) => (a.dataset.vue === name ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    if (name === 'tableau') renderTableau();
    if (name === 'contribuer') setMode(['voix', 'phrase', 'traduction'].includes(sub) ? sub : state.mode);
    if (name === 'valider') setVal(state.val);
    if (name === 'classement') renderClassement();
    if (name === 'compte') renderCompte();
    window.scrollTo(0, 0);
  }

  $$('.seg [data-mode]').forEach((b) => b.addEventListener('click', () => { location.hash = `#contribuer/${b.dataset.mode}`; }));
  $$('.seg [data-val]').forEach((b) => b.addEventListener('click', () => setVal(b.dataset.val)));
  $$('.seg [data-periode]').forEach((b) => b.addEventListener('click', () => renderClassement(b.dataset.periode)));
  $$('.keys button').forEach((b) => b.addEventListener('mousedown', (e) => e.preventDefault()));
  $$('.keys button').forEach((b) => b.addEventListener('click', () => insertChar(b)));
  $('#v-rec').addEventListener('click', toggleRecording);
  $('#v-redo').addEventListener('click', () => { resetRecording(); say($('#c-status'), ''); });
  $('#v-send').addEventListener('click', sendVoice);
  $('#v-skip').addEventListener('click', () => nextConsigne('voix'));
  $('#t-skip').addEventListener('click', () => nextConsigne('traduction'));
  $('#f-phrase').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (needProfile($('#c-status'))) return;
    try { await post('/api/phrase', { bm: $('#p-bm').value, fr: $('#p-fr').value }); $('#p-bm').value = ''; $('#p-fr').value = ''; say($('#c-status'), 'Merci ! Votre phrase sera vérifiée par d’autres contributeurs.', 'ok'); loadMoi(); }
    catch (err) { say($('#c-status'), err.message, 'err'); }
  });
  $('#f-trad').addEventListener('submit', async (e) => {
    e.preventDefault();
    const c = state.consigne.traduction; if (!c) return;
    try { await post('/api/traduction', { consigne: c.id, bm: $('#t-bm').value }); say($('#c-status'), 'Merci ! Voici la phrase suivante.', 'ok'); loadMoi(); nextConsigne('traduction'); }
    catch (err) { say($('#c-status'), err.message, 'err'); }
  });
  $('#val-oui').addEventListener('click', () => vote(1));
  $('#val-non').addEventListener('click', () => vote(-1));
  $('#val-skip').addEventListener('click', () => vote(0));
  $('#f-profil').addEventListener('submit', saveProfile);
  $('#co-delete').addEventListener('click', deleteAll);
  addEventListener('hashchange', route);

  loadMoi().catch(() => {}).finally(route);
})();
