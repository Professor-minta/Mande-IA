import React from 'react';
import { Globe2, Sparkles, HeartHandshake } from 'lucide-react';

export const MissionIntro: React.FC = () => {
  return (
    <section id="mission-intro" className="py-20 md:py-28 relative overflow-hidden bg-[#08090C] border-t border-white/5">
      {/* Subtle radial ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono tracking-widest uppercase mb-6">
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>NOTRE MISSION</span>
        </div>

        {/* H2 */}
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-8 font-['Plus_Jakarta_Sans']">
          L'intelligence artificielle ne devrait pas avoir de{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            frontière linguistique.
          </span>
        </h2>

        {/* Text */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <p className="text-base sm:text-xl text-zinc-300 leading-relaxed font-normal">
            Des millions de personnes utilisent déjà l'IA pour apprendre, travailler, créer et résoudre des problèmes.
          </p>
          <p className="text-base sm:text-xl text-zinc-400 leading-relaxed font-normal">
            Mande-IA veut rendre cette expérience plus naturelle pour les communautés qui parlent Bamanankan — et construire une nouvelle génération d'outils IA pour les langues africaines.
          </p>
        </div>
      </div>
    </section>
  );
};
