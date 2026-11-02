const fs = require('fs');
const path = require('path');

const DOSSIER = path.join(__dirname, '..', 'connaissances');
const LIMITE = 9000;
const RELIRE_MS = 60 * 1000;

let cache = { lu: 0, fiches: [] };

const simple = (texte) => String(texte || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const echapper = (texte) => texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function lireFiche(nom) {
  const brut = fs.readFileSync(path.join(DOSSIER, nom), 'utf8').replace(/\r\n/g, '\n');
  const morceaux = brut.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!morceaux) return null;
  const meta = {};
  for (const ligne of morceaux[1].split('\n')) {
    const i = ligne.indexOf(':');
    if (i > 0) meta[ligne.slice(0, i).trim()] = ligne.slice(i + 1).trim();
  }
  const mots = String(meta.mots || '').split(',').map((m) => simple(m).trim()).filter(Boolean);
  if (!mots.length) return null;
  return { titre: meta.titre || nom, corps: morceaux[2].trim(), motifs: mots.map((m) => new RegExp(`(^|[^a-z0-9])${echapper(m)}`)) };
}

function fiches() {
  if (Date.now() - cache.lu < RELIRE_MS) return cache.fiches;
  let liste = [];
  try {
    liste = fs.readdirSync(DOSSIER).filter((nom) => nom.endsWith('.md') && nom !== 'README.md').sort().map((nom) => {
      try { return lireFiche(nom); } catch (erreur) { console.error(`Connaissance ${nom} illisible :`, erreur.message); return null; }
    }).filter(Boolean);
  } catch {}
  cache = { lu: Date.now(), fiches: liste };
  return liste;
}

function connaissancesPour(texte) {
  const cible = simple(texte);
  if (!cible.trim()) return '';
  const trouvees = fiches().filter((f) => f.motifs.some((motif) => motif.test(cible)));
  if (!trouvees.length) return '';
  const corps = trouvees.map((f) => `### ${f.titre}\n${f.corps}`).join('\n\n').slice(0, LIMITE);
  return [
    'Dossier vérifié par Minta Services sur le sujet de la question. Appuie-toi d’abord sur lui.',
    'Pour les faits anciens, dis « selon la tradition orale ». N’ajoute aucun fait, aucune date ni aucune citation qui n’y figure pas.',
    corps
  ].join('\n\n');
}

function derniereQuestion(messages) {
  const dernier = [...(messages || [])].reverse().find((m) => m?.role === 'user');
  if (!dernier) return '';
  if (typeof dernier.content === 'string') return dernier.content;
  return (Array.isArray(dernier.content) ? dernier.content : []).filter((b) => b?.type === 'text').map((b) => b.text).join(' ');
}

module.exports = { connaissancesPour, derniereQuestion };
