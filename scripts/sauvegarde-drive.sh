#!/usr/bin/env bash
# Relie le serveur à Google Drive pour les sauvegardes chiffrées (à lancer une seule fois, en root).
set -euo pipefail

if ! command -v rclone >/dev/null; then
  echo "Installez d'abord rclone : apt install -y rclone"
  exit 1
fi

conf=$(rclone config file | tail -n 1)
mkdir -p "$(dirname "$conf")"
if [ -f "$conf" ]; then cp "$conf" "$conf.avant-$(date +%F-%H%M)"; fi

echo "Collez le jeton affiché sur l'ordinateur (la ligne qui commence par { ), puis Entrée."
echo "Rien ne s'affiche pendant que vous collez : c'est normal."
read -rs jeton
echo
case "$jeton" in
  \{*refresh_token*\}) ;;
  *) echo "Ce n'est pas un jeton Google Drive. Recommencez avec la ligne entre les flèches."; exit 1 ;;
esac

read -rsp "Choisissez le mot de passe des sauvegardes (12 caractères minimum) : " mot1; echo
read -rsp "Retapez-le : " mot2; echo
if [ "$mot1" != "$mot2" ]; then echo "Les deux mots de passe sont différents. Recommencez."; exit 1; fi
if [ ${#mot1} -lt 12 ]; then echo "Le mot de passe doit avoir au moins 12 caractères."; exit 1; fi
obscur=$(printf '%s' "$mot1" | rclone obscure -)
unset mot1 mot2

for nom in gdrive sauvegarde; do
  if rclone listremotes | grep -qx "$nom:"; then rclone config delete "$nom"; fi
done

umask 077
cat >> "$conf" <<EOF

[gdrive]
type = drive
scope = drive.file
token = $jeton

[sauvegarde]
type = crypt
remote = gdrive:MintaServices-sauvegardes
password = $obscur
EOF
unset jeton obscur
chmod 600 "$conf"

if printf 'ok' | rclone rcat sauvegarde:test.txt && [ "$(rclone cat sauvegarde:test.txt)" = ok ]; then
  rclone deletefile sauvegarde:test.txt
  echo "Google Drive est prêt. Les sauvegardes iront, chiffrées, dans le dossier MintaServices-sauvegardes."
else
  echo "Google Drive ne répond pas. Le jeton a peut-être expiré : refaites l'autorisation sur l'ordinateur."
  exit 1
fi
