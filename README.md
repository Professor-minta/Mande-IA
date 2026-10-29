# Mande-IA

**Assistant IA centré sur le Bambara – Mali**

Par **Minta Services** — Bamako / Ségou, Mali 🇲🇱

> Discutez en Bambara, Français ou Anglais.  
> Réponses en direct • Photos et PDF • Voix bambara • Appel vocal en direct • WhatsApp

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
- Mode invité, comptes et conversations sauvegardées
- Limite gratuite de 5 questions par jour
- **Nouveautés** affichées dans l'application après chaque mise à jour
- Modèle local **Ollama** en secours si Claude ne répond pas
- Intégration **WhatsApp** (en cours)
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
| `PAIEMENT_*` | Paiement CinetPay (à venir) |

Le fichier `.env` ne doit **jamais** être envoyé sur GitHub. Voir [SECURITY.md](SECURITY.md).

---

## Mise en production (aaPanel + PM2)

Première installation sur le serveur :

```bash
cd /www/wwwroot/mande-ia-v2
npm install --omit=dev
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup systemd
pm2 save
```

Mettre à jour après un changement sur GitHub :

```bash
cd /www/wwwroot/mande-ia-v2 && git pull --ff-only origin main && chown -R www:www . && pm2 reload mande-ia
```

Commandes utiles : `pm2 status`, `pm2 logs mande-ia --lines 50`.

---

## WhatsApp

Le connecteur répond sur WhatsApp avec un menu de 10 sujets, l'indicateur « en train d'écrire » et des réponses envoyées paragraphe par paragraphe.

```bash
node scripts/whatsapp.js diagnostic       # vérifie le jeton, le numéro, l'abonnement et le webhook
node scripts/whatsapp.js configurer       # abonne l'app, met à jour le profil, la photo et les suggestions
node scripts/whatsapp.js enregistrer PIN  # active le numéro sur Cloud API (PIN à 6 chiffres)
node scripts/whatsapp.js test             # simule un message « menu » depuis WHATSAPP_TEST_RECIPIENT
```

---

## Structure du projet

```
server.js               Serveur Express : discussion, fichiers, voix, appel, WhatsApp
ecosystem.config.js     Configuration PM2
verifier-cles.js        Vérifie les clés API sans les afficher
scripts/                whatsapp.js (diagnostic et configuration), nettoyer-serveur.sh
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
