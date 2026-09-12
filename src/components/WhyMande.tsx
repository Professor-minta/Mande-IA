import React from 'react';
import { Globe, Search, Bot, Cpu, ArrowUpRight, Sparkles } from 'lucide-react';

export const WhyMande: React.FC = () => {
  const features = [
    {
      num: "01",
      title: "Comprend le Bamanankan",
      description: "Posez vos questions naturellement. Mande-IA est conçu pour comprendre et produire des réponses en Bamanankan, avec la possibilité de passer au Français ou à l'English.",
      icon: Globe,
      badge: null
    },
    {
      num: "02",
      title: "Une IA qui peut rechercher",
      description: "Lorsque votre question nécessite des informations récentes, Mande-IA peut rechercher sur le web et utiliser les résultats pour construire une réponse plus pertinente.",
      icon: Search,
      badge: "Powered by Exa"
    },
    {
      num: "03",
      title: "Un véritable agent IA",
      description: "Mande-IA ne se limite pas à générer du texte. Son architecture lui permet de comprendre votre intention, choisir les outils appropriés et exécuter des actions pour vous aider à atteindre votre objectif.",
      icon: Bot,
      badge: null
    },
    {
      num: "04",
      title: "Plusieurs modèles, une seule expérience",
      description: "Mande-IA utilise une architecture flexible permettant de sélectionner différents modèles d'intelligence artificielle selon la tâche, tout en gardant une expérience simple pour l'utilisateur.",
      icon: Cpu,
      badge: "Powered by OpenRouter"
    }
  ];

  return (
    <section id="why-mande" className="py-24 relative overflow-hidden bg-[#08090C]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-lime-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Eyebrow & H2 & Description */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>POURQUOI MANDE-IA</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 font-['Plus_Jakarta_Sans'] leading-tight">
            Une IA pensée pour vous,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              pas seulement traduite pour vous.
            </span>
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed font-normal">
            Mande-IA place le Bamanankan au cœur de l'expérience tout en donnant accès aux capacités modernes de l'intelligence artificielle.
          </p>
        </div>

        {/* 4 Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.num}
                className="p-8 rounded-2xl bg-[#0D1017] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between shadow-xl"
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>

                    {feat.badge ? (
                      <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300 text-xs font-mono font-medium">
                        {feat.badge}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-zinc-600 font-semibold">
                        FEATURE {feat.num}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors font-['Plus_Jakarta_Sans']">
                    {feat.title}
                  </h3>

                  <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-6 font-normal">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-emerald-400">
                  <span>DISPONIBLE DANS LA DÉMO</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
