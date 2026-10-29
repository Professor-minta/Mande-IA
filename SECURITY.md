# Security

## Never commit secrets

Do not commit or send these files or values to GitHub:

- `.env` and `.env.local`
- API keys, WhatsApp tokens, Meta app secrets, session secrets, passwords, or certificates
- `data/` databases, sessions, backups, audio uploads, or user conversations
- copies of `.env` such as `env1`, `prod.env` or `.env.backup`

Never take a photo or screenshot of an open `.env` file. To check your keys without showing them, run:

```bash
npm run check-keys
```

The repository `.gitignore` excludes these files. Before every push, run `git status` and add files one by one instead of using `git add .`:

```bash
git status
git add server.js public/app.js
```

If a secret is ever shown publicly, revoke and replace it immediately through the provider dashboard.

## Reporting

Do not create a public issue for a security problem. Contact Minta Services privately through the contact details on [mintaservices.com](https://www.mintaservices.com).
