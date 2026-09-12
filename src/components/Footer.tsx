import React from 'react';
import { MandeLogo } from './MandeLogo';
import { Globe } from 'lucide-react';

interface FooterProps {
  onOpenChat?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenChat }) => {
  const scrollTo = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="site-footer" className="bg-[#050608] border-t border-white/5 pt-16 pb-12 text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/5">
          {/* Logo & Subtitle */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#121620] to-[#0A0D14] border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)] p-1">
                <MandeLogo size="sm" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                Mande<span className="text-emerald-400">-IA</span>
              </span>
            </div>
            <p className="text-zinc-300 text-sm font-medium">
              L'IA dans votre langue.
            </p>
            <p className="text-zinc-500 text-xs max-w-md leading-relaxed">
              Assistant IA centré sur le Bamanankan, conçu pour rendre l'intelligence artificielle accessible aux locuteurs du Mali et des communautés mandingues.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <div className="text-white font-semibold text-sm tracking-wide">Navigation</div>
            <ul className="space-y-2">
              <li>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors cursor-pointer">
                  Produit
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('why-mande')} className="hover:text-white transition-colors cursor-pointer">
                  Fonctionnalités
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('live-demo')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Live Demo
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('vision-section')} className="hover:text-white transition-colors cursor-pointer">
                  À propos
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('faq-section')} className="hover:text-white transition-colors cursor-pointer">
                  Contact & FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Languages & Tech */}
          <div className="space-y-4">
            <div>
              <div className="text-white font-semibold text-sm tracking-wide mb-2">Langues</div>
              <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-medium">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bamanankan · Français · English</span>
              </div>
            </div>

            <div>
              <div className="text-white font-semibold text-sm tracking-wide mb-2">Technologie</div>
              <div className="text-zinc-400 text-xs font-mono">
                OpenRouter · Exa · AI Agents
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <div>
            Built in Mali 🇲🇱 for the Mande-speaking world.
          </div>
          <div>
            © 2026 Mande-IA. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
