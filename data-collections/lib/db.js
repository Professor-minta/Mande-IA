const fs = require('fs');
const path = require('path');

let Database;
try { Database = require('better-sqlite3'); }
catch (error) {
  if (error.code !== 'ERR_DLOPEN_FAILED' && error.code !== 'MODULE_NOT_FOUND') throw error;
  console.error(`Dépendances absentes ou installées avec une autre version de Node que ${process.version}. Dans le dossier du site, lancez « rm -rf node_modules && npm install --omit=dev », puis redémarrez.`);
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const AUDIO_DIR = path.join(DATA_DIR, 'audio');
const now = () => new Date().toISOString();

function openDb({ quiet = false } = {}) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  let db;
  try { db = new Database(path.join(DATA_DIR, 'data.db')); }
  catch (error) {
    if (!/bindings|\.node|ERR_DLOPEN_FAILED/.test(`${error.code} ${error.message}`)) throw error;
    console.error('SQLite n’est pas construit pour ce serveur. Dans le dossier du site, lancez :\n  npm install-scripts approve better-sqlite3   (ou : npm approve-scripts better-sqlite3)\n  npm rebuild better-sqlite3\npuis relancez.');
    process.exit(1);
  }
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
CREATE TABLE IF NOT EXISTS imports (hash TEXT PRIMARY KEY, item_id INTEGER, created_at TEXT NOT NULL);
`);
  const file = path.join(ROOT, 'seeds', 'phrases.json');
  if (fs.existsSync(file)) {
    const seeds = JSON.parse(fs.readFileSync(file, 'utf8'));
    const insert = db.prepare('INSERT OR IGNORE INTO prompts (kind, bm, fr, source, created_at) VALUES (?, ?, ?, ?, ?)');
    const added = db.transaction(() => {
      let n = 0;
      for (const p of seeds.lire || []) n += insert.run('lire', p.bm, p.fr || null, p.source || 'seed', now()).changes;
      for (const p of seeds.traduire || []) n += insert.run('traduire', null, p.fr, p.source || 'seed', now()).changes;
      return n;
    })();
    if (added && !quiet) console.log(`Data-Collections : ${added} phrases de départ ajoutées.`);
  }
  return db;
}

module.exports = { openDb, now, DATA_DIR, AUDIO_DIR, ROOT };
