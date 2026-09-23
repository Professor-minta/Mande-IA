# Mande-IA

**Mande-IA** is an early-stage, Bambara-first AI assistant from **Minta Services**, created by Issa Minta in Mali. It is being built to make useful digital assistance more accessible through Bambara text, carefully tested voice features, and community-reviewed language resources.

Live demo: [ia.mintaservices.com](https://ia.mintaservices.com)  
Organisation: [Minta Services](https://www.mintaservices.com)

## What works today

- Text conversations with a Bambara or French response setting.
- Guest mode, accounts, saved conversations, and a daily free-use limit.
- Djelia text-to-speech for supported responses.
- A microphone input in beta. Bambara speech-to-text depends on an external provider and must be tested before use in a live presentation.
- A starter Bambara - French - English phrase collection in [`public/bambara-demo.js`](public/bambara-demo.js).

## Why this project

Many people in Mali and across West Africa are more comfortable learning, asking questions, and expressing ideas in local languages. Mande-IA is an experiment in building language technology with communities, not only for communities.

The next goal is a reviewed Bambara language resource, built with speakers, teachers, linguists, students, and developers. The project does **not** claim that its current AI responses are linguistically perfect.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
git clone https://github.com/Professor-minta/mande-ia.git
cd mande-ia
cp .env.example .env
npm install
npm start
```

Open `http://localhost:3001`.

## Configuration

Copy `.env.example` to `.env` and add your own values. Never commit `.env`, access tokens, application secrets, databases, or user conversations.

The app can run without optional provider keys, but AI and voice features need their respective providers configured.

## Bambara phrase collection

`public/bambara-demo.js` currently contains starter phrases with three fields:

```js
{ category: 'Salutations', bm: 'Aw ni ce!', fr: 'Bonjour !', en: 'Hello!' }
```

This is a learning and demonstration collection, not an authoritative linguistic dataset. Contributions from Bambara speakers and language specialists are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).

## Roadmap

1. Review and expand the Bambara phrase collection with native speakers and linguists.
2. Evaluate response quality using transparent Bambara test sets.
3. Improve speech-to-text reliability and make its limitations clear in the user interface.
4. Explore an offline, local deployment using Ollama for community locations with limited connectivity.
5. Build a documented Bambara language API only after data consent, quality review, infrastructure, and sustainable governance are in place.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Do not submit private conversations, API keys, or copyrighted language material without permission.

## Contact

- Issa Minta / Professor Minta
- Minta Services, Mali
- Website: [mintaservices.com](https://www.mintaservices.com)

## License

Code is available under the [MIT License](LICENSE). The Bambara phrase collection is offered for collaborative review; contributors must only submit material they have the right to share.
