# Les dossiers vérifiés de Mande-IA

Un fichier `.md` par sujet. Quand une question contient l'un des mots-clés du fichier, Mande-IA lit le dossier avant de répondre : dans le chat, sur WhatsApp et chez les agents du mode scène.

## Les dossiers

- `kurukan-fuga.md` : Kurukan Fuga, la Charte du Manden et l'Empire du Mali.
- `mansa-moussa.md` : Mansa Moussa et Aboubakar II.
- `minta-services.md` : Minta Services, Minta Academy, Data-Collections, Minta Entrepreneurship et Mande-IA (services, prix, adresses).
- `minta-academy.md` : Minta Academy en détail, pour l'agent Formateur : les 10 modules, les règles de sécurité, le projet final, la formation à Bamako et l'aide aux élèves bloqués.

## Ajouter un dossier

1. Crée un fichier, par exemple `empire-songhai.md`, dans ce dossier.
2. Commence-le par cet en-tête :

```
---
titre: L'Empire songhaï
mots: songhai, songhay, gao, askia, sonni ali, tombouctou
source: lien vers le document d'origine
---
```

3. Écris ensuite les faits vérifiés, en phrases courtes, avec les dates et les sources. 2 à 6 pages au plus.
4. Fais une PR. Après `git pull` sur le serveur, Mande-IA l'utilise dans la minute.

## Les règles

- Les mots-clés sont séparés par des virgules. Les accents et les majuscules ne comptent pas.
- Évite les mots trop courts ou trop courants : « mande » toucherait chaque message qui cite Mande-IA.
- Que des faits vérifiés : Mande-IA les répète tels quels.
- Pas de clé, de mot de passe ni de numéro privé.

## Le lexique bambara

`bambara-lexique.json` contient des phrases en français, en anglais et en bamanankan. L'agent Bambara du mode scène le lit à chaque demande, et le chat et WhatsApp le lisent quand on demande une traduction. Mande-IA reprend telles quelles les phrases marquées vérifiées.

Les phrases vérifiées viennent des fiches du dossier Google Drive « Agent Bamanankan (Mande-IA) », remplies et relues par deux personnes. Pour ajouter un lot terminé :

1. Dans Google Sheets : Fichier, Télécharger, Valeurs séparées par des virgules (.csv).
2. `node scripts/importer-lexique.js lot-1.csv "Lot 1"`
3. Fais une PR avec le fichier `bambara-lexique.json` mis à jour.

Seules les lignes avec une traduction et une personne dans « Vérifié par » sont ajoutées.
