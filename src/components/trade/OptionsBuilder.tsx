"use client";

import { useState, useMemo } from "react";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import type { Quote } from "@/lib/types";
import { bs, legPL, type Leg, type OptType, type OptSide } from "@/lib/options";
import { fmt, fmtUSD } from "@/lib/data/seed";

const PRESETS: Record<string, { type: OptType; side: OptSide; off: number }[]> = {
  "Covered Call": [{ type: "call", side: "short", off: 0.06 }],
  "Bull Call Spread": [{ type: "call", side: "long", off: 0 }, { type: "call", side: "short", off: 0.08 }],
  "Protective Put": [{ type: "put", side: "long", off: -0.05 }],
  "Long Straddle": [{ type: "call", side: "long", off: 0 }, { type: "put", side: "long", off: 0 }],
  "Iron Condor": [{ type: "put", side: "long", off: -0.12 }, { type: "put", side: "short", off: -0.06 }, { type: "call", side: "short", off: 0.06 }, { type: "call", side: "long", off: 0.12 }],
};

export function OptionsBuilder({ quote, onClose }: { quote: Quote | undefined; onClose: () => void }) {
  const S = quote && quote.price && !isNaN(quote.price) ? quote.price : 100;
  const r = 0.045, T = 55 / 365, baseIV = 0.42;
  const step = S > 500 ? 10 : S > 100 ? 5 : 2.5;
  const round = (v: number) => Math.max(step, Math.round(v / step) * step);

  const mkLeg = (type: OptType, side: OptSide, off: number): Leg => {
    const strike = round(S * (1 + off));
    const iv = baseIV + Math.abs(off) * 0.6;
    return { id: Math.random().toString(36).slice(2, 7), type, side, strike, qty: 1, premium: bs(type, S, strike, T, r, iv).price, iv };
  };

  const [preset, setPreset] = useState("Covered Call");
  const [legs, setLegs] = useState<Leg[]>(() => PRESETS["Covered Call"].map((l) => mkLeg(l.type, l.side, l.off)));
  const [stockLeg, setStockLeg] = useState(true);

  const applyPreset = (name: string) => {
    setPreset(name);
    setLegs(PRESETS[name].map((l) => mkLeg(l.type, l.side, l.off)));
    setStockLeg(name === "Covered Call" || name === "Protective Put");
  };
  const updateLeg = (id: string, field: keyof Leg, val: number) =>
    setLegs((ls) => ls.map((l) => l.id === id ? { ...l, [field]: val, premium: field === "strike" ? bs(l.type, S, val, T, r, l.iv).price : l.premium } : l));
  const removeLeg = (id: string) => setLegs((ls) => ls.filter((l) => l.id !== id));
  const addLeg = () => setLegs((ls) => [...ls, mkLeg("call", "long", 0.04)]);

  const payoff = useMemo(() => {
    const pts: { st: number; pl: number }[] = []; const span = S * 0.4;
    for (let ST = S - span; ST <= S + span; ST += span / 60) {
      let pl = stockLeg ? (ST - S) * 100 : 0;
      legs.forEach((l) => (pl += legPL(l, ST)));
      pts.push({ st: ST, pl });
    }
    return pts;
  }, [legs, stockLeg, S]);

  const greeks = useMemo(() => {
    let d = stockLeg ? 100 : 0, g = 0, t = 0, v = 0;
    legs.forEach((l) => {
      const gk = bs(l.type, S, l.strike, T, r, l.iv); const sign = l.side === "long" ? 1 : -1;
      d += sign * gk.delta * l.qty * 100; g += sign * gk.gamma * l.qty * 100; t += sign * gk.theta * l.qty * 100; v += sign * gk.vega * l.qty * 100;
    });
    return { d, g, t, v };
  }, [legs, stockLeg, S]);

  const netDebit = legs.reduce((a, l) => a + (l.side === "long" ? 1 : -1) * l.premium * l.qty * 100, 0);
  const maxP = Math.max(...payoff.map((p) => p.pl));
  const maxL = Math.min(...payoff.map((p) => p.pl));
  const breakevens = useMemo(() => {
    const bes: number[] = [];
    for (let i = 1; i < payoff.length; i++) if ((payoff[i - 1].pl < 0) !== (payoff[i].pl < 0)) bes.push(payoff[i].st);
    return bes;
  }, [payoff]);

  // SVG geometry
  const W = 620, H = 240, pL = 52, pR = 14, pT = 14, pB = 26;
  const xs = payoff.map((p) => p.st), pls = payoff.map((p) => p.pl);
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  let ymin = Math.min(...pls, 0), ymax = Math.max(...pls, 0);
  if (ymax - ymin < 1) { ymax += 50; ymin -= 50; }
  const X = (st: number) => pL + ((st - xmin) / ((xmax - xmin) || 1)) * (W - pL - pR);
  const Y = (pl: number) => pT + (1 - (pl - ymin) / ((ymax - ymin) || 1)) * (H - pT - pB);
  const zeroY = Y(0);
  const linePath = payoff.map((p, i) => `${i ? "L" : "M"}${X(p.st).toFixed(1)},${Y(p.pl).toFixed(1)}`).join(" ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(7,10,22,0.55)" }} onClick={onClose}>
      <div className="rounded-2xl w-full max-w-[920px] max-h-[90vh] overflow-auto sc animate-slide-in" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 z-10" style={{ borderColor: "var(--color-line)", background: "var(--color-panel)" }}>
          <div>
            <div className="text-[16px] font-semibold">Options Strategy Builder</div>
            <div className="text-[12px]" style={{ color: "var(--color-faint)" }}>{quote?.symbol ?? "—"} · spot {fmt(S)} · {Math.round(T * 365)}d to expiry</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--color-dim)" }}><X size={18} /></button>
        </div>

        <div className="p-5">
          {/* presets */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {Object.keys(PRESETS).map((name) => (
              <button key={name} onClick={() => applyPreset(name)} className="px-3 py-1.5 rounded-lg text-[12px] font-medium"
                style={{ background: preset === name ? "var(--color-accent)" : "var(--color-subtle)", color: preset === name ? "#fff" : "var(--color-dim)" }}>{name}</button>
            ))}
          </div>

          {/* payoff diagram */}
          <div className="rounded-xl p-3 mb-4" style={{ background: "var(--color-panel2)", border: "1px solid var(--color-line)" }}>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
              <line x1={pL} y1={zeroY} x2={W - pR} y2={zeroY} stroke="var(--color-line-hover)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1={X(S)} y1={pT} x2={X(S)} y2={H - pB} stroke="var(--color-faint)" strokeWidth="1" strokeDasharray="2 3" />
              <text x={X(S)} y={H - pB + 16} fontSize="10" fill="var(--color-faint)" textAnchor="middle">spot {fmt(S, 0)}</text>
              {/* profit region above zero, loss below — clip via two paths */}
              <path d={`${linePath} L${X(xmax)},${zeroY} L${X(xmin)},${zeroY} Z`} fill="var(--color-up)" fillOpacity="0.08" />
              <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" />
              {breakevens.map((be, i) => (
                <g key={i}>
                  <circle cx={X(be)} cy={zeroY} r="3.5" fill="var(--color-accent)" />
                  <text x={X(be)} y={zeroY - 8} fontSize="9.5" fill="var(--color-accent)" textAnchor="middle">{fmt(be, 0)}</text>
                </g>
              ))}
              <text x={pL} y={Y(ymax) + 4} fontSize="10" fill="var(--color-up)">{fmtUSD(maxP, 0)}</text>
              <text x={pL} y={Y(ymin) - 2} fontSize="10" fill="var(--color-down)">{maxL < 0 ? "-" : ""}{fmtUSD(maxL, 0)}</text>
            </svg>
          </div>

          {/* metrics */}
          <div className="grid grid-cols-4 gap-2.5 mb-4">
            {([["Net " + (netDebit >= 0 ? "Debit" : "Credit"), fmtUSD(netDebit, 0), netDebit >= 0 ? "var(--color-down)" : "var(--color-up)"],
               ["Max Profit", maxP > 1e6 ? "Unlimited" : fmtUSD(maxP, 0), "var(--color-up)"],
               ["Max Loss", maxL < -1e6 ? "Unlimited" : (maxL < 0 ? "-" : "") + fmtUSD(maxL, 0), "var(--color-down)"],
               ["Breakeven", breakevens.length ? breakevens.map((b) => fmt(b, 0)).join(", ") : "—", "var(--color-content)"]] as const).map(([l, v, c]) => (
              <div key={l} className="rounded-lg p-2.5" style={{ background: "var(--color-panel2)" }}>
                <div className="text-[10.5px]" style={{ color: "var(--color-faint)" }}>{l}</div>
                <div className="num text-[15px] font-semibold mt-0.5" style={{ color: c }}>{v}</div>
              </div>
            ))}
          </div>

          {/* greeks */}
          <div className="grid grid-cols-4 gap-2.5 mb-4">
            {([["Delta", greeks.d], ["Gamma", greeks.g], ["Theta", greeks.t], ["Vega", greeks.v]] as const).map(([l, v]) => (
              <div key={l} className="rounded-lg p-2.5 text-center" style={{ background: "var(--color-inset)" }}>
                <div className="text-[10.5px]" style={{ color: "var(--color-faint)" }}>{l}</div>
                <div className="num text-[15px] font-semibold mt-0.5">{v >= 0 ? "+" : ""}{fmt(v, 2)}</div>
              </div>
            ))}
          </div>

          {/* legs */}
          <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1px solid var(--color-line)" }}>
            <div className="flex items-center px-3 py-2 text-[10.5px] uppercase font-semibold" style={{ background: "var(--color-panel2)", color: "var(--color-faint)" }}>
              <span className="w-[88px]">Side</span><span className="w-[70px]">Type</span><span className="flex-1">Strike</span><span className="w-[60px] text-right">Premium</span><span className="w-[50px] text-right">Qty</span><span className="w-8" />
            </div>
            {stockLeg && (
              <div className="flex items-center px-3 py-2.5 text-[12.5px] border-t" style={{ borderColor: "var(--color-subtle)" }}>
                <span className="w-[88px] font-semibold" style={{ color: "var(--color-up)" }}>Long</span>
                <span className="flex-1">100 shares @ {fmt(S)}</span>
                <button onClick={() => setStockLeg(false)} className="w-8 flex justify-end" style={{ color: "var(--color-faint)" }}><Trash2 size={13} /></button>
              </div>
            )}
            {legs.map((l) => (
              <div key={l.id} className="flex items-center px-3 py-2 text-[12.5px] border-t" style={{ borderColor: "var(--color-subtle)" }}>
                <button className="w-[88px] text-left font-semibold capitalize" style={{ color: l.side === "long" ? "var(--color-up)" : "var(--color-down)" }}
                  onClick={() => setLegs((ls) => ls.map((x) => x.id === l.id ? { ...x, side: x.side === "long" ? "short" : "long" } : x))}>{l.side}</button>
                <button className="w-[70px] text-left capitalize" style={{ color: "var(--color-dim)" }}
                  onClick={() => setLegs((ls) => ls.map((x) => { if (x.id !== l.id) return x; const nt: OptType = x.type === "call" ? "put" : "call"; return { ...x, type: nt, premium: bs(nt, S, x.strike, T, r, x.iv).price }; }))}>{l.type}</button>
                <span className="flex-1 flex items-center gap-1.5">
                  <button onClick={() => updateLeg(l.id, "strike", Math.max(step, l.strike - step))} className="p-1 rounded border" style={{ borderColor: "var(--color-line)" }}><Minus size={10} /></button>
                  <span className="num font-semibold w-12 text-center">{fmt(l.strike, 0)}</span>
                  <button onClick={() => updateLeg(l.id, "strike", l.strike + step)} className="p-1 rounded border" style={{ borderColor: "var(--color-line)" }}><Plus size={10} /></button>
                </span>
                <span className="num w-[60px] text-right" style={{ color: "var(--color-dim)" }}>{fmt(l.premium)}</span>
                <span className="num w-[50px] text-right flex items-center justify-end gap-1">
                  <button onClick={() => updateLeg(l.id, "qty", Math.max(1, l.qty - 1))} className="p-0.5"><Minus size={10} /></button>
                  {l.qty}
                  <button onClick={() => updateLeg(l.id, "qty", l.qty + 1)} className="p-0.5"><Plus size={10} /></button>
                </span>
                <button onClick={() => removeLeg(l.id)} className="w-8 flex justify-end" style={{ color: "var(--color-faint)" }}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button onClick={addLeg} className="flex items-center gap-1.5 text-[12.5px] font-medium" style={{ color: "var(--color-accent)" }}><Plus size={14} /> Add leg</button>
            {!stockLeg && <button onClick={() => setStockLeg(true)} className="text-[12.5px]" style={{ color: "var(--color-accent)" }}>+ Add 100 shares</button>}
          </div>

          <button className="w-full h-11 rounded-xl font-semibold text-[14px] text-white mt-4" style={{ background: "var(--color-accent)" }}>
            Review Strategy ({legs.length} {legs.length === 1 ? "leg" : "legs"}{stockLeg ? " + stock" : ""})
          </button>
        </div>
      </div>
    </div>
  );
}
