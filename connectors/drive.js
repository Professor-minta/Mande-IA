const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token';
const REVOKE_URL = process.env.GOOGLE_REVOKE_URL || 'https://oauth2.googleapis.com/revoke';
const DRIVE_API = process.env.GOOGLE_DRIVE_API_URL || 'https://www.googleapis.com';
const DOSSIER_TYPE = 'application/vnd.google-apps.folder';
const DOC_TYPE = 'application/vnd.google-apps.document';

const DRIVE_TOOL = {
  type: 'function',
  name: 'enregistrer_dans_drive',
  description: 'Enregistre un texte, par exemple la réponse d’un agent, comme document Google Docs dans le Google Drive du Professeur Minta.',
  parameters: {
    type: 'object',
    properties: {
      titre: { type: 'string', description: 'Un titre court et clair pour le document.' },
      contenu: { type: 'string', description: 'Le texte complet à enregistrer, sans le résumer.' }
    },
    required: ['titre', 'contenu']
  }
};
const DRIVE_INSTRUCTION = 'Si on te demande d’enregistrer, de sauvegarder ou de garder un texte dans le Drive, appelle l’outil enregistrer_dans_drive avec un titre court et le texte complet, par exemple la dernière réponse d’un agent, puis confirme en une phrase.';

class DriveError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}

function setupDrive(app, { db, getUser, now, secret }) {
  db.exec('CREATE TABLE IF NOT EXISTS drive_compte (id INTEGER PRIMARY KEY CHECK (id = 1), jeton TEXT NOT NULL, dossier_id TEXT, connecte_le TEXT NOT NULL)');
  const cle = crypto.createHash('sha256').update(`mande-ia-drive:${process.env.DRIVE_CLE || secret}`).digest();
  let acces = { jeton: '', expire: 0 };

  const proprietaire = () => String(process.env.DRIVE_PROPRIETAIRE || '').trim().toLowerCase();
  const configure = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && proprietaire());
  const estProprietaire = (user) => Boolean(user && configure() && user.email === proprietaire());
  const retour = () => `${String(process.env.PUBLIC_URL || 'https://ia.mintaservices.com').replace(/\/+$/, '')}/api/drive/retour`;
  const nomDossier = () => process.env.DRIVE_DOSSIER || 'Mande-IA Agents';
  const compte = () => db.prepare('SELECT jeton, dossier_id FROM drive_compte WHERE id = 1').get();
  const connecte = () => configure() && Boolean(compte());
  const utilisateur = (req) => (req.session.userId ? getUser(req.session.userId) : null);

  function chiffrer(texte) {
    const iv = crypto.randomBytes(12);
    const chiffre = crypto.createCipheriv('aes-256-gcm', cle, iv);
    const donnees = Buffer.concat([chiffre.update(texte, 'utf8'), chiffre.final()]);
    return Buffer.concat([iv, chiffre.getAuthTag(), donnees]).toString('base64');
  }
  function dechiffrer(texte) {
    const brut = Buffer.from(texte, 'base64');
    const dechiffre = crypto.createDecipheriv('aes-256-gcm', cle, brut.subarray(0, 12));
    dechiffre.setAuthTag(brut.subarray(12, 28));
    return Buffer.concat([dechiffre.update(brut.subarray(28)), dechiffre.final()]).toString('utf8');
  }
  function oublier() {
    db.prepare('DELETE FROM drive_compte WHERE id = 1').run();
    acces = { jeton: '', expire: 0 };
  }

  async function jetonGoogle(params) {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(20000),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, ...params })
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, data };
  }

  async function jetonAcces() {
    if (acces.jeton && Date.now() < acces.expire) return acces.jeton;
    const ligne = compte();
    if (!ligne) throw new DriveError('Google Drive n’est pas relié. Reliez-le dans Paramètres.', 409);
    let refresh;
    try { refresh = dechiffrer(ligne.jeton); } catch { oublier(); throw new DriveError('Google Drive doit être relié à nouveau dans Paramètres.', 409); }
    const { ok, data } = await jetonGoogle({ grant_type: 'refresh_token', refresh_token: refresh });
    if (!ok) {
      if (data.error === 'invalid_grant') { oublier(); throw new DriveError('L’accès à Google Drive a expiré. Reliez-le à nouveau dans Paramètres.', 409); }
      console.error('Drive, jeton :', data.error, data.error_description);
      throw new DriveError('Google Drive ne répond pas pour le moment.');
    }
    acces = { jeton: data.access_token, expire: Date.now() + Math.max(60, (Number(data.expires_in) || 3600) - 120) * 1000 };
    return acces.jeton;
  }

  async function driveFetch(chemin, options = {}) {
    const response = await fetch(`${DRIVE_API}${chemin}`, { ...options, signal: AbortSignal.timeout(30000), headers: { authorization: `Bearer ${await jetonAcces()}`, ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    return { status: response.status, ok: response.ok, data };
  }

  async function dossier({ recreer = false } = {}) {
    const ligne = compte();
    if (ligne?.dossier_id && !recreer) return ligne.dossier_id;
    const nom = nomDossier();
    const q = `name = '${nom.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}' and mimeType = '${DOSSIER_TYPE}' and trashed = false`;
    const trouve = await driveFetch(`/drive/v3/files?${new URLSearchParams({ q, fields: 'files(id)', pageSize: '1', spaces: 'drive' })}`);
    let id = trouve.ok ? trouve.data.files?.[0]?.id : null;
    if (!id) {
      const cree = await driveFetch('/drive/v3/files?fields=id', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: nom, mimeType: DOSSIER_TYPE }) });
      if (!cree.ok) { console.error('Drive, dossier :', cree.status, cree.data?.error?.message); throw new DriveError('Impossible de créer le dossier dans Google Drive.'); }
      id = cree.data.id;
    }
    db.prepare('UPDATE drive_compte SET dossier_id = ? WHERE id = 1').run(id);
    return id;
  }

  async function televerser(titre, contenu, type, parent) {
    const separation = `mande-ia-${crypto.randomBytes(8).toString('hex')}`;
    const corps = [
      `--${separation}`, 'Content-Type: application/json; charset=UTF-8', '', JSON.stringify({ name: titre, mimeType: DOC_TYPE, parents: [parent] }),
      `--${separation}`, `Content-Type: ${type}; charset=UTF-8`, '', contenu,
      `--${separation}--`, ''
    ].join('\r\n');
    return driveFetch('/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', { method: 'POST', headers: { 'content-type': `multipart/related; boundary=${separation}` }, body: corps });
  }

  async function enregistrer({ titre, contenu }) {
    const nom = String(titre || '').replace(/\s+/g, ' ').trim().slice(0, 120) || `Mande-IA, ${new Date().toLocaleDateString('fr-FR')}`;
    const texte = String(contenu || '').trim().slice(0, 100000);
    if (!texte) throw new DriveError('Rien à enregistrer.', 400);
    let parent = await dossier();
    let resultat = await televerser(nom, texte, 'text/markdown', parent);
    if (resultat.status === 404) { parent = await dossier({ recreer: true }); resultat = await televerser(nom, texte, 'text/markdown', parent); }
    if (resultat.status === 400) resultat = await televerser(nom, texte, 'text/plain', parent);
    if (!resultat.ok) { console.error('Drive, enregistrement :', resultat.status, resultat.data?.error?.message); throw new DriveError('L’enregistrement dans Google Drive a échoué. Réessayez.'); }
    return { titre: resultat.data.name || nom, lien: resultat.data.webViewLink || '' };
  }

  const limite = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false });

  app.get('/api/drive/etat', (req, res) => {
    const user = utilisateur(req);
    if (!estProprietaire(user)) return res.json({ proprietaire: false });
    res.json({ proprietaire: true, connecte: connecte(), dossier: nomDossier() });
  });

  app.get('/api/drive/connecter', (req, res) => {
    if (!estProprietaire(utilisateur(req))) return res.redirect('/?drive=refuse');
    const etat = crypto.randomBytes(24).toString('hex');
    req.session.driveEtat = etat;
    const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: retour(), response_type: 'code', scope: SCOPE, access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', login_hint: proprietaire(), state: etat });
    req.session.save(() => res.redirect(`${AUTH_URL}?${params}`));
  });

  app.get('/api/drive/retour', async (req, res) => {
    const attendu = req.session.driveEtat;
    delete req.session.driveEtat;
    if (!estProprietaire(utilisateur(req)) || !attendu || req.query.state !== attendu) return res.redirect('/?drive=refuse');
    if (req.query.error || !req.query.code) return res.redirect('/?drive=annule');
    try {
      const { ok, data } = await jetonGoogle({ grant_type: 'authorization_code', code: String(req.query.code), redirect_uri: retour() });
      if (!ok || !data.refresh_token) { console.error('Drive, autorisation :', data.error, data.error_description); return res.redirect('/?drive=erreur'); }
      if (!String(data.scope || SCOPE).split(' ').includes(SCOPE)) return res.redirect('/?drive=annule');
      db.prepare('INSERT INTO drive_compte (id, jeton, dossier_id, connecte_le) VALUES (1, ?, NULL, ?) ON CONFLICT(id) DO UPDATE SET jeton = excluded.jeton, dossier_id = NULL, connecte_le = excluded.connecte_le').run(chiffrer(data.refresh_token), now());
      acces = { jeton: data.access_token || '', expire: data.access_token ? Date.now() + Math.max(60, (Number(data.expires_in) || 3600) - 120) * 1000 : 0 };
      await dossier().catch((error) => console.error('Drive, dossier :', error.message));
      console.log('Google Drive relié à Mande-IA.');
      res.redirect('/?drive=ok');
    } catch (error) {
      console.error('Drive, retour :', error.message);
      res.redirect('/?drive=erreur');
    }
  });

  app.post('/api/drive/deconnecter', async (req, res) => {
    if (!estProprietaire(utilisateur(req))) return res.status(403).json({ error: 'Réservé au propriétaire du Drive.' });
    const ligne = compte();
    if (ligne) {
      try { await fetch(`${REVOKE_URL}?${new URLSearchParams({ token: dechiffrer(ligne.jeton) })}`, { method: 'POST', signal: AbortSignal.timeout(15000) }); } catch {}
      oublier();
    }
    res.json({ success: true });
  });

  app.post('/api/drive/enregistrer', limite, async (req, res) => {
    if (!estProprietaire(utilisateur(req))) return res.status(403).json({ error: 'Réservé au propriétaire du Drive.' });
    try {
      res.json(await enregistrer({ titre: req.body?.titre, contenu: req.body?.contenu }));
    } catch (error) {
      res.status(error.status || 502).json({ error: error instanceof DriveError ? error.message : 'Google Drive ne répond pas pour le moment.' });
    }
  });

  return {
    outilsScene: (user) => (estProprietaire(user) && connecte() ? { tools: [DRIVE_TOOL], instruction: DRIVE_INSTRUCTION } : { tools: [], instruction: '' })
  };
}

module.exports = { setupDrive };
