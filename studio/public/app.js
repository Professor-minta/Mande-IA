const $ = (id) => document.getElementById(id);
const ETATS = { arrete: 'Arrêté', attente: 'Attend OBS', connexion: 'Connexion…', direct: 'En direct', erreur: 'Erreur' };
const AIDES = {
  facebook: 'Facebook : Live Producer, « Logiciel de streaming », copiez la clé de stream. Cochez « Clé de stream persistante » pour garder la même clé à chaque live.',
  youtube: 'YouTube Studio : Passer au direct, onglet Flux, copiez la clé de stream.',
  tiktok: 'TikTok donne une adresse de serveur et une clé à chaque live (LIVE Studio ou « Diffuser depuis un PC »). Collez les deux ici avant chaque direct.',
  autre: 'Toute plateforme qui accepte le RTMP : collez l\'adresse du serveur et la clé.'
};
let types = {};
let enEdition = null;
let minuterie = null;
let derniere = '';

async function api(chemin, methode = 'GET', corps) {
  const reponse = await fetch(`/api/${chemin}`, { method: methode, headers: corps ? { 'Content-Type': 'application/json' } : {}, body: corps ? JSON.stringify(corps) : undefined });
  const donnees = await reponse.json().catch(() => ({}));
  if (reponse.status === 401 && chemin !== 'connexion') { afficherConnexion(); throw new Error('Connexion requise.'); }
  if (!reponse.ok) throw new Error(donnees.erreur || 'Le serveur ne répond pas.');
  return donnees;
}

function duree(depuis) {
  const s = Math.max(0, Math.floor((Date.now() - depuis) / 1000));
  const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60);
  return `${h ? `${h} h ` : ''}${String(m).padStart(h ? 2 : 1, '0')} min ${String(s % 60).padStart(2, '0')} s`;
}

function afficherConnexion() {
  clearInterval(minuterie);
  $('studio').hidden = true; $('sortir').hidden = true; $('connexion').hidden = false;
  $('motDePasse').focus();
}

function bouton(texte, classe, action) {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = texte; if (classe) b.className = classe;
  b.addEventListener('click', action);
  return b;
}

function dessiner(etat) {
  types = etat.types;
  const s = etat.signal;
  $('voyant').classList.toggle('on', Boolean(s) && !s.coupe);
  $('voyant').classList.toggle('coupe', Boolean(s?.coupe));
  $('titreSignal').textContent = !s ? 'En attente d\'OBS' : s.coupe ? 'Signal coupé' : 'Signal OBS reçu';
  $('detailSignal').textContent = s?.coupe ? 'OBS s\'est déconnecté. S\'il revient dans les 30 secondes, le direct continue sans coupure.' : s ? `${s.largeur} × ${s.hauteur} · ${s.ips} images/s · ${s.kbps} kbps · depuis ${duree(s.depuis)}` : 'Lancez le streaming dans OBS : le signal apparaît ici.';
  $('obsServeur').textContent = etat.obs.serveur;
  $('vide').hidden = etat.destinations.length > 0;

  const liste = $('liste');
  const sousTitre = (d) => `${types[d.type]?.nom || 'Autre'} · clé ••••${d.cleFin}${d.etat === 'direct' ? ` · depuis ${duree(d.depuis)}` : ''}`;
  const empreinte = JSON.stringify(etat.destinations.map((d) => ({ ...d, depuis: 0 })));
  if (empreinte === derniere) {
    etat.destinations.forEach((d, i) => { liste.children[i].querySelector('small').textContent = sousTitre(d); });
    return;
  }
  derniere = empreinte;
  liste.replaceChildren(...etat.destinations.map((d) => {
    const li = document.createElement('li');
    if (d.etat === 'direct') li.className = 'direct';
    if (d.etat === 'erreur') li.className = 'erreur-etat';
    const haut = document.createElement('div'); haut.className = 'haut';
    const nom = document.createElement('div'); nom.className = 'nom';
    const titre = document.createElement('strong'); titre.textContent = d.nom;
    const sous = document.createElement('small');
    sous.textContent = sousTitre(d);
    nom.append(titre, sous);
    const badge = document.createElement('span'); badge.className = `badge ${d.etat}`; badge.textContent = ETATS[d.etat];
    haut.append(nom, badge);
    const actions = document.createElement('div'); actions.className = 'actions';
    actions.append(
      d.actif ? bouton('Arrêter', '', () => agir(`destinations/${d.id}/actif`, 'POST', { actif: false })) : bouton('Lancer', 'principal', () => agir(`destinations/${d.id}/actif`, 'POST', { actif: true })),
      bouton('Modifier', '', () => editer(d)),
      bouton('Supprimer', 'danger', () => { if (confirm(`Supprimer « ${d.nom} » ?`)) agir(`destinations/${d.id}`, 'DELETE'); })
    );
    li.append(haut, actions);
    if (d.erreur) { const pb = document.createElement('p'); pb.className = 'pb'; pb.textContent = `${d.erreur} Nouvel essai automatique.`; li.append(pb); }
    return li;
  }));
}

async function rafraichir() {
  try { dessiner(await api('etat')); } catch { /* la connexion est redemandée par api() */ }
}
async function agir(chemin, methode, corps) {
  try { await api(chemin, methode, corps); } catch (erreur) { alert(erreur.message); }
  rafraichir();
}

function choisirType() {
  const t = $('type').value;
  $('aideType').textContent = AIDES[t];
  if (!enEdition) $('url').value = types[t]?.url || '';
  $('url').placeholder = t === 'tiktok' ? 'rtmp://… (donnée par TikTok)' : 'rtmps://…';
}
function editer(d) {
  enEdition = d.id;
  $('titreForm').textContent = `Modifier « ${d.nom} »`;
  $('type').value = d.type; $('nom').value = d.nom; $('url').value = d.url; $('cle').value = '';
  $('cle').placeholder = 'Laissez vide pour garder la clé actuelle';
  $('boutonForm').textContent = 'Enregistrer'; $('annuler').hidden = false;
  choisirType();
  $('titreForm').scrollIntoView({ behavior: 'smooth' });
}
function viderForm() {
  enEdition = null;
  $('formDestination').reset();
  $('titreForm').textContent = 'Ajouter une destination';
  $('cle').placeholder = ''; $('boutonForm').textContent = 'Ajouter'; $('annuler').hidden = true; $('erreurForm').textContent = '';
  choisirType();
}

async function copier(texte, bouton) {
  const avant = bouton.textContent;
  try { await navigator.clipboard.writeText(texte); bouton.textContent = 'Copié'; } catch { bouton.textContent = 'Copie impossible'; }
  setTimeout(() => { bouton.textContent = avant; }, 1500);
}

async function demarrer() {
  let etat;
  try { etat = await api('etat'); } catch { return; }
  $('connexion').hidden = true; $('studio').hidden = false; $('sortir').hidden = false;
  if (!$('type').options.length) {
    for (const [cle, t] of Object.entries(etat.types)) $('type').add(new Option(t.nom, cle));
    types = etat.types;
    choisirType();
  }
  dessiner(etat);
  clearInterval(minuterie);
  minuterie = setInterval(rafraichir, 2000);
}

$('formConnexion').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('erreurConnexion').textContent = '';
  try { await api('connexion', 'POST', { motDePasse: $('motDePasse').value }); $('motDePasse').value = ''; demarrer(); } catch (erreur) { $('erreurConnexion').textContent = erreur.message; }
});
$('sortir').addEventListener('click', async () => { await api('deconnexion', 'POST', {}).catch(() => {}); afficherConnexion(); });
$('type').addEventListener('change', choisirType);
$('annuler').addEventListener('click', viderForm);
$('formDestination').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('erreurForm').textContent = '';
  const corps = { type: $('type').value, nom: $('nom').value, url: $('url').value, cle: $('cle').value };
  try {
    await api(enEdition ? `destinations/${enEdition}` : 'destinations', enEdition ? 'PUT' : 'POST', corps);
    viderForm(); rafraichir();
  } catch (erreur) { $('erreurForm').textContent = erreur.message; }
});
$('toutLancer').addEventListener('click', () => agir('tout', 'POST', { actif: true }));
$('toutArreter').addEventListener('click', () => agir('tout', 'POST', { actif: false }));
$('copierServeur').addEventListener('click', (e) => copier($('obsServeur').textContent, e.currentTarget));
$('copierCle').addEventListener('click', async (e) => { const b = e.currentTarget; try { copier((await api('cle-obs')).cle, b); } catch { /* connexion redemandée */ } });

demarrer();
