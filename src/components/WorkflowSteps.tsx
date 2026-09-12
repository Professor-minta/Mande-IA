import React from 'react';
import { Bot, Search, Cpu, CheckCircle2, Globe, Shield, Mic } from 'lucide-react';

export const WorkflowSteps: React.FC = () => {
  const steps = [
    {
      stepNumber: "01",
      title: "Compréhension d'Intention & Planner",
      description: "L'utilisateur interagit naturellement en Bamanankan, Français ou Anglais. L'Agent Core analyse la requête, extrait l'intention métier (discussion, explication, recherche, synthèse) sans friction.",
      badge: "Bamanankan-First • NLP",
      icon: Bot,
      details: ["Support natif Bamanankan", "Détection automatique d'intention", "Normalisation linguistique mandingue"],
      image: "https://cdn.prod.website-files.com/68f4ee72649c170da7026b71/68f861ea6894c6e329567a39_Step%2001%20Image.avif"
    },
    {
      stepNumber: "02",
      title: "Routage d'Outils & Recherche Web Exa",
      description: "L'Agent Core décide de manière autonome si des données fraîches sont nécessaires. Si oui, il convoque Exa Web Search pour interroger et indexer des sources fiables en temps réel.",
      badge: "Exa Search • Décision Autonome",
      icon: Search,
      details: ["Décision dynamique d'outils", "Recherche web sémantique Exa", "Indexation de sources vérifiées"],
      image: "https://cdn.prod.website-files.com/68f4ee72649c170da7026b71/68f863eab6a0084f6a3a8292_Step%2002%20Image.avif"
    },
    {
      stepNumber: "03",
      title: "Passerelle OpenRouter & Extension Vocale",
      description: "Abstraction multi-modèles via OpenRouter garantissant zéro fuite de clés API côté client. Architecture prête pour le pipeline oral Speech-to-Speech (STT ➔ Agent Core ➔ TTS).",
      badge: "OpenRouter Gateway • Voix",
      icon: Cpu,
      details: ["Isolation sécurisée des clés API", "Routage multi-LLM intelligent", "Pipeline vocal STT/TTS Bamanankan"],
      image: "https://cdn.prod.website-files.com/68f4ee72649c170da7026b71/68f864ec186fad2be59a9be6_Step%203%20Image.avif"
    }
  ];

  return (
    <section id="architecture-section" className="py-24 relative bg-[#07090D] border-t border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-4">
            <Globe className="w-3.5 h-3.5" />
            <span>Architecture Cible // Mande-IA v2.0</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Fonctionnement de l'Agent Core
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
            Un pipeline agentique moderne remplaçant le simple chatbot par une orchestration d'outils, une recherche augmentée Exa et une passerelle OpenRouter sécurisée.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative rounded-3xl bg-[#0D1017] border border-white/10 p-6 sm:p-8 flex flex-col justify-between overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 shadow-xl"
              >
                {/* Step number watermark */}
                <div className="absolute top-4 right-6 text-5xl font-extrabold font-mono text-white/[0.04] select-none pointer-events-none group-hover:text-emerald-500/10 transition-colors">
                  {item.stepNumber}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      Étape {item.stepNumber}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    {item.description}
                  </p>

                  <ul className="space-y-2 mb-6 text-xs text-zinc-300">
                    {item.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Step Visual Preview Card */}
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#07090D] aspect-[16/10] flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-100"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 text-[11px] font-mono text-zinc-300 bg-black/70 px-2.5 py-1 rounded backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{item.badge}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
