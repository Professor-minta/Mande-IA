const fs = require('fs');
const path = require('path');

const DOSSIER = path.join(__dirname, '..', 'connaissances');
const LIMITE = 12000;
const RELIRE_MS = 60 * 1000;

let cache = { lu: 0, fiches: [] };

const simple = (texte) => String(texte || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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
  return { titre: meta.titre || nom, corps: morceaux[2].trim(), mots, motifs: mots.map((m) => new RegExp(`(^|[^a-z0-9])${echapper(m)}`)) };
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
  const trouvees = fiches()
    .map((f) => ({ f, score: f.motifs.filter((motif) => motif.test(cible)).length }))
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!trouvees.length) return '';
  const blocs = [];
  let taille = 0;
  for (const { f } of trouvees) {
    const bloc = `### ${f.titre}\n${f.corps}`;
    if (blocs.length && taille + bloc.length > LIMITE) break;
    blocs.push(bloc.slice(0, LIMITE));
    taille += bloc.length;
  }
  const corps = blocs.join('\n\n');
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

function dossiersVerifies() {
  return fiches().map((f) => ({ titre: f.titre, corps: f.corps, motifs: f.motifs }));
}

module.exports = { connaissancesPour, derniereQuestion, dossiersVerifies };
