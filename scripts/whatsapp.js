#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ quiet: true, path: path.join(__dirname, '..', '.env') });

const env = process.env;
const GRAPH = `${env.META_GRAPH_BASE_URL || 'https://graph.facebook.com'}/${env.META_GRAPH_API_VERSION || 'v26.0'}`;
const TOKEN = env.WHATSAPP_ACCESS_TOKEN || env.WHATSAPP_ROOT_TOKEN || '';
const PHONE_ID = env.WHATSAPP_PHONE_NUMBER_ID || '';
const WEBHOOK_URL = env.WHATSAPP_WEBHOOK_URL || 'https://ia.mintaservices.com/api/whatsapp/webhook';
const PROFILE_PICTURE = path.join(__dirname, '..', 'public', 'icons', 'whatsapp-profil.png');

const PROFILE = {
  about: 'Assistant IA en bambara, français et anglais. Par Minta Services.',
  description: 'Mande-IA répond à vos questions en bambara, en français et en anglais : conseils, école, entrepreneuriat, technologie et culture du Mali. Créé par le Professeur Issa Minta (Minta Services). Tapez menu pour voir les sujets.',
  email: 'academy@mintaservices.com',
  websites: ['https://ia.mintaservices.com', 'https://mintaservices.com'],
  vertical: 'EDU'
};
const ICE_BREAKERS = [
  'Donne-moi un conseil pour lancer mon activité',
  'Une leçon de bambara, s’il te plaît',
  'Explique-moi l’école au Mali',
  'Montre-moi le menu'
];
const COMMANDS = [
  { command_name: 'menu', command_description: 'Voir les sujets de Mande-IA' },
  { command_name: 'aide', command_description: 'Comment utiliser Mande-IA sur WhatsApp' }
];

let problems = 0;
const ok = (label, text) => console.log(`  OK        ${label.padEnd(20)} ${text}`);
const bad = (label, text) => { problems += 1; console.log(`  PROBLÈME  ${label.padEnd(20)} ${text}`); };
const note = (label, text) => console.log(`  INFO      ${label.padEnd(20)} ${text}`);
const why = (res) => `(${res.status}${res.data?.error?.code ? ` ${res.data.error.code}` : ''}${res.data?.error?.message ? ` : ${res.data.error.message}` : ''})`;

async function graph(method, url, { body, auth = `Bearer ${TOKEN}`, headers = {} } = {}) {
  const target = url.startsWith('http') ? url : `${GRAPH}${url}`;
  const isBinary = Buffer.isBuffer(body);
  try {
    const response = await fetch(target, { method, signal: AbortSignal.timeout(20000), headers: { ...(auth ? { Authorization: auth } : {}), ...(body && !isBinary ? { 'content-type': 'application/json' } : {}), ...headers }, body: body ? (isBinary ? body : JSON.stringify(body)) : undefined });
    const text = await response.text();
    let data = {}; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return { ok: response.ok, status: response.status, data };
  } catch (error) { return { ok: false, status: 0, data: { error: { message: error.message } } }; }
}

async function wabaIds() {
  const res = await graph('GET', `/debug_token?input_token=${encodeURIComponent(TOKEN)}`);
  const scopes = res.data?.data?.granular_scopes || [];
  return [...new Set(scopes.filter((s) => s.scope === 'whatsapp_business_management').flatMap((s) => s.target_ids || []))];
}

async function diagnostic() {
  console.log('\n1. Fichier .env');
  TOKEN ? ok('Jeton', 'présent') : bad('Jeton', 'WHATSAPP_ACCESS_TOKEN manquant');
  PHONE_ID ? ok('Phone number ID', 'présent') : bad('Phone number ID', 'WHATSAPP_PHONE_NUMBER_ID manquant');
  env.META_APP_SECRET ? ok('Clé secrète app', 'présente') : bad('Clé secrète app', 'META_APP_SECRET manquant (App settings → Basic → App secret)');
  env.WHATSAPP_VERIFY_TOKEN ? ok('Jeton webhook', 'présent') : bad('Jeton webhook', 'WHATSAPP_VERIFY_TOKEN manquant');
  if (env.WHATSAPP_TEST_MODE === 'false') ok('Mode', 'public : Mande-IA répond à tout le monde');
  else if (env.WHATSAPP_TEST_RECIPIENT) note('Mode', `test : répond seulement au ${env.WHATSAPP_TEST_RECIPIENT}`);
  else bad('Mode', 'test, mais WHATSAPP_TEST_RECIPIENT est vide : Mande-IA ne répond à personne');
  if (!TOKEN || !PHONE_ID) return;

  console.log('\n2. Numéro WhatsApp');
  const phone = await graph('GET', `/${PHONE_ID}?fields=display_phone_number,verified_name,name_status,code_verification_status,quality_rating,platform_type,status`);
  if (!phone.ok) bad('Numéro', `refusé ${why(phone)}`);
  else {
    const p = phone.data;
    ok('Numéro', `${p.display_phone_number} (nom affiché : ${p.verified_name})`);
    p.platform_type === 'CLOUD_API' ? ok('Plateforme', 'Cloud API') : bad('Plateforme', `${p.platform_type || 'inconnue'} : lancez « node scripts/whatsapp.js enregistrer PIN »`);
    p.status && p.status !== 'CONNECTED' ? bad('Statut', p.status) : ok('Statut', p.status || 'non indiqué');
    p.name_status === 'APPROVED' || p.name_status === 'AVAILABLE_WITHOUT_REVIEW' ? ok('Nom affiché', p.name_status) : note('Nom affiché', `${p.name_status || 'inconnu'} (en attente ou refusé par Meta)`);
    note('Qualité', p.quality_rating || 'inconnue');
  }

  console.log('\n3. Compte WhatsApp Business et abonnement de l’app');
  const ids = await wabaIds();
  if (!ids.length) bad('Compte WhatsApp', 'le jeton n’a pas accès au compte WhatsApp (Utilisateur système → Assign assets → WhatsApp accounts)');
  for (const id of ids) {
    const subs = await graph('GET', `/${id}/subscribed_apps`);
    if (!subs.ok) bad(`Compte ${id}`, `lecture impossible ${why(subs)}`);
    else if (!(subs.data.data || []).length) bad(`Compte ${id}`, 'aucune app abonnée : lancez « node scripts/whatsapp.js configurer »');
    else ok(`Compte ${id}`, `app abonnée : ${(subs.data.data || []).map((a) => a.whatsapp_business_api_data?.name || a.name || a.id).join(', ')}`);
  }

  console.log('\n4. Webhook chez Meta');
  if (env.META_APP_ID && env.META_APP_SECRET) {
    const subs = await graph('GET', `/${env.META_APP_ID}/subscriptions`, { auth: `OAuth ${env.META_APP_ID}|${env.META_APP_SECRET}` });
    const wa = (subs.data?.data || []).find((s) => s.object === 'whatsapp_business_account');
    if (!subs.ok) bad('Configuration', `lecture impossible ${why(subs)}`);
    else if (!wa) bad('Configuration', 'aucun webhook WhatsApp : WhatsApp → Configuration → Callback URL');
    else {
      wa.callback_url === WEBHOOK_URL ? ok('Callback URL', wa.callback_url) : bad('Callback URL', `${wa.callback_url} (attendu : ${WEBHOOK_URL})`);
      const fields = (wa.fields || []).map((f) => f.name || f);
      fields.includes('messages') ? ok('Champ messages', 'abonné') : bad('Champ messages', 'non abonné : Webhook fields → messages → Subscribe');
      wa.active === false ? bad('Webhook', 'inactif') : ok('Webhook', 'actif');
    }
  } else note('Configuration', 'ajoutez META_APP_ID dans .env pour vérifier la Callback URL');

  console.log('\n5. Serveur joignable depuis Internet');
  if (env.WHATSAPP_VERIFY_TOKEN) {
    const challenge = String(Date.now());
    const res = await graph('GET', `${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(env.WHATSAPP_VERIFY_TOKEN)}&hub.challenge=${challenge}`, { auth: '' });
    res.ok && String(res.data?.raw ?? res.data) === challenge ? ok('Webhook public', `${WEBHOOK_URL} répond correctement`) : bad('Webhook public', `réponse inattendue ${why(res)} : vérifiez Nginx et PM2`);
  }

  console.log(problems ? `\n${problems} problème(s) à corriger.\n` : '\nTout est en ordre. Envoyez « menu » au numéro de Mande-IA.\n');
}

async function uploadProfilePicture() {
  if (!env.META_APP_ID) { note('Photo de profil', 'ajoutez META_APP_ID dans .env, ou envoyez la photo dans WhatsApp Manager'); return null; }
  const file = fs.readFileSync(PROFILE_PICTURE);
  const session = await graph('POST', `/${env.META_APP_ID}/uploads?file_name=whatsapp-profil.png&file_length=${file.length}&file_type=image%2Fpng`);
  if (!session.ok || !session.data.id) { bad('Photo de profil', `envoi refusé ${why(session)} : envoyez public/icons/whatsapp-profil.png dans WhatsApp Manager`); return null; }
  const upload = await graph('POST', `/${session.data.id}`, { body: file, auth: `OAuth ${TOKEN}`, headers: { file_offset: '0' } });
  if (!upload.ok || !upload.data.h) { bad('Photo de profil', `envoi refusé ${why(upload)} : envoyez public/icons/whatsapp-profil.png dans WhatsApp Manager`); return null; }
  return upload.data.h;
}

async function configurer() {
  if (!TOKEN || !PHONE_ID) { console.log('Remplissez d’abord WHATSAPP_ACCESS_TOKEN et WHATSAPP_PHONE_NUMBER_ID dans .env.'); process.exitCode = 1; return; }
  console.log('\nConfiguration de WhatsApp');
  for (const id of await wabaIds()) {
    const res = await graph('POST', `/${id}/subscribed_apps`);
    res.ok ? ok(`Compte ${id}`, 'app abonnée aux messages') : bad(`Compte ${id}`, `abonnement refusé ${why(res)}`);
  }
  const handle = await uploadProfilePicture();
  const profile = await graph('POST', `/${PHONE_ID}/whatsapp_business_profile`, { body: { messaging_product: 'whatsapp', ...PROFILE, ...(handle ? { profile_picture_handle: handle } : {}) } });
  profile.ok ? ok('Profil', `description, site, e-mail${handle ? ' et photo' : ''} mis à jour`) : bad('Profil', `refusé ${why(profile)}`);
  const automation = await graph('POST', `/${PHONE_ID}/conversational_automation`, { body: { enable_welcome_message: true, prompts: ICE_BREAKERS, commands: COMMANDS } });
  automation.ok ? ok('Suggestions', `${ICE_BREAKERS.length} questions et ${COMMANDS.length} commandes ajoutées`) : bad('Suggestions', `refusé ${why(automation)}`);
  console.log(problems ? `\n${problems} problème(s).\n` : '\nTerminé. Lancez « node scripts/whatsapp.js diagnostic » pour tout vérifier.\n');
}

async function enregistrer(pin) {
  if (!/^\d{6}$/.test(pin || '')) { console.log('Usage : node scripts/whatsapp.js enregistrer 123456 (votre code PIN à 6 chiffres)'); process.exitCode = 1; return; }
  const res = await graph('POST', `/${PHONE_ID}/register`, { body: { messaging_product: 'whatsapp', pin } });
  res.ok ? ok('Enregistrement', 'numéro activé sur Cloud API') : bad('Enregistrement', `refusé ${why(res)}`);
}

async function test() {
  const to = env.WHATSAPP_TEST_RECIPIENT;
  if (!to || !env.META_APP_SECRET) { console.log('Remplissez WHATSAPP_TEST_RECIPIENT et META_APP_SECRET dans .env.'); process.exitCode = 1; return; }
  const body = JSON.stringify({ object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: { messages: [{ from: to, id: `wamid.test.${Date.now()}`, type: 'text', text: { body: 'menu' } }] } }] }] });
  const signature = crypto.createHmac('sha256', env.META_APP_SECRET).update(body).digest('hex');
  const res = await graph('POST', `http://127.0.0.1:${env.PORT || 3001}/api/whatsapp/webhook`, { body: Buffer.from(body), auth: '', headers: { 'content-type': 'application/json', 'x-hub-signature-256': `sha256=${signature}` } });
  if (res.ok) ok('Message simulé', `accepté. Regardez le WhatsApp du ${to} : le menu doit arriver.`);
  else bad('Message simulé', `refusé ${why(res)}`);
  note('Attention', 'WhatsApp n’accepte la réponse que si ce numéro a écrit à Mande-IA dans les dernières 24 heures.');
}

const [command = 'diagnostic', arg] = process.argv.slice(2);
const actions = { diagnostic, configurer, enregistrer: () => enregistrer(arg), test };
if (!actions[command]) { console.log('Commandes : diagnostic | configurer | enregistrer PIN | test'); process.exitCode = 1; }
else actions[command]().catch((error) => { console.error(error.message); process.exitCode = 1; });
