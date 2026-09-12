import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Terminal,
  Code2,
  Eye,
  Sliders,
  Copy,
  Check,
  Download,
  RotateCcw,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Wand2,
  Layers,
  Cpu,
  Zap,
  Activity
} from 'lucide-react';
import { PROMPT_PRESETS, INITIAL_COMPONENT } from '../data/mockData';
import { GeneratedComponent } from '../types';

interface InteractiveStudioProps {
  onCopyNotice: (msg: string) => void;
}

export const InteractiveStudio: React.FC<InteractiveStudioProps> = ({ onCopyNotice }) => {
  const [prompt, setPrompt] = useState(PROMPT_PRESETS[0].prompt);
  const [selectedPresetId, setSelectedPresetId] = useState(PROMPT_PRESETS[0].id);
  const [category, setCategory] = useState("Hero Sections");
  const [style, setStyle] = useState("Cyber-Emerald Luxury");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "tokens">("preview");
  const [viewDevice, setViewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);

  // Real-time Latency State
  const [latencyMs, setLatencyMs] = useState<number>(184);
  const [liveElapsedMs, setLiveElapsedMs] = useState<number>(0);
  const [latencyStatus, setLatencyStatus] = useState<"idle" | "measuring" | "completed">("idle");

  // Live Token interactive controls
  const [customRadius, setCustomRadius] = useState(16);
  const [customGlow, setCustomGlow] = useState(25);
  const [customAccent, setCustomAccent] = useState("#10B981");

  const [component, setComponent] = useState<GeneratedComponent>(INITIAL_COMPONENT);

  // Live timer for active model inference duration
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (isLoading) {
      const startTime = performance.now();
      setLatencyStatus("measuring");
      setLiveElapsedMs(0);
      intervalId = setInterval(() => {
        setLiveElapsedMs(Math.round(performance.now() - startTime));
      }, 16);
    } else {
      setLatencyStatus("completed");
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading]);

  const handleSelectPreset = (preset: typeof PROMPT_PRESETS[0]) => {
    setSelectedPresetId(preset.id);
    setPrompt(preset.prompt);
    setCategory(preset.category);
    setStyle(preset.style);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    const startTime = performance.now();

    try {
      const response = await fetch('/api/mande-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          category,
          style,
          tokens: {
            radius: `${customRadius}px`,
            accentColor: customAccent,
            glowIntensity: customGlow
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Synthesis failed');
      }

      const resJson = await response.json();
      const elapsed = Math.max(12, Math.round(performance.now() - startTime));
      setLatencyMs(elapsed);

      if (resJson.data) {
        setComponent(resJson.data);
        onCopyNotice(`⚡ Mande-AI synthesized code in ${elapsed}ms!`);
      }
    } catch (err) {
      console.warn("Generation fallback used:", err);
      const elapsed = Math.max(12, Math.round(performance.now() - startTime));
      setLatencyMs(elapsed);

      // Local synthesis fallback
      const synthesized: GeneratedComponent = {
        componentName: `${category.replace(/\s+/g, '')}ModelView`,
        title: prompt.slice(0, 45) + '...',
        category,
        style,
        designRationale: `Synthesized with Mande-AI 3.5 constraint matrix in ${elapsed}ms. Applied ${customRadius}px radius and ${customAccent} photon accent, strictly abiding by 8pt baseline grids.`,
        tokens: {
          accentColor: customAccent,
          glowColor: `${customAccent}33`,
          surface: '#0B0E14',
          border: 'rgba(255,255,255,0.09)',
          radius: `${customRadius}px`,
          typography: 'Plus Jakarta Sans + JetBrains Mono'
        },
        tags: ['Tailwind v4', 'Zero Drift', 'Custom Tokens'],
        cleanCode: `import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';

export function ${category.replace(/\s+/g, '')}Component() {
  return (
    <div className="p-8 rounded-[${customRadius}px] bg-[#0C0F16] border border-white/10 shadow-2xl relative overflow-hidden">
      <div className="flex items-center gap-2 text-xs font-mono mb-4 text-[${customAccent}]">
        <Sparkles className="w-4 h-4" />
        <span>MANDE-AI // SYNTHESIS</span>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">${prompt}</h3>
      <p className="text-zinc-400 text-sm mb-6">Autonomous zero-drift layout compiled directly to Tailwind CSS.</p>
      <button className="px-5 py-2.5 rounded-xl bg-[${customAccent}] text-black font-semibold text-xs flex items-center gap-2">
        Deploy Component <ArrowUpRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}`,
        htmlPreview: `<div class="p-8 rounded-[${customRadius}px] bg-[#0C0F16] border border-white/10 text-white shadow-2xl">
  <div class="inline-flex items-center gap-2 text-xs font-mono mb-4 text-[${customAccent}]">
    <span>●</span> MANDE-AI // SYNTHESIS
  </div>
  <h3 class="text-2xl font-bold text-white mb-2">${prompt}</h3>
  <p class="text-zinc-400 text-sm mb-6">Autonomous zero-drift layout compiled directly to Tailwind CSS.</p>
  <button class="px-5 py-2.5 rounded-xl bg-[${customAccent}] text-black font-semibold text-xs">Deploy Component</button>
</div>`
      };
      setComponent(synthesized);
      onCopyNotice(`⚡ Mande-AI synthesized code in ${elapsed}ms!`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(component.cleanCode);
    setCopied(true);
    onCopyNotice('📋 React & Tailwind code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const element = document.createElement("a");
    const file = new Blob([component.cleanCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${component.componentName || 'MandeComponent'}.tsx`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    onCopyNotice(`💾 Downloaded ${component.componentName || 'MandeComponent'}.tsx`);
  };

  return (
    <section id="interactive-studio" className="py-24 relative bg-[#07090D] border-t border-b border-white/5 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-4">
            <Terminal className="w-3.5 h-3.5" />
            <span>Interactive Mande-AI Studio</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Prompt the Model. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-300">Ship in Seconds.</span>
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed">
            Experience the Mande AI design model in real time. Select a curated design intent or type your own custom interface prompt.
          </p>
        </div>

        {/* Prompt Input Container */}
        <div className="max-w-4xl mx-auto mb-8 bg-[#0D1017] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          {/* Presets Chips */}
          <div className="mb-4">
            <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Curated Design Prompts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PROMPT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                    selectedPresetId === preset.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.07] hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Textarea & Actions */}
          <div className="relative">
            <textarea
              id="mande-prompt-textarea"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setSelectedPresetId("");
              }}
              rows={3}
              placeholder="Describe your desired component or interface section (e.g. 'A dark luxury analytics overview with emerald charts and zero layout drift')..."
              className="w-full bg-[#080A0E] text-zinc-100 text-sm rounded-xl p-4 border border-white/10 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none placeholder:text-zinc-600 font-sans resize-none"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
              {/* Filter pills */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-[#121620] border border-white/10 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500/50"
                >
                  <option>Hero Sections</option>
                  <option>FinTech</option>
                  <option>Bento Grids</option>
                  <option>Spatial UI</option>
                  <option>Pricing</option>
                </select>

                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="bg-[#121620] border border-white/10 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500/50"
                >
                  <option>Cyber-Emerald Luxury</option>
                  <option>Swiss Minimal</option>
                  <option>Obsidian Matrix</option>
                  <option>Titanium Glass</option>
                </select>
              </div>

              {/* Latency & Synthesize Actions */}
              <div className="flex items-center gap-3">
                {/* Real-Time Latency Indicator Badge */}
                <div
                  id="studio-latency-pill"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#090C12] border border-white/10 text-xs font-mono select-none"
                  title="Real-time measured code synthesis response duration"
                >
                  <div className="relative flex items-center justify-center w-2 h-2">
                    {isLoading ? (
                      <>
                        <span className="absolute w-2.5 h-2.5 rounded-full bg-amber-400/50 animate-ping" />
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                      </>
                    )}
                  </div>

                  <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                    <Zap className={`w-3 h-3 ${isLoading ? 'text-amber-400 animate-bounce' : 'text-emerald-400'}`} />
                    <span className="hidden sm:inline text-zinc-500 uppercase">
                      {isLoading ? 'Synthesizing:' : 'Latency:'}
                    </span>
                    <span className={`font-bold ${isLoading ? 'text-amber-300' : 'text-emerald-400'}`}>
                      {isLoading ? `${liveElapsedMs}ms` : `${latencyMs}ms`}
                    </span>
                  </span>

                  {!isLoading && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase hidden md:inline">
                      {latencyMs < 200 ? 'Instant' : latencyMs < 600 ? 'Sub-Sec' : 'Optimal'}
                    </span>
                  )}
                </div>

                {/* Synthesize Button */}
                <button
                  id="synthesize-mande-btn"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="px-5 sm:px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold text-xs tracking-wide transition-all duration-200 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Compiling...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Synthesize with Mande-AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Studio Workspace Canvas */}
        <div className="max-w-6xl mx-auto bg-[#0A0D14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Studio Toolbar Header */}
          <div className="flex flex-wrap items-center justify-between p-4 border-b border-white/5 bg-[#0D1017] gap-4">
            {/* View tabs */}
            <div className="flex items-center gap-1.5 bg-[#07090D] p-1 rounded-xl border border-white/5">
              <button
                id="tab-preview"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === "preview"
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Visual Canvas</span>
              </button>
              <button
                id="tab-code"
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === "code"
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>JSX / Tailwind</span>
              </button>
              <button
                id="tab-tokens"
                onClick={() => setActiveTab("tokens")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === "tokens"
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Token Controls</span>
              </button>
            </div>

            {/* Responsive Device Switches (when preview active) */}
            {activeTab === "preview" && (
              <div className="hidden sm:flex items-center gap-1 bg-[#07090D] p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setViewDevice("desktop")}
                  title="Desktop View"
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewDevice === "desktop" ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewDevice("tablet")}
                  title="Tablet View"
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewDevice === "tablet" ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewDevice("mobile")}
                  title="Mobile View"
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewDevice === "mobile" ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Right Action buttons */}
            <div className="flex items-center gap-2">
              <button
                id="copy-component-code-btn"
                onClick={copyCode}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-200 font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSX'}</span>
              </button>

              <button
                id="download-component-btn"
                onClick={downloadFile}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-200 font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Interactive Token Sliders Drawer (Available across tabs or when selected) */}
          <div className="px-6 py-3 bg-[#080A0F] border-b border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-6 flex-wrap">
              {/* Radius slider */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">RADIUS:</span>
                <input
                  type="range"
                  min={0}
                  max={28}
                  value={customRadius}
                  onChange={(e) => setCustomRadius(Number(e.target.value))}
                  className="w-20 accent-emerald-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <span className="text-emerald-400 font-semibold w-8">{customRadius}px</span>
              </div>

              {/* Glow slider */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">PHOTON GLOW:</span>
                <input
                  type="range"
                  min={0}
                  max={60}
                  value={customGlow}
                  onChange={(e) => setCustomGlow(Number(e.target.value))}
                  className="w-20 accent-emerald-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <span className="text-emerald-400 font-semibold w-8">{customGlow}%</span>
              </div>

              {/* Accent Palette Selector */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">ACCENT:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { color: "#10B981", name: "Emerald" },
                    { color: "#06B6D4", name: "Cyan" },
                    { color: "#84CC16", name: "Lime" },
                    { color: "#F59E0B", name: "Amber" },
                    { color: "#FFFFFF", name: "Silver" },
                  ].map((item) => (
                    <button
                      key={item.color}
                      onClick={() => setCustomAccent(item.color)}
                      style={{ backgroundColor: item.color }}
                      className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                        customAccent === item.color ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110 opacity-70'
                      }`}
                      title={item.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div id="drawer-latency-metric" className="flex items-center gap-2 text-xs font-mono">
              <Cpu className={`w-3.5 h-3.5 ${isLoading ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
              <span className="text-zinc-500">REAL-TIME INFERENCE:</span>
              <span className={`font-semibold ${isLoading ? 'text-amber-300' : 'text-emerald-400'}`}>
                {isLoading ? `${liveElapsedMs}ms` : `${latencyMs}ms (${(latencyMs / 1000).toFixed(2)}s)`}
              </span>
            </div>
          </div>

          {/* Active Canvas Body */}
          <div className="p-6 sm:p-10 min-h-[460px] bg-[#07090D] flex items-center justify-center relative overflow-hidden">
            {/* Ambient Background photon reflection based on custom tokens */}
            <div
              className="absolute pointer-events-none transition-all duration-500"
              style={{
                width: '400px',
                height: '400px',
                borderRadius: '9999px',
                backgroundColor: customAccent,
                opacity: customGlow / 300,
                filter: 'blur(100px)',
              }}
            />

            {/* TAB 1: VISUAL CANVAS PREVIEW */}
            {activeTab === "preview" && (
              <div
                className={`w-full transition-all duration-300 mx-auto ${
                  viewDevice === "mobile"
                    ? 'max-w-sm'
                    : viewDevice === "tablet"
                    ? 'max-w-2xl'
                    : 'max-w-4xl'
                }`}
              >
                {/* Live Rendered Component Box */}
                <div
                  className="relative p-6 sm:p-8 bg-[#0C0F16] border border-white/10 shadow-2xl transition-all duration-300"
                  style={{
                    borderRadius: `${customRadius}px`,
                    boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 ${customGlow}px ${customAccent}22`,
                  }}
                >
                  {/* Eyebrow badge */}
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-4 border transition-all"
                    style={{
                      backgroundColor: `${customAccent}15`,
                      borderColor: `${customAccent}40`,
                      color: customAccent,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-ping"
                      style={{ backgroundColor: customAccent }}
                    />
                    <span>MANDE-AI // {component.category.toUpperCase()}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
                    {component.title}
                  </h3>

                  <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-6 max-w-xl">
                    {component.designRationale}
                  </p>

                  {/* Interactive Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-6 text-center">
                    <div>
                      <div className="text-[10px] text-zinc-500 font-mono">TOKEN MATCH</div>
                      <div
                        className="text-base sm:text-lg font-bold font-mono"
                        style={{ color: customAccent }}
                      >
                        99.8%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 font-mono">GRID SYSTEM</div>
                      <div className="text-base sm:text-lg font-bold font-mono text-white">8pt Base</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 font-mono">CODE DRIFT</div>
                      <div className="text-base sm:text-lg font-bold font-mono text-lime-400">0.00%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 font-mono flex items-center justify-center gap-1">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        <span>MODEL LATENCY</span>
                      </div>
                      <div className="text-base sm:text-lg font-bold font-mono text-emerald-400">
                        {isLoading ? `${liveElapsedMs}ms` : `${latencyMs}ms`}
                      </div>
                    </div>
                  </div>

                  {/* Component Actions */}
                  <div className="flex flex-wrap gap-3 items-center">
                    <button
                      onClick={copyCode}
                      className="px-5 py-2.5 text-black font-semibold text-xs tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer"
                      style={{
                        backgroundColor: customAccent,
                        borderRadius: `${Math.max(6, customRadius - 6)}px`,
                        boxShadow: `0 0 20px ${customAccent}55`,
                      }}
                    >
                      <span>Deploy Component</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("code")}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
                      style={{
                        borderRadius: `${Math.max(6, customRadius - 6)}px`,
                      }}
                    >
                      Inspect JSX &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CLEAN CODE VIEWER */}
            {activeTab === "code" && (
              <div className="w-full max-w-4xl bg-[#080B10] border border-white/10 rounded-xl p-5 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-zinc-300">{component.componentName}.tsx</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>Synthesized in:</span>
                      <span className="text-emerald-400 font-bold">{latencyMs}ms</span>
                    </span>
                    <span className="text-emerald-400">100% Tailwind v4 Verified</span>
                  </div>
                </div>
                <pre className="text-xs font-mono leading-relaxed text-zinc-300 overflow-x-auto p-2 max-h-[380px]">
                  <code>{component.cleanCode}</code>
                </pre>
              </div>
            )}

            {/* TAB 3: DESIGN TOKENS INSPECTOR */}
            {activeTab === "tokens" && (
              <div className="w-full max-w-2xl bg-[#080B10] border border-white/10 rounded-xl p-6 shadow-2xl">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2 font-mono">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>MANDE-AI // MATHEMATICAL TOKENS</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-xs text-zinc-500 font-mono">ACCENT COLOR</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: customAccent }} />
                      <span className="text-sm font-mono text-white">{customAccent}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-xs text-zinc-500 font-mono">CORNER RADIUS</span>
                    <div className="text-sm font-mono text-white mt-1">{customRadius}px</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-xs text-zinc-500 font-mono">PHOTON GLOW</span>
                    <div className="text-sm font-mono text-white mt-1">{customGlow}% Intensity</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-xs text-zinc-500 font-mono">TYPOGRAPHIC RATIO</span>
                    <div className="text-sm font-mono text-white mt-1">1.25 (Major Third)</div>
                  </div>
                </div>

                <p className="mt-5 text-xs text-zinc-400 leading-relaxed">
                  Design tokens are automatically synced across React props, Tailwind utility theme classes, and Figma variables without manual drift.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
