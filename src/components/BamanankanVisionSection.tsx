import React from 'react';
import { Globe, Mic, Smartphone, Sparkles, Layers, Compass, ArrowRight } from 'lucide-react';

export const BamanankanVisionSection: React.FC = () => {
  const futureItems = [
    {
      title: "Voice AI",
      description: "Parlez naturellement avec Mande-IA.",
      icon: Mic
    },
    {
      title: "Mobile",
      description: "Emportez votre assistant partout.",
      icon: Smartphone
    },
    {
      title: "Better Bamanankan AI",
      description: "Améliorer continuellement la compréhension et la génération en Bamanankan.",
      icon: Sparkles
    },
    {
      title: "More African Languages",
      description: "Étendre progressivement l'expérience à d'autres langues africaines.",
      icon: Globe
    },
    {
      title: "More Agents",
      description: "Connecter Mande-IA à davantage d'outils et de services.",
      icon: Layers
    }
  ];

  return (
    <section id="vision-section" className="py-24 relative overflow-hidden bg-[#08090C] border-t border-white/5">
      {/* Ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section 12: Bamanankan */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-4">
            <Globe className="w-3.5 h-3.5" />
            <span>BAMANANKAN FIRST</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-6 font-['Plus_Jakarta_Sans'] leading-tight">
            Construire l'IA dans nos langues.
          </h2>

          <p className="text-zinc-300 text-base sm:text-lg leading-relaxed mb-8 max-w-3xl mx-auto font-normal">
            L'avenir de l'intelligence artificielle ne doit pas être limité aux langues les mieux représentées sur Internet. Mande-IA explore une autre voie : construire des expériences IA pensées dès le départ pour les langues et les communautés africaines.
          </p>

          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold text-sm sm:text-base shadow-lg shadow-emerald-500/5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Bamanankan aujourd'hui. D'autres langues demain.</span>
          </div>
        </div>

        {/* Section 13: Vision */}
        <div className="max-w-5xl mx-auto mb-24 p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#0D121B] to-[#080B10] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300 text-xs font-mono uppercase tracking-wider mb-4">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>NOTRE VISION</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-6 font-['Plus_Jakarta_Sans']">
              Faire en sorte que la langue ne soit jamais une barrière pour accéder à l'intelligence artificielle.
            </h3>

            <p className="text-zinc-300 text-base sm:text-lg leading-relaxed max-w-3xl">
              Mande-IA commence avec le Bamanankan. Notre ambition est de contribuer à un écosystème où les langues africaines peuvent participer pleinement à la révolution de l'IA — dans l'éducation, le travail, la création, les services et la vie quotidienne.
            </p>
          </div>
        </div>

        {/* Section 14: Future */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 font-['Plus_Jakarta_Sans']">
              Ce n'est que le début.
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              Les prochaines étapes de la feuille de route Mande-IA.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {futureItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#0D1017] border border-white/10 hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-emerald-400 mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2 font-['Plus_Jakarta_Sans']">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-white/5 text-[10px] font-mono text-emerald-400/70 uppercase">
                    Roadmap
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
