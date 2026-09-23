# Security

## Never commit secrets

Do not commit or send these files or values to GitHub:

- `.env` and `.env.local`
- API keys, WhatsApp tokens, Meta app secrets, session secrets, passwords, or certificates
- `data/` databases, sessions, backups, audio uploads, or user conversations

The repository `.gitignore` excludes these files. Before every push, run:

```bash
git status
```

If a secret is ever shown publicly, revoke and replace it immediately through the provider dashboard.

## Reporting

Do not create a public issue for a security problem. Contact Minta Services privately through the contact details on [mintaservices.com](https://www.mintaservices.com).
