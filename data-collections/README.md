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

Le code arrive avec Mande-IA, dans `/www/wwwroot/mande-ia-v2/data-collections`.

```bash
cd /www/wwwroot/mande-ia-v2 && git pull
cd data-collections && npm install --omit=dev
cp .env.example .env && nano .env
chown -R www:www /www/wwwroot/mande-ia-v2/data-collections && chmod 600 .env
```

Dans `.env`, collez le résultat de `openssl rand -hex 32` dans `SESSION_SECRET` et celui de `openssl rand -hex 24` dans `ADMIN_TOKEN`.

Puis dans aaPanel, **Website → Node project → Add Node project** :

| Réglage | Valeur |
|---|---|
| Path | `/www/wwwroot/mande-ia-v2/data-collections` |
| Run opt | `start` |
| Port | `3002` |
| User | `www` |
| Domaine | `data.mintaservices.com`, puis SSL Let's Encrypt |

Si `data.mintaservices.com` est déjà attribué à l'ancien site, retirez d'abord le domaine de l'ancien site (ou arrêtez l'ancien projet), après avoir sauvegardé son dossier.
