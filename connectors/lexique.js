const fs = require('fs');
const path = require('path');

const FICHIER = path.join(__dirname, '..', 'connaissances', 'bambara-lexique.json');
const RELIRE_MS = 60 * 1000;
const MAX = 12;
const DECLENCHEURS = /(bambara|bamanankan|bamana|traduis|tradui|traduction|translate|translation|comment (on )?dit|comment dire|en bm\b)/;
const VIDES = new Set('les des une est que qui pour avec dans sur pas mon ton son mes tes ses nous vous ils elle the and you are for with this that what how can cela ceci tres plus moi toi lui ici veux veut vais faire fais peux peut bambara bamanankan bamana traduis traduire traduction translate translation comment dit dire phrase phrases mot mots francais anglais english french say'.split(' '));

let cache = { lu: 0, entrees: [] };

const simple = (texte) => String(texte || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, ' ');
const mots = (texte) => new Set(simple(texte).split(/[^a-z0-9ɛɔɲŋ]+/).filter((m) => m.length > 2 && !VIDES.has(m)));

function entrees() {
  if (Date.now() - cache.lu < RELIRE_MS) return cache.entrees;
  let liste = [];
  try {
    liste = JSON.parse(fs.readFileSync(FICHIER, 'utf8'))
      .filter((e) => e && e.bm && (e.fr || e.en))
      .map((e) => ({ ...e, mots: mots(`${e.fr || ''} ${e.en || ''} ${e.bm}`) }));
  } catch (erreur) {
    if (erreur.code !== 'ENOENT') console.error('Lexique bambara illisible :', erreur.message);
  }
  const frequence = new Map();
  for (const e of liste) for (const m of e.mots) frequence.set(m, (frequence.get(m) || 0) + 1);
  for (const e of liste) e.poids = new Map([...e.mots].map((m) => [m, 1 / frequence.get(m)]));
  cache = { lu: Date.now(), entrees: liste };
  return liste;
}

function lexiquePour(texte, { force = false } = {}) {
  const cible = simple(texte);
  if (!cible.trim() || (!force && !DECLENCHEURS.test(cible))) return '';
  const demande = mots(cible);
  const notees = entrees()
    .map((e) => {
      let score = 0;
      for (const [m, poids] of e.poids) if (demande.has(m)) score += poids;
      return { e, score: score * (e.verifie ? 1.5 : 1) };
    })
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score);
  const seuil = notees.length ? notees[0].score / 3 : 0;
  const trouvees = notees.filter((t) => t.score >= seuil).slice(0, MAX);
  const lignes = trouvees.map(({ e }) => `- ${e.fr || e.en} = ${e.bm}${e.en && e.fr ? ` (en anglais : ${e.en})` : ''}${e.notes ? ` (note : ${e.notes})` : ''}${e.verifie ? ' [vérifiée]' : ' [exemple]'}`);
  return [
    'Bamanankan : écris avec l’orthographe officielle (ɛ, ɔ, ɲ, ŋ). Si tu n’es pas sûr d’une traduction, dis-le et propose une formulation simple.',
    lignes.length ? 'Phrases de référence de Minta Services. Une phrase [vérifiée] a été relue par deux locuteurs : reprends-la telle quelle. Un [exemple] peut varier selon les régions.' : '',
    lignes.join('\n')
  ].filter(Boolean).join('\n');
}

function statsLexique() {
  const liste = entrees();
  return { total: liste.length, verifiees: liste.filter((e) => e.verifie).length };
}

module.exports = { lexiquePour, statsLexique };
