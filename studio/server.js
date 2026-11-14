require('dotenv').config({ path: require('path').join(__dirname, '.env'), quiet: true });
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const NodeMediaServer = require('node-media-server');
const journalRtmp = require('node-media-server/src/core/logger.js');

const PORT = Number(process.env.PORT || 3004);
const RTMP_PORT = Number(process.env.RTMP_PORT || 1935);
const SECRET = process.env.SESSION_SECRET || '';
const MOT_DE_PASSE = process.env.STUDIO_MOT_DE_PASSE || '';
const CLE_OBS = process.env.STUDIO_CLE_OBS || '';
const DOMAINE = process.env.STUDIO_DOMAINE || 'studio.mintaservices.com';
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const DATA = path.join(__dirname, 'data');
const FICHIER = path.join(DATA, 'destinations.json');
const SESSION_MS = 12 * 60 * 60 * 1000;
const ARRET_AUTO_MS = 10 * 60 * 1000;
const MAX_DESTINATIONS = 8;
const TYPES = {
  facebook: { nom: 'Facebook Live', url: 'rtmps://live-api-s.facebook.com:443/rtmp' },
  youtube: { nom: 'YouTube Live', url: 'rtmp://a.rtmp.youtube.com/live2' },
  tiktok: { nom: 'TikTok Live', url: '' },
  autre: { nom: 'Autre', url: '' }
};

const manque = [];
if (SECRET.length < 32) manque.push('SESSION_SECRET (openssl rand -hex 32)');
if (MOT_DE_PASSE.length < 12) manque.push('STUDIO_MOT_DE_PASSE (12 caractères au minimum)');
if (!/^[A-Za-z0-9_-]{24,}$/.test(CLE_OBS)) manque.push('STUDIO_CLE_OBS (openssl rand -hex 16)');
if (manque.length) { console.error(`Fichier .env incomplet : ${manque.join(' ; ')}`); process.exit(1); }

fs.mkdirSync(DATA, { recursive: true });
const CHEMIN = `/live/${CLE_OBS}`;
const SOURCE = `rtmp://127.0.0.1:${RTMP_PORT}${CHEMIN}`;

function lire() {
  try { return JSON.parse(fs.readFileSync(FICHIER, 'utf8')); } catch (erreur) {
    if (erreur.code !== 'ENOENT') console.error('destinations.json illisible :', erreur.message);
    return [];
  }
}
let destinations = lire();
function enregistrer() {
  const provisoire = `${FICHIER}.tmp`;
  fs.writeFileSync(provisoire, `${JSON.stringify(destinations, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(provisoire, FICHIER);
}

const signal = { session: null, depuis: 0, fin: Date.now(), octets: 0, mesure: Date.now(), kbps: 0 };
const coupe = () => Boolean(signal.session?.socket?.destroyed);
const local = (ip) => /^(::ffff:)?127\.|^::1:/.test(String(ip));

const rtmp = new NodeMediaServer({
  bind: '0.0.0.0',
  rtmp: { port: RTMP_PORT },
  webadmin: { enable: false },
  store: { path: path.join(DATA, 'rtmp') },
  auth: { play: false, publish: false, secret: '' },
  record: { auto: false, path: path.join(DATA, 'rtmp') }
}, '');
journalRtmp.level = 'error';

rtmp.on('prePublish', (session) => {
  if (session.streamPath !== CHEMIN) { console.warn(`Flux refusé depuis ${String(session.ip).replace(/:\d+$/, '')} : mauvaise clé`); session.socket?.destroy(); }
});
rtmp.on('prePlay', (session) => {
  if (!local(session.ip)) session.socket?.destroy();
});
rtmp.on('postPublish', (session) => {
  if (session.streamPath !== CHEMIN || session.socket?.destroyed) return;
  const reprise = Boolean(signal.session);
  Object.assign(signal, { session, depuis: reprise ? signal.depuis : Date.now(), octets: session.inBytes || 0, mesure: Date.now(), kbps: 0 });
  console.log(reprise ? 'Signal OBS revenu' : 'Signal OBS reçu');
});
rtmp.on('donePublish', (session) => {
  if (signal.session !== session) return;
  Object.assign(signal, { session: null, fin: Date.now(), kbps: 0 });
  console.log('Signal OBS terminé');
});

const relais = new Map();
const etatDe = (id) => relais.get(id) || relais.set(id, { proc: null, debut: 0, erreur: '', echecs: 0, apres: 0 }).get(id);
const cible = (d) => `${d.url.replace(/\/+$/, '')}/${d.cle}`;
const masquer = (texte, d) => String(texte).split(d.cle).join('••••').split(CLE_OBS).join('••••').replace(/\s+/g, ' ').trim().slice(-220);

function expliquer(sortie) {
  if (/introuvable/.test(sortie)) return sortie;
  if (/resolve|Name or service/i.test(sortie)) return 'Adresse du serveur introuvable : vérifiez-la.';
  if (/refused|timed out|unreachable/i.test(sortie)) return 'La plateforme ne répond pas à cette adresse.';
  if (/Input\/output|Broken pipe|reset by peer|End of file|Server error|Unauthorized|handshake/i.test(sortie)) return 'La plateforme a fermé la connexion : vérifiez la clé de stream (elle a peut-être expiré) et que le live est bien créé.';
  return 'L\'envoi s\'est arrêté.';
}
function lancer(d) {
  const r = etatDe(d.id);
  const proc = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-rw_timeout', '15000000', '-i', SOURCE, '-c', 'copy', '-flvflags', 'no_duration_filesize', '-f', 'flv', cible(d)], { stdio: ['ignore', 'ignore', 'pipe'] });
  let sortie = '';
  r.proc = proc; r.debut = Date.now(); r.erreur = '';
  proc.stderr.on('data', (m) => { sortie = (sortie + m).slice(-2000); });
  proc.on('error', (erreur) => { sortie = erreur.code === 'ENOENT' ? 'ffmpeg est introuvable sur le serveur : apt install -y ffmpeg' : erreur.message; });
  proc.on('close', (code) => {
    if (r.proc !== proc) return;
    const duree = Date.now() - r.debut;
    r.proc = null;
    if (d.actif && signal.session && code !== 0 && code !== 255) {
      r.echecs = duree > 60000 ? 1 : r.echecs + 1;
      r.erreur = expliquer(sortie);
      r.apres = Date.now() + Math.min(30000, 4000 * r.echecs);
      console.warn(`${d.nom} : ${masquer(sortie, d) || `ffmpeg s'est arrêté (code ${code})`}`);
    }
  });
  console.log(`${d.nom} : envoi lancé`);
}
function arreter(id) {
  const r = relais.get(id);
  if (!r?.proc) return;
  const proc = r.proc;
  r.proc = null;
  proc.kill('SIGTERM');
  setTimeout(() => { if (proc.exitCode === null) proc.kill('SIGKILL'); }, 3000).unref();
}

function tour() {
  const maintenant = Date.now();
  if (signal.session) {
    const octets = signal.session.inBytes || 0;
    const secondes = (maintenant - signal.mesure) / 1000;
    if (secondes >= 1.5) { signal.kbps = Math.max(0, Math.round(((octets - signal.octets) * 8) / secondes / 1000)); signal.octets = octets; signal.mesure = maintenant; }
  } else if (maintenant - signal.fin > ARRET_AUTO_MS && destinations.some((d) => d.actif)) {
    for (const d of destinations) d.actif = false;
    enregistrer();
    console.log('Aucun signal depuis 10 minutes : toutes les destinations sont arrêtées');
  }
  for (const d of destinations) {
    const r = etatDe(d.id);
    if (!d.actif || !signal.session) { arreter(d.id); if (!d.actif) { r.erreur = ''; r.echecs = 0; r.apres = 0; } continue; }
    if (!r.proc && maintenant >= r.apres) lancer(d);
  }
}
setInterval(tour, 2000);

function signer(valeur) { return `${valeur}.${crypto.createHmac('sha256', SECRET).update(valeur).digest('base64url')}`; }
function verifier(signe) {
  const i = String(signe || '').lastIndexOf('.');
  if (i < 1) return null;
  const valeur = signe.slice(0, i);
  const a = Buffer.from(signer(valeur)); const b = Buffer.from(signe);
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? valeur : null;
}
function cookie(req, nom) {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === nom) return decodeURIComponent(v.join('='));
  }
  return '';
}
const connecte = (req) => Number(verifier(cookie(req, 'studio'))) > Date.now();
const empreinte = (texte) => crypto.createHash('sha256').update(String(texte)).digest();

function publique(d) {
  const r = etatDe(d.id);
  let etat = 'arrete';
  if (d.actif) etat = coupe() ? 'attente' : r.proc ? (Date.now() - r.debut > 5000 ? 'direct' : 'connexion') : r.erreur ? 'erreur' : 'attente';
  return { id: d.id, nom: d.nom, type: d.type, url: d.url, cleFin: d.cle.slice(-4), actif: d.actif, etat, erreur: d.actif ? r.erreur : '', depuis: r.proc ? r.debut : 0 };
}
function valider(corps, ancienne) {
  const type = Object.hasOwn(TYPES, corps.type) ? corps.type : ancienne?.type || 'autre';
  const nom = String(corps.nom || ancienne?.nom || TYPES[type].nom).trim().slice(0, 40);
  const url = String(corps.url || ancienne?.url || TYPES[type].url).trim();
  const cle = String(corps.cle || ancienne?.cle || '').trim();
  if (!/^rtmps?:\/\/[A-Za-z0-9.-]+(:\d{1,5})?(\/[^\s]*)?$/.test(url) || url.length > 300) return { erreur: 'L\'adresse du serveur doit commencer par rtmp:// ou rtmps://' };
  if (/^rtmps?:\/\/(127\.|localhost|0\.0\.0\.0|\[?::1)/i.test(url)) return { erreur: 'Cette adresse désigne le studio lui-même.' };
  if (!/^[^\s]{4,400}$/.test(cle)) return { erreur: 'La clé de stream est vide ou contient un espace.' };
  return { type, nom, url, cle };
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], imgSrc: ["'self'", 'data:'], styleSrc: ["'self'"], scriptSrc: ["'self'"], connectSrc: ["'self'"], frameAncestors: ["'none'"] } }, referrerPolicy: { policy: 'no-referrer' } }));
app.use(express.json({ limit: '8kb' }));
app.use((req, res, next) => { res.set('X-Robots-Tag', 'noindex, nofollow'); next(); });
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 240, standardHeaders: true, legacyHeaders: false }));

app.post('/api/connexion', rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false, message: { erreur: 'Trop d\'essais. Réessayez dans 15 minutes.' } }), (req, res) => {
  if (!crypto.timingSafeEqual(empreinte(req.body?.motDePasse), empreinte(MOT_DE_PASSE))) return res.status(401).json({ erreur: 'Mot de passe incorrect.' });
  res.cookie('studio', signer(String(Date.now() + SESSION_MS)), { httpOnly: true, sameSite: 'strict', secure: req.secure, maxAge: SESSION_MS, path: '/' });
  res.json({ ok: true });
});
app.post('/api/deconnexion', (req, res) => { res.clearCookie('studio', { path: '/' }); res.json({ ok: true }); });

app.use('/api', (req, res, next) => (connecte(req) ? next() : res.status(401).json({ erreur: 'Connexion requise.' })));

app.get('/api/etat', (req, res) => {
  const s = signal.session;
  res.json({
    signal: s ? { coupe: coupe(), depuis: signal.depuis, kbps: signal.kbps, largeur: s.videoWidth || 0, hauteur: s.videoHeight || 0, ips: Math.round(s.videoFramerate || 0) } : null,
    obs: { serveur: `rtmp://${DOMAINE}:${RTMP_PORT}/live` },
    types: TYPES,
    destinations: destinations.map(publique)
  });
});
app.get('/api/cle-obs', (req, res) => res.json({ cle: CLE_OBS }));

app.post('/api/destinations', (req, res) => {
  if (destinations.length >= MAX_DESTINATIONS) return res.status(400).json({ erreur: `Pas plus de ${MAX_DESTINATIONS} destinations.` });
  const d = valider(req.body || {});
  if (d.erreur) return res.status(400).json(d);
  destinations.push({ id: crypto.randomBytes(6).toString('hex'), ...d, actif: false });
  enregistrer();
  res.json({ ok: true });
});
app.put('/api/destinations/:id', (req, res) => {
  const i = destinations.findIndex((x) => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ erreur: 'Destination introuvable.' });
  const d = valider(req.body || {}, destinations[i]);
  if (d.erreur) return res.status(400).json(d);
  arreter(destinations[i].id);
  destinations[i] = { ...destinations[i], ...d };
  enregistrer();
  res.json({ ok: true });
});
app.delete('/api/destinations/:id', (req, res) => {
  arreter(req.params.id);
  relais.delete(req.params.id);
  destinations = destinations.filter((x) => x.id !== req.params.id);
  enregistrer();
  res.json({ ok: true });
});
app.post('/api/destinations/:id/actif', (req, res) => {
  const d = destinations.find((x) => x.id === req.params.id);
  if (!d) return res.status(404).json({ erreur: 'Destination introuvable.' });
  d.actif = req.body?.actif === true;
  if (!signal.session) signal.fin = Date.now();
  enregistrer();
  tour();
  res.json({ ok: true });
});
app.post('/api/tout', (req, res) => {
  const actif = req.body?.actif === true;
  for (const d of destinations) d.actif = actif;
  if (!signal.session) signal.fin = Date.now();
  enregistrer();
  tour();
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html', maxAge: '5m' }));
app.use((req, res) => res.status(404).json({ erreur: 'Introuvable.' }));

rtmp.run();
const serveur = app.listen(PORT, '127.0.0.1', () => console.log(`Studio Live prêt : tableau de bord sur le port ${PORT}, signal OBS sur le port ${RTMP_PORT}`));

function fermer() {
  for (const d of destinations) arreter(d.id);
  serveur.close();
  rtmp.stop().finally(() => process.exit(0));
  setTimeout(() => process.exit(0), 4000).unref();
}
process.on('SIGTERM', fermer);
process.on('SIGINT', fermer);
