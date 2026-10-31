# Data-Collections by Minta Services

Le site **data.mintaservices.com** : la collecte de voix et de textes en bambara qui sert à entraîner Mande-IA.

## Comment la collecte se passe

1. **Le contributeur crée un profil** (onglet Compte) : un pseudo, et s'il le veut sa région, sa tranche d'âge et son genre. Il coche deux cases : il a 18 ans ou plus, et il accepte que ses contributions servent à développer Mande-IA. Pas d'e-mail ni de mot de passe : le profil est lié à son navigateur.
2. **Il contribue** de trois façons :
   - **Voix** : il lit à voix haute une phrase en bambara affichée à l'écran (1 à 15 secondes). Les phrases viennent des jeux de données de Mande-IA, puis des phrases validées par la communauté.
   - **Phrase** : il écrit une phrase naturelle en bambara, avec la traduction en français s'il peut.
   - **Traduction** : il traduit en bambara une phrase française.
3. **D'autres contributeurs valident** (onglet Valider) : ils écoutent la voix ou lisent le texte et répondent « Oui, c'est juste » ou « Non, c'est faux ». Personne ne valide sa propre contribution. Avec 2 « oui » (réglable avec `VOTES_REQUIS`), la contribution est **validée** ; avec 2 « non », elle est **rejetée**.
4. **Une phrase écrite ou traduite et validée** rejoint automatiquement la liste des phrases à lire à voix haute. La collecte de voix grandit donc toute seule.
5. **Minta Services exporte** les contributions validées en CSV, avec les fichiers audio, pour entraîner Mande-IA.
6. **Le contributeur peut tout supprimer** à tout moment depuis Compte : profil, voix, phrases et votes.

Le tableau de bord montre les chiffres réels : phrases, voix, contributions validées, contributeurs, qualité de validation et progression vers l'objectif (`OBJECTIF`). Le classement est calculé à partir des vraies contributions.

## Où sont les données

- `data/data.db` : la base SQLite (profils, contributions, votes).
- `data/audio/` : les enregistrements, environ 30 à 60 Ko chacun.

Le dossier `data/` n'est jamais envoyé sur GitHub. Sauvegardez-le avec les sauvegardes du serveur.

## Exporter le jeu de données

Dans le navigateur, en remplaçant `TOKEN` par la valeur de `ADMIN_TOKEN` du fichier `.env` :

```text
https://data.mintaservices.com/api/admin/export.csv?token=TOKEN
https://data.mintaservices.com/api/admin/export.csv?token=TOKEN&tout=1
```

La première adresse donne les contributions validées, la seconde tout (en attente et rejetées compris). Les fichiers audio sont dans `data/audio/`, sous le nom indiqué dans la colonne `fichier_audio`. Aucun pseudo n'est exporté, seulement la région, l'âge et le genre.

## Mettre en ligne sur aaPanel

On garde le site et le Node project déjà en place (`data_mintaservices_com`, dossier `/www/wwwroot/data.mintaservices.com`, port 3003) : le domaine et le certificat HTTPS ne changent pas. On remplace seulement le contenu, après une sauvegarde.

**1.** Dans aaPanel, **Website → Node.js Project → data_mintaservices_com → Stop**.

**2.** Dans le Terminal d'aaPanel :

```bash
cd /www/wwwroot/mande-ia-v2 && git pull
cd /www/wwwroot/data.mintaservices.com
mkdir -p /root/sauvegarde-data && cp -a . /root/sauvegarde-data/
rm -rf public node_modules package-lock.json yarn.lock script.js server.js1 server.js2 server.js3 server.js4 text_submissions.json metadata.json phrases.json
cp -a /www/wwwroot/mande-ia-v2/data-collections/. .
npm install --omit=dev
printf 'PORT=3003\nSESSION_SECRET=%s\nADMIN_TOKEN=%s\nVOTES_REQUIS=2\nOBJECTIF=10000\n' "$(openssl rand -hex 32)" "$(openssl rand -hex 24)" > .env
node scripts/importer-ancien.js /root/sauvegarde-data
```

La dernière commande **vérifie seulement** les anciennes données (textes, voix, phrases) et n'écrit rien. Si les nombres sont justes :

```bash
node scripts/importer-ancien.js /root/sauvegarde-data --ok
chown -R www:www /www/wwwroot/data.mintaservices.com 2>/dev/null; chmod 600 .env
```

**3.** Dans aaPanel, sur `data_mintaservices_com` : **Run opt** reste `node server.js`, **Port** `3003`, **Node** v24, **Pkg Manager** `npm`. Puis **Start**.

**4.** Ouvrez https://data.mintaservices.com.

Tout l'ancien site reste en sécurité dans `/root/sauvegarde-data/`. Les dossiers `uploads/` et `dataset/` restent aussi en place, mais ne sont plus accessibles depuis internet. Les anciennes contributions sont rangées sous « Première collecte » et attendent la validation de la communauté. Pour les marquer directement validées, ajoutez `--valider` à la commande d'import.

Mettre à jour plus tard :

```bash
cd /www/wwwroot/mande-ia-v2 && git pull && cp -a data-collections/. /www/wwwroot/data.mintaservices.com/
cd /www/wwwroot/data.mintaservices.com && npm install --omit=dev
```

Puis **Restart** du projet. Le dossier `data/` et le fichier `.env` ne sont jamais écrasés.
