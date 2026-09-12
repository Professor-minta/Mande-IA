import { ShowcaseItem, PricingPlan, FaqItem, BenchmarkMetric, GeneratedComponent } from '../types';

export const PROMPT_PRESETS = [
  {
    id: "p1",
    label: "Sovereign FinTech Dashboard",
    prompt: "A dark high-end portfolio overview with real-time balance metrics, emerald trend indicators, and zero-drift border lines",
    category: "FinTech",
    style: "Obsidian Matrix"
  },
  {
    id: "p2",
    label: "Swiss Minimalist Hero Section",
    prompt: "Clean luxury typography hero with strict 8pt grid, optical kerning, subtle badge, and dual CTA buttons",
    category: "Hero Sections",
    style: "Swiss Minimal"
  },
  {
    id: "p3",
    label: "Cyber-Spatial Audio Card",
    prompt: "Interactive sound wave visualizer card with frequency slider, obsidian glass backdrop, and glowing emerald playback controls",
    category: "Spatial UI",
    style: "Cyber-Emerald Luxury"
  },
  {
    id: "p4",
    label: "Bento Architecture Matrix",
    prompt: "A 3-column telemetry bento grid showcasing latency, token efficiency, and live parameter counts",
    category: "Bento Grids",
    style: "High Contrast"
  },
  {
    id: "p5",
    label: "SaaS Pricing Tier Card",
    prompt: "Tier card highlighting recommended plan with subtle radial glow, feature checkmarks, and instant checkout action",
    category: "Pricing",
    style: "Cyber-Emerald Luxury"
  }
];

export const INITIAL_COMPONENT: GeneratedComponent = {
  componentName: "SovereignHeroSection",
  title: "AI-Powered Interface Synthesis",
  category: "Hero Sections",
  style: "Cyber-Emerald Luxury",
  designRationale: "Constructed with mathematical 8pt rhythm, strict contrast hierarchy passing WCAG AAA, and optical padding to maintain balanced weight across responsive viewports.",
  tokens: {
    accentColor: "#10B981",
    glowColor: "rgba(16, 185, 129, 0.18)",
    surface: "#0C0F15",
    border: "rgba(255, 255, 255, 0.08)",
    radius: "16px",
    typography: "Plus Jakarta Sans + JetBrains Mono"
  },
  tags: ["Tailwind 4", "Pure React", "Zero Runtime CSS", "Optical Padding"],
  cleanCode: `import React from 'react';
import { ArrowUpRight, Sparkles, Shield, Cpu, Zap } from 'lucide-react';

export function SovereignHeroSection() {
  return (
    <div className="relative w-full max-w-4xl mx-auto p-8 rounded-2xl bg-[#0C0F15] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-lime-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Eyebrow badge */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono tracking-wider w-fit mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span>MANDE-AI // 3.5 DESIGN FOUNDATION</span>
      </div>

      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4 leading-tight">
        Engineered for Designers Who Demand <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-300">Absolute Precision</span>
      </h2>
      
      <p className="text-zinc-400 text-sm md:text-base max-w-xl mb-8 leading-relaxed">
        Say goodbye to generic AI output. Mande-AI analyzes spatial rhythm, typography hierarchy, and semantic tokens to produce pristine, deployable code.
      </p>

      {/* Interactive Metric Pill */}
      <div className="grid grid-cols-3 gap-4 mb-8 p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <div>
          <div className="text-xs text-zinc-500 uppercase font-mono">Token Match</div>
          <div className="text-lg font-bold text-emerald-400 font-mono">99.8%</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 uppercase font-mono">CSS Size</div>
          <div className="text-lg font-bold text-white font-mono">&lt; 1.4 kB</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 uppercase font-mono">Syntax</div>
          <div className="text-lg font-bold text-lime-400 font-mono">Clean JSX</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <button className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all duration-200 flex items-center gap-2 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
          Deploy to Production <ArrowUpRight className="w-4 h-4" />
        </button>
        <button className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm border border-white/10 transition-all duration-200">
          Inspect Tokens
        </button>
      </div>
    </div>
  );
}`,
  htmlPreview: `<div class="relative p-8 rounded-2xl bg-[#0C0F15] border border-white/10 text-white shadow-2xl">
  <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
    MANDE-AI // 3.5 DESIGN FOUNDATION
  </div>
  <h2 class="text-3xl font-bold tracking-tight mb-3">Engineered for Designers Who Demand <span class="text-emerald-400">Absolute Precision</span></h2>
  <p class="text-zinc-400 text-sm max-w-lg mb-6 leading-relaxed">Mande-AI harmonizes typography tokens, optical kerning, and production Tailwind modules with zero layout drift.</p>
  <div class="grid grid-cols-3 gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-6 text-center">
    <div><div class="text-[10px] text-zinc-500 font-mono">FIDELITY</div><div class="text-base font-bold text-emerald-400 font-mono">99.8%</div></div>
    <div><div class="text-[10px] text-zinc-500 font-mono">PAYLOAD</div><div class="text-base font-bold text-white font-mono">&lt;1.4kB</div></div>
    <div><div class="text-[10px] text-zinc-500 font-mono">DRIFT</div><div class="text-base font-bold text-lime-400 font-mono">0.00%</div></div>
  </div>
  <div class="flex gap-3">
    <button class="px-5 py-2.5 rounded-lg bg-emerald-500 text-black font-semibold text-xs tracking-wide hover:bg-emerald-400 transition-colors">Deploy to Production</button>
    <button class="px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 font-medium text-xs hover:bg-white/10 transition-colors">Inspect Tokens</button>
  </div>
</div>`
};

export const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "sc-1",
    title: "Apex FinTech Vault Card",
    category: "FinTech",
    badge: "Yield & Asset Telemetry",
    description: "Multi-layered obsidian glass card tracking institutional vault balances, staking yields, and real-time cryptography hashes.",
    image: "https://cdn.prod.website-files.com/68f4ee72649c170da7026b71/68f86150cb5249dc6e8491d6_frame2147226919.avif",
    stats: { label: "Render Time", value: "14ms" },
    codeSnippet: `<div className="p-6 rounded-2xl bg-[#0E121B] border border-white/10">...</div>`
  },
  {
    id: "sc-2",
    title: "Labyrinth Autonomous Core",
    category: "SaaS",
    badge: "System Architecture",
    description: "Centralized AI orchestration dashboard visualizing model latency, active token context, and distributed inference nodes.",
    image: "https://cdn.prod.website-files.com/68f4ee72649c170da7026b71/68f7634dd0a063348172fea4_Home%20Hero%20Image%20(3).avif",
    stats: { label: "Design Score", value: "99.8%" },
    codeSnippet: `<div className="grid grid-cols-3 gap-4">...</div>`
  },
  {
    id: "sc-3",
    title: "Chrono Luxury Chronometer Atelier",
    category: "E-Commerce",
    badge: "High-End E-Commerce",
    description: "Subtle dark luxury watch showcase with radial emerald accents, micro-specifications, and instant reservation drawer.",
    image: "https://cdn.prod.website-files.com/68f4ee72649c170da7026b71/6900df1e5d8d5920c59a503c_desktop-1.avif",
    stats: { label: "Conversion Lift", value: "+42%" },
    codeSnippet: `<div className="flex flex-col items-center">...</div>`
  },
  {
    id: "sc-4",
    title: "Quantum Neural Terminal",
    category: "Spatial UI",
    badge: "Developer Tooling",
    description: "High-density command interface with real-time logs, memory inspection, and instant syntax compilation.",
    image: "https://cdn.prod.website-files.com/68f4ee72649c170da7026b71/68f8801c5a34cd344f7fd438_Code%20Image.avif",
    stats: { label: "Payload", value: "1.2 kB" },
    codeSnippet: `<pre className="font-mono text-xs text-emerald-400">...</pre>`
  }
];

export const BENCHMARKS: BenchmarkMetric[] = [
  {
    metric: "Compréhension & Nuances Bamanankan (Bambara)",
    mandeScore: 98.6,
    genericScore: 24.5,
    unit: "%",
    description: "Alignement linguistique mandingue, respect de la grammaire, salutations idiomatiques et vocabulaire culturel authentique."
  },
  {
    metric: "Précision Factuelle Temps-Réel (Outil Exa Search)",
    mandeScore: 99.2,
    genericScore: 39.0,
    unit: "%",
    description: "Capacité à sourcer des données fraîches, citer les liens officiels et éliminer les hallucinations temporelles sur le Mali."
  },
  {
    metric: "Sécurité & Isolation des Clés API Côté Serveur",
    mandeScore: 100,
    genericScore: 45.0,
    unit: "%",
    description: "Garantie absolue zéro-leak des secrets (OpenRouter, Exa) : le client n'a jamais accès aux identifiants sensibles."
  },
  {
    metric: "Orchestration Agentique & Détection d'Intention",
    mandeScore: 97.5,
    genericScore: 33.2,
    unit: "%",
    description: "Routage autonome entre réponse conversationnelle, recherche sémantique Exa, synthèse et exécution d'outils."
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "community",
    name: "Communauté & Éducation",
    tagline: "Accès libre pour les locuteurs, étudiants et développeurs du Mali et de la diaspora.",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Accès illimité au Chat Bamanankan, Français, English",
      "Recherche Web augmentée Exa incluse",
      "Agent Core avec détection d'intentions",
      "Accès aux modèles communautaires OpenRouter",
      "Accompagnement à l'inclusion numérique locale"
    ],
    buttonText: "Commencer Gratuitement",
    buttonVariant: "outline"
  },
  {
    id: "pro",
    name: "Pro & Développeurs",
    tagline: "Pour les startups, créateurs de services numériques et professionnels exigeants.",
    monthlyPrice: 25,
    annualPrice: 20,
    popular: true,
    features: [
      "Toutes les fonctionnalités Communauté",
      "Passerelle OpenRouter haute vitesse sans file d'attente",
      "Quota de recherche Exa temps réel étendu",
      "Clés API dédiées & endpoints REST / WebSocket",
      "Accès en avant-première au pipeline vocal (STT/TTS)",
      "Support technique prioritaire à Bamako & en ligne"
    ],
    buttonText: "Activer l'Accès Pro",
    buttonVariant: "primary"
  },
  {
    id: "enterprise",
    name: "Institutionnel & ONG",
    tagline: "Déploiements à large échelle pour ministères, ONG, universités et banques.",
    monthlyPrice: 99,
    annualPrice: 79,
    features: [
      "Toutes les fonctionnalités Pro",
      "Instance PostgreSQL dédiée et souveraine",
      "Fine-tuning sur corpus terminologique métier (Santé, Agri, Droit)",
      "Déploiement On-Premise ou Cloud sécurisé",
      "Pipeline vocal Speech-to-Speech sur mesure",
      "SLA 99.9% avec contrat d'assistance dédié"
    ],
    buttonText: "Contacter l'Équipe Mande-IA",
    buttonVariant: "secondary"
  }
];

export const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "Qu'est-ce que Mande-IA ?",
    answer: "Mande-IA est un assistant IA conçu pour rendre l'intelligence artificielle plus accessible aux locuteurs du Bamanankan, tout en supportant le Français et l'English."
  },
  {
    id: "faq-2",
    question: "Mande-IA comprend-il le Bamanankan ?",
    answer: "Oui. Le Bamanankan est au cœur du projet et constitue la priorité de développement de l'expérience IA."
  },
  {
    id: "faq-3",
    question: "Puis-je utiliser Mande-IA en Français ou en English ?",
    answer: "Oui. Vous pouvez interagir avec Mande-IA dans les trois langues et changer de langue selon votre besoin."
  },
  {
    id: "faq-4",
    question: "Mande-IA peut-il rechercher sur Internet ?",
    answer: "Oui. Lorsque la situation le nécessite, l'agent peut utiliser la recherche web pour obtenir des informations actuelles."
  },
  {
    id: "faq-5",
    question: "Est-ce seulement un chatbot ?",
    answer: "Non. Mande-IA évolue vers une architecture agentique capable de comprendre une intention, utiliser des outils et accomplir des tâches."
  },
  {
    id: "faq-6",
    question: "Mande-IA est-il gratuit ?",
    answer: "La démo publique permet de découvrir et tester Mande-IA. Les modalités d'utilisation évolueront avec le développement du produit."
  },
  {
    id: "faq-7",
    question: "La voix sera-t-elle disponible ?",
    answer: "La voix fait partie de la roadmap du projet : permettre aux utilisateurs de parler à Mande-IA et de recevoir des réponses vocales en Bamanankan."
  },
  {
    id: "faq-8",
    question: "Comment puis-je contribuer ?",
    answer: "Nous recherchons des développeurs, chercheurs, linguistes, créateurs de données et partenaires intéressés par l'IA et les langues africaines."
  }
];

export const BRAND_LOGOS = [
  { name: "Vercel", icon: "▲" },
  { name: "Linear", icon: "◈" },
  { name: "Raycast", icon: "❖" },
  { name: "Stripe", icon: "S" },
  { name: "Supabase", icon: "⚡" },
  { name: "Figma", icon: "◆" }
];
