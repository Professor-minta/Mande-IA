import React from 'react';
import { Sparkles, ArrowRight, Terminal } from 'lucide-react';

interface CtaSectionProps {
  onOpenStudio: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onOpenStudio }) => {
  return (
    <section id="cta-section" className="py-24 relative overflow-hidden bg-[#08090C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative rounded-3xl bg-gradient-to-b from-[#111622] to-[#0A0D14] border border-white/10 p-8 sm:p-16 text-center shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Luminous emerald radiant core */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />

          {/* Background image overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <img
              src="https://cdn.prod.website-files.com/68f4ee72649c170da7026b71/68f61bac449b115b219bf0d2_CTA%20BG.avif"
              alt="Mande AI Network"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Model Generation</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight font-['Plus_Jakarta_Sans']">
              Turn Your Ideas Into Modern Interfaces in Seconds.
            </h2>

            <p className="text-zinc-400 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Type your design intent, let the Mande-AI foundation model handle typography, spacing grids, and zero-drift Tailwind code.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                id="cta-launch-studio-btn"
                onClick={onOpenStudio}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-[0_0_35px_rgba(16,185,129,0.5)] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Mande Studio Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#architecture-section"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm border border-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>View Documentation</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
