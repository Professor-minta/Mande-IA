(() => {
  const toile = document.getElementById('coeur');
  const dessin = document.getElementById('scene');
  if (!toile || !dessin) return;
  const c = toile.getContext('2d');
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const TEINTES = { repos: [34, 211, 230], micro: [46, 224, 170], voix: [252, 209, 22], agents: [255, 122, 61] };
  const MALI = [[31, 191, 91], [252, 209, 22], [230, 59, 63]];
  const MOTS = ['BAMANANKAN', 'FRANÇAIS', 'ENGLISH', 'MANDEN', 'KURUKAN FUGA', 'SÉGOU', 'BAMAKO', 'TOMBOUCTOU', 'DJENNÉ', 'I NI CE', 'KALAN', 'BAARA', 'MALI', 'SAHEL', 'VOIX', 'AGENTS'];

  const alea = (() => { let g = 20261116; return () => { g = (g * 1664525 + 1013904223) % 4294967296; return g / 4294967296; }; })();
  const surSphere = (rayon) => {
    const u = alea() * 2 - 1;
    const a = alea() * TAU;
    const r = Math.sqrt(1 - u * u);
    return { x: r * Math.cos(a) * rayon, y: u * rayon, z: r * Math.sin(a) * rayon };
  };
  const points = Array.from({ length: 300 }, (_, i) => ({ ...surSphere(150 + alea() * 78), t: 0.7 + alea() * 1.6, mali: i % 9 === 0 ? MALI[(i / 9) % 3 | 0] : null, phase: alea() * TAU }));
  const mots = MOTS.map((texte, i) => { const a = (i / MOTS.length) * TAU + 0.3; const y = ((i * 5) % 7 - 3) * 34; const r = Math.sqrt(Math.max(1, 205 * 205 - y * y)); return { texte, x: Math.cos(a) * r, y, z: Math.sin(a) * r }; });
  const orbites = [
    { r: 150, aplat: 0.34, angle: 0.5, vitesse: 0.16, tete: 0.0, allure: 0.9 },
    { r: 174, aplat: 0.46, angle: -0.75, vitesse: -0.11, tete: 2.1, allure: -0.7 },
    { r: 198, aplat: 0.3, angle: 1.9, vitesse: 0.08, tete: 4.0, allure: 0.55 },
    { r: 222, aplat: 0.52, angle: -2.3, vitesse: -0.06, tete: 1.2, allure: -0.45 }
  ];
  const ondes = [];

  let ech = 1;
  let cx = 0;
  let cy = 0;
  let large = 0;
  let haut = 0;
  let niveau = 0;
  let teinte = [...TEINTES.repos];
  let rotation = 0;
  let dernier = 0;
  let derniereOnde = 0;

  function mesurer() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cadre = toile.getBoundingClientRect();
    large = cadre.width;
    haut = cadre.height;
    if (toile.width !== Math.round(large * dpr) || toile.height !== Math.round(haut * dpr)) { toile.width = Math.round(large * dpr); toile.height = Math.round(haut * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const boite = dessin.getBoundingClientRect();
    ech = Math.min(boite.width / 1000, boite.height / 680) || 1;
    cx = boite.left - cadre.left + (boite.width - 1000 * ech) / 2 + 500 * ech;
    cy = boite.top - cadre.top + (boite.height - 680 * ech) / 2 + 330 * ech;
  }

  function mode() {
    const etat = document.body.dataset.state;
    if (etat === 'working') return 'agents';
    if (etat !== 'live') return 'repos';
    const voix = document.body.dataset.voice;
    return voix === 'think' ? 'agents' : voix === 'ai' ? 'voix' : 'micro';
  }
  const rgba = (t, a) => `rgba(${t[0] | 0}, ${t[1] | 0}, ${t[2] | 0}, ${Math.max(0, Math.min(1, a))})`;

  function image(temps) {
    const dt = Math.min(0.05, (temps - dernier) / 1000 || 0);
    dernier = temps;
    const m = mode();
    const cible = TEINTES[m];
    for (let i = 0; i < 3; i += 1) teinte[i] += (cible[i] - teinte[i]) * Math.min(1, dt * 4);
    const souffle = 0.1 + 0.06 * Math.sin(temps / 1400);
    const voulu = m === 'repos' ? souffle : Math.max(souffle, Math.min(1, Number(window.sceneNiveau) || 0)) + (m === 'agents' ? 0.25 : 0);
    niveau += (voulu - niveau) * Math.min(1, dt * 9);
    rotation += dt * (0.1 + niveau * 0.45) * (m === 'agents' ? 3 : 1);

    c.clearRect(0, 0, large, haut);
    c.globalCompositeOperation = 'lighter';

    const halo = c.createRadialGradient(cx, cy, 90 * ech, cx, cy, (250 + niveau * 90) * ech);
    halo.addColorStop(0, rgba(teinte, 0.2 + niveau * 0.3));
    halo.addColorStop(0.45, rgba(teinte, 0.07 + niveau * 0.1));
    halo.addColorStop(1, rgba(teinte, 0));
    c.fillStyle = halo;
    c.fillRect(0, 0, large, haut);

    c.lineCap = 'round';
    for (let i = 0; i < 64; i += 1) {
      const a = (i / 64) * TAU + rotation * 0.35;
      const onde = 0.5 + 0.5 * Math.sin(i * 1.7 + temps / 380) * Math.sin(i * 0.63 - temps / 610);
      const debut = 126 * ech;
      const fin = (136 + onde * (18 + niveau * 78)) * ech;
      c.strokeStyle = rgba(teinte, 0.1 + onde * 0.3 * (0.4 + niveau));
      c.lineWidth = 1.4 * ech;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * debut, cy + Math.sin(a) * debut);
      c.lineTo(cx + Math.cos(a) * fin, cy + Math.sin(a) * fin);
      c.stroke();
    }

    if (niveau > 0.3 && temps - derniereOnde > 520 - niveau * 260) { ondes.push({ ne: temps }); derniereOnde = temps; }
    for (let i = ondes.length - 1; i >= 0; i -= 1) {
      const age = (temps - ondes[i].ne) / 1500;
      if (age >= 1) { ondes.splice(i, 1); continue; }
      c.strokeStyle = rgba(teinte, 0.38 * (1 - age));
      c.lineWidth = (2.4 - age * 1.6) * ech;
      c.beginPath();
      c.arc(cx, cy, (124 + age * 150) * ech, 0, TAU);
      c.stroke();
    }

    for (const o of orbites) {
      const angle = o.angle + rotation * o.vitesse * 6;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const lieu = (t) => {
        const x = Math.cos(t) * o.r;
        const y = Math.sin(t) * o.r * o.aplat;
        return [cx + (x * cos - y * sin) * ech, cy + (x * sin + y * cos) * ech];
      };
      c.strokeStyle = rgba(teinte, 0.16 + niveau * 0.14);
      c.lineWidth = 1.2 * ech;
      c.beginPath();
      c.ellipse(cx, cy, o.r * ech, o.r * o.aplat * ech, angle, 0, TAU);
      c.stroke();
      const tete = o.tete + rotation * o.allure * 9;
      const sens = Math.sign(o.allure);
      for (let k = 0; k < 26; k += 1) {
        const [x1, y1] = lieu(tete - sens * k * 0.035);
        const [x2, y2] = lieu(tete - sens * (k + 1) * 0.035);
        c.strokeStyle = rgba(teinte, (1 - k / 26) * (0.5 + niveau * 0.5));
        c.lineWidth = (3.2 - k * 0.1) * ech;
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      }
      const [tx, ty] = lieu(tete);
      const eclat = c.createRadialGradient(tx, ty, 0, tx, ty, 16 * ech);
      eclat.addColorStop(0, 'rgba(255, 255, 255, .95)');
      eclat.addColorStop(0.25, rgba(teinte, 0.8));
      eclat.addColorStop(1, rgba(teinte, 0));
      c.fillStyle = eclat;
      c.beginPath(); c.arc(tx, ty, 16 * ech, 0, TAU); c.fill();
    }

    const ca = Math.cos(rotation);
    const sa = Math.sin(rotation);
    const cb = Math.cos(0.38);
    const sb = Math.sin(0.38);
    const projeter = (p, gonfle) => {
      const x = (p.x * ca + p.z * sa) * gonfle;
      const z0 = (-p.x * sa + p.z * ca) * gonfle;
      const y = p.y * gonfle * cb - z0 * sb;
      const z = p.y * gonfle * sb + z0 * cb;
      return [cx + x * ech, cy + y * 0.86 * ech, z];
    };
    for (const p of points) {
      const [x, y, z] = projeter(p, 1 + niveau * 0.1 + 0.02 * Math.sin(temps / 900 + p.phase));
      const pres = (z + 230) / 460;
      const couleur = p.mali || teinte;
      c.fillStyle = rgba(couleur, (0.12 + pres * 0.7) * (p.mali ? 1 : 0.75 + niveau * 0.25));
      c.beginPath();
      c.arc(x, y, p.t * (0.5 + pres * 0.9) * ech, 0, TAU);
      c.fill();
    }

    c.globalCompositeOperation = 'source-over';
    const corps = Math.max(9.5, 12 * ech);
    c.font = `500 ${corps}px "JetBrains Mono", ui-monospace, monospace`;
    c.textBaseline = 'middle';
    const pris = [];
    for (const mot of ech < 0.5 ? [] : mots.map((mot) => ({ mot, lieu: projeter(mot, 1.04) })).sort((a, b) => b.lieu[2] - a.lieu[2])) {
      const [x, y, z] = mot.lieu;
      if (z < 30 || Math.hypot(x - cx, y - cy) < 150 * ech) continue;
      const droite = x >= cx;
      if (pris.some((p) => p.droite === droite && Math.abs(p.y - y) < corps * 1.5)) continue;
      pris.push({ droite, y });
      const pres = Math.min(1, (z - 30) / 110);
      c.strokeStyle = rgba(teinte, 0.7 * pres);
      c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + (droite ? 14 : -14) * ech, y); c.stroke();
      c.fillStyle = rgba(teinte, pres);
      c.beginPath(); c.arc(x, y, 2.4 * ech, 0, TAU); c.fill();
      c.textAlign = droite ? 'left' : 'right';
      c.fillStyle = `rgba(232, 241, 255, ${0.92 * pres})`;
      c.fillText(mot.mot.texte, x + (droite ? 19 : -19) * ech, y);
    }
  }

  let attente = 0;
  function boucle(temps) {
    if (!document.hidden) image(temps);
    attente = requestAnimationFrame(boucle);
  }
  mesurer();
  new ResizeObserver(mesurer).observe(toile);
  addEventListener('resize', mesurer);
  document.fonts?.ready.then(mesurer);
  if (calme) { rotation = 0.6; image(performance.now()); setInterval(() => image(performance.now()), 1500); } else attente = requestAnimationFrame(boucle);
})();
