"use client";

import { useState } from "react";
import { useQuotes } from "@/lib/hooks/useMarket";
import { OrderTicket } from "./OrderTicket";
import { PriceChart } from "./PriceChart";
import { OptionsBuilder } from "./OptionsBuilder";
import { fmt, aiRatingColor } from "@/lib/data/seed";
import { Star, SlidersHorizontal } from "lucide-react";

const WATCH = ["NVDA", "MU", "ASML", "GEV", "CEG", "NOW", "CRM", "MSFT", "AVGO", "QQQ", "SMH", "VTI"];

export function TradeSurface() {
  const quotes = useQuotes();
  const [active, setActive] = useState("NVDA");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const q = quotes[active];

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* symbol list */}
      <div className="w-[380px] border-r flex flex-col" style={{ borderColor: "var(--color-line)", background: "var(--color-panel)" }}>
        <div className="px-4 py-3 text-[13px] font-semibold border-b" style={{ borderColor: "var(--color-line)" }}>Markets</div>
        <div className="sc overflow-auto flex-1">
          {WATCH.map((sym) => {
            const w = quotes[sym]; if (!w) return null;
            const up = w.changePct >= 0; const on = sym === active;
            return (
              <button key={sym} onClick={() => setActive(sym)}
                className="w-full flex items-center px-4 py-2.5 border-b text-left"
                style={{ borderColor: "var(--color-subtle)", background: on ? "var(--color-inset)" : "transparent", borderLeft: on ? "2px solid var(--color-accent)" : "2px solid transparent" }}>
                <Star size={13} className="mr-2.5" style={{ color: on ? "var(--color-accent)" : "var(--color-faint)" }} fill={on ? "var(--color-accent)" : "none"} />
                <div className="flex-1">
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded mr-1.5" style={{ color: "var(--color-accent)", background: "var(--color-accent-soft)" }}>{sym}</span>
                  <span className="text-[13px]">{w.name.split(" ")[0]}</span>
                </div>
                <span className="num text-[13px] font-semibold w-16 text-right">{fmt(w.price)}</span>
                <span className="num text-[11.5px] font-semibold w-16 text-right" style={{ color: up ? "var(--color-up)" : "var(--color-down)" }}>{fmt(Math.abs(w.changePct))}%</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* center: symbol detail */}
      <div className="flex-1 sc overflow-auto p-6">
        {q && (
          <>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-[32px]">${fmt(q.price)}</span>
              <span className="num text-[15px]" style={{ color: q.changePct >= 0 ? "var(--color-up)" : "var(--color-down)" }}>
                {q.changePct >= 0 ? "↑" : "↓"} {fmt(Math.abs(q.change))} ({fmt(Math.abs(q.changePct))}%)
              </span>
            </div>
            <div className="text-[13px] mt-1" style={{ color: "var(--color-dim)" }}>{q.name} · {q.symbol} · {q.sector}</div>
            <div className="mt-3 flex items-center gap-2.5">
              <div className="inline-flex items-center gap-2 text-[13px] px-3 py-1.5 rounded-lg" style={{ background: "var(--color-inset)" }}>
                AI rating: <span className="font-semibold" style={{ color: aiRatingColor(q.aiRating) }}>{q.aiRating}</span>
                <span style={{ color: "var(--color-faint)" }}>· score {q.aiScore}/100</span>
              </div>
              <button onClick={() => setOptionsOpen(true)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}>
                <SlidersHorizontal size={14} /> Options &amp; Strategies
              </button>
            </div>
            <div className="mt-6">
              <PriceChart quote={q} />
            </div>
          </>
        )}
      </div>

      {optionsOpen && <OptionsBuilder quote={q} onClose={() => setOptionsOpen(false)} />}

      {/* right: order ticket */}
      <div className="w-[320px] border-l sc overflow-auto" style={{ borderColor: "var(--color-line)", background: "var(--color-panel)" }}>
        <div className="px-4 py-3 text-[13px] font-semibold border-b" style={{ borderColor: "var(--color-line)" }}>Order Ticket</div>
        <OrderTicket quote={q} />
      </div>
    </div>
  );
}
