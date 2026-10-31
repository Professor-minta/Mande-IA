require('dotenv').config({ path: require('path').join(__dirname, '.env'), quiet: true });
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
let Database;
try { Database = require('better-sqlite3'); }
catch (error) {
  if (error.code !== 'ERR_DLOPEN_FAILED' && error.code !== 'MODULE_NOT_FOUND') throw error;
  console.error(`Dépendances absentes ou installées avec une autre version de Node que ${process.version}. Dans ce dossier, lancez « rm -rf node_modules && npm install --omit=dev », puis redémarrez.`);
  process.exit(1);
}

const PORT = Number(process.env.PORT || 3002);
const DATA_DIR = path.join(__dirname, 'data');
const AUDIO_DIR = path.join(DATA_DIR, 'audio');
const SECRET = process.env.SESSION_SECRET || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const VOTES = Math.max(1, Number.parseInt(process.env.VOTES_REQUIS || '2', 10) || 2);
const OBJECTIF = Math.max(1, Number.parseInt(process.env.OBJECTIF || '10000', 10) || 10000);
const MAX_AUDIO_BYTES = 1024 * 1024;
const AUDIO_TYPES = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/aac': 'aac' };
const REGIONS = ['Bamako', 'Kayes', 'Koulikoro', 'Sikasso', 'Ségou', 'Mopti', 'Tombouctou', 'Gao', 'Kidal', 'Ménaka', 'Taoudéni', 'Hors du Mali'];
const AGES = ['18-24', '25-34', '35-49', '50-64', '65+'];
const GENRES = ['Femme', 'Homme', 'Ne pas répondre'];

if (!SECRET) { console.error('SESSION_SECRET manquant dans .env. Lancez « openssl rand -hex 32 » et collez le résultat.'); process.exit(1); }
fs.mkdirSync(AUDIO_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'data.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS contributors (id TEXT PRIMARY KEY, pseudo TEXT NOT NULL, region TEXT, age_range TEXT, gender TEXT, consent_at TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS prompts (id INTEGER PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('lire', 'traduire')), bm TEXT, fr TEXT, source TEXT, created_at TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS prompts_unique ON prompts(kind, COALESCE(bm, ''), COALESCE(fr, ''));
CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('voix', 'phrase', 'traduction')), contributor_id TEXT NOT NULL REFERENCES contributors(id) ON DELETE CASCADE, prompt_id INTEGER REFERENCES prompts(id), bm TEXT, fr TEXT, audio_file TEXT, duration_ms INTEGER, status TEXT NOT NULL DEFAULT 'en_attente' CHECK(status IN ('en_attente', 'validee', 'rejetee')), up INTEGER NOT NULL DEFAULT 0, down INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, decided_at TEXT);
CREATE INDEX IF NOT EXISTS items_status ON items(status, kind);
CREATE INDEX IF NOT EXISTS items_contributor ON items(contributor_id);
CREATE TABLE IF NOT EXISTS votes (item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE, contributor_id TEXT NOT NULL REFERENCES contributors(id) ON DELETE CASCADE, value INTEGER NOT NULL CHECK(value IN (-1, 1)), created_at TEXT NOT NULL, PRIMARY KEY(item_id, contributor_id));
`);
const now = () => new Date().toISOString();

(function seed() {
  const file = path.join(__dirname, 'seeds', 'phrases.json');
  if (!fs.existsSync(file)) return;
  const seeds = JSON.parse(fs.readFileSync(file, 'utf8'));
  const insert = db.prepare('INSERT OR IGNORE INTO prompts (kind, bm, fr, source, created_at) VALUES (?, ?, ?, ?, ?)');
  const added = db.transaction(() => {
    let n = 0;
    for (const p of seeds.lire || []) n += insert.run('lire', p.bm, p.fr || null, p.source || 'seed', now()).changes;
    for (const p of seeds.traduire || []) n += insert.run('traduire', null, p.fr, p.source || 'seed', now()).changes;
    return n;
  })();
  if (added) console.log(`Data-Collections : ${added} phrases de départ ajoutées.`);
})();

function sign(value) { return `${value}.${crypto.createHmac('sha256', SECRET).update(value).digest('base64url')}`; }
function unsign(signed) {
  const i = String(signed || '').lastIndexOf('.');
  if (i < 1) return null;
  const value = signed.slice(0, i);
  const a = Buffer.from(sign(value)); const b = Buffer.from(signed);
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? value : null;
}
function readCookie(req, name) {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return '';
}
function setContributorCookie(res, id) {
  res.append('Set-Cookie', `dc_id=${encodeURIComponent(sign(id))}; Path=/; Max-Age=${60 * 60 * 24 * 365 * 2}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'development' ? '' : '; Secure'}`);
}
const getContributor = db.prepare('SELECT * FROM contributors WHERE id = ?');
function contributor(req) { const id = unsign(readCookie(req, 'dc_id')); return id ? getContributor.get(id) : null; }
function requireContributor(req, res, next) {
  const c = contributor(req);
  if (!c) return res.status(401).json({ error: 'Créez votre profil de contributeur dans Compte avant de contribuer.' });
  req.contributor = c; next();
}
const clean = (text, max) => String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const pick = (value, list) => (list.includes(value) ? value : null);

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], imgSrc: ["'self'", 'data:'], mediaSrc: ["'self'", 'blob:'], styleSrc: ["'self'", 'https://fonts.googleapis.com'], fontSrc: ["'self'", 'https://fonts.gstatic.com'], scriptSrc: ["'self'"], connectSrc: ["'self'"] } } }));
app.use(express.json({ limit: '64kb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
const contributeLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false, message: { error: 'Beaucoup de contributions en peu de temps. Faites une pause et revenez dans un moment.' } });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_AUDIO_BYTES, files: 1 } });

function decide(itemId) {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
  if (!item || item.status !== 'en_attente') return;
  let status = null;
  if (item.up >= VOTES && item.up > item.down) status = 'validee';
  else if (item.down >= VOTES && item.down > item.up) status = 'rejetee';
  if (!status) return;
  db.prepare('UPDATE items SET status = ?, decided_at = ? WHERE id = ?').run(status, now(), itemId);
  if (status === 'validee' && item.kind !== 'voix' && item.bm) db.prepare('INSERT OR IGNORE INTO prompts (kind, bm, fr, source, created_at) VALUES (?, ?, ?, ?, ?)').run('lire', item.bm, item.fr, `contribution:${item.contributor_id}`, now());
}

app.get('/api/stats', (req, res) => {
  const row = db.prepare(`SELECT
    SUM(kind IN ('phrase', 'traduction')) AS phrases,
    SUM(kind = 'voix') AS voix,
    SUM(status = 'validee') AS validees,
    SUM(status = 'rejetee') AS rejetees,
    COUNT(DISTINCT contributor_id) AS contributeurs,
    SUM(CASE WHEN kind = 'voix' AND status = 'validee' THEN duration_ms ELSE 0 END) AS ms_valides
    FROM items`).get();
  const decided = (row.validees || 0) + (row.rejetees || 0);
  res.json({
    phrases: row.phrases || 0, voix: row.voix || 0, validees: row.validees || 0, contributeurs: row.contributeurs || 0,
    minutesValidees: Math.round((row.ms_valides || 0) / 60000), objectif: OBJECTIF,
    qualite: decided ? Math.round(((row.validees || 0) / decided) * 1000) / 10 : null,
    aLire: db.prepare("SELECT COUNT(*) AS n FROM prompts WHERE kind = 'lire'").get().n,
    aTraduire: db.prepare("SELECT COUNT(*) AS n FROM prompts WHERE kind = 'traduire'").get().n,
    votesRequis: VOTES
  });
});

app.get('/api/classement', (req, res) => {
  const mois = req.query.periode === 'mois';
  const since = mois ? new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString() : '';
  const rows = db.prepare(`SELECT c.pseudo, c.region, COUNT(i.id) AS contributions, SUM(i.status = 'validee') AS validees
    FROM items i JOIN contributors c ON c.id = i.contributor_id WHERE i.created_at >= ? AND i.status != 'rejetee'
    GROUP BY c.id ORDER BY contributions DESC, validees DESC LIMIT 20`).all(since);
  res.json({ periode: mois ? 'mois' : 'tout', contributeurs: rows });
});

app.get('/api/options', (req, res) => res.json({ regions: REGIONS, ages: AGES, genres: GENRES }));

app.get('/api/moi', (req, res) => {
  const c = contributor(req);
  if (!c) return res.json({ contributeur: null });
  const counts = db.prepare(`SELECT COUNT(*) AS total, SUM(kind = 'voix') AS voix, SUM(kind = 'phrase') AS phrases, SUM(kind = 'traduction') AS traductions, SUM(status = 'validee') AS validees FROM items WHERE contributor_id = ?`).get(c.id);
  const votes = db.prepare('SELECT COUNT(*) AS n FROM votes WHERE contributor_id = ?').get(c.id).n;
  res.json({ contributeur: { pseudo: c.pseudo, region: c.region, age: c.age_range, genre: c.gender, depuis: c.created_at }, compteurs: { ...counts, votes } });
});

app.post('/api/moi', (req, res) => {
  const pseudo = clean(req.body?.pseudo, 30);
  if (pseudo.length < 2) return res.status(400).json({ error: 'Choisissez un pseudo d’au moins 2 lettres.' });
  const existing = contributor(req);
  const region = pick(req.body?.region, REGIONS); const age = pick(req.body?.age, AGES); const genre = pick(req.body?.genre, GENRES);
  if (existing) {
    db.prepare('UPDATE contributors SET pseudo = ?, region = ?, age_range = ?, gender = ? WHERE id = ?').run(pseudo, region, age, genre, existing.id);
    return res.json({ ok: true });
  }
  if (req.body?.consentement !== true || req.body?.majeur !== true) return res.status(400).json({ error: 'Cochez les deux cases : vous avez 18 ans ou plus, et vous acceptez l’utilisation de vos contributions.' });
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO contributors (id, pseudo, region, age_range, gender, consent_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, pseudo, region, age, genre, now(), now());
  setContributorCookie(res, id);
  res.json({ ok: true });
});

app.delete('/api/moi', requireContributor, (req, res) => {
  const files = db.prepare("SELECT audio_file FROM items WHERE contributor_id = ? AND audio_file IS NOT NULL").all(req.contributor.id);
  db.transaction(() => {
    db.prepare('UPDATE items SET up = up - 1 WHERE id IN (SELECT item_id FROM votes WHERE contributor_id = ? AND value = 1)').run(req.contributor.id);
    db.prepare('UPDATE items SET down = down - 1 WHERE id IN (SELECT item_id FROM votes WHERE contributor_id = ? AND value = -1)').run(req.contributor.id);
    const own = `contribution:${req.contributor.id}`;
    db.prepare('UPDATE items SET prompt_id = NULL WHERE prompt_id IN (SELECT id FROM prompts WHERE source = ?)').run(own);
    db.prepare('DELETE FROM prompts WHERE source = ?').run(own);
    db.prepare('DELETE FROM contributors WHERE id = ?').run(req.contributor.id);
  })();
  for (const f of files) fs.rm(path.join(AUDIO_DIR, path.basename(f.audio_file)), { force: true }, () => {});
  res.append('Set-Cookie', 'dc_id=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
  res.json({ ok: true });
});

app.get('/api/consigne', requireContributor, (req, res) => {
  const kind = req.query.type === 'traduire' ? 'traduire' : 'lire';
  const itemKind = kind === 'lire' ? 'voix' : 'traduction';
  const prompt = db.prepare(`SELECT p.id, p.bm, p.fr, (SELECT COUNT(*) FROM items i WHERE i.prompt_id = p.id AND i.kind = ? AND i.status != 'rejetee') AS fait
    FROM prompts p WHERE p.kind = ? AND p.id NOT IN (SELECT prompt_id FROM items WHERE contributor_id = ? AND prompt_id IS NOT NULL)
    ORDER BY fait ASC, RANDOM() LIMIT 1`).get(itemKind, kind, req.contributor.id);
  if (!prompt) return res.json({ consigne: null });
  res.json({ consigne: { id: prompt.id, bm: kind === 'lire' ? prompt.bm : null, fr: prompt.fr } });
});

app.post('/api/voix', contributeLimit, requireContributor, upload.single('audio'), (req, res) => {
  const file = req.file;
  const prompt = db.prepare("SELECT * FROM prompts WHERE id = ? AND kind = 'lire'").get(Number(req.body?.consigne));
  if (!prompt) return res.status(400).json({ error: 'Phrase introuvable. Changez de phrase et recommencez.' });
  const type = String(file?.mimetype || '').split(';')[0];
  if (!file || !AUDIO_TYPES[type] || file.size < 2000) return res.status(400).json({ error: 'Enregistrement vide ou format non pris en charge. Réessayez.' });
  const duration = Math.round(Number(req.body?.duree) || 0);
  if (duration < 700 || duration > 16000) return res.status(400).json({ error: 'L’enregistrement doit durer entre 1 et 15 secondes.' });
  const name = `${new Date().toISOString().slice(0, 10)}-${crypto.randomBytes(9).toString('hex')}.${AUDIO_TYPES[type]}`;
  fs.writeFileSync(path.join(AUDIO_DIR, name), file.buffer);
  db.prepare("INSERT INTO items (kind, contributor_id, prompt_id, bm, fr, audio_file, duration_ms, created_at) VALUES ('voix', ?, ?, ?, ?, ?, ?, ?)").run(req.contributor.id, prompt.id, prompt.bm, prompt.fr, name, duration, now());
  res.json({ ok: true });
});

app.post('/api/phrase', contributeLimit, requireContributor, (req, res) => {
  const bm = clean(req.body?.bm, 300); const fr = clean(req.body?.fr, 300);
  if (bm.length < 2) return res.status(400).json({ error: 'Écrivez une phrase en bambara.' });
  if (db.prepare("SELECT 1 FROM items WHERE kind = 'phrase' AND lower(bm) = lower(?) AND status != 'rejetee'").get(bm)) return res.status(409).json({ error: 'Cette phrase existe déjà. Proposez-en une autre.' });
  db.prepare("INSERT INTO items (kind, contributor_id, bm, fr, created_at) VALUES ('phrase', ?, ?, ?, ?)").run(req.contributor.id, bm, fr || null, now());
  res.json({ ok: true });
});

app.post('/api/traduction', contributeLimit, requireContributor, (req, res) => {
  const prompt = db.prepare("SELECT * FROM prompts WHERE id = ? AND kind = 'traduire'").get(Number(req.body?.consigne));
  const bm = clean(req.body?.bm, 300);
  if (!prompt) return res.status(400).json({ error: 'Phrase introuvable. Changez de phrase et recommencez.' });
  if (bm.length < 2) return res.status(400).json({ error: 'Écrivez la traduction en bambara.' });
  db.prepare("INSERT INTO items (kind, contributor_id, prompt_id, bm, fr, created_at) VALUES ('traduction', ?, ?, ?, ?, ?)").run(req.contributor.id, prompt.id, bm, prompt.fr, now());
  res.json({ ok: true });
});

app.get('/api/a-valider', requireContributor, (req, res) => {
  const kinds = req.query.type === 'voix' ? ['voix'] : ['phrase', 'traduction'];
  const skip = String(req.query.sauf || '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 50);
  const item = db.prepare(`SELECT id, kind, bm, fr, audio_file, duration_ms FROM items
    WHERE status = 'en_attente' AND kind IN (${kinds.map(() => '?').join(',')}) AND contributor_id != ?
    AND id NOT IN (SELECT item_id FROM votes WHERE contributor_id = ?)${skip.length ? ` AND id NOT IN (${skip.map(() => '?').join(',')})` : ''}
    ORDER BY (up + down) DESC, created_at ASC LIMIT 1`).get(...kinds, req.contributor.id, req.contributor.id, ...skip);
  if (!item) return res.json({ element: null });
  res.json({ element: { id: item.id, type: item.kind, bm: item.bm, fr: item.fr, audio: item.audio_file ? `/audio/${item.audio_file}` : null } });
});

app.post('/api/vote', contributeLimit, requireContributor, (req, res) => {
  const id = Number(req.body?.element); const value = req.body?.valeur === 1 ? 1 : req.body?.valeur === -1 ? -1 : 0;
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!item || !value) return res.status(400).json({ error: 'Vote invalide.' });
  if (item.contributor_id === req.contributor.id) return res.status(403).json({ error: 'Vous ne pouvez pas valider votre propre contribution.' });
  const done = db.transaction(() => {
    const inserted = db.prepare('INSERT OR IGNORE INTO votes (item_id, contributor_id, value, created_at) VALUES (?, ?, ?, ?)').run(id, req.contributor.id, value, now()).changes;
    if (inserted) db.prepare(`UPDATE items SET ${value === 1 ? 'up = up + 1' : 'down = down + 1'} WHERE id = ?`).run(id);
    return inserted;
  })();
  if (done) decide(id);
  res.json({ ok: true });
});

app.get('/audio/:file', requireContributor, (req, res) => {
  const name = path.basename(req.params.file);
  const file = path.join(AUDIO_DIR, name);
  if (!/^[\w-]+\.(webm|ogg|m4a|mp3|wav|aac)$/.test(name) || !fs.existsSync(file)) return res.sendStatus(404);
  res.set('Cache-Control', 'private, max-age=3600');
  res.sendFile(file);
});

function requireAdmin(req, res, next) {
  const token = String(req.get('x-admin-token') || req.query.token || '');
  if (!ADMIN_TOKEN || token.length !== ADMIN_TOKEN.length || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(ADMIN_TOKEN))) return res.status(403).json({ error: 'Accès réservé.' });
  next();
}
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
function exportCsv(req, res) {
  const all = req.query.tout === '1';
  const rows = db.prepare(`SELECT i.id, i.kind, i.bm, i.fr, i.audio_file, i.duration_ms, i.status, i.up, i.down, i.created_at, c.region, c.age_range, c.gender
    FROM items i JOIN contributors c ON c.id = i.contributor_id ${all ? '' : "WHERE i.status = 'validee'"} ORDER BY i.id`).all();
  const head = ['id', 'type', 'bambara', 'francais', 'fichier_audio', 'duree_ms', 'statut', 'votes_pour', 'votes_contre', 'date', 'region', 'age', 'genre'];
  const body = rows.map((r) => [r.id, r.kind, r.bm, r.fr, r.audio_file, r.duration_ms, r.status, r.up, r.down, r.created_at, r.region, r.age_range, r.gender].map(csvCell).join(','));
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="data-collections-${all ? 'tout' : 'validees'}-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send('﻿' + [head.join(','), ...body].join('\n'));
}
app.get('/api/admin/export.csv', requireAdmin, exportCsv);
app.get('/api/export-csv', requireAdmin, exportCsv);

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], maxAge: '1h' }));
app.use('/api', (req, res) => res.status(404).json({ error: 'Adresse inconnue.' }));
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) return res.status(413).json({ error: 'Enregistrement trop lourd. Gardez-le sous 15 secondes.' });
  console.error(error);
  res.status(500).json({ error: 'Erreur interne. Réessayez dans un instant.' });
});

app.listen(PORT, '127.0.0.1', () => console.log(`Data-Collections écoute sur le port ${PORT} (votes requis : ${VOTES}, objectif : ${OBJECTIF}).`));
