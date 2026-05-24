"use client";

import { useMemo } from "react";
import { useQuotes, useBrokerage } from "@/lib/hooks/useMarket";
import { MODELS, CASH_BALANCE, fmt, fmtUSD } from "@/lib/data/seed";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Sparkles, AlertTriangle, Info, Newspaper, CalendarDays } from "lucide-react";

export function AnalyzerView() {
  const quotes = useQuotes();
  const { positions } = useBrokerage();

  const sdValue = positions.reduce((a, p) => a + p.shares * (quotes[p.symbol]?.price ?? p.avgCost), 0);
  const modelValue = MODELS.reduce((a, m) => a + m.allocated, 0);
  const total = sdValue + modelValue + CASH_BALANCE;

  const equity = useMemo(() => {
    const out: { t: number; v: number }[] = []; let v = total * 0.78;
    for (let i = 0; i < 70; i++) { v += v * ((Math.random() - 0.44) * 0.014); out.push({ t: i, v }); }
    out[out.length - 1].v = total; return out;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const bench = useMemo(() => Array.from({ length: 9 }, (_, i) => ({
    m: ["5M", "6M", "7M", "8M", "9M", "10M", "11M", "1Y", "2Y"][i],
    port: 30 + Math.sin(i) * 12 + i * 2, ndx: 45 + Math.cos(i) * 20 + i * 1.5, dax: 10 + Math.sin(i + 2) * 14 + i * 3,
  })), []);

  const gauges: [string, number, string][] = [
    ["ILS", 25, "var(--color-up)"], ["INDEX", 22, "var(--color-up)"], ["Currency", 19, "var(--color-down)"],
    ["Bonds", 12, "var(--color-up)"], ["Stocks", 9, "var(--color-accent)"],
  ];
  const news = [["09:00 AM", "Stocks to Watch: Fireworks for N…"], ["10:41 AM", "3 Great reasons to buy Apple"], ["11:09 AM", "INTC Negative — Intel lowered…"], ["12:09 PM", "Earnings estimate chart…"], ["01:09 PM", "Stocks to Watch: Fireworks…"]];
  const events = [["Sep 24", "V Visa Inc at Morgan Stanley Tech…"], ["Sep 12", "WFC Earnings Report after Market…"], ["Sep 1", "UPS Earnings report after Market…"], ["Aug 29", "KO Ex-Dividend Date"], ["Aug 23", "BK Earnings Report before Market…"]];

  const held = positions.map((p) => quotes[p.symbol]).filter(Boolean);
  const buys = held.filter((q) => q!.aiRating.includes("Buy")).length;
  const holds = held.filter((q) => q!.aiRating === "Hold").length;
  const sells = held.filter((q) => q!.aiRating.includes("Sell")).length;

  return (
    <div className="sc flex-1 overflow-auto p-5">
      <h1 className="font-display text-[26px] mb-4">Portfolio Analyzer</h1>

      {/* top: total value + gauges */}
      <div className="flex gap-3.5 mb-3.5">
        <div className="flex-[1.4] rounded-2xl p-[18px]" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
          <div className="text-[12px]" style={{ color: "var(--color-faint)" }}>Total Value</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-[30px]">${fmt(total, 0)}</span>
            <span className="num text-[13px]" style={{ color: "var(--color-up)" }}>↑ $430.09 (15%)</span>
          </div>
          <div style={{ height: 110 }} className="mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equity} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs><linearGradient id="tv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} /></linearGradient></defs>
                <Area type="monotone" dataKey="v" stroke="var(--color-accent)" strokeWidth={2} fill="url(#tv)" dot={false} isAnimationActive={false} />
                <Tooltip contentStyle={{ background: "var(--color-panel)", border: "1px solid var(--color-line)", borderRadius: 8, fontSize: 11 }} labelFormatter={() => ""} formatter={(v: number) => [fmtUSD(v, 0), "Value"]} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {gauges.map(([label, val, col]) => {
          const r = 34, circ = 2 * Math.PI * r;
          return (
            <div key={label} className="flex-1 rounded-2xl p-4 flex flex-col" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
              <div className="text-[11.5px]" style={{ color: "var(--color-faint)" }}>{label}</div>
              <div className="flex-1 flex items-center justify-center" style={{ minHeight: 92 }}>
                <div className="relative" style={{ width: 84, height: 84 }}>
                  <svg width="84" height="84" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="42" cy="42" r={r} fill="none" stroke="var(--color-subtle)" strokeWidth="7" />
                    <circle cx="42" cy="42" r={r} fill="none" stroke={col} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${circ * (val / 100)} ${circ}`} />
                  </svg>
                  <div className="num absolute inset-0 flex items-center justify-center text-[18px] font-bold" style={{ color: col }}>{val}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* middle: yields/risk | benchmark | news/events */}
      <div className="flex gap-3.5 mb-3.5">
        <div className="w-[280px] flex flex-col gap-3.5">
          <div className="rounded-2xl p-4" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
            <div className="flex items-center gap-1.5 text-[14px] font-semibold mb-3">Portfolio Yields <Info size={13} style={{ color: "var(--color-faint)" }} /></div>
            <div className="flex gap-1 rounded-lg p-0.5 mb-3" style={{ background: "var(--color-panel2)" }}>
              {["USD", "EUR", "BTC"].map((c, i) => (
                <div key={c} className="flex-1 text-center py-1.5 rounded-md text-[12px] font-semibold" style={{ background: i === 0 ? "var(--color-panel)" : "transparent", color: i === 0 ? "var(--color-accent)" : "var(--color-dim)", border: i === 0 ? "1px solid var(--color-line)" : "none" }}>{c}</div>
              ))}
            </div>
            {([["MTD", "$12,240", "↑ 55%", "var(--color-up)"], ["YTD", "$9,240", "↓ 30%", "var(--color-down)"], ["12 M", "$15,240", "↑ 55%", "var(--color-up)"], ["Std Deviation", "25.15", "", "var(--color-accent)"]] as const).map(([k, v, c, col]) => (
              <div key={k} className="flex justify-between items-center py-2 border-b text-[12.5px]" style={{ borderColor: "var(--color-subtle)" }}>
                <span style={{ color: "var(--color-dim)" }}>{k}</span>
                <span><span className="num font-semibold">{v}</span>{c && <span className="ml-2 text-[11.5px]" style={{ color: col }}>{c}</span>}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-4" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[14px] font-semibold">My risk portfolio</span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ color: "var(--color-down)", background: "color-mix(in srgb, var(--color-down) 12%, transparent)" }}>Risky</span>
            </div>
            <div className="flex gap-1 mb-2.5">{[1, 2, 3, 4].map((i) => <div key={i} className="flex-1 h-1 rounded-sm" style={{ background: i <= 3 ? "var(--color-down)" : "var(--color-subtle)" }} />)}</div>
            <div className="text-[11px]" style={{ color: "var(--color-faint)" }}>Based on discussion from 01/09/2024</div>
            <div className="text-[12px] mt-1.5 font-medium" style={{ color: "var(--color-accent)" }}>About your Risk profile →</div>
          </div>
        </div>

        <div className="flex-1 rounded-2xl p-4" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] font-semibold">My securities</span>
            <div className="flex gap-1">
              <div className="px-3 py-1.5 rounded-md text-[12px] font-semibold" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}>Asset class</div>
              <div className="px-3 py-1.5 rounded-md text-[12px]" style={{ color: "var(--color-dim)" }}>Portfolio Yield</div>
            </div>
          </div>
          <div style={{ height: 290 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bench} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <XAxis dataKey="m" tick={{ fill: "var(--color-faint)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--color-faint)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v + "%"} />
                <Tooltip contentStyle={{ background: "var(--color-panel)", border: "1px solid var(--color-line)", borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="port" name="Total Portfolio %" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="ndx" name="NASDAQ 100" stroke="var(--color-up)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="dax" name="DAX" stroke="#B79CFF" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 justify-center text-[11.5px] mt-1.5">
            {([["Total Portfolio %", "var(--color-accent)"], ["NASDAQ 100", "var(--color-up)"], ["DAX", "#B79CFF"]] as const).map(([l, c]) => (
              <span key={l} className="flex items-center gap-1.5" style={{ color: "var(--color-dim)" }}><span className="w-3.5 h-0.5 rounded-sm" style={{ background: c }} />{l}</span>
            ))}
          </div>
        </div>

        <div className="w-[260px] flex flex-col gap-3.5">
          <Rail title="Portfolio News" icon={Newspaper} items={news} dateColor="var(--color-faint)" />
          <Rail title="Portfolio Events" icon={CalendarDays} items={events} dateColor="var(--color-accent)" />
        </div>
      </div>

      {/* AI health + blended composition */}
      <div className="flex gap-3.5">
        <div className="flex-[1.2] rounded-2xl p-[18px]" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
          <div className="flex items-center gap-1.5 text-[14px] font-semibold mb-3.5"><Sparkles size={15} style={{ color: "var(--color-accent)" }} /> AI Portfolio Health</div>
          <div className="flex gap-5 mb-3.5">
            <div><div className="num font-display text-[26px]" style={{ color: "var(--color-up)" }}>{buys}</div><div className="text-[11px]" style={{ color: "var(--color-faint)" }}>Buy / Strong Buy</div></div>
            <div><div className="num font-display text-[26px]" style={{ color: "var(--color-hold)" }}>{holds}</div><div className="text-[11px]" style={{ color: "var(--color-faint)" }}>Hold</div></div>
            <div><div className="num font-display text-[26px]" style={{ color: "var(--color-down)" }}>{sells}</div><div className="text-[11px]" style={{ color: "var(--color-faint)" }}>Sell</div></div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 text-[12px] px-2.5 py-2 rounded-lg" style={{ background: "color-mix(in srgb, var(--color-down) 10%, transparent)", color: "var(--color-down)" }}><AlertTriangle size={13} /> AI Infrastructure Growth sleeve drift +4.4% — exceeds 3% tolerance</div>
            <div className="flex items-center gap-2.5 text-[12px] px-2.5 py-2 rounded-lg" style={{ background: "color-mix(in srgb, var(--color-hold) 12%, transparent)", color: "var(--color-hold)" }}><Info size={13} /> Semiconductor concentration at 41% — above 35% guideline</div>
          </div>
        </div>
        <div className="flex-1 rounded-2xl p-[18px]" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
          <div className="text-[14px] font-semibold mb-1">Account Composition</div>
          <div className="text-[11.5px] mb-4" style={{ color: "var(--color-faint)" }}>Self-directed vs. model-managed vs. cash — the blended view</div>
          <div className="flex h-4 rounded-lg overflow-hidden gap-0.5 mb-3.5">
            <div style={{ width: `${(sdValue / total) * 100}%`, background: "var(--color-accent)" }} />
            <div style={{ width: `${(modelValue / total) * 100}%`, background: "#B79CFF" }} />
            <div style={{ width: `${(CASH_BALANCE / total) * 100}%`, background: "var(--color-faint)" }} />
          </div>
          {([["Self-Directed", sdValue, "var(--color-accent)"], ["Model-Managed", modelValue, "#B79CFF"], ["Cash", CASH_BALANCE, "var(--color-faint)"]] as const).map(([l, v, c]) => (
            <div key={l} className="flex items-center justify-between py-1.5 border-b text-[12.5px]" style={{ borderColor: "var(--color-subtle)" }}>
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} /> {l}</span>
              <span><span className="num font-semibold">{fmtUSD(v, 0)}</span> <span className="ml-2" style={{ color: "var(--color-faint)" }}>{((v / total) * 100).toFixed(0)}%</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Rail({ title, icon: Icon, items, dateColor }: { title: string; icon: React.ComponentType<{ size?: number; color?: string }>; items: string[][]; dateColor: string }) {
  return (
    <div className="flex-1 rounded-2xl p-4 overflow-hidden" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[14px] font-semibold flex items-center gap-1.5"><Icon size={14} color="var(--color-accent)" /> {title}</span>
        <span className="text-[11.5px]" style={{ color: "var(--color-accent)" }}>All →</span>
      </div>
      {items.map(([d, t], i) => (
        <div key={i} className="py-2 border-b last:border-0" style={{ borderColor: "var(--color-subtle)" }}>
          <div className="num text-[10.5px] mb-0.5" style={{ color: dateColor }}>{d}</div>
          <div className="text-[12.5px] font-medium">{t}</div>
        </div>
      ))}
    </div>
  );
}
