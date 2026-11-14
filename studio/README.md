# Studio Live by Minta Services

Le site **studio.mintaservices.com** : OBS envoie **un seul direct** au serveur, et le serveur le renvoie en même temps vers Facebook, YouTube, TikTok et toute plateforme qui accepte le RTMP.

Avec une connexion du Mali, on n'envoie donc la vidéo qu'une fois. C'est le serveur, avec sa connexion rapide, qui fait les copies.

## Comment ça marche

1. **OBS** envoie le direct au serveur sur le port 1935, avec une clé secrète (`STUDIO_CLE_OBS`). Un flux sans la bonne clé est refusé.
2. **Le tableau de bord** (protégé par mot de passe) montre le signal reçu et la liste des destinations.
3. Pour chaque destination « lancée », le serveur recopie le direct avec `ffmpeg`, sans le réencoder : le processeur du serveur travaille très peu.
4. Si OBS se déconnecte et revient dans les 30 secondes, le direct continue. Si une plateforme coupe, l'envoi reprend tout seul.
5. Sans signal pendant 10 minutes, toutes les destinations repassent sur « Arrêté » : aucun direct ne part par surprise le lendemain.

Les clés de stream ne s'affichent jamais dans le tableau de bord, seulement leurs 4 derniers caractères. Elles sont enregistrées dans `data/destinations.json`, qui n'est jamais envoyé sur GitHub.

## Installation sur le serveur (aaPanel)

1. **DNS** : chez Namecheap, un enregistrement A `studio` vers l'adresse du serveur.
2. **ffmpeg** : dans le terminal du serveur.

```bash
apt install -y ffmpeg
```

3. **Le code** : copier le dossier `studio/` du dépôt.

```bash
cd /www/wwwroot/mande-ia-v2 && git pull
mkdir -p /www/wwwroot/studio.mintaservices.com
cp -a studio/. /www/wwwroot/studio.mintaservices.com/
cd /www/wwwroot/studio.mintaservices.com && npm install --omit=dev
```

4. **Le fichier .env** : le créer à partir du modèle, puis remplir les trois secrets.

```bash
cp .env.example .env && chmod 600 .env
openssl rand -hex 32
openssl rand -hex 16
nano .env
```

Le premier résultat va dans `SESSION_SECRET`, le second dans `STUDIO_CLE_OBS`. `STUDIO_MOT_DE_PASSE` est un mot de passe de 12 caractères au minimum, créé dans Bitwarden.

5. **aaPanel, Website, Node project, Add** : dossier `/www/wwwroot/studio.mintaservices.com`, fichier `server.js`, port `3004`, Node 20 ou plus, domaine `studio.mintaservices.com`. Puis SSL : Let's Encrypt et « Force HTTPS ».
6. **Ouvrir le port 1935** (TCP) : dans aaPanel, Security ; et dans le pare-feu DigitalOcean s'il y en a un sur le Droplet.

## Réglages d'OBS

Paramètres, Stream :

- Service : Personnalisé
- Serveur : `rtmp://studio.mintaservices.com:1935/live`
- Clé de stream : bouton « Copier la clé » du tableau de bord

Paramètres, Sortie : 1280 × 720, 30 images par seconde, 2500 kbps, image clé toutes les 2 secondes, audio 128 kbps. Toutes les plateformes reçoivent exactement ce qu'OBS envoie.

## Les clés de chaque plateforme

- **Facebook** : Live Producer, « Logiciel de streaming ». Cocher « Clé de stream persistante » pour garder la même clé.
- **YouTube** : YouTube Studio, Passer au direct, onglet Flux.
- **TikTok** : l'adresse du serveur et la clé changent à chaque live. Les coller dans le tableau de bord avant chaque direct.

## Mettre à jour

```bash
cd /www/wwwroot/mande-ia-v2 && git pull
cp -a studio/. /www/wwwroot/studio.mintaservices.com/
cd /www/wwwroot/studio.mintaservices.com && npm install --omit=dev
```

Puis redémarrer le projet Node dans aaPanel. Le fichier `.env` et le dossier `data/` ne sont pas touchés.

## Limites

- Entre OBS et le serveur, le flux n'est pas chiffré (RTMP simple) : la clé `STUDIO_CLE_OBS` peut se changer à tout moment dans `.env`.
- Le serveur recopie le direct sans le transformer : une image horizontale reste horizontale sur TikTok.
