import React, { useState } from 'react';
import { Sparkles, ArrowUpRight, Copy, Check, Eye } from 'lucide-react';
import { SHOWCASE_ITEMS } from '../data/mockData';
import { ShowcaseItem } from '../types';

interface DesignGalleryProps {
  onSelectComponent: (item: ShowcaseItem) => void;
  onCopyNotice: (msg: string) => void;
}

export const DesignGallery: React.FC<DesignGalleryProps> = ({ onSelectComponent, onCopyNotice }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filters = ['All', 'SaaS', 'FinTech', 'Spatial UI', 'E-Commerce'];

  const filteredItems = selectedFilter === 'All'
    ? SHOWCASE_ITEMS
    : SHOWCASE_ITEMS.filter(item => item.category === selectedFilter);

  const handleCopy = (e: React.MouseEvent, item: ShowcaseItem) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.codeSnippet);
    setCopiedId(item.id);
    onCopyNotice(`📋 Copied ${item.title} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section id="showcase-section" className="py-24 relative bg-[#07090D] border-t border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Model Showcase</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Synthesized with Mande-AI
            </h2>
            <p className="text-zinc-400 text-base mt-2 max-w-xl">
              Inspect production layouts generated natively by the model. Click any card to inspect or test inside the interactive studio.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  selectedFilter === filter
                    ? 'bg-emerald-500 text-black font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-[#121620] text-zinc-400 border border-white/10 hover:text-white hover:bg-[#181E2B]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectComponent(item)}
              className="group cursor-pointer rounded-3xl bg-[#0D1017] border border-white/10 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Card Image Preview */}
              <div className="relative aspect-[16/9] overflow-hidden bg-[#090B10]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D1017] via-transparent to-transparent" />

                {/* Floating Category Badge */}
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[11px] font-mono text-emerald-400">
                  {item.badge}
                </div>

                {/* Floating Metric */}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md text-[11px] font-mono text-emerald-300">
                  {item.stats.label}: {item.stats.value}
                </div>
              </div>

              {/* Card Content Footer */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {item.title}
                    </h3>
                    <ArrowUpRight className="w-5 h-5 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-500">
                    Category: <span className="text-zinc-300">{item.category}</span>
                  </span>

                  <button
                    onClick={(e) => handleCopy(e, item)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-200 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
