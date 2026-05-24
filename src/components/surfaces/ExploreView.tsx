"use client";

import { useState, useMemo } from "react";
import { useQuotes } from "@/lib/hooks/useMarket";
import { fmt, fmtPct, aiRatingColor } from "@/lib/data/seed";
import type { AssetClass, AIRating } from "@/lib/types";
import { Search, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

type SortKey = "symbol" | "price" | "changePct" | "aiScore";

export function ExploreView() {
  const quotes = useQuotes();
  const [query, setQuery] = useState("");
  const [assetFilter, setAssetFilter] = useState<AssetClass | "all">("all");
  const [ratingFilter, setRatingFilter] = useState<AIRating | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("aiScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const list = useMemo(() => {
    let rows = Object.values(quotes);
    if (query) rows = rows.filter((q) => q.symbol.toLowerCase().includes(query.toLowerCase()) || q.name.toLowerCase().includes(query.toLowerCase()));
    if (assetFilter !== "all") rows = rows.filter((q) => q.assetClass === assetFilter);
    if (ratingFilter !== "all") rows = rows.filter((q) => q.aiRating === ratingFilter);
    rows = [...rows].sort((a, b) => {
      let av: number | string = a[sortKey], bv: number | string = b[sortKey];
      if (typeof av === "string") { av = av as string; bv = bv as string; return sortDir === "asc" ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1); }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return rows;
  }, [quotes, query, assetFilter, ratingFilter, sortKey, sortDir]);

  const movers = useMemo(() => {
    const all = Object.values(quotes);
    const gainers = [...all].sort((a, b) => b.changePct - a.changePct).slice(0, 3);
    const losers = [...all].sort((a, b) => a.changePct - b.changePct).slice(0, 3);
    const topAI = [...all].sort((a, b) => b.aiScore - a.aiScore).slice(0, 3);
    return { gainers, losers, topAI };
  }, [quotes]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "symbol" ? "asc" : "desc"); }
  };

  const assetChips: (AssetClass | "all")[] = ["all", "stock", "etf", "fund"];
  const ratingChips: (AIRating | "all")[] = ["all", "Strong Buy", "Buy", "Hold", "Sell"];

  return (
    <div className="sc flex-1 overflow-auto p-5">
      <h1 className="font-display text-[26px] mb-4">Explore</h1>

      {/* movers cards */}
      <div className="flex gap-3.5 mb-4">
        <MoverCard title="Top Gainers" icon={TrendingUp} color="var(--color-up)" rows={movers.gainers} kind="pct" />
        <MoverCard title="Top Losers" icon={TrendingDown} color="var(--color-down)" rows={movers.losers} kind="pct" />
        <MoverCard title="Highest AI Score" icon={Sparkles} color="var(--color-accent)" rows={movers.topAI} kind="ai" />
      </div>

      {/* screener */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
        <div className="p-4 border-b flex items-center gap-3 flex-wrap" style={{ borderColor: "var(--color-line)" }}>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-[200px]" style={{ background: "var(--color-panel2)", border: "1px solid var(--color-line)" }}>
            <Search size={15} style={{ color: "var(--color-faint)" }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search symbol or name" className="bg-transparent outline-none text-[13px] w-full" style={{ color: "var(--color-content)" }} />
          </div>
          <div className="flex gap-1.5">
            {assetChips.map((a) => (
              <button key={a} onClick={() => setAssetFilter(a)} className="px-3 py-1.5 rounded-md text-[11.5px] font-medium capitalize"
                style={{ background: assetFilter === a ? "var(--color-accent-soft)" : "transparent", color: assetFilter === a ? "var(--color-accent)" : "var(--color-dim)", border: `1px solid ${assetFilter === a ? "var(--color-accent)" : "var(--color-line)"}` }}>
                {a === "all" ? "All" : a.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {ratingChips.map((r) => (
              <button key={r} onClick={() => setRatingFilter(r)} className="px-3 py-1.5 rounded-md text-[11.5px] font-medium"
                style={{ background: ratingFilter === r ? "var(--color-accent-soft)" : "transparent", color: ratingFilter === r ? "var(--color-accent)" : "var(--color-dim)", border: `1px solid ${ratingFilter === r ? "var(--color-accent)" : "var(--color-line)"}` }}>
                {r === "all" ? "Any rating" : r}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-[12.5px]">
          <thead>
            <tr style={{ color: "var(--color-faint)" }} className="text-[10.5px] uppercase">
              <Th label="Symbol" k="symbol" {...{ sortKey, sortDir, toggleSort }} align="left" />
              <th className="py-2.5 px-4 font-semibold text-left">Sector</th>
              <Th label="Price" k="price" {...{ sortKey, sortDir, toggleSort }} />
              <Th label="Change" k="changePct" {...{ sortKey, sortDir, toggleSort }} />
              <Th label="AI Score" k="aiScore" {...{ sortKey, sortDir, toggleSort }} />
              <th className="py-2.5 px-4 font-semibold text-right">AI Rating</th>
            </tr>
          </thead>
          <tbody>
            {list.map((q) => (
              <tr key={q.symbol} className="border-t" style={{ borderColor: "var(--color-subtle)" }}>
                <td className="py-2.5 px-4">
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded mr-2" style={{ color: "var(--color-accent)", background: "var(--color-accent-soft)" }}>{q.symbol}</span>
                  <span className="font-medium">{q.name}</span>
                </td>
                <td className="px-4" style={{ color: "var(--color-dim)" }}>{q.sector}</td>
                <td className="num text-right px-4">{fmt(q.price)}</td>
                <td className="num text-right px-4" style={{ color: q.changePct >= 0 ? "var(--color-up)" : "var(--color-down)" }}>{fmtPct(q.changePct)}</td>
                <td className="num text-right px-4 font-semibold">{q.aiScore}</td>
                <td className="text-right px-4 py-2.5 font-semibold" style={{ color: aiRatingColor(q.aiRating) }}>{q.aiRating}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className="px-4 py-8 text-center text-[13px]" style={{ color: "var(--color-faint)" }}>No matches.</div>}
      </div>
    </div>
  );
}

function Th({ label, k, sortKey, sortDir, toggleSort, align = "right" }: { label: string; k: SortKey; sortKey: SortKey; sortDir: "asc" | "desc"; toggleSort: (k: SortKey) => void; align?: "left" | "right" }) {
  const active = sortKey === k;
  return (
    <th className="py-2.5 px-4 font-semibold cursor-pointer select-none" style={{ textAlign: align, color: active ? "var(--color-accent)" : undefined }} onClick={() => toggleSort(k)}>
      {label}{active ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );
}

function MoverCard({ title, icon: Icon, color, rows, kind }: { title: string; icon: React.ComponentType<{ size?: number; color?: string }>; color: string; rows: { symbol: string; name: string; price: number; changePct: number; aiScore: number }[]; kind: "pct" | "ai" }) {
  return (
    <div className="flex-1 rounded-2xl p-4" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
      <div className="flex items-center gap-1.5 text-[13px] font-semibold mb-3"><Icon size={14} color={color} /> {title}</div>
      {rows.map((q) => (
        <div key={q.symbol} className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded" style={{ color: "var(--color-accent)", background: "var(--color-accent-soft)" }}>{q.symbol}</span>
            <span className="num text-[12px]">{fmt(q.price)}</span>
          </div>
          <span className="num text-[12px] font-semibold" style={{ color: kind === "ai" ? "var(--color-accent)" : q.changePct >= 0 ? "var(--color-up)" : "var(--color-down)" }}>
            {kind === "ai" ? `${q.aiScore}/100` : fmtPct(q.changePct)}
          </span>
        </div>
      ))}
    </div>
  );
}
