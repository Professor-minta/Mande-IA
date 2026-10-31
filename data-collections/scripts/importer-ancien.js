#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { openDb, now, AUDIO_DIR } = require('../lib/db');

const args = process.argv.slice(2);
const source = args.find((a) => !a.startsWith('--'));
const write = args.includes('--ok');
const validate = args.includes('--valider');
if (!source || !fs.existsSync(source)) {
  console.log('Usage : node scripts/importer-ancien.js /root/sauvegarde-data          (vérification, rien n’est écrit)');
  console.log('        node scripts/importer-ancien.js /root/sauvegarde-data --ok     (import)');
  console.log('        ajoutez --valider pour marquer les anciennes contributions comme déjà validées');
  process.exit(1);
}

const LEGACY_ID = 'premiere-collecte';
const AUDIO_EXT = { '.webm': 'webm', '.weba': 'webm', '.ogg': 'ogg', '.oga': 'ogg', '.opus': 'ogg', '.wav': 'wav', '.mp3': 'mp3', '.m4a': 'm4a', '.mp4': 'm4a', '.aac': 'aac' };
const SKIP_DIRS = new Set(['node_modules', 'public', '.well-known', '.git', 'data']);
const sha1 = (value) => crypto.createHash('sha1').update(value).digest('hex');
const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const first = (obj, keys) => { for (const k of keys) if (obj && obj[k] != null && clean(obj[k])) return clean(obj[k]); return ''; };
const BM_KEYS = ['bambara', 'bm', 'bamanankan', 'text_bm', 'texte_bm', 'phrase_bm', 'texte', 'text', 'phrase', 'sentence', 'prompt', 'transcription'];
const FR_KEYS = ['french', 'fr', 'francais', 'français', 'traduction', 'translation', 'text_fr', 'texte_fr'];
const FILE_KEYS = ['file', 'filename', 'fileName', 'audio', 'audioFile', 'audio_file', 'path', 'fichier', 'voice', 'url'];
const TIME_KEYS = ['time', 'date', 'timestamp', 'created_at', 'createdAt', 'uploadedAt'];

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}
function records(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    for (const key of ['data', 'items', 'submissions', 'recordings', 'voices', 'texts', 'phrases']) if (Array.isArray(data[key])) return data[key];
    return Object.entries(data).map(([k, v]) => (v && typeof v === 'object' ? { file: k, ...v } : { file: k, text: v }));
  }
  return [];
}
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (!SKIP_DIRS.has(entry.name)) walk(full, out); }
    else out.push(full);
  }
  return out;
}
const isoTime = (v) => { const d = new Date(/^\d{10,13}$/.test(String(v)) ? Number(String(v).length === 10 ? v * 1000 : v) : v); return Number.isNaN(d.getTime()) ? now() : d.toISOString(); };

const files = walk(source);
const audioFiles = files.filter((f) => AUDIO_EXT[path.extname(f).toLowerCase()]);
const jsonFiles = files.filter((f) => path.extname(f).toLowerCase() === '.json' && !/package(-lock)?\.json$/.test(f));
const byName = new Map(audioFiles.map((f) => [path.basename(f), f]));

const texts = [];
const voices = [];
const prompts = [];
for (const jf of jsonFiles) {
  const list = records(readJson(jf));
  for (const r of list) {
    if (typeof r === 'string') { if (/phrase/i.test(path.basename(jf))) prompts.push({ bm: clean(r), fr: '' }); continue; }
    const fileRef = first(r, FILE_KEYS);
    const bm = first(r, BM_KEYS);
    const fr = first(r, FR_KEYS);
    const time = first(r, TIME_KEYS);
    const refName = path.basename(fileRef.split('?')[0]);
    const stem = refName && !AUDIO_EXT[path.extname(refName).toLowerCase()] ? audioFiles.find((f) => path.basename(f).startsWith(`${refName}.`)) : null;
    if (fileRef && (AUDIO_EXT[path.extname(refName).toLowerCase()] || stem)) {
      const found = stem || byName.get(refName);
      voices.push({ file: found || null, ref: fileRef, bm, fr, time });
    } else if (/phrase/i.test(path.basename(jf)) && bm && !time) prompts.push({ bm, fr });
    else if (bm) texts.push({ bm, fr, time });
  }
}
const referenced = new Set(voices.map((v) => v.file).filter(Boolean));
for (const f of audioFiles) if (!referenced.has(f)) voices.push({ file: f, ref: path.relative(source, f), bm: '', fr: '', time: fs.statSync(f).mtime.toISOString() });

const missing = voices.filter((v) => !v.file);
console.log(`\nDossier analysé : ${source}`);
console.log(`  Fichiers JSON lus    : ${jsonFiles.map((f) => path.relative(source, f)).join(', ') || 'aucun'}`);
console.log(`  Textes trouvés       : ${texts.length}`);
console.log(`  Voix trouvées        : ${voices.length - missing.length} (dont ${voices.filter((v) => v.file && v.bm).length} avec leur phrase)`);
if (missing.length) console.log(`  Voix introuvables    : ${missing.length} (fichier absent : ${missing.slice(0, 3).map((v) => v.ref).join(', ')}${missing.length > 3 ? '…' : ''})`);
console.log(`  Phrases à lire       : ${prompts.length}`);
for (const t of texts.slice(0, 3)) console.log(`    exemple texte : « ${t.bm} »${t.fr ? ` = « ${t.fr} »` : ''}`);
for (const v of voices.filter((x) => x.file).slice(0, 3)) console.log(`    exemple voix  : ${path.basename(v.file)}${v.bm ? ` « ${v.bm} »` : ''}`);
console.log('  Les noms des anciens contributeurs ne sont pas importés : tout est rangé sous « Première collecte ».');

if (!write) { console.log('\nVérification seulement. Si tout est juste, relancez avec --ok pour importer.\n'); process.exit(0); }

const db = openDb({ quiet: true });
const status = validate ? 'validee' : 'en_attente';
const seen = db.prepare('SELECT 1 FROM imports WHERE hash = ?');
const mark = db.prepare('INSERT INTO imports (hash, item_id, created_at) VALUES (?, ?, ?)');
const insertItem = db.prepare('INSERT INTO items (kind, contributor_id, bm, fr, audio_file, status, created_at, decided_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
const insertPrompt = db.prepare("INSERT OR IGNORE INTO prompts (kind, bm, fr, source, created_at) VALUES ('lire', ?, ?, 'premiere-collecte', ?)");
const result = { textes: 0, voix: 0, phrases: 0, deja: 0 };

db.transaction(() => {
  db.prepare("INSERT OR IGNORE INTO contributors (id, pseudo, consent_at, created_at) VALUES (?, 'Première collecte', ?, ?)").run(LEGACY_ID, now(), now());
  for (const t of texts) {
    const hash = sha1(`t:${t.bm.toLowerCase()}|${t.fr.toLowerCase()}`);
    if (seen.get(hash)) { result.deja++; continue; }
    const id = insertItem.run('phrase', LEGACY_ID, t.bm.slice(0, 300), t.fr.slice(0, 300) || null, null, status, isoTime(t.time), validate ? now() : null).lastInsertRowid;
    mark.run(hash, id, now()); result.textes++;
    if (validate) result.phrases += insertPrompt.run(t.bm.slice(0, 300), t.fr.slice(0, 300) || null, now()).changes;
  }
  for (const v of voices.filter((x) => x.file)) {
    const buffer = fs.readFileSync(v.file);
    if (buffer.length < 1000) continue;
    const hash = sha1(buffer);
    if (seen.get(hash)) { result.deja++; continue; }
    const name = `ancien-${hash.slice(0, 16)}.${AUDIO_EXT[path.extname(v.file).toLowerCase()]}`;
    fs.writeFileSync(path.join(AUDIO_DIR, name), buffer);
    const id = insertItem.run('voix', LEGACY_ID, v.bm.slice(0, 300) || null, v.fr.slice(0, 300) || null, name, status, isoTime(v.time), validate ? now() : null).lastInsertRowid;
    mark.run(hash, id, now()); result.voix++;
  }
  for (const p of prompts) if (p.bm) result.phrases += insertPrompt.run(p.bm.slice(0, 300), p.fr.slice(0, 300) || null, now()).changes;
})();

console.log(`\nImport terminé : ${result.textes} textes, ${result.voix} voix, ${result.phrases} phrases à lire ajoutées${result.deja ? `, ${result.deja} déjà importés (ignorés)` : ''}.`);
console.log(validate ? 'Les anciennes contributions sont marquées validées.\n' : 'Les anciennes contributions attendent la validation de la communauté (onglet Valider).\n');
