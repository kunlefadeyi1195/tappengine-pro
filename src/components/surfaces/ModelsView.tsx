"use client";

import { useState, useMemo } from "react";
import { useQuotes } from "@/lib/hooks/useMarket";
import { MODELS, fmt, fmtUSD, fmtPct, aiRatingColor } from "@/lib/data/seed";
import { AreaChart, Area, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Plus } from "lucide-react";

export function ModelsView() {
  const quotes = useQuotes();
  const [selected, setSelected] = useState(MODELS[0].id);
  const model = MODELS.find((m) => m.id === selected)!;

  const perf = useMemo(() => {
    const out: { t: number; v: number }[] = [];
    let v = 100;
    for (let i = 0; i < 60; i++) { v += v * ((Math.random() - 0.42) * 0.01); out.push({ t: i, v }); }
    return out;
  }, [selected]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* list */}
      <div className="w-[360px] border-r flex flex-col" style={{ borderColor: "var(--color-line)", background: "var(--color-panel)" }}>
        <div className="px-[18px] pt-[18px] pb-3.5">
          <h1 className="font-display text-[22px]">Model Portfolios</h1>
          <div className="text-[12px] mt-1" style={{ color: "var(--color-faint)" }}>Advisor-managed strategies from TE Advisors</div>
        </div>
        <div className="sc overflow-auto flex-1 px-3 pb-3">
          {MODELS.map((m) => {
            const on = m.id === selected; const active = m.allocated > 0;
            return (
              <button key={m.id} onClick={() => setSelected(m.id)}
                className="w-full text-left p-4 rounded-xl mb-2.5"
                style={{ background: on ? "var(--color-inset)" : "var(--color-panel)", border: `1px solid ${on ? "var(--color-accent)" : "var(--color-line)"}` }}>
                <div className="flex justify-between items-start">
                  <div className="text-[14px] font-semibold">{m.name}</div>
                  {active && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}>ACTIVE</span>}
                </div>
                <div className="text-[11px] mt-1 mb-3" style={{ color: "var(--color-faint)" }}>{m.risk} · {m.holdings.length} holdings</div>
                <div className="flex gap-5">
                  <div><div className="num text-[16px] font-bold" style={{ color: "var(--color-up)" }}>{fmtPct(m.ytdReturn)}</div><div className="text-[9.5px]" style={{ color: "var(--color-faint)" }}>YTD</div></div>
                  <div><div className="num text-[16px] font-bold">{fmtPct(m.sinceInception)}</div><div className="text-[9.5px]" style={{ color: "var(--color-faint)" }}>Since incept.</div></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* detail */}
      <div className="sc flex-1 overflow-auto p-6">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h1 className="font-display text-[28px]">{model.name}</h1>
            <div className="text-[12.5px] mt-1.5" style={{ color: "var(--color-dim)" }}>{model.manager} · {model.risk} risk · Rebalanced quarterly · TWR (continuous)</div>
          </div>
          {model.allocated > 0 ? (
            <div className="px-4 h-[38px] flex items-center rounded-lg text-[13px]" style={{ background: "var(--color-subtle)", border: "1px solid var(--color-line)" }}>Allocated {fmtUSD(model.allocated, 0)}</div>
          ) : (
            <button className="px-4 h-[38px] flex items-center gap-1.5 rounded-lg text-[13px] font-semibold text-white" style={{ background: "var(--color-accent)" }}><Plus size={15} /> Allocate to Sleeve</button>
          )}
        </div>

        <div className="flex gap-3.5 mb-4">
          {([["YTD Return", fmtPct(model.ytdReturn), "var(--color-up)"], ["Since Inception", fmtPct(model.sinceInception), "var(--color-content)"], ["Holdings", String(model.holdings.length), "var(--color-content)"], ["Expense", "0.35%", "var(--color-content)"]] as const).map(([l, v, c]) => (
            <div key={l} className="flex-1 rounded-xl p-4" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
              <div className="text-[11px]" style={{ color: "var(--color-faint)" }}>{l}</div>
              <div className="num font-display text-[22px] mt-1" style={{ color: c }}>{v}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-[18px] mb-4" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
          <div className="text-[14px] font-semibold mb-3">Performance (indexed to 100)</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={perf} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs><linearGradient id="mpf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.22} /><stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} /></linearGradient></defs>
                <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fill: "var(--color-faint)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Area type="monotone" dataKey="v" stroke="var(--color-accent)" strokeWidth={2} fill="url(#mpf)" dot={false} isAnimationActive={false} />
                <Tooltip contentStyle={{ background: "var(--color-panel)", border: "1px solid var(--color-line)", borderRadius: 8, fontSize: 11 }} labelFormatter={() => ""} formatter={(v: number) => [fmt(v), "Index"]} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
          <div className="px-[18px] py-3.5 text-[14px] font-semibold border-b" style={{ borderColor: "var(--color-line)" }}>Target Allocation</div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr style={{ color: "var(--color-faint)" }} className="text-[10.5px] uppercase">
                {["Symbol", "Name", "AI Ranked", "Target", "Live Price"].map((h, i) => (
                  <th key={h} className="py-2 px-[18px] font-semibold" style={{ textAlign: i < 2 ? "left" : "right" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {model.holdings.map((h) => {
                const q = quotes[h.symbol];
                return (
                  <tr key={h.symbol} className="border-t" style={{ borderColor: "var(--color-subtle)" }}>
                    <td className="py-2.5 px-[18px] font-bold">{h.symbol}</td>
                    <td style={{ color: "var(--color-dim)" }}>{q?.name ?? h.symbol}</td>
                    <td className="text-right font-semibold" style={{ color: q ? aiRatingColor(q.aiRating) : "var(--color-faint)" }}>{q?.aiRating ?? "—"}</td>
                    <td className="num text-right">{h.targetWeight}%</td>
                    <td className="num text-right py-2.5 px-[18px]" style={{ color: q && q.changePct >= 0 ? "var(--color-up)" : "var(--color-down)" }}>{q ? fmt(q.price) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
