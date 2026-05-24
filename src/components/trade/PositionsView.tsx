"use client";

import { useQuotes, useBrokerage } from "@/lib/hooks/useMarket";
import { brokerage } from "@/lib/data/brokerage";
import { fmt, fmtUSD, fmtPct, aiRatingColor } from "@/lib/data/seed";
import { X } from "lucide-react";

export function PositionsView() {
  const quotes = useQuotes();
  const { positions, orders } = useBrokerage();

  const rows = positions.map((p) => {
    const q = quotes[p.symbol];
    const isOption = p.instrument === "option" && p.option;

    if (isOption && p.option) {
      const S = q?.price ?? p.option.legs[0].strike;
      // Current strategy value per share = sum of leg intrinsic with long/short sign.
      const curPerShare = p.option.legs.reduce((a, l) => {
        const intrinsic = l.right === "call" ? Math.max(0, S - l.strike) : Math.max(0, l.strike - S);
        return a + (l.action === "long" ? 1 : -1) * intrinsic * l.qty;
      }, 0);
      // Cost basis per share is the net price paid (debit positive).
      const costPerShare = p.option.netPrice;
      const mult = 100; // contracts to shares
      const mktValue = curPerShare * mult;
      const cost = costPerShare * mult;
      const pl = mktValue - cost;
      const plPct = cost !== 0 ? (pl / Math.abs(cost)) * 100 : 0;
      return { ...p, q, price: curPerShare, mktValue, pl, plPct, dayChange: 0, isOption: true as const };
    }

    const price = q?.price ?? p.avgCost;
    const mktValue = p.shares * price;
    const cost = p.shares * p.avgCost;
    const pl = mktValue - cost;
    const plPct = (pl / cost) * 100;
    const dayChange = q ? p.shares * q.change : 0;
    return { ...p, q, price, mktValue, pl, plPct, dayChange, isOption: false as const };
  });

  const totalValue = rows.reduce((a, r) => a + r.mktValue, 0);
  const totalPL = rows.reduce((a, r) => a + r.pl, 0);
  const totalDay = rows.reduce((a, r) => a + r.dayChange, 0);

  const working = orders.filter((o) => o.status === "working");
  const recent = orders.filter((o) => o.status !== "working").slice(0, 12);

  return (
    <div className="sc flex-1 overflow-auto p-5">
      <h1 className="font-display text-[26px] mb-4">Positions &amp; Orders</h1>

      {/* summary */}
      <div className="flex gap-3 mb-5">
        <SummaryCard label="Total Position Value" value={fmtUSD(totalValue, 0)} />
        <SummaryCard label="Open P&L" value={(totalPL >= 0 ? "+" : "") + fmtUSD(totalPL, 0)} tone={totalPL >= 0 ? "up" : "down"} />
        <SummaryCard label="Day Change" value={(totalDay >= 0 ? "+" : "") + fmtUSD(totalDay, 0)} tone={totalDay >= 0 ? "up" : "down"} />
        <SummaryCard label="Open Orders" value={String(working.length)} />
      </div>

      {/* positions table */}
      <Panel title="Open Positions">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr style={{ color: "var(--color-faint)" }} className="text-[10.5px] uppercase">
              {["Symbol", "Qty", "Avg Cost", "Last", "Mkt Value", "Day", "Open P&L", "AI"].map((h, i) => (
                <th key={h} className="py-2 px-4 font-semibold" style={{ textAlign: i === 0 ? "left" : "right" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.symbol + "-" + idx} className="border-t" style={{ borderColor: "var(--color-subtle)" }}>
                <td className="py-2.5 px-4">
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded mr-2" style={{ color: "var(--color-accent)", background: "var(--color-accent-soft)" }}>{r.symbol}</span>
                  {r.isOption && r.option && (
                    <span className="text-[11px]" style={{ color: "var(--color-dim)" }}>
                      {r.option.strategy} · {r.option.expiry}
                      <span className="text-[9.5px] ml-1.5 px-1 py-0.5 rounded" style={{ background: "var(--color-subtle)", color: "var(--color-faint)" }}>OPT</span>
                    </span>
                  )}
                </td>
                <td className="num text-right" style={{ color: "var(--color-dim)" }}>{r.shares}{r.isOption ? "c" : ""}</td>
                <td className="num text-right" style={{ color: "var(--color-dim)" }}>{fmt(r.avgCost)}</td>
                <td className="num text-right">{fmt(r.price)}</td>
                <td className="num text-right">{(r.mktValue < 0 ? "-" : "") + fmtUSD(r.mktValue, 0)}</td>
                <td className="num text-right" style={{ color: r.dayChange >= 0 ? "var(--color-up)" : "var(--color-down)" }}>{r.isOption ? "—" : (r.dayChange >= 0 ? "+" : "") + fmtUSD(r.dayChange, 0)}</td>
                <td className="num text-right py-2.5 px-4" style={{ color: r.pl >= 0 ? "var(--color-up)" : "var(--color-down)" }}>{r.pl >= 0 ? "+" : ""}{fmtUSD(r.pl, 0)} ({fmtPct(r.plPct)})</td>
                <td className="text-right pr-4 font-semibold" style={{ color: r.q ? aiRatingColor(r.q.aiRating) : "var(--color-faint)" }}>{r.isOption ? "—" : r.q?.aiRating ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {/* working orders */}
      <div className="mt-4">
        <Panel title={`Working Orders (${working.length})`}>
          {working.length === 0 ? (
            <div className="px-4 py-6 text-[13px]" style={{ color: "var(--color-faint)" }}>No working orders.</div>
          ) : (
            <table className="w-full text-[12.5px]">
              <thead>
                <tr style={{ color: "var(--color-faint)" }} className="text-[10.5px] uppercase">
                  {["Symbol", "Side", "Type", "Qty", "Limit", "Stop", "TIF", ""].map((h, i) => (
                    <th key={h + i} className="py-2 px-4 font-semibold" style={{ textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {working.map((o) => (
                  <tr key={o.id} className="border-t" style={{ borderColor: "var(--color-subtle)" }}>
                    <td className="py-2.5 px-4 font-semibold">{o.symbol}</td>
                    <td className="text-right capitalize" style={{ color: o.side === "buy" ? "var(--color-up)" : "var(--color-down)" }}>{o.side}</td>
                    <td className="num text-right capitalize" style={{ color: "var(--color-dim)" }}>{o.type}</td>
                    <td className="num text-right">{o.qty}</td>
                    <td className="num text-right">{o.limitPrice ? fmt(o.limitPrice) : "—"}</td>
                    <td className="num text-right">{o.stopPrice ? fmt(o.stopPrice) : "—"}</td>
                    <td className="num text-right uppercase" style={{ color: "var(--color-dim)" }}>{o.tif}</td>
                    <td className="text-right pr-4">
                      <button onClick={() => brokerage.cancelOrder(o.id)} className="inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--color-down)" }}>
                        <X size={12} /> Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      {/* recent fills */}
      <div className="mt-4">
        <Panel title="Recent Activity">
          {recent.length === 0 ? (
            <div className="px-4 py-6 text-[13px]" style={{ color: "var(--color-faint)" }}>No recent activity.</div>
          ) : (
            <table className="w-full text-[12.5px]">
              <thead>
                <tr style={{ color: "var(--color-faint)" }} className="text-[10.5px] uppercase">
                  {["Symbol", "Side", "Type", "Qty", "Fill Price", "Status"].map((h, i) => (
                    <th key={h} className="py-2 px-4 font-semibold" style={{ textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-t" style={{ borderColor: "var(--color-subtle)" }}>
                    <td className="py-2.5 px-4 font-semibold">
                      {o.symbol}
                      {o.instrument === "option" && o.option && (
                        <span className="text-[10.5px] font-normal ml-1.5" style={{ color: "var(--color-faint)" }}>{o.option.strategy}</span>
                      )}
                    </td>
                    <td className="text-right capitalize" style={{ color: o.side === "buy" ? "var(--color-up)" : "var(--color-down)" }}>{o.side}</td>
                    <td className="num text-right capitalize" style={{ color: "var(--color-dim)" }}>{o.instrument === "option" ? "option" : o.type}</td>
                    <td className="num text-right">{o.qty}</td>
                    <td className="num text-right">{o.avgFillPrice ? fmt(o.avgFillPrice) : "—"}</td>
                    <td className="text-right pr-4 capitalize" style={{ color: o.status === "filled" ? "var(--color-up)" : "var(--color-dim)" }}>{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="flex-1 rounded-2xl p-4" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
      <div className="text-[11px]" style={{ color: "var(--color-faint)" }}>{label}</div>
      <div className="num font-display text-[22px] mt-1" style={{ color: tone === "up" ? "var(--color-up)" : tone === "down" ? "var(--color-down)" : "var(--color-content)" }}>{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
      <div className="px-4 py-3.5 text-[14px] font-semibold border-b" style={{ borderColor: "var(--color-line)" }}>{title}</div>
      {children}
    </div>
  );
}
