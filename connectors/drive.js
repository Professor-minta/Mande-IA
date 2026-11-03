const crypto = require('crypto');
const path = require('path');
const { execSync } = require('child_process');
const rateLimit = require('express-rate-limit');
const { dossiersVerifies } = require('./connaissances');

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token';
const REVOKE_URL = process.env.GOOGLE_REVOKE_URL || 'https://oauth2.googleapis.com/revoke';
const DRIVE_API = process.env.GOOGLE_DRIVE_API_URL || 'https://www.googleapis.com';
const DOSSIER_TYPE = 'application/vnd.google-apps.folder';
const DOC_TYPE = 'application/vnd.google-apps.document';
const PREFIXE_VERIFIE = 'Dossier vérifié : ';
const DEMARRE = new Date().toISOString();
const VERSION = (() => { try { return execSync('git log -1 --format="%h %cs"', { cwd: path.join(__dirname, '..'), stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return 'inconnue'; } })();

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
const DRIVE_LIRE_TOOL = {
  type: 'function',
  name: 'consulter_drive',
  description: 'Liste les documents que Mande-IA a enregistrés dans le Google Drive du Professeur Minta, ou lit l’un d’eux quand un titre est donné.',
  parameters: {
    type: 'object',
    properties: {
      titre: { type: 'string', description: 'Le titre, ou un mot du titre, du document à lire. Laisser vide pour obtenir la liste.' }
    }
  }
};
const driveInstruction = (dossier) => [
  `Tu as accès au Google Drive du Professeur Minta, dans le dossier « ${dossier} ».`,
  'Quand on te demande d’enregistrer, de sauvegarder, de garder ou de mettre un texte dans le Drive, appelle tout de suite l’outil enregistrer_dans_drive avec un titre court et le texte complet, par exemple la dernière réponse d’un agent, puis confirme en une phrase.',
  'Quand on te demande ce qu’il y a dans le Drive, d’ouvrir le Drive ou de lire un document, appelle l’outil consulter_drive : sans titre pour la liste, avec un titre pour lire le document.',
  'Le dossier contient aussi les dossiers vérifiés de Minta Services, par exemple Kurukan Fuga et Mansa Moussa : pour lire l’un d’eux, appelle consulter_drive avec un mot de son titre, comme « Mansa Moussa ».',
  'Le Drive ne relève d’aucun agent : pour tout ce qui touche au Drive, n’appelle jamais consulter_agent, utilise seulement enregistrer_dans_drive ou consulter_drive.',
  'Tu vois seulement les documents que Mande-IA a créés dans ce dossier, pas les autres fichiers du Drive. Ne dis jamais que tu n’as pas accès au Drive.'
].join(' ');

const simple = (texte) => String(texte || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

class DriveError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}

function setupDrive(app, { db, getUser, now, secret }) {
  db.exec('CREATE TABLE IF NOT EXISTS drive_compte (id INTEGER PRIMARY KEY CHECK (id = 1), jeton TEXT NOT NULL, dossier_id TEXT, connecte_le TEXT NOT NULL)');
  db.exec('CREATE TABLE IF NOT EXISTS drive_erreur (id INTEGER PRIMARY KEY CHECK (id = 1), quand TEXT NOT NULL, etape TEXT NOT NULL, detail TEXT)');
  db.exec('CREATE TABLE IF NOT EXISTS drive_cle (id INTEGER PRIMARY KEY CHECK (id = 1), cle TEXT NOT NULL)');
  const cleStockee = () => {
    const ligne = db.prepare('SELECT cle FROM drive_cle WHERE id = 1').get();
    if (ligne) return ligne.cle;
    const nouvelle = crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT OR IGNORE INTO drive_cle (id, cle) VALUES (1, ?)').run(nouvelle);
    return db.prepare('SELECT cle FROM drive_cle WHERE id = 1').get().cle;
  };
  const deriver = (valeur) => crypto.createHash('sha256').update(`mande-ia-drive:${valeur}`).digest();
  const cle = deriver(process.env.DRIVE_CLE || cleStockee());
  const ancienneCle = deriver(process.env.DRIVE_CLE || secret);
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
  function dechiffrer(texte, avec = cle) {
    const brut = Buffer.from(texte, 'base64');
    const dechiffre = crypto.createDecipheriv('aes-256-gcm', avec, brut.subarray(0, 12));
    dechiffre.setAuthTag(brut.subarray(12, 28));
    return Buffer.concat([dechiffre.update(brut.subarray(28)), dechiffre.final()]).toString('utf8');
  }
  function noter(etape, ...details) {
    const detail = details.filter((d) => d !== undefined && d !== null && d !== '').join(' ').slice(0, 300);
    console.error(`Drive, ${etape} :`, detail);
    try { db.prepare('INSERT INTO drive_erreur (id, quand, etape, detail) VALUES (1, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET quand = excluded.quand, etape = excluded.etape, detail = excluded.detail').run(now(), etape, detail); } catch {}
  }
  function effacerErreur() {
    try { db.prepare('DELETE FROM drive_erreur WHERE id = 1').run(); } catch {}
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
    try { refresh = dechiffrer(ligne.jeton); }
    catch {
      try {
        refresh = dechiffrer(ligne.jeton, ancienneCle);
        db.prepare('UPDATE drive_compte SET jeton = ? WHERE id = 1').run(chiffrer(refresh));
      } catch {
        noter('jeton', 'la clé de chiffrement a changé depuis la liaison (SESSION_SECRET absent ou modifié dans .env) : reliez le Drive à nouveau');
        oublier();
        throw new DriveError('Google Drive doit être relié à nouveau dans Paramètres.', 409);
      }
    }
    const { ok, data } = await jetonGoogle({ grant_type: 'refresh_token', refresh_token: refresh });
    if (!ok) {
      if (data.error === 'invalid_grant') { noter('jeton', 'invalid_grant : accès retiré ou expiré, reliez à nouveau'); oublier(); throw new DriveError('L’accès à Google Drive a expiré. Reliez-le à nouveau dans Paramètres.', 409); }
      noter('jeton', data.error, data.error_description);
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

  async function driveTexte(chemin) {
    const response = await fetch(`${DRIVE_API}${chemin}`, { signal: AbortSignal.timeout(30000), headers: { authorization: `Bearer ${await jetonAcces()}` } });
    return { status: response.status, ok: response.ok, texte: await response.text().catch(() => '') };
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
      if (!cree.ok) { noter('dossier', cree.status, cree.data?.error?.message); throw new DriveError('Impossible de créer le dossier dans Google Drive.'); }
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
    if (!resultat.ok) { noter('enregistrement', resultat.status, resultat.data?.error?.message); throw new DriveError('L’enregistrement dans Google Drive a échoué. Réessayez.'); }
    return { titre: resultat.data.name || nom, lien: resultat.data.webViewLink || '' };
  }

  async function lister(parent) {
    const q = `'${parent}' in parents and trashed = false and mimeType != '${DOSSIER_TYPE}'`;
    const liste = await driveFetch(`/drive/v3/files?${new URLSearchParams({ q, orderBy: 'modifiedTime desc', pageSize: '50', fields: 'files(id,name,mimeType,modifiedTime)', spaces: 'drive' })}`);
    if (!liste.ok) { noter('consultation', liste.status, liste.data?.error?.message); throw new DriveError('Impossible de lire le dossier dans Google Drive.'); }
    return liste.data.files || [];
  }

  async function garnir(parent, fichiers) {
    const presents = new Set(fichiers.map((f) => f.name));
    const ajoutes = [];
    for (const fiche of dossiersVerifies()) {
      const nom = `${PREFIXE_VERIFIE}${fiche.titre}`.slice(0, 120);
      if (presents.has(nom)) continue;
      let resultat = await televerser(nom, fiche.corps, 'text/markdown', parent);
      if (resultat.status === 400) resultat = await televerser(nom, fiche.corps, 'text/plain', parent);
      if (!resultat.ok) { noter('dossiers vérifiés', resultat.status, resultat.data?.error?.message); continue; }
      ajoutes.push({ id: resultat.data.id, name: nom, mimeType: DOC_TYPE, modifiedTime: new Date().toISOString() });
    }
    return ajoutes;
  }

  async function consulter({ titre }) {
    const parent = await dossier();
    let fichiers = await lister(parent);
    fichiers = [...(await garnir(parent, fichiers)), ...fichiers];
    const resume = fichiers.slice(0, 15).map((f) => ({ titre: f.name, date: String(f.modifiedTime || '').slice(0, 10) }));
    const cherche = simple(titre);
    if (!cherche) return { dossier: nomDossier(), nombre: fichiers.length, documents: resume };
    const mots = cherche.split(/\s+/).filter((m) => m.length > 2);
    const motifs = new Map(dossiersVerifies().map((d) => [`${PREFIXE_VERIFIE}${d.titre}`.slice(0, 120), d.motifs]));
    const score = (f) => {
      const nom = simple(f.name);
      if (nom === cherche) return 100;
      if (nom.includes(cherche)) return 50;
      const colles = nom.split(/[^a-z0-9]+/).filter((w) => w.length > 4 && cherche.replace(/\s+/g, '').includes(w)).length;
      return mots.filter((m) => nom.includes(m)).length + colles + 2 * (motifs.get(f.name) || []).filter((motif) => motif.test(cherche)).length;
    };
    const meilleur = fichiers.map((f) => ({ f, s: score(f) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s)[0]?.f;
    if (!meilleur) return { trouve: false, documents: resume };
    const lu = meilleur.mimeType === DOC_TYPE
      ? await driveTexte(`/drive/v3/files/${encodeURIComponent(meilleur.id)}/export?mimeType=text%2Fplain`)
      : await driveTexte(`/drive/v3/files/${encodeURIComponent(meilleur.id)}?alt=media`);
    if (!lu.ok) { noter('lecture', lu.status, lu.texte.slice(0, 200)); throw new DriveError('Impossible de lire ce document dans Google Drive.'); }
    const texte = lu.texte.replace(/^\uFEFF/, '').trim();
    return { trouve: true, titre: meilleur.name, date: String(meilleur.modifiedTime || '').slice(0, 10), texte: texte.slice(0, 6000), coupe: texte.length > 6000 };
  }

  async function verifierDossier() {
    const id = compte()?.dossier_id;
    if (id) {
      const lu = await driveFetch(`/drive/v3/files/${encodeURIComponent(id)}?fields=id,trashed`);
      if (lu.ok && !lu.data.trashed) return;
      if (!lu.ok && lu.status !== 404) { noter('dossier', lu.status, lu.data?.error?.message); throw new DriveError('Google Drive refuse l’accès au dossier.'); }
    }
    await dossier({ recreer: true });
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
    if (!estProprietaire(utilisateur(req))) return res.redirect('/?drive=refuse');
    if (!attendu || req.query.state !== attendu) { noter('retour', 'session perdue : rouvrez /api/drive/connecter dans le même navigateur'); return res.redirect('/?drive=refuse'); }
    if (req.query.error || !req.query.code) { noter('autorisation', req.query.error || 'aucun code reçu de Google'); return res.redirect('/?drive=annule'); }
    try {
      const { ok, data } = await jetonGoogle({ grant_type: 'authorization_code', code: String(req.query.code), redirect_uri: retour() });
      if (!ok || !data.refresh_token) { noter('autorisation', data.error || 'pas de refresh_token', data.error_description); return res.redirect('/?drive=erreur'); }
      if (!String(data.scope || SCOPE).split(' ').includes(SCOPE)) { noter('autorisation', 'la case Google Drive n’a pas été cochée'); return res.redirect('/?drive=annule'); }
      db.prepare('INSERT INTO drive_compte (id, jeton, dossier_id, connecte_le) VALUES (1, ?, NULL, ?) ON CONFLICT(id) DO UPDATE SET jeton = excluded.jeton, dossier_id = NULL, connecte_le = excluded.connecte_le').run(chiffrer(data.refresh_token), now());
      acces = { jeton: data.access_token || '', expire: data.access_token ? Date.now() + Math.max(60, (Number(data.expires_in) || 3600) - 120) * 1000 : 0 };
      effacerErreur();
      await dossier().catch(() => {});
      console.log('Google Drive relié à Mande-IA.');
      res.redirect('/?drive=ok');
    } catch (error) {
      noter('retour', error.message);
      res.redirect('/?drive=erreur');
    }
  });

  app.get('/api/drive/diagnostic', async (req, res) => {
    res.set('cache-control', 'no-store');
    const envoyer = (lignes) => res.type('text/plain; charset=utf-8').send(lignes.join('\n'));
    const coche = (valeur) => (valeur ? '✅' : '❌');
    const lignes = ['Diagnostic Google Drive de Mande-IA', `Version du serveur : ${VERSION}, démarré le ${DEMARRE.slice(0, 16).replace('T', ' ')} UTC`, ''];
    const user = utilisateur(req);
    if (!user) return envoyer([...lignes, '❌ Vous n’êtes pas connecté à Mande-IA dans ce navigateur.', '', 'À faire : connectez-vous à Mande-IA, puis rouvrez cette page.']);
    lignes.push(`✅ Connecté à Mande-IA : ${user.email}`);
    lignes.push(`${coche(process.env.GOOGLE_CLIENT_ID)} GOOGLE_CLIENT_ID lu dans .env`);
    lignes.push(`${coche(process.env.GOOGLE_CLIENT_SECRET)} GOOGLE_CLIENT_SECRET lu dans .env`);
    lignes.push(`${coche(proprietaire())} DRIVE_PROPRIETAIRE lu dans .env`);
    lignes.push(`${coche(process.env.SESSION_SECRET)} SESSION_SECRET lu dans .env${process.env.SESSION_SECRET ? '' : ' (sans lui, tout le monde est déconnecté à chaque redémarrage)'}`);
    if (!configure()) return envoyer([...lignes, '', 'À faire : ajoutez la ligne manquante dans .env, puis redémarrez le projet Node.']);
    lignes.push(`${coche(estProprietaire(user))} Ce compte est le propriétaire du Drive`);
    if (!estProprietaire(user)) return envoyer([...lignes, '', 'À faire : connectez-vous à Mande-IA avec l’adresse écrite dans DRIVE_PROPRIETAIRE (même orthographe), ou corrigez-la dans .env puis redémarrez.']);
    lignes.push(`Adresse de retour déclarée chez Google : ${retour()}`);
    lignes.push(`${coche(connecte())} Google Drive relié`);
    if (connecte()) {
      try {
        await verifierDossier();
        effacerErreur();
        lignes.push(`✅ Dossier « ${nomDossier()} » présent dans le Drive`);
        const parent = compte()?.dossier_id;
        const fichiers = await lister(parent);
        const ajoutes = await garnir(parent, fichiers);
        const verifies = [...ajoutes, ...fichiers].filter((f) => f.name.startsWith(PREFIXE_VERIFIE)).length;
        lignes.push(`${coche(verifies >= dossiersVerifies().length)} Dossiers vérifiés dans le Drive : ${verifies} sur ${dossiersVerifies().length}${ajoutes.length ? ` (${ajoutes.length} copié${ajoutes.length > 1 ? 's' : ''} à l’instant)` : ''}`);
        lignes.push(`Documents dans le dossier : ${fichiers.length + ajoutes.length}`);
      }
      catch (error) { lignes.push(`❌ Dossier « ${nomDossier()} » : ${error.message}`); }
    }
    const erreur = db.prepare('SELECT quand, etape, detail FROM drive_erreur WHERE id = 1').get();
    lignes.push('', erreur ? `Dernière erreur (${erreur.quand.slice(0, 16).replace('T', ' ')} UTC), ${erreur.etape} : ${erreur.detail}` : 'Aucune erreur enregistrée.');
    if (connecte()) lignes.push(`Outils Drive du mode scène : ${[DRIVE_TOOL, DRIVE_LIRE_TOOL].map((t) => t.name).join(', ')}`);
    if (!connecte()) lignes.push('', `À faire : ouvrez ${retour().replace(/retour$/, 'connecter')} et acceptez chez Google.`);
    else if (!lignes.some((l) => l.startsWith('❌'))) lignes.push('', 'Tout est en ordre : touchez « Drive » sous une réponse de Mande-IA.');
    envoyer(lignes);
  });

  app.post('/api/drive/deconnecter', async (req, res) => {
    if (!estProprietaire(utilisateur(req))) return res.status(403).json({ error: 'Réservé au propriétaire du Drive.' });
    const ligne = compte();
    if (ligne) {
      try { await fetch(`${REVOKE_URL}?${new URLSearchParams({ token: dechiffrer(ligne.jeton) })}`, { method: 'POST', signal: AbortSignal.timeout(15000) }); } catch {}
      oublier();
      noter('liaison', 'Drive délié volontairement depuis Paramètres');
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

  app.post('/api/drive/consulter', limite, async (req, res) => {
    if (!estProprietaire(utilisateur(req))) return res.status(403).json({ error: 'Réservé au propriétaire du Drive.' });
    try {
      res.json(await consulter({ titre: req.body?.titre }));
    } catch (error) {
      res.status(error.status || 502).json({ error: error instanceof DriveError ? error.message : 'Google Drive ne répond pas pour le moment.' });
    }
  });

  return {
    outilsScene: (user) => (estProprietaire(user) && connecte() ? { tools: [DRIVE_TOOL, DRIVE_LIRE_TOOL], instruction: driveInstruction(nomDossier()) } : { tools: [], instruction: '' })
  };
}

module.exports = { setupDrive };
