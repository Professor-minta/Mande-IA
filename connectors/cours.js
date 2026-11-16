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

const INTRO_ETUDES = [
  '*Réussir ses études*',
  '10 leçons courtes et gratuites pour mieux travailler : organiser sa semaine, prendre des notes, mémoriser, réussir un exposé, rédiger, préparer un examen, écrire un CV.',
  'Ce sont des méthodes qui marchent dans toutes les filières. Une leçon par jour suffit. Écris *leçon* pour la suivante.'
].join('\n\n');

const LECONS_ETUDES = [
  {
    titre: 'Organise ta semaine',
    corps: [
      'Ceux qui réussissent ne travaillent pas toujours plus. Ils savent *quand* ils travaillent.',
      '• Le dimanche, note tes cours, tes devoirs et tes examens de la semaine sur une seule page.\n• Chaque matin, choisis *3 priorités*. Pas dix.\n• Travaille par blocs de 45 minutes, téléphone retourné, puis 10 minutes de pause.\n• Fais le plus difficile au moment où tu as le plus d’énergie.'
    ],
    exercice: 'écris tes 3 priorités de demain avant de dormir.'
  },
  {
    titre: 'Prends des notes utiles',
    corps: [
      'Recopier tout ce que dit le professeur ne sert à rien. Note les *idées*, avec tes mots.',
      'La méthode Cornell divise la page en trois :\n• à droite, tes *notes* pendant le cours ;\n• à gauche, les *mots-clés* et les questions, ajoutés après le cours ;\n• en bas, un *résumé* de 3 lignes.',
      'Relis tes notes dans les 24 heures : c’est le moment où l’on oublie le plus vite.'
    ],
    exercice: 'prends les notes de ton prochain cours avec cette méthode, puis écris le résumé de 3 lignes.'
  },
  {
    titre: 'Mémorise pour de vrai',
    corps: [
      'Relire dix fois donne l’impression de savoir. Deux techniques marchent mieux :',
      '• Le *rappel actif* : ferme le cahier et récite, ou écris ce dont tu te souviens. Vérifie ensuite. L’effort de chercher fixe la mémoire.\n• La *répétition espacée* : revois la leçon le lendemain, puis 3 jours après, puis une semaine après. Chaque rappel la fait durer plus longtemps.',
      'Explique la leçon à un camarade : si tu peux l’expliquer simplement, tu la sais.'
    ],
    exercice: 'choisis une leçon d’hier, ferme le cahier, et écris tout ce dont tu te souviens en 5 minutes.'
  },
  {
    titre: 'Lis un texte difficile',
    corps: [
      'Un texte difficile ne se lit pas comme un roman. Fais-le en 4 temps :',
      '1. *Survole* : titre, sous-titres, introduction, conclusion.\n2. *Questionne* : qu’est-ce que je dois trouver dans ce texte ?\n3. *Lis* en soulignant peu : une idée par paragraphe.\n4. *Résume* en 3 phrases, sans regarder le texte.',
      'Un mot inconnu ? Note-le et continue. Cherche-le à la fin si tu en as encore besoin.'
    ],
    exercice: 'applique les 4 temps à un chapitre de ton cours, et envoie ton résumé de 3 phrases à Mande-IA pour le faire corriger.'
  },
  {
    titre: 'Réussis ton exposé',
    corps: [
      'Un bon exposé, c’est un message clair, pas beaucoup de diapositives.',
      '• Un *plan en 3 parties*, annoncé au début.\n• *Une idée par diapositive*, peu de texte, en gros caractères.\n• Ne lis pas tes diapositives : parle à la salle et regarde les gens.\n• Répète à voix haute, avec un chronomètre, au moins deux fois.\n• Termine par une phrase que l’on retient, puis « Avez-vous des questions ? ».'
    ],
    exercice: 'présente ton prochain sujet en 2 minutes devant un ami, et demande-lui ce qu’il a retenu.'
  },
  {
    titre: 'Écris clairement',
    corps: [
      'Un correcteur fatigué donne de meilleures notes aux copies faciles à lire.',
      '• *Une idée par paragraphe*, annoncée dans sa première phrase.\n• Des phrases courtes : sujet, verbe, complément.\n• L’introduction en 3 temps : le sujet, la question posée, le plan.\n• Des mots de liaison : d’abord, ensuite, cependant, donc.\n• Relis à voix haute : si tu manques de souffle, la phrase est trop longue.'
    ],
    exercice: 'écris l’introduction de ton prochain devoir en 5 lignes, et demande à Mande-IA de la corriger.'
  },
  {
    titre: 'Cite tes sources',
    corps: [
      'Copier un texte sans le dire s’appelle du plagiat. C’est une faute grave à l’université, et les enseignants le repèrent facilement.',
      '• Si tu recopies une phrase : mets-la « entre guillemets » et indique l’auteur et l’année.\n• Si tu reformules une idée : cite quand même l’auteur.\n• À la fin du devoir, une *bibliographie* : auteur, titre, année, et l’adresse pour un site web.',
      'Une IA peut t’aider à comprendre et à corriger. Le devoir, lui, doit être le tien.'
    ],
    exercice: 'reprends ton dernier devoir et vérifie que chaque idée empruntée a sa source.'
  },
  {
    titre: 'Prépare un examen',
    corps: [
      'On ne prépare pas un examen la veille.',
      '• Pars de la date de l’examen et *remonte en arrière* : répartis les chapitres sur les jours disponibles.\n• Travaille sur les *anciens sujets* : c’est le meilleur entraînement.\n• Entraîne-toi dans les vraies conditions : même durée, sans cahier, sans téléphone.\n• La veille, révise légèrement et *dors*. Le sommeil fixe ce que tu as appris.\n• Le jour même, lis tout le sujet avant d’écrire, et commence par ce que tu sais.'
    ],
    exercice: 'écris la date de ton prochain examen et le chapitre à revoir chaque jour jusque-là.'
  },
  {
    titre: 'Travaille en groupe',
    corps: [
      'Un groupe de travail peut te faire gagner des heures, ou t’en faire perdre.',
      '• 3 ou 4 personnes, pas plus.\n• Un *objectif* par séance : « finir les exercices du chapitre 2 ».\n• Chacun prépare une partie *avant* la séance et l’explique aux autres : expliquer, c’est apprendre deux fois.\n• Une heure de début et une heure de fin.\n• Un groupe WhatsApp réservé au travail.'
    ],
    exercice: 'propose à 2 camarades une séance d’une heure cette semaine, avec un objectif précis.'
  },
  {
    titre: 'Ton CV et ton e-mail professionnel',
    corps: [
      '*Le CV* tient sur une page : tes coordonnées, ta formation, tes expériences (stages, projets, associations), tes compétences et tes langues. Écris des faits : « J’ai créé le site de mon association », pas « Je suis motivé ».',
      '*L’e-mail* : une adresse sérieuse (prenom.nom), un objet clair (« Candidature au stage de… »), « Bonjour Madame, » ou « Bonjour Monsieur, », trois phrases courtes, « Cordialement, » puis ton nom et ton numéro. Relis avant d’envoyer.',
      'Bravo, tu as terminé ce cours !'
    ],
    exercice: 'écris ton CV sur une page, et demande à Mande-IA de te dire ce qu’il faut améliorer.'
  }
];

const INTRO_ENGLISH = [
  '*English for students*',
  '10 short lessons to speak English at university and at work. Each lesson gives you useful sentences, with the French translation.',
  '10 leçons courtes pour parler anglais à l’université et au travail. Écris *leçon* pour la suivante. Tu peux ensuite parler anglais avec Mande-IA et lui demander de corriger tes fautes.'
].join('\n\n');

const LECONS_ENGLISH = [
  {
    titre: 'Introduce yourself (Se présenter)',
    corps: [
      '• *My name is Awa.* Je m’appelle Awa.\n• *I am from Ségou, in Mali.* Je viens de Ségou, au Mali.\n• *I am a student at the University of Ségou.* Je suis étudiante à l’Université de Ségou.\n• *I study agronomy.* J’étudie l’agronomie.\n• *I am twenty years old.* J’ai vingt ans.\n• *Nice to meet you.* Enchanté(e).',
      'Attention : en anglais on dit « I *am* twenty », jamais « I have twenty ».'
    ],
    exercice: 'écris ta présentation en 4 phrases et envoie-la à Mande-IA pour correction.'
  },
  {
    titre: 'In class (En classe)',
    corps: [
      '• *Could you repeat that, please?* Pouvez-vous répéter, s’il vous plaît ?\n• *I don’t understand.* Je ne comprends pas.\n• *What does “software” mean?* Que veut dire « software » ?\n• *How do you spell it?* Comment ça s’écrit ?\n• *How do you say “ordinateur” in English?* Comment dit-on « ordinateur » en anglais ?\n• *May I ask a question?* Puis-je poser une question ?',
      '« Could you… » et « May I… » sont les formes polies. Utilise-les avec un professeur.'
    ],
    exercice: 'apprends ces 6 phrases par cœur et utilise-en une avec Mande-IA.'
  },
  {
    titre: 'Asking questions (Poser des questions)',
    corps: [
      'Les mots pour interroger :\n• *What* (quoi) : What do you study?\n• *Where* (où) : Where do you live?\n• *When* (quand) : When does the class start?\n• *Why* (pourquoi) : Why do you learn English?\n• *Who* (qui) : Who is your teacher?\n• *How* (comment) : How do you go to school?',
      'L’ordre : mot interrogatif + *do* ou *does* + sujet + verbe. On dit « Where *do* you live? », jamais « Where you live? ».'
    ],
    exercice: 'écris 3 questions à poser à un nouvel ami, puis pose-les à Mande-IA en anglais.'
  },
  {
    titre: 'The present (Le présent)',
    corps: [
      'L’anglais a deux présents :',
      '• *Present simple*, pour les habitudes : *I study every day.* J’étudie tous les jours.\nAvec he, she, it, on ajoute un s : *She studies every day.*\n• *Present continuous*, pour ce qui se passe maintenant : *I am studying now.* Je suis en train d’étudier.\nIl se forme avec *am / is / are* + verbe en *-ing*.',
      'Mots repères : every day, always, often (simple) ; now, at the moment, today (continuous).'
    ],
    exercice: 'écris 2 phrases sur tes habitudes et 2 phrases sur ce que tu fais maintenant.'
  },
  {
    titre: 'The past (Le passé)',
    corps: [
      'Pour une action terminée, on utilise le *past simple*.',
      '• Verbes réguliers : on ajoute *-ed*. work, *worked* ; study, *studied* ; learn, *learned*.\n• Verbes irréguliers, à apprendre par cœur : go, *went* ; have, *had* ; see, *saw* ; make, *made* ; do, *did* ; come, *came* ; take, *took*.',
      '*Yesterday I went to the library and I studied for two hours.*\nPour la négation : *I did not go* (didn’t go). Après *did*, le verbe reste à l’infinitif.'
    ],
    exercice: 'raconte ta journée d’hier en 4 phrases au passé.'
  },
  {
    titre: 'The future (Le futur)',
    corps: [
      '• *will* + verbe, pour une décision prise maintenant ou une prévision : *I will call you tonight.* Je t’appellerai ce soir.\n• *be going to* + verbe, pour un projet déjà décidé : *I am going to study medicine.* Je vais étudier la médecine.',
      'Négation : *I will not* (won’t) ; *I am not going to*.\nQuestion : *Will you come? Are you going to come?*',
      'Mots repères : tomorrow, next week, next year, soon.'
    ],
    exercice: 'écris 3 phrases sur tes projets pour l’année prochaine avec « going to ».'
  },
  {
    titre: 'Tech words (Les mots de la tech)',
    corps: [
      '• *password* : mot de passe\n• *to download* : télécharger (recevoir)\n• *to upload* : envoyer un fichier\n• *file* : fichier ; *folder* : dossier\n• *link* : lien\n• *screen* : écran ; *keyboard* : clavier\n• *software* : logiciel ; *update* : mise à jour\n• *to log in* : se connecter ; *to log out* : se déconnecter\n• *settings* : paramètres',
      '*Click on the link, log in with your password, and download the file.*'
    ],
    exercice: 'mets ton téléphone en anglais pendant une journée et note 5 mots nouveaux.'
  },
  {
    titre: 'Writing an email (Écrire un e-mail)',
    corps: [
      '*Subject: Application for an internship*\n\n*Dear Ms Traoré,*\n\n*I am writing to apply for the internship at your company. I am a second-year student in computer science at the University of Ségou.*\n\n*Please find attached my CV.*\n\n*I look forward to hearing from you.*\n\n*Best regards,*\n*Awa Coulibaly*',
      '« Dear Mr… » pour un homme, « Dear Ms… » pour une femme. « Please find attached » : veuillez trouver ci-joint. « I look forward to hearing from you » : dans l’attente de votre réponse.'
    ],
    exercice: 'écris un e-mail de 5 lignes pour demander un stage, et fais-le corriger par Mande-IA.'
  },
  {
    titre: 'A job interview (Un entretien)',
    corps: [
      '*Tell me about yourself.* Parlez-moi de vous.\n→ *I am a student in… I am interested in… I have experience in…*',
      '*What are your strengths?* Quels sont vos points forts ?\n→ *I am hard-working and I learn quickly.*',
      '*Why do you want this job?* Pourquoi voulez-vous ce poste ?\n→ *Because I want to use my skills and learn from your team.*',
      '*Do you have any questions?*\n→ *Yes. What does a typical day look like?*',
      'Termine par : *Thank you for your time.*'
    ],
    exercice: 'demande à Mande-IA : « Let’s practise a job interview in English. Ask me one question at a time. »'
  },
  {
    titre: 'Keep learning (Continue chaque jour)',
    corps: [
      'On apprend une langue un peu chaque jour, pas en une fois.',
      '• *Listen* 10 minutes par jour : une vidéo ou une chanson, avec les sous-titres en anglais.\n• *Read* à voix haute un petit texte.\n• *Write* 3 phrases sur ta journée.\n• *Speak* avec Mande-IA. Écris-lui : *Let’s practise English. Correct my mistakes and explain them in French.*',
      'Les fautes sont normales : celui qui ne parle pas ne progresse pas.',
      'Well done, you have finished the course!'
    ],
    exercice: 'choisis une des 4 activités et fais-la maintenant, pendant 10 minutes.'
  }
];

const COURS = {
  tech: { nom: 'Cours Tech', description: 'Smartphone, sécurité, IA, web, programmation', intro: INTRO, lecons: LECONS, mots: ['cours tech', 'lecon tech', 'lecons tech'] },
  etudes: { nom: 'Réussir ses études', description: 'Notes, mémoire, exposé, examen, CV', intro: INTRO_ETUDES, lecons: LECONS_ETUDES, mots: ['reussir ses etudes', 'cours etudes', 'cours methode', 'lecon etudes', 'methode de travail'] },
  english: { nom: 'English for students', description: 'Anglais pour l’université et le travail', intro: INTRO_ENGLISH, lecons: LECONS_ENGLISH, mots: ['english for students', 'english course', 'english lesson', 'cours anglais', 'cours d\'anglais', 'cours d’anglais', 'lecon anglais', 'lecon d\'anglais', 'lecon d’anglais'] }
};
const PAR_DEFAUT = 'tech';

const DEBUT = {
  tech: /^(je suis )?(un |une )?(etudiant|etudiante|etudiants|student|students|eleve|cours tech|tech)$/,
  etudes: /^(cours )?(etudes|etude|methode|methodes|reussir|reussir ses etudes)$/,
  english: /^(cours (d )?)?(english|anglais|english for students)$/
};
const LISTE = /^(cours|les cours|autres cours|courses|mes cours)$/;
const SUITE = /^(lecon|lecons|lecon suivante|la suite|suite|suivant|suivante|next|next lesson|lesson|continuer|continue)$/;
const NUMERO = /^(?:lecon|lesson) (\d{1,2})$/;
const ZERO = /^recommencer( le cours)?$/;

function texteLecon(cours, n) {
  const { lecons } = COURS[cours];
  const lecon = lecons[n - 1];
  return [`*Leçon ${n}/${lecons.length} · ${lecon.titre}*`, ...lecon.corps, `*À faire aujourd’hui :* ${lecon.exercice}`].join('\n\n');
}

function commandeCours(texteNormalise) {
  for (const [cours, motif] of Object.entries(DEBUT)) if (motif.test(texteNormalise)) return { action: 'debut', cours };
  if (LISTE.test(texteNormalise)) return { action: 'liste' };
  if (SUITE.test(texteNormalise)) return { action: 'suite' };
  if (ZERO.test(texteNormalise)) return { action: 'zero' };
  const numero = texteNormalise.match(NUMERO);
  if (numero && Number(numero[1]) >= 1) return { action: 'numero', numero: Number(numero[1]) };
  return null;
}

function fichesCours() {
  const catalogue = [
    'Mande-IA propose trois cours gratuits pour les étudiants, de 10 leçons chacun. Sur WhatsApp (+223 92 27 58 84), on écrit « Étudiant » ou « cours », puis « leçon » pour la suivante.',
    ...Object.values(COURS).map((c) => `${c.nom} : ${c.lecons.map((l, i) => `${i + 1}. ${l.titre}`).join(' ; ')}.`),
    'Ne confonds pas ces leçons avec les 10 modules de Minta Academy (https://mintaservices.com/academy/), qui portent sur les serveurs, les sites web et l’IA locale.',
    'Si la personne demande « une leçon » ou « la leçon 4 » sans dire de quel cours, demande-lui lequel des trois elle veut. N’invente jamais un titre de leçon ou de module.'
  ].join('\n\n');
  return [
    { titre: 'Les cours pour étudiants de Mande-IA', corps: catalogue, mots: ['lecon', 'lecons', 'lesson', 'lessons', 'cours whatsapp', 'cours etudiant', 'cours etudiants', 'cours pour etudiant', 'cours gratuit', 'cours gratuits'] },
    ...Object.values(COURS).map((c) => ({ titre: `${c.nom} : les ${c.lecons.length} leçons`, corps: c.lecons.map((l, i) => [`Leçon ${i + 1} : ${l.titre}`, ...l.corps, `À faire : ${l.exercice}`].join('\n')).join('\n\n').replace(/\*/g, ''), mots: c.mots }))
  ];
}

module.exports = { COURS, PAR_DEFAUT, texteLecon, commandeCours, fichesCours };
