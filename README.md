# Mande-IA

A simple mobile web assistant for Bambara (Bamanankan) speakers in Mali. People can type or use their phone's microphone; Mande-IA replies in Bambara and reads the response aloud when the browser supports it.

## What you need

1. A domain name pointed at your DigitalOcean Droplet's public IPv4 address (an `A` DNS record, for example `app.example.ml`).
2. A DigitalOcean Ubuntu Droplet (at least 1 GB RAM is a sensible starting point).
3. An OpenAI API key and billing enabled for the OpenAI project.
4. aaPanel access so you can create a website, configure SSL, and add a reverse proxy.

> The microphone feature depends on the phone browser and works only on HTTPS, except when testing on `localhost`. French is selected as the speech-recognition locale because browser support for Bambara varies; the AI is instructed to reply in Bambara.

## Run locally

```bash
cp .env.example .env
# Put your real OpenAI key in .env
npm install
npm start
```

Open `http://localhost:3000`.

## Deploy with aaPanel and DigitalOcean

1. In your DNS provider, create an `A` record for your chosen subdomain pointing to the Droplet IP. Wait for DNS to resolve.
2. In aaPanel, install **Node.js version manager** (or Node Project Manager), then install Node 20 LTS.
3. Upload or clone this repository to `/www/wwwroot/mande-ia` on the Droplet.
4. On the Droplet, create the production configuration without committing it:
   ```bash
   cd /www/wwwroot/mande-ia
   cp .env.example .env
   nano .env
   npm install --omit=dev
   ```
   Set `OPENAI_API_KEY` in `.env`. Keep this key private: never put it in `public/`, Git, or the browser.
5. In aaPanel's Node Project Manager, add a project with **project path** `/www/wwwroot/mande-ia`, **startup file** `server.js`, and **port** `3000`. Start it and enable its boot-start option.
6. In aaPanel Website, add your domain and request a Let's Encrypt SSL certificate. Turn on **Force HTTPS**.
7. Add a reverse proxy from the website to `http://127.0.0.1:3000`. Visit `https://your-domain` and test both typing and the microphone button from a phone.

## Before sharing widely

- Add a privacy notice in Bambara and French, including how chat messages are handled.
- Set a monthly OpenAI spending limit and review usage regularly.
- Test the real Bambara phrases your community uses with several speakers. Correct the assistant instructions in `server.js` as needed.
- For WhatsApp later, use the official WhatsApp Business Platform or an approved provider, add a webhook endpoint, and verify opt-in/consent requirements. Do not expose your OpenAI key in that integration.
