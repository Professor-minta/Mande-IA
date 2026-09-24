const state = { user: null, usage: null, conversationId: null, messages: [], recorder: null, chunks: [], djelia: false, installEvent: null, transcribing: false, recordingStartedAt: 0, recordingTimer: null, speechCache: new Map(), activeAudio: null, activeSpeechButton: null, speechLoading: false };
const $ = (selector) => document.querySelector(selector);
const savedLanguage = localStorage.getItem('mande-language');
const preferences = { theme: localStorage.getItem('mande-theme') || 'light', language: ['auto', 'bm', 'fr', 'en'].includes(savedLanguage) ? savedLanguage : 'auto', voice: localStorage.getItem('mande-voice') === 'true' };
const api = async (url, options = {}) => { const response = await fetch(url, { credentials: 'same-origin', ...options }); const data = await response.json(); if (!response.ok) { const error=new Error(data.error || 'Une erreur est arrivée.'); error.payload=data; error.detail=data.detail || ''; throw error; } return data; };
const text = (value) => document.createTextNode(value);

function applyPreferences() { document.documentElement.dataset.theme = preferences.theme; $('#theme-toggle').checked = preferences.theme === 'dark'; $('#language-select').value = preferences.language; $('#voice-toggle').checked = preferences.voice; $('#voice-description').textContent = state.djelia ? 'Moussa lira la réponse dans sa langue' : 'Disponible après configuration de Djelía'; }
function renderUsage() { const usage = state.usage; const remaining = Number(usage?.remaining); const limitReached = Boolean(usage?.limit) && Number.isFinite(remaining) && remaining <= 0; $('#usage').textContent = usage?.limit ? `${remaining} question${remaining === 1 ? '' : 's'} gratuite${remaining === 1 ? '' : 's'} restante${remaining === 1 ? '' : 's'} aujourd’hui.` : state.user?.plan === 'pro' ? '⭐ Plan Pro — questions illimitées.' : ''; const composer=$('.composer'); const gate=$('#upgrade-gate'); composer.hidden=limitReached; composer.style.display=limitReached?'none':'flex'; gate.hidden=!limitReached; gate.style.display=limitReached?'grid':'none'; $('#login-button').textContent = state.user ? state.user.email : 'Se connecter'; $('#mobile-login').textContent = state.user ? state.user.email.split('@')[0] : 'Compte'; $('#logout').classList.toggle('hidden', !state.user); $('#delete-conversation').disabled = !state.user || !state.conversationId; }
async function copyText(content, button) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(content);
    else {
      const helper = document.createElement('textarea');
      helper.value = content; helper.style.position = 'fixed'; helper.style.opacity = '0';
      document.body.append(helper); helper.select(); document.execCommand('copy'); helper.remove();
    }
    if (button) { const original = button.textContent; button.textContent = '✓ Copié'; setTimeout(() => { button.textContent = original; }, 1400); }
    $('#status').textContent = 'Message copié.';
  } catch { $('#status').textContent = 'Impossible de copier ce message.'; }
}
async function shareText(content, button) {
  const share = { title: 'Mande-IA', text: content };
  if (navigator.share) {
    try { await navigator.share(share); return; } catch (error) { if (error.name === 'AbortError') return; }
  }
  await copyText(content, button);
}
function messageAction(label, title, handler) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'message-action'; button.textContent = label;
  button.title = title; button.setAttribute('aria-label', title); button.onclick = () => handler(button);
  return button;
}
function addMessage(role, content) {
  $('#welcome').hidden = true;
  const item = document.createElement('article'); item.className = `message ${role}`;
  const body = document.createElement('div'); body.className = 'message-text'; body.append(text(content)); item.append(body);
  const actions = document.createElement('div'); actions.className = 'message-actions';
  if (role === 'assistant') {
    const speak = messageAction('🔊', 'Écouter la réponse', (button) => say(content, button));
    actions.append(speak);
  }
  actions.append(messageAction('📋 Copier', 'Copier ce message', (button) => copyText(content, button)));
  actions.append(messageAction('↗ Partager', 'Partager ce message', (button) => shareText(content, button)));
  item.append(actions);
  $('#messages').append(item); item.scrollIntoView({ block: 'end', behavior: 'smooth' }); return item;
}
function renderMessages() { $('#messages').replaceChildren(); if (!state.messages.length) { $('#welcome').hidden = false; return; } state.messages.forEach((message) => addMessage(message.role, message.content)); }
async function checkHealth() { const data = await api('/api/health'); state.djelia = Boolean(data.djelia); applyPreferences(); }
async function checkAuth() { const data = await api('/api/auth', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({action:'check'}) }); state.user=data.user; state.usage=data.usage; renderUsage(); if (state.user) await loadConversations(); }
async function openAuth() { $('#auth-error').textContent=''; $('#email').value=state.user?.email || ''; $('#password').value=''; $('#account-state').textContent=state.user ? `Connecté en tant que : ${state.user.email}` : 'Créez un compte gratuit ou connectez-vous.'; $('#auth-dialog').showModal(); }
async function submitAuth(action) { try { const data=await api('/api/auth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,email:$('#email').value,password:$('#password').value})}); state.user=data.user; state.usage=data.usage; $('#auth-dialog').close(); renderUsage(); await loadConversations(); } catch(error) { $('#auth-error').textContent=error.message; } }
async function logout() { await api('/api/auth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'logout'})}); state.user=null; state.conversationId=null; state.messages=[]; await checkAuth(); renderMessages(); }
function conversationButton(conversation) { const button=document.createElement('button'); button.className=`conversation ${conversation.id===state.conversationId?'active':''}`; button.textContent=conversation.title; button.onclick=()=>openConversation(conversation.id); return button; }
async function loadConversations() { const lists=[$('#conversation-list'),$('#mobile-conversation-list')]; lists.forEach((list)=>list.replaceChildren()); if (!state.user) { $('#history-empty').hidden=false; return; } const data=await api('/api/conversations'); const visible=data.conversations.filter((conversation)=>conversation.title !== 'Nouvelle conversation' && Boolean(conversation.preview)); visible.forEach((conversation)=>lists.forEach((list)=>list.append(conversationButton(conversation)))); $('#history-empty').hidden=visible.length > 0; }
async function newConversation() { stopSpeech(); state.messages=[]; state.conversationId=null; renderMessages(); renderUsage(); }
async function openConversation(id) { const data=await api(`/api/conversations/${id}`); state.conversationId=id; state.messages=data.messages.map(({role,content})=>({role,content})); renderMessages(); if ($('#history-dialog').open) $('#history-dialog').close(); await loadConversations(); renderUsage(); }
async function deleteConversation() { if (!state.user || !state.conversationId) return; if (!confirm('Effacer définitivement cette discussion ?')) return; await api(`/api/conversations/${state.conversationId}`, { method:'DELETE' }); state.conversationId=null; state.messages=[]; renderMessages(); renderUsage(); await loadConversations(); }

async function send() { const input=$('#prompt'); const content=input.value.trim(); if (!content) return; if (state.user && !state.conversationId) { const data=await api('/api/conversations',{method:'POST'}); state.conversationId=data.conversation.id; } input.value=''; state.messages.push({role:'user',content}); addMessage('user',content); const waiting=addMessage('assistant','Mande‑IA réfléchit…'); try { const data=await api('/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:state.messages,conversationId:state.conversationId,language:preferences.language})}); waiting.remove(); state.messages.push({role:'assistant',content:data.reply}); addMessage('assistant',data.reply); state.usage=data.usage; renderUsage(); if (state.user) loadConversations(); if (preferences.voice) say(data.reply); } catch(error) { waiting.textContent=error.message; if (error.payload?.usage) state.usage=error.payload.usage; if (error.message.includes('Limite')) renderUsage(); } }
function resetSpeechButton(button) { if (!button) return; button.disabled=false; button.textContent='🔊'; button.title='Écouter la réponse'; button.setAttribute('aria-label','Écouter la réponse'); }
function stopSpeech() { if (!state.activeAudio) return false; state.activeAudio.pause(); state.activeAudio.currentTime=0; resetSpeechButton(state.activeSpeechButton); state.activeAudio=null; state.activeSpeechButton=null; return true; }
async function say(content, button) {
  if (!state.djelia) { $('#status').textContent='La lecture vocale n’est pas configurée.'; return; }
  if (state.speechLoading || button?.disabled) return;
  if (state.activeAudio) {
    const sameButton=state.activeSpeechButton===button;
    stopSpeech();
    if (sameButton) { $('#status').textContent='Lecture vocale arrêtée.'; return; }
  }
  if (button) { button.disabled=true; button.textContent='⏳'; button.title='Préparation de l’audio…'; }
  state.speechLoading=true;
  try {
    let audio = state.speechCache.get(content);
    if (!audio) {
      $('#status').textContent='Préparation de la voix Moussa…';
      const data=await api('/api/voice/speak',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:content})});
      audio=`data:audio/mp3;base64,${data.audio}`;
      state.speechCache.set(content, audio);
    }
    const player=new Audio(audio);
    state.activeAudio=player; state.activeSpeechButton=button;
    player.onended=()=>{ if (state.activeAudio===player) { resetSpeechButton(state.activeSpeechButton); state.activeAudio=null; state.activeSpeechButton=null; $('#status').textContent='Écrivez dans votre langue — micro bêta'; } };
    await player.play();
    if (button) { button.disabled=false; button.textContent='⏹️'; button.title='Arrêter la lecture'; button.setAttribute('aria-label','Arrêter la lecture'); }
    $('#status').textContent='Lecture vocale en cours. Appuyez sur ⏹️ pour arrêter.';
  } catch (error) {
    $('#status').textContent=error.detail ? `Lecture vocale indisponible (${error.detail}).` : 'Lecture vocale momentanément indisponible.';
    resetSpeechButton(button); state.activeAudio=null; state.activeSpeechButton=null;
  } finally { state.speechLoading=false; }
}
function resetMicButton() { clearInterval(state.recordingTimer); state.recordingTimer=null; const mic=$('#mic'); mic.classList.remove('recording'); mic.textContent='🎙️'; mic.title='Microphone bêta : écrivez si la transcription ne fonctionne pas'; }
async function toggleMic() {
  if (state.transcribing) return;
  if (state.recorder?.state==='recording') {
    clearInterval(state.recordingTimer); $('#status').textContent='Transcription Bambara…'; state.recorder.stop(); return;
  }
  try {
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    state.chunks=[];
    const mimeType=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find((type)=>MediaRecorder.isTypeSupported(type));
    state.recorder=new MediaRecorder(stream,mimeType?{mimeType}:undefined);
    state.recorder.ondataavailable=(event)=>{ if (event.data.size) state.chunks.push(event.data); };
    state.recorder.onstop=async()=>{
      clearInterval(state.recordingTimer); state.recordingTimer=null; stream.getTracks().forEach((track)=>track.stop()); resetMicButton();
      const duration=Date.now()-state.recordingStartedAt;
      if (duration < 700) { $('#status').textContent='Parlez au moins une seconde, puis réessayez.'; return; }
      state.transcribing=true; $('#mic').disabled=true;
      const mime=state.recorder.mimeType || 'audio/webm'; const extension=mime.includes('mp4') ? 'm4a' : 'webm'; const blob=new Blob(state.chunks,{type:mime}); const form=new FormData(); form.append('audio',blob,`mande-ia-audio.${extension}`);
      try { const data=await api('/api/voice/transcribe',{method:'POST',body:form}); if (!data.text?.trim()) throw new Error('Aucun mot reconnu. Réessayez plus près du microphone.'); $('#prompt').value=data.text.trim(); $('#status').textContent='Texte reçu : vérifiez-le, puis appuyez sur Envoyer.'; $('#prompt').focus(); }
      catch(error) { $('#status').textContent=error.detail?.includes('HTTP 5') ? 'La voix Bambara est temporairement indisponible. Écrivez votre message pour continuer.' : error.message; }
      finally { state.transcribing=false; $('#mic').disabled=false; }
    };
    state.recordingStartedAt=Date.now(); state.recorder.start();
    const mic=$('#mic'); mic.classList.add('recording');
    const showDuration=()=>{ const seconds=Math.min(10,Math.max(1,Math.ceil((Date.now()-state.recordingStartedAt)/1000))); mic.textContent=String(seconds); mic.title=`Enregistrement ${seconds}/10 secondes`; $('#status').textContent=`J’écoute… ${seconds}/10 secondes. Appuyez à nouveau pour arrêter.`; if (seconds>=10 && state.recorder?.state==='recording') { clearInterval(state.recordingTimer); $('#status').textContent='10 secondes atteintes. Transcription Bambara…'; state.recorder.stop(); } };
    showDuration(); state.recordingTimer=setInterval(showDuration,250);
  } catch { resetMicButton(); $('#status').textContent='Autorisez le microphone pour parler.'; }
}
function shareApp() { const share = { title:'Mande-IA', text:'Parlez avec Mande‑IA, assistant Bambara pour le Mali.', url: location.origin }; if (navigator.share) navigator.share(share).catch(()=>{}); else navigator.clipboard?.writeText(location.origin).then(()=>alert('Lien copié.')); }

$('#send').onclick=send; $('#prompt').addEventListener('keydown',(event)=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();send();}}); $('#mic').onclick=toggleMic; $('#new-chat').onclick=newConversation; $('#login-button').onclick=openAuth; $('#mobile-login').onclick=openAuth; $('#close-dialog').onclick=()=>$('#auth-dialog').close(); $('#register').onclick=()=>submitAuth('register'); $('#login').onclick=()=>submitAuth('login'); $('#logout').onclick=logout;
$('#settings-button').onclick=()=>{ applyPreferences(); $('#settings-dialog').showModal(); }; $('#close-settings').onclick=()=>$('#settings-dialog').close(); $('#theme-toggle').onchange=(event)=>{ preferences.theme=event.target.checked?'dark':'light'; localStorage.setItem('mande-theme',preferences.theme); applyPreferences(); }; $('#language-select').onchange=(event)=>{ preferences.language=event.target.value; localStorage.setItem('mande-language',preferences.language); }; $('#voice-toggle').onchange=(event)=>{ preferences.voice=event.target.checked; localStorage.setItem('mande-voice',String(preferences.voice)); }; $('#share-app').onclick=shareApp; $('#delete-conversation').onclick=()=>deleteConversation().catch((error)=>alert(error.message));
const whatsapp='22377295259'; $('#support-link').href=`https://wa.me/${whatsapp}?text=${encodeURIComponent('Bonjour, j’ai besoin d’aide avec Mande-IA.')}`; $('#feedback-link').href=`https://wa.me/${whatsapp}?text=${encodeURIComponent('Bonjour, voici mon avis sur Mande-IA : ')}`;
$('#upgrade-link').href=`https://wa.me/${whatsapp}?text=${encodeURIComponent('Bonjour, je souhaite passer à Pro sur Mande-IA. Pouvez-vous m’indiquer les moyens de paiement disponibles ?')}`;
$('#mobile-new').onclick=()=>newConversation().catch((error)=>alert(error.message)); $('#history-new').onclick=()=>newConversation().then(()=>$('#history-dialog').close()).catch((error)=>alert(error.message)); $('#mobile-history').onclick=async()=>{ await loadConversations(); $('#history-dialog').showModal(); }; $('#close-history').onclick=()=>$('#history-dialog').close();
const aboutText = {
  bm: { title:'Mande‑IA kɔrɔ', paragraphs:['Aw ni ce. Mande‑IA ye Minta Services ka wali ye. A dan na Issa Minta, teknoloji kalanbaga ani Minta Services dabaga la.','Mande‑IA bɛ mɔgɔw dɛmɛ ka miiri kura bɔ, ka baara kɛcogoɲuman, ani ka teknoloji nafa fɔ. A ka kunko ye ka teknoloji kɛ ka se mɔgɔ bɛɛ ma.','Aw ka miiri kura bɛ damin yan, Mande‑IA fɛ.'] },
  fr: { title:'À propos de Mande‑IA', paragraphs:['Bienvenue sur Mande‑IA — votre partenaire intelligent pour l’innovation.','Mande‑IA n’est pas simplement une intelligence artificielle : c’est l’évolution d’une idée. Construit par Issa Minta, professeur de technologie et fondateur de Minta Services, il est conçu pour amplifier votre créativité et accélérer vos solutions.','Utilisez Mande‑IA pour générer des idées innovantes, optimiser vos processus de développement et accéder à une intelligence artificielle pratique et accessible.','Découvrez la puissance de la technologie Minta Services. Votre prochaine grande idée commence ici.'] },
  en: { title:'About Mande‑IA', paragraphs:['Welcome to Mande‑IA — your intelligent partner for innovation.','Mande‑IA is more than artificial intelligence: it is the evolution of an idea. Built by Issa Minta, technology teacher and founder of Minta Services, it is designed to amplify creativity and accelerate solutions.','Use Mande‑IA to generate innovative ideas, improve development processes, and access practical, approachable artificial intelligence.','Discover the power of Minta Services technology. Your next great idea starts here.'] }
};
function renderAbout() { const copy=aboutText[$('#about-language').value]; $('#about-title').textContent=copy.title; const content=$('#about-content'); content.replaceChildren(); copy.paragraphs.forEach((paragraph)=>{ const p=document.createElement('p'); p.textContent=paragraph; content.append(p); }); }
$('#about-app').onclick=()=>{ $('#settings-dialog').close(); $('#about-language').value=preferences.language === 'fr' ? 'fr' : 'bm'; renderAbout(); $('#about-dialog').showModal(); }; $('#close-about').onclick=()=>$('#about-dialog').close(); $('#about-language').onchange=renderAbout;
window.addEventListener('beforeinstallprompt',(event)=>{ event.preventDefault(); state.installEvent=event; $('#install-app').classList.remove('hidden'); }); $('#install-app').onclick=async()=>{ if (!state.installEvent) return; state.installEvent.prompt(); await state.installEvent.userChoice; state.installEvent=null; $('#install-app').classList.add('hidden'); };
applyPreferences(); checkHealth().catch(()=>{}); checkAuth().catch(()=>{$('#status').textContent='Le serveur n’est pas encore prêt.';}); renderMessages();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
