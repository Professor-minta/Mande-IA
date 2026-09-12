import React, { useState, useEffect } from 'react';
import { MandeLogo } from './MandeLogo';
import { Sparkles, Menu, X, ArrowUpRight, Terminal, Cpu, Layers, FileText, Bot } from 'lucide-react';

interface NavbarProps {
  onOpenStudio: () => void;
  onOpenChat?: () => void;
  onSelectPlan?: (planId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenStudio, onOpenChat }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      id="site-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#08090C]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-3.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <a
            id="brand-logo-link"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#121620] to-[#0A0D14] border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:border-emerald-400/40 transition-all duration-300 p-1">
              <MandeLogo size="sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1 font-['Plus_Jakarta_Sans']">
                Mande<span className="text-emerald-400">-IA</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
                Bamanankan AI
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] shadow-inner">
            <button
              id="nav-link-home"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors rounded-full hover:bg-white/[0.04]"
            >
              Accueil
            </button>

            <button
              id="nav-link-features"
              onClick={() => scrollTo('why-mande')}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors rounded-full hover:bg-white/[0.04]"
            >
              Fonctionnalités
            </button>

            <button
              id="nav-link-how-it-works"
              onClick={() => scrollTo('how-it-works')}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors rounded-full hover:bg-white/[0.04]"
            >
              Comment ça marche
            </button>

            <button
              id="nav-link-about"
              onClick={() => scrollTo('vision-section')}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors rounded-full hover:bg-white/[0.04]"
            >
              À propos
            </button>
          </nav>

          {/* Right Action Button - Primary CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              id="nav-primary-cta-btn"
              onClick={() => {
                if (onOpenChat) onOpenChat();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#08090C] font-semibold text-xs transition-all duration-200 flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(16,185,129,0.55)] cursor-pointer"
            >
              <span>Essayer Mande-IA</span>
              <span>→</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-zinc-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 px-4 pb-6 bg-[#0B0E14] border-b border-white/10 shadow-2xl animate-in fade-in duration-200">
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setMobileMenuOpen(false);
              }}
              className="text-left px-4 py-2.5 rounded-lg text-zinc-300 text-sm hover:bg-white/5"
            >
              Accueil
            </button>

            <button
              onClick={() => scrollTo('why-mande')}
              className="text-left px-4 py-2.5 rounded-lg text-zinc-300 text-sm hover:bg-white/5"
            >
              Fonctionnalités
            </button>

            <button
              onClick={() => scrollTo('how-it-works')}
              className="text-left px-4 py-2.5 rounded-lg text-zinc-300 text-sm hover:bg-white/5"
            >
              Comment ça marche
            </button>

            <button
              onClick={() => scrollTo('vision-section')}
              className="text-left px-4 py-2.5 rounded-lg text-zinc-300 text-sm hover:bg-white/5"
            >
              À propos
            </button>

            <button
              onClick={() => {
                if (onOpenChat) onOpenChat();
                setMobileMenuOpen(false);
              }}
              className="mt-2 text-center px-4 py-3 rounded-lg bg-emerald-500 text-black font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <span>Essayer Mande-IA →</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
