#!/bin/bash
# Range dans /root tous les fichiers du dossier Mande-IA qui ne sont pas sur GitHub.
# Garde : .env, data/ (comptes et conversations), node_modules/.
set -e
cd "$(dirname "$0")/.."
DEST="/root/mande-ia-ranges-$(date +%Y%m%d-%H%M)"
FICHIERS=()
while IFS= read -r -d '' f; do
  case "$f" in .env|data/|node_modules/) continue ;; esac
  FICHIERS+=("${f%/}")
done < <(git ls-files -z --others --directory)
if [ ${#FICHIERS[@]} -eq 0 ]; then echo "Rien à ranger : le dossier est déjà propre."; exit 0; fi
echo "Ces fichiers ne sont pas sur GitHub :"
printf '  %s\n' "${FICHIERS[@]}"
read -r -p "Les ranger dans $DEST ? Tapez oui pour confirmer : " REPONSE
if [ "$REPONSE" != "oui" ]; then echo "Rien n'a été déplacé."; exit 0; fi
for f in "${FICHIERS[@]}"; do
  mkdir -p "$DEST/$(dirname "$f")"
  mv "$f" "$DEST/$f"
done
echo "Terminé. Fichiers rangés dans $DEST."
echo "Restent seulement les fichiers de GitHub, plus .env, data/ et node_modules/."
