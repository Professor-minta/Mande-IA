# Mande-IA

**Assistant IA centré sur le Bambara – Mali**

Par **Minta Services** — Bamako / Ségou, Mali 🇲🇱

> Discutez en Bambara, Français ou Anglais.  
> Réponses en direct • Photos et PDF • Voix bambara • Appel vocal en direct • Appels vers vos contacts • WhatsApp

**Démo en ligne** → [ia.mintaservices.com](https://ia.mintaservices.com)

---

## Contacts officiels

| Canal                    | Lien                                      |
|--------------------------|-------------------------------------------|
| **Email**                | Academy@mintaservices.com                 |
| **WhatsApp Mande-IA**    | +223 92 27 58 84                          |
| **Téléphone principal**  | +223 77 295 259                           |
| **Site web**             | [mintaservices.com](https://mintaservices.com) |
| **Plateforme IA**        | [ia.mintaservices.com](https://ia.mintaservices.com) |
| **Collecte de données**  | [data.mintaservices.com](https://data.mintaservices.com) |
| **GitHub**               | [github.com/Professor-minta](https://github.com/Professor-minta) |

---

## Fonctionnalités

- Conversations en **Bambara, Français et Anglais**, avec des réponses qui s'écrivent au fur et à mesure
- **Photos et PDF** analysés (Gemini, avec Claude en relais)
- **Écouter les réponses** : voix bambara avec Djelia, voix naturelle en français et en anglais
- **Dictée** au micro
- **Appel vocal en direct** (OpenAI Realtime, WebRTC) : 3 minutes en gratuit, 15 minutes en Pro
- **Appeler un contact** : « Appelle Mamadou » ou « Mamadou wele », écrit ou dit au micro ou pendant l'appel en direct, ouvre le téléphone avec le bon numéro (contacts gardés sur l'appareil, import depuis le téléphone sur Android, raccourci « Appeler » sur l'icône)
- **Installation** sur l'écran d'accueil proposée à la première visite (Android, et explications pour iPhone)
- Mode invité, comptes et conversations sauvegardées
- Limite gratuite de 5 questions par jour
- **Nouveautés** affichées dans l'application après chaque mise à jour
- Modèle local **Ollama** en secours si Claude ne répond pas
- **WhatsApp** : +223 92 27 58 84, carte d'accueil, menu de 10 sujets
- **Mande-IA Pro** : paiement Orange Money et Moov (PayDunya ou CinetPay)
- Génération d'images (bientôt)

---

## Pourquoi Mande-IA ?

Beaucoup de personnes au Mali et en Afrique de l'Ouest préfèrent s'exprimer dans les langues locales.  
Mande-IA est conçu pour rendre l'intelligence artificielle accessible **en Bambara**, avec la communauté.

Les réponses actuelles ne prétendent pas être parfaites.  
L'objectif est de construire une ressource linguistique solide, revue et utile.

---

## Démarrage rapide

Il faut Node.js 20 ou plus récent.

```bash
git clone https://github.com/Professor-minta/Mande-IA.git
cd Mande-IA
cp .env.example .env
npm install
npm start
```

Ouvrez ensuite [http://localhost:3001](http://localhost:3001).

Remplissez au minimum `ANTHROPIC_API_KEY` et `SESSION_SECRET` dans `.env`. Pour créer un `SESSION_SECRET` :

```bash
openssl rand -hex 32
```

Vérifiez vos clés sans les afficher :

```bash
npm run check-keys
```

---

## Variables d'environnement

Toutes les variables sont listées dans [`.env.example`](.env.example).

| Variable | Sert à |
|---|---|
| `ANTHROPIC_API_KEY` | Réponses de Mande-IA (Claude) |
| `SESSION_SECRET` | Protéger les comptes des utilisateurs |
| `GEMINI_API_KEY`, `GEMINI_VISION_MODEL` | Analyse des photos et des PDF |
| `OPENAI_API_KEY`, `OPENAI_REALTIME_MODEL` | Appel en direct et voix française et anglaise |
| `DJELIA_API_KEY` | Voix et dictée en bambara |
| `OLLAMA_API_URL`, `OLLAMA_MODEL` | Modèle local de secours (laisser vide sans Ollama) |
| `WHATSAPP_*`, `META_*` | Connecteur WhatsApp |
| `PAIEMENT_PROVIDER`, `PAYDUNYA_*`, `CINETPAY_*` | Paiement de Mande-IA Pro (voir ci-dessous) |

Le fichier `.env` ne doit **jamais** être envoyé sur GitHub. Voir [SECURITY.md](SECURITY.md).

---

## Mise en production (aaPanel)

Mande-IA tourne comme **Node.js Project** dans aaPanel (Website → Node.js Project). Réglages du projet :

| Champ | Valeur |
|---|---|
| Path | `/www/wwwroot/mande-ia-v2` |
| Run opt | `start` (lance `node server.js`) |
| Port | `3001` |
| User | `www` |
| Node version | celle qui a installé `node_modules` |

Un seul gestionnaire à la fois : si Mande-IA tourne dans aaPanel, il ne doit pas tourner aussi avec PM2. Sinon le port 3001 est déjà pris et l'un des deux s'arrête. `ecosystem.config.js` sert seulement si vous choisissez PM2 à la place d'aaPanel.

Après un changement de version de Node, réinstallez les modules : supprimez `node_modules`, puis onglet **Module** du projet → installation en un clic.

Mettre à jour après un changement sur GitHub :

```bash
cd /www/wwwroot/mande-ia-v2 && git pull --ff-only origin main && chown -R www:www .
```

Puis **Restart** dans aaPanel. En cas de problème, regardez l'onglet **Project log**.

---

## Mande-IA Pro et paiement

| Formule | Prix | Durée | Appels en direct |
|---|---|---|---|
| Gratuit | 0 | chaque jour | 1 appel de 3 min par jour |
| Pro Semaine | 1 000 FCFA | 7 jours | 15 min |
| Pro Mois | 3 000 FCFA | 30 jours | 1 h |
| Pro 3 mois | 8 000 FCFA | 90 jours | 3 h |

Pro : questions illimitées (100 par jour au plus), appels de 15 minutes au plus. Pas de renouvellement automatique.

1. Dans `.env` : `PAIEMENT_PROVIDER=paydunya`, les trois clés `PAYDUNYA_*` et `PAYDUNYA_MODE=test` pour essayer sans argent réel.
2. **Restart** dans aaPanel. Le journal affiche `Paiement : paydunya (mode test).`
3. Testez un achat, puis passez `PAYDUNYA_MODE=live` et **Restart**.

Le prestataire prévient Mande-IA sur `https://ia.mintaservices.com/api/paiement/webhook`. Mande-IA revérifie chaque paiement directement auprès du prestataire avant d'activer Pro.

Entreprises, écoles ou activation à la main (le compte doit exister) :

```bash
cd /www/wwwroot/mande-ia-v2
sudo -u www node scripts/pro.js activer ecole@exemple.com 90 180   # 90 jours, 180 min d'appel
sudo -u www node scripts/pro.js voir ecole@exemple.com
sudo -u www node scripts/pro.js paiements                          # 30 derniers paiements et total
```

## WhatsApp

Le connecteur répond sur WhatsApp avec un menu de 10 sujets, l'indicateur « en train d'écrire » et des réponses envoyées paragraphe par paragraphe. Il répond toujours depuis le numéro qui a reçu le message.

Callback URL chez Meta : `https://ia.mintaservices.com/whatsapp/webhook` (`/api/whatsapp/webhook` marche aussi).

```bash
node scripts/whatsapp.js diagnostic       # vérifie le jeton, le numéro, l'abonnement et le webhook
node scripts/whatsapp.js configurer       # abonne l'app, met à jour le profil, la photo et les suggestions
node scripts/whatsapp.js enregistrer PIN  # active le numéro sur Cloud API (PIN à 6 chiffres)
node scripts/whatsapp.js test             # simule un message « menu » depuis WHATSAPP_TEST_RECIPIENT
```

---

## Sauvegardes

`scripts/sauvegarde.sh` copie chaque nuit les bases de Mande-IA (`data/mande-ia.db`) et de Data-Collections (`data/data.db`), ainsi que les deux fichiers `.env`. Les bases sont copiées proprement, même pendant que les sites tournent. Le script range une archive dans `/root/sauvegardes`, où il garde les 7 dernières. Si Google Drive est relié, il envoie aussi l'archive et les nouvelles voix, chiffrées, dans le dossier `MintaServices-sauvegardes`, et y garde 60 jours d'archives.

**Relier Google Drive, une seule fois :**

1. Sur l'ordinateur, dans PowerShell :
   ```powershell
   winget install Rclone.Rclone
   rclone authorize "drive" "eyJzY29wZSI6ImRyaXZlLmZpbGUifQ"
   ```
   Le navigateur s'ouvre : choisissez le compte Google, puis autorisez. PowerShell affiche ensuite un jeton entre deux flèches. C'est la ligne qui commence par `{`.
2. Sur le serveur, en root :
   ```bash
   apt install -y rclone
   bash /www/wwwroot/mande-ia-v2/scripts/sauvegarde-drive.sh
   ```
   Collez le jeton, puis choisissez le mot de passe des sauvegardes. Gardez ce mot de passe dans un gestionnaire de mots de passe : sans lui, les sauvegardes ne peuvent pas être ouvertes.
3. Dans aaPanel, allez dans **Cron**, puis **Add Task** : type **Shell Script**, tous les jours à 3 h 30, avec la commande `bash /www/wwwroot/mande-ia-v2/scripts/sauvegarde.sh`.

**Restaurer :**

```bash
rclone copy sauvegarde:bases/minta-AAAA-MM-JJ.tar.gz /root/restauration/
tar -xzf /root/restauration/minta-AAAA-MM-JJ.tar.gz -C /root/restauration/
rclone copy sauvegarde:voix /root/restauration/voix
```

---

## Structure du projet

```
server.js               Serveur Express : discussion, fichiers, voix, appel, WhatsApp
ecosystem.config.js     Configuration PM2 (seulement si PM2 remplace aaPanel)
verifier-cles.js        Vérifie les clés API sans les afficher
scripts/                whatsapp.js (diagnostic et configuration), pro.js, sauvegarde.sh, sauvegarde-drive.sh, nettoyer-serveur.sh
chats/, connectors/     Connecteur WhatsApp (connectors/whatsapp.js) et logique multi-agents
public/                 Application web (PWA)
  index.html, app.js, style.css
  nouveautes.json       Nouveautés affichées aux utilisateurs
  service-worker.js     Mode hors ligne et cache
  bambara-demo.js       Phrases trilingues { category, bm, fr, en }
Bambara Dataset/        Données de phrases en bambara
```

---

## Contribuer

Les corrections de phrases en bambara sont les bienvenues. Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

[MIT](LICENSE) © 2026 Issa Minta, Minta Services
