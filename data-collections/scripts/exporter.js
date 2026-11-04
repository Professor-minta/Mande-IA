#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { openDb, DATA_DIR, AUDIO_DIR, ROOT } = require('../lib/db');
require('dotenv').config({ path: path.join(ROOT, '.env'), quiet: true });
const VOTES = Math.max(1, Number(process.env.VOTES_REQUIS) || 2);

const args = process.argv.slice(2);
if (args.includes('--aide') || args.includes('--help')) {
  console.log('Usage : node scripts/exporter.js                    exporte les contributions validées dans data/exports/AAAA-MM-JJ');
  console.log('        node scripts/exporter.js /chemin/dossier    exporte dans ce dossier');
  console.log('        ajoutez --sans-conversion pour garder le format audio d’origine (sinon WAV 16 kHz mono avec ffmpeg)');
  process.exit(0);
}

const jour = new Date().toISOString().slice(0, 10);
const sortie = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(DATA_DIR, 'exports', jour));
const conversion = !args.includes('--sans-conversion') && (() => {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; }
})();

const db = openDb({ quiet: true });
const locuteur = (id) => crypto.createHash('sha256').update(`minta-locuteur:${id}`).digest('hex').slice(0, 10);
const cellule = (valeur) => {
  const texte = String(valeur ?? '');
  return /[",\n\r]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
};
const ecrireCsv = (fichier, tete, lignes) => fs.writeFileSync(fichier, [tete, ...lignes].map((l) => l.map(cellule).join(',')).join('\n') + '\n');

if (fs.existsSync(sortie) && fs.readdirSync(sortie).length) {
  const carte = path.join(sortie, 'README.md');
  if (!fs.existsSync(carte) || !fs.readFileSync(carte, 'utf8').includes('# Data-Collections by Minta Services')) {
    console.error(`Le dossier ${sortie} existe et n’est pas un export de Data-Collections : choisissez un dossier vide.`);
    process.exit(1);
  }
  fs.rmSync(sortie, { recursive: true, force: true });
}
fs.mkdirSync(path.join(sortie, 'voix', 'audio'), { recursive: true });

const voix = db.prepare(`SELECT i.id, i.bm, i.fr, i.audio_file, i.duration_ms, i.contributor_id, c.region, c.age_range, c.gender
  FROM items i JOIN contributors c ON c.id = i.contributor_id
  WHERE i.kind = 'voix' AND i.status = 'validee' AND i.audio_file IS NOT NULL ORDER BY i.id`).all();

const lignesVoix = [];
let manquants = 0;
let illisibles = 0;
for (const v of voix) {
  const source = path.join(AUDIO_DIR, path.basename(v.audio_file));
  if (!fs.existsSync(source)) { manquants += 1; continue; }
  const nom = `${String(v.id).padStart(6, '0')}.${conversion ? 'wav' : path.extname(source).slice(1)}`;
  const cible = path.join(sortie, 'voix', 'audio', nom);
  if (conversion) {
    try { execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', source, '-ac', '1', '-ar', '16000', '-sample_fmt', 's16', cible], { stdio: 'ignore' }); }
    catch { illisibles += 1; fs.rmSync(cible, { force: true }); continue; }
  } else fs.copyFileSync(source, cible);
  lignesVoix.push([`audio/${nom}`, v.bm, v.fr, v.duration_ms, locuteur(v.contributor_id), v.region, v.age_range, v.gender, v.id]);
}
ecrireCsv(path.join(sortie, 'voix', 'metadata.csv'), ['file_name', 'bambara', 'francais', 'duree_ms', 'locuteur', 'region', 'age', 'genre', 'id'], lignesVoix);

const textes = db.prepare(`SELECT i.id, i.kind, i.bm, i.fr, i.contributor_id, c.region, c.age_range, c.gender
  FROM items i JOIN contributors c ON c.id = i.contributor_id
  WHERE i.kind IN ('phrase', 'traduction') AND i.status = 'validee' ORDER BY i.id`).all();
ecrireCsv(path.join(sortie, 'textes.csv'), ['id', 'type', 'bambara', 'francais', 'auteur', 'region', 'age', 'genre'],
  textes.map((t) => [t.id, t.kind, t.bm, t.fr, locuteur(t.contributor_id), t.region, t.age_range, t.gender]));

const secondes = Math.round(lignesVoix.reduce((total, l) => total + (Number(l[3]) || 0), 0) / 1000);
const locuteurs = new Set(lignesVoix.map((l) => l[4])).size;
fs.writeFileSync(path.join(sortie, 'README.md'), `---
language:
- bm
- fr
pretty_name: Data-Collections by Minta Services
task_categories:
- automatic-speech-recognition
- text-to-speech
- translation
configs:
- config_name: voix
  data_dir: voix
- config_name: textes
  data_files: textes.csv
---

# Data-Collections by Minta Services

Voix et textes en bambara collectés sur https://data.mintaservices.com et validés par la communauté (${VOTES} vote${VOTES > 1 ? 's' : ''} « oui » au moins, jamais par leur auteur). Export du ${jour}.

| Partie | Contenu |
|---|---|
| voix | ${lignesVoix.length} enregistrements (${Math.floor(secondes / 60)} min ${secondes % 60} s), ${locuteurs} locuteurs${conversion ? ', WAV 16 kHz mono' : ''} |
| textes | ${textes.length} phrases et traductions bambara-français |

Colonnes : \`bambara\` est le texte lu ou écrit, \`francais\` sa traduction quand elle existe. \`locuteur\` et \`auteur\` sont des codes anonymes : le même code désigne la même personne, sans révéler son pseudo. \`region\`, \`age\` et \`genre\` sont déclarés librement par le contributeur, et souvent vides.

## Consentement et usage

Chaque contributeur a 18 ans ou plus et a accepté que ses enregistrements et ses textes soient utilisés par Minta Services pour développer Mande-IA et des outils en langues africaines. Il peut tout supprimer à tout moment : chaque nouvel export retire ses contributions.

Jeu de données privé de Minta Services. Ne pas le rendre public ni le partager sans l'accord de Minta Services.
`);

console.log(`Export terminé : ${sortie}`);
console.log(`  voix : ${lignesVoix.length} (${Math.floor(secondes / 60)} min ${secondes % 60} s, ${locuteurs} locuteurs)${conversion ? ', converties en WAV 16 kHz mono' : ', format d’origine'}`);
console.log(`  textes : ${textes.length}`);
if (!conversion && !args.includes('--sans-conversion')) console.log('  ffmpeg est absent : installez-le (apt install -y ffmpeg) pour obtenir des WAV prêts pour l’entraînement.');
if (manquants) console.log(`  ${manquants} enregistrement(s) validé(s) sans fichier audio, ignoré(s).`);
if (illisibles) console.log(`  ${illisibles} enregistrement(s) illisible(s), ignoré(s).`);
