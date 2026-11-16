const INTRO = [
  '*Cours Tech pour étudiants*',
  '10 leçons courtes et gratuites sur WhatsApp : ton smartphone, la sécurité de tes comptes, la recherche sur internet, les réseaux sociaux, l’intelligence artificielle, les sites web, le design et la programmation.',
  'Une leçon par jour suffit. Écris *leçon* quand tu veux la suivante.',
  'Entre deux leçons, pose n’importe quelle question à Mande-IA, en français, en anglais ou en bambara.',
  'Enregistre ce numéro sous le nom *Mande-IA* pour le retrouver facilement.'
].join('\n\n');

const LECONS = [
  {
    titre: 'Ton smartphone est un ordinateur',
    corps: [
      'Ton téléphone a un processeur, de la mémoire et un système (Android ou iOS), comme un ordinateur. Bien le régler, c’est déjà de la technologie.',
      '• *Stockage* : quand il est presque plein, le téléphone ralentit. Regarde dans Paramètres, Stockage.\n• *Mises à jour* : elles corrigent des failles de sécurité. Installe-les.\n• *Applications* : installe-les seulement depuis le Play Store ou l’App Store.\n• *Autorisations* : une lampe torche n’a pas besoin de tes contacts. Refuse ce qui est inutile.'
    ],
    exercice: 'ouvre Paramètres, Stockage, et supprime une application que tu n’utilises plus.'
  },
  {
    titre: 'Protège tes comptes',
    corps: [
      'Un compte volé, ce sont tes photos, tes messages et parfois ton argent.',
      '• Un mot de passe *long* (une phrase de 4 mots) protège mieux qu’un mot court et compliqué.\n• Un mot de passe *différent* pour chaque compte. Un gestionnaire gratuit comme Bitwarden les retient pour toi.\n• Active la *validation en deux étapes* : même avec ton mot de passe, un voleur ne peut pas entrer sans ton téléphone.\n• Le code reçu par SMS ne se donne à *personne*, même à quelqu’un qui dit travailler pour WhatsApp ou pour ta banque.'
    ],
    exercice: 'dans WhatsApp, ouvre Paramètres, Compte, Vérification en deux étapes, et active-la.'
  },
  {
    titre: 'Chercher et vérifier une information',
    corps: [
      'Savoir chercher, c’est apprendre plus vite que les autres.',
      '• Écris des *mots-clés précis*, pas une longue phrase.\n• Mets une expression « entre guillemets » pour la trouver exactement.\n• Ajoute *filetype:pdf* pour trouver des cours et des livres en PDF.\n• Avant de croire une information : qui l’a écrite ? À quelle date ? Une deuxième source dit-elle la même chose ?\n• Pour une photo douteuse, utilise la recherche par image (Google Lens).'
    ],
    exercice: 'cherche le sujet de ton prochain cours en ajoutant filetype:pdf, et garde le meilleur document.'
  },
  {
    titre: 'Des réseaux sociaux qui te servent',
    corps: [
      'Les réseaux peuvent te faire perdre du temps, ou t’ouvrir des portes.',
      '• Ton *profil* est ta carte de visite : une vraie photo, ce que tu étudies, ce que tu sais faire.\n• *LinkedIn* pour les stages et l’emploi, *YouTube* pour apprendre, les groupes *WhatsApp* pour réviser à plusieurs.\n• Publie ce que tu apprends, une fois par semaine : c’est comme ça qu’on se fait connaître.\n• Ce que tu publies reste. Un recruteur regardera.\n• Une offre trop belle, ou une demande d’argent pour « débloquer » un gain, est une arnaque.'
    ],
    exercice: 'écris en deux lignes qui tu es et ce que tu apprends, et mets-le sur un de tes profils.'
  },
  {
    titre: 'L’intelligence artificielle, c’est quoi ?',
    corps: [
      'Une IA comme Mande-IA a lu énormément de textes. Elle a appris à calculer la suite la plus probable d’une phrase. Elle ne « sait » pas comme un humain.',
      '• Elle est forte pour *expliquer, résumer, traduire, corriger* et donner des idées.\n• Elle peut se tromper avec assurance, et même inventer. Vérifie toujours les chiffres, les dates et les citations.\n• Ne lui donne jamais un mot de passe ni une information très privée.\n• Pour tes études, utilise-la pour *comprendre*, pas pour copier : à l’examen, tu seras seul.'
    ],
    exercice: 'demande à Mande-IA d’expliquer une notion difficile de ton cours « comme à un élève de 10 ans ».'
  },
  {
    titre: 'Bien parler à une IA',
    corps: [
      'La qualité de la réponse dépend de ta demande. Donne 4 éléments :',
      '1. *Rôle* : « Tu es un professeur de mathématiques. »\n2. *Contexte* : « Je suis en première année et je n’ai pas compris les dérivées. »\n3. *Tâche* : « Explique-moi avec un exemple de la vie courante. »\n4. *Format* : « En 5 lignes, puis 3 exercices avec les corrigés. »',
      'Si la réponse ne te convient pas, ne recommence pas : dis ce qui manque. « Plus simple », « plus court », « avec un exemple du Mali ».'
    ],
    exercice: 'écris à Mande-IA une demande avec ces 4 éléments sur une matière de ta semaine.'
  },
  {
    titre: 'Comment marche un site web',
    corps: [
      'Quand tu ouvres mintaservices.com, quatre choses travaillent ensemble :',
      '• Le *nom de domaine* est l’adresse du site. Il se loue à l’année.\n• Le *serveur* est un ordinateur allumé jour et nuit, qui garde les fichiers du site.\n• Le *DNS* est l’annuaire qui relie le nom au serveur.\n• La page est écrite en trois langages : *HTML* pour le contenu, *CSS* pour l’apparence, *JavaScript* pour les actions.',
      'Le cadenas *HTTPS* signifie que l’échange entre toi et le site est chiffré.'
    ],
    exercice: 'dans Chrome, écris view-source: devant l’adresse d’un site que tu aimes, et repère les balises <h1> et <p>.'
  },
  {
    titre: 'Le web design en 4 règles',
    corps: [
      'Un beau visuel n’est pas une question de talent. Ce sont des règles :',
      '• *Contraste* : texte foncé sur fond clair, ou l’inverse. Si on doit plisser les yeux, c’est raté.\n• *Alignement* : tout est aligné sur quelque chose. Rien n’est posé au hasard.\n• *Espace* : laisse du vide autour des éléments. Le vide aide à lire.\n• *Hiérarchie* : le plus important est le plus gros. Un seul titre principal.',
      'Limite-toi à 2 polices et 3 couleurs. Outils gratuits : *Canva* pour les affiches, *Figma* pour les maquettes de sites et d’applications.'
    ],
    exercice: 'refais dans Canva l’affiche d’un événement de ta classe en appliquant les 4 règles.'
  },
  {
    titre: 'Premiers pas en programmation',
    corps: [
      'Programmer, c’est donner des instructions très précises. Trois idées suffisent pour commencer : la *variable* (une boîte qui garde une valeur), la *condition* (si… alors…) et la *boucle* (répéter).',
      'En Python :\n```age = 20\nif age >= 18:\n    print("Majeur")\nfor i in range(3):\n    print("I ni ce")```',
      'Tu peux essayer sur ton téléphone avec l’application gratuite *Pydroid 3* (Android), ou en cherchant « Python en ligne ».'
    ],
    exercice: 'recopie ce programme, lance-le, puis change le 3 en 5 et regarde ce qui se passe.'
  },
  {
    titre: 'Ton premier projet, et la suite',
    corps: [
      'On apprend vraiment en construisant quelque chose d’utile.',
      '• Choisis un *petit problème réel* près de toi : l’emploi du temps de ta classe, les prix du marché, la page d’une boutique.\n• Écris en une phrase ce que ton projet fait.\n• Fais la version la plus simple possible, puis montre-la à 3 personnes.\n• Mets ton code sur *GitHub* : c’est le CV d’un développeur.',
      'Pour continuer gratuitement : *Minta Academy*, 10 modules, du nom de domaine à l’IA sans internet : https://mintaservices.com/academy/',
      'Bravo, tu as terminé le Cours Tech !'
    ],
    exercice: 'écris à Mande-IA l’idée de ton projet, et demande-lui un plan en 5 étapes.'
  }
];

const DEBUT = /^(je suis )?(un |une )?(etudiant|etudiante|etudiants|student|students|eleve|cours|cours tech|tech)$/;
const SUITE = /^(lecon|lecons|lecon suivante|la suite|suite|suivant|suivante|next|continuer|continue)$/;
const NUMERO = /^lecon (\d{1,2})$/;
const ZERO = /^recommencer( le cours)?$/;

function texteLecon(n) {
  const lecon = LECONS[n - 1];
  return [`*Leçon ${n}/${LECONS.length} · ${lecon.titre}*`, ...lecon.corps, `*À faire aujourd’hui :* ${lecon.exercice}`].join('\n\n');
}

function commandeCours(texteNormalise) {
  if (DEBUT.test(texteNormalise)) return { action: 'debut' };
  if (SUITE.test(texteNormalise)) return { action: 'suite' };
  if (ZERO.test(texteNormalise)) return { action: 'zero' };
  const numero = texteNormalise.match(NUMERO);
  if (numero && Number(numero[1]) >= 1 && Number(numero[1]) <= LECONS.length) return { action: 'numero', numero: Number(numero[1]) };
  return null;
}

module.exports = { INTRO, LECONS, texteLecon, commandeCours };
