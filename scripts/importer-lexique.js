#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const FICHIER = path.join(__dirname, '..', 'connaissances', 'bambara-lexique.json');

const AIDE = `Ajoute un lot de la fiche « Agent Bamanankan » au lexique de Mande-IA.

Utilisation :
  node scripts/importer-lexique.js <fichier.csv> "<nom du lot>"

Le CSV vient de Google Sheets (Fichier, Télécharger, CSV) avec les colonnes :
N°, Catégorie, English, Français, Bamanankan, Rempli par, Vérifié par, Notes

Seules les lignes avec une traduction en bamanankan ET une personne dans « Vérifié par » sont ajoutées.
Une phrase française déjà présente est mise à jour avec la nouvelle traduction.`;

function lireCsv(texte) {
  const lignes = [];
  let ligne = [];
  let champ = '';
  let guillemets = false;
  const t = texte.replace(/^﻿/, '');
  for (let i = 0; i < t.length; i += 1) {
    const c = t[i];
    if (guillemets) {
      if (c === '"' && t[i + 1] === '"') { champ += '"'; i += 1; }
      else if (c === '"') guillemets = false;
      else champ += c;
    } else if (c === '"') guillemets = true;
    else if (c === ',') { ligne.push(champ); champ = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i += 1;
      ligne.push(champ); champ = '';
      if (ligne.some((v) => v.trim())) lignes.push(ligne);
      ligne = [];
    } else champ += c;
  }
  ligne.push(champ);
  if (ligne.some((v) => v.trim())) lignes.push(ligne);
  return lignes;
}

const cle = (texte) => String(texte || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

function colonne(entetes, ...noms) {
  const cibles = noms.map(cle);
  return entetes.findIndex((e) => cibles.includes(cle(e)));
}

function main() {
  const [fichierCsv, lot] = process.argv.slice(2);
  if (!fichierCsv || !lot || fichierCsv === '--aide') { console.log(AIDE); process.exit(fichierCsv === '--aide' ? 0 : 1); }

  const [entetes, ...lignes] = lireCsv(fs.readFileSync(fichierCsv, 'utf8'));
  const i = {
    categorie: colonne(entetes, 'Catégorie', 'Categorie'),
    en: colonne(entetes, 'English', 'Anglais'),
    fr: colonne(entetes, 'Français', 'Francais'),
    bm: colonne(entetes, 'Bamanankan', 'Bambara'),
    verifie: colonne(entetes, 'Vérifié par', 'Verifie par'),
    notes: colonne(entetes, 'Notes')
  };
  for (const nom of ['fr', 'bm', 'verifie']) {
    if (i[nom] < 0) { console.error(`Colonne introuvable : ${nom}. Vérifie l'en-tête du CSV.`); process.exit(1); }
  }

  const lexique = fs.existsSync(FICHIER) ? JSON.parse(fs.readFileSync(FICHIER, 'utf8')) : [];
  const index = new Map(lexique.map((e, n) => [cle(e.fr), n]));
  const bilan = { ajoutees: 0, misesAJour: 0, sansTraduction: 0, nonVerifiees: 0 };

  for (const l of lignes) {
    const val = (k) => (i[k] >= 0 ? String(l[i[k]] || '').trim() : '');
    if (!val('fr')) continue;
    if (!val('bm')) { bilan.sansTraduction += 1; continue; }
    if (!val('verifie')) { bilan.nonVerifiees += 1; continue; }
    const entree = { categorie: val('categorie') || 'Divers', fr: val('fr'), en: val('en'), bm: val('bm'), verifie: true, source: lot };
    if (val('notes')) entree.notes = val('notes');
    const n = index.get(cle(entree.fr));
    if (n === undefined) { index.set(cle(entree.fr), lexique.length); lexique.push(entree); bilan.ajoutees += 1; }
    else { lexique[n] = entree; bilan.misesAJour += 1; }
  }

  fs.writeFileSync(FICHIER, `${JSON.stringify(lexique, null, 2)}\n`);
  const verifiees = lexique.filter((e) => e.verifie).length;
  console.log(`${lot} : ${bilan.ajoutees} phrases ajoutées, ${bilan.misesAJour} mises à jour.`);
  console.log(`Ignorées : ${bilan.sansTraduction} sans traduction, ${bilan.nonVerifiees} pas encore vérifiées.`);
  console.log(`Lexique : ${lexique.length} phrases, dont ${verifiees} vérifiées.`);
}

main();
