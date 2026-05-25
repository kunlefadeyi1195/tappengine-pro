"use client";

import { useState } from "react";
import { Sparkles, LineChart, Layers, Compass, ArrowRight, X, ShieldCheck } from "lucide-react";

const SLIDES = [
  {
    icon: LineChart,
    title: "Welcome to TAPP Engine Pro",
    body: "A professional trading terminal for stocks, ETFs, options, and advisor-managed models — with an AI copilot that proposes, while you stay in control.",
    tag: "DEMO",
  },
  {
    icon: Compass,
    title: "Trade and explore",
    body: "Place stock and options orders from the Terminal, screen the market in Explore, and track everything live under Positions & Orders. Prices move in real time.",
    tag: "TERMINAL",
  },
  {
    icon: Layers,
    title: "Invest in models",
    body: "Allocate into TE Advisors managed sleeves (with suitability and advisory agreement) or copy a self-directed template into your own account — two distinct, properly-gated paths.",
    tag: "MODELS",
  },
  {
    icon: Sparkles,
    title: "Meet your AI Copilot",
    body: "Tap “Ask Copilot,” then “Analyze my portfolio.” It spots concentration, drift, and idle cash, and proposes actions — each behind a compliance review you approve. It never executes on its own.",
    tag: "AI COPILOT",
  },
];

export function WelcomeOverlay({ onClose, onOpenCopilot }: { onClose: () => void; onOpenCopilot: () => void }) {
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const Icon = slide.icon;
  const last = i === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgba(7,10,22,0.62)" }}>
      <div className="rounded-3xl w-full max-w-[480px] overflow-hidden animate-slide-in" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
        {/* hero band */}
        <div className="relative px-7 pt-8 pb-7" style={{ background: "linear-gradient(135deg, rgba(90,114,255,0.14), rgba(183,156,255,0.14))" }}>
          <button onClick={onClose} className="absolute top-4 right-4" style={{ color: "var(--color-faint)" }} aria-label="Skip"><X size={18} /></button>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg,#5a72ff,#b79cff)" }}>
            <Icon size={24} color="#fff" />
          </div>
          <div className="text-[10px] font-bold tracking-wide mb-1.5" style={{ color: "var(--color-accent)" }}>{slide.tag}</div>
          <h2 className="font-display text-[24px] leading-tight mb-2">{slide.title}</h2>
          <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--color-dim)" }}>{slide.body}</p>
        </div>

        {/* footer / controls */}
        <div className="px-7 py-5">
          <div className="flex items-center gap-1.5 mb-5">
            {SLIDES.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)} className="h-1.5 rounded-full transition-all"
                style={{ width: idx === i ? 22 : 7, background: idx === i ? "var(--color-accent)" : "var(--color-line)" }} aria-label={`Slide ${idx + 1}`} />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button onClick={onClose} className="text-[13px] font-medium" style={{ color: "var(--color-faint)" }}>
              Skip intro
            </button>
            {last ? (
              <button onClick={() => { onClose(); onOpenCopilot(); }} className="flex items-center gap-2 px-5 h-11 rounded-xl font-semibold text-[14px] text-white" style={{ background: "linear-gradient(135deg,#5a72ff,#b79cff)" }}>
                <Sparkles size={16} /> Try the Copilot
              </button>
            ) : (
              <button onClick={() => setI(i + 1)} className="flex items-center gap-1.5 px-5 h-11 rounded-xl font-semibold text-[14px] text-white" style={{ background: "var(--color-accent)" }}>
                Next <ArrowRight size={15} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-4 text-[10.5px]" style={{ color: "var(--color-faint)" }}>
            <ShieldCheck size={12} /> Simulated environment · no real money or market connection
          </div>
        </div>
      </div>
    </div>
  );
}
