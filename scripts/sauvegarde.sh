#!/usr/bin/env bash
# Sauvegarde quotidienne : bases Mande-IA et Data-Collections, fichiers .env, voix.
# Copie locale dans /root/sauvegardes, puis envoi chiffré sur Google Drive si rclone est configuré.
set -euo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

MANDE_DIR=${MANDE_DIR:-/www/wwwroot/mande-ia-v2}
DATA_SITE=${DATA_SITE:-/www/wwwroot/data.mintaservices.com}
LOCAL_DIR=${SAUVEGARDE_DIR:-/root/sauvegardes}
REMOTE=${SAUVEGARDE_REMOTE:-sauvegarde}
GARDER_LOCAL=${GARDER_LOCAL:-7}
GARDER_DRIVE=${GARDER_DRIVE:-60}
APP_USER=${APP_USER:-www}

copie_base() {
  local cmd=(python3 - "$1" "$2")
  if [ "$(id -un)" != "$APP_USER" ]; then cmd=(sudo -u "$APP_USER" "${cmd[@]}"); fi
  "${cmd[@]}" <<'PY'
import sqlite3, sys
source = sqlite3.connect(f"file:{sys.argv[1]}?mode=ro", uri=True)
copie = sqlite3.connect(sys.argv[2])
source.backup(copie)
source.close()
copie.execute("PRAGMA journal_mode=DELETE")
etat = copie.execute("PRAGMA quick_check").fetchone()[0]
copie.close()
if etat != "ok":
    sys.exit(f"Copie de {sys.argv[1]} abîmée : {etat}")
PY
}

jour=$(date +%F)
travail=$(mktemp -d)
trap 'rm -rf "$travail"' EXIT
chmod 711 "$travail"
install -d -o "$APP_USER" -g "$APP_USER" "$travail/mande-ia" "$travail/data-collections"

if [ -f "$MANDE_DIR/data/mande-ia.db" ]; then copie_base "$MANDE_DIR/data/mande-ia.db" "$travail/mande-ia/mande-ia.db"; fi
if [ -f "$DATA_SITE/data/data.db" ]; then copie_base "$DATA_SITE/data/data.db" "$travail/data-collections/data.db"; fi
if [ -f "$MANDE_DIR/.env" ]; then cp "$MANDE_DIR/.env" "$travail/mande-ia/env"; fi
if [ -f "$DATA_SITE/.env" ]; then cp "$DATA_SITE/.env" "$travail/data-collections/env"; fi

mkdir -p "$LOCAL_DIR"
chmod 700 "$LOCAL_DIR"
archive="$LOCAL_DIR/minta-$jour.tar.gz"
tar -czf "$archive" -C "$travail" .
chmod 600 "$archive"
ls -1t "$LOCAL_DIR"/minta-*.tar.gz | tail -n +$((GARDER_LOCAL + 1)) | xargs -r rm -f
echo "Copie locale : $archive ($(du -h "$archive" | cut -f1))"

if ! command -v rclone >/dev/null || ! rclone listremotes | grep -qx "$REMOTE:"; then
  echo "Google Drive n'est pas encore configuré : seule la copie locale est faite."
  exit 0
fi
rclone copy "$archive" "$REMOTE:bases"
if [ -d "$DATA_SITE/data/audio" ]; then rclone copy "$DATA_SITE/data/audio" "$REMOTE:voix"; fi
rclone delete --min-age "${GARDER_DRIVE}d" "$REMOTE:bases"
echo "Envoyé sur Google Drive, chiffré : bases du $jour et nouvelles voix."
