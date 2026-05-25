"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Moon, Sun, LineChart, Briefcase, Layers, Compass, Wallet, Sparkles, RotateCcw } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useQuotes, useBrokerage, useAdvisory, useNotifications } from "@/lib/hooks/useMarket";
import { CASH_BALANCE, fmt } from "@/lib/data/seed";
import { brokerage } from "@/lib/data/brokerage";
import { advisory } from "@/lib/data/advisory";
import { copilot } from "@/lib/data/copilot";
import { notifications } from "@/lib/data/notifications";

const NAV = [
  { href: "/", label: "Terminal", icon: LineChart },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/positions", label: "Positions & Orders", icon: Wallet },
  { href: "/analyzer", label: "Analyzer", icon: Briefcase },
  { href: "/models", label: "Models", icon: Layers },
];

export function TopBar({ onOpenCopilot }: { onOpenCopilot?: () => void }) {
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const quotes = useQuotes();
  const { positions } = useBrokerage();
  const { allocations } = useAdvisory();
  const notifs = useNotifications();
  const [confirmReset, setConfirmReset] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = notifs.filter((n) => !n.read).length;

  const doReset = () => { brokerage.reset(); advisory.reset(); copilot.reset(); notifications.reset(); setConfirmReset(false); };

  // Live portfolio metrics reconciled with actual positions, cash, and allocations.
  const equityRows = positions.filter((p) => (p.instrument ?? "equity") === "equity");
  const equityValue = equityRows.reduce((a, p) => a + p.shares * (quotes[p.symbol]?.price ?? p.avgCost), 0);
  const dayPnl = equityRows.reduce((a, p) => a + p.shares * (quotes[p.symbol]?.change ?? 0), 0);
  const openPnl = equityRows.reduce((a, p) => a + p.shares * ((quotes[p.symbol]?.price ?? p.avgCost) - p.avgCost), 0);
  const allocated = allocations.reduce((a, x) => a + x.amount, 0);
  const cash = Math.max(0, CASH_BALANCE - allocated);
  const totalValue = equityValue + allocated + cash;
  const prevValue = totalValue - dayPnl;
  const dayPct = prevValue > 0 ? (dayPnl / prevValue) * 100 : 0;

  const METRICS: [string, string, string?][] = [
    ["Account Value", fmt(totalValue, 0)],
    ["Day P&L", (dayPnl >= 0 ? "+" : "-") + fmt(Math.abs(dayPnl), 0) + ` (${dayPct >= 0 ? "+" : ""}${fmt(dayPct, 2)}%)`, dayPnl >= 0 ? "up" : "down"],
    ["Open P&L", (openPnl >= 0 ? "+" : "-") + fmt(Math.abs(openPnl), 0), openPnl >= 0 ? "up" : "down"],
    ["In Models", fmt(allocated, 0)],
    ["Buying Power", fmt(cash, 0)],
  ];

  return (
    <div className="border-b" style={{ borderColor: "var(--color-line)", background: "var(--color-panel)" }}>
      <div className="flex items-center h-14 px-4 gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg,#5a72ff,#b79cff)" }}>TE</div>
          <div className="text-[15px] font-semibold">
            TAPP Engine <span style={{ color: "var(--color-accent)" }} className="font-bold">Pro</span>
          </div>
        </div>

        <div className="flex flex-1 justify-center">
          {METRICS.map(([label, val, tone], i) => (
            <div key={label} className="px-6" style={{ borderLeft: i ? "1px solid var(--color-line)" : "none" }}>
              <div className="text-[11px] mb-0.5" style={{ color: "var(--color-faint)" }}>{label}</div>
              <div className="num text-[15px] font-semibold" style={{ color: tone === "up" ? "var(--color-up)" : "var(--color-content)" }}>{val}</div>
            </div>
          ))}
        </div>

        <button onClick={onOpenCopilot} className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[12px] font-semibold text-white" style={{ background: "linear-gradient(135deg,#5a72ff,#b79cff)" }} aria-label="AI Copilot">
          <Sparkles size={14} /> Copilot
        </button>
        <div className="relative">
          <button onClick={() => { setNotifOpen(!notifOpen); }} className="relative" aria-label="Notifications">
            <Bell size={18} style={{ color: "var(--color-dim)" }} />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold w-[15px] h-[15px] rounded-full flex items-center justify-center text-white"
                style={{ background: "var(--color-accent)" }}>{unread}</span>
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-[340px] rounded-2xl z-50 overflow-hidden shadow-xl" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--color-line)" }}>
                  <span className="text-[13.5px] font-semibold">Notifications</span>
                  {unread > 0 && <button onClick={() => notifications.markAllRead()} className="text-[11.5px] font-medium" style={{ color: "var(--color-accent)" }}>Mark all read</button>}
                </div>
                <div className="max-h-[360px] overflow-auto sc">
                  {notifs.length === 0 ? (
                    <div className="px-4 py-8 text-center text-[12.5px]" style={{ color: "var(--color-faint)" }}>No notifications.</div>
                  ) : notifs.map((n) => (
                    <button key={n.id} onClick={() => notifications.markRead(n.id)} className="w-full text-left px-4 py-3 border-b flex gap-2.5" style={{ borderColor: "var(--color-subtle)", background: n.read ? "transparent" : "var(--color-inset)" }}>
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.read ? "transparent" : "var(--color-accent)" }} />
                      <span>
                        <span className="block text-[12.5px] font-semibold">{n.title}</span>
                        <span className="block text-[11.5px] mt-0.5" style={{ color: "var(--color-dim)" }}>{n.body}</span>
                        <span className="block text-[10.5px] mt-1" style={{ color: "var(--color-faint)" }}>{timeAgo(n.createdAt)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <button onClick={toggle} className="p-1.5 rounded-lg border" style={{ borderColor: "var(--color-line)", color: "var(--color-dim)" }} aria-label="Toggle theme">
          {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
        </button>
        <button onClick={() => setConfirmReset(true)} className="p-1.5 rounded-lg border" style={{ borderColor: "var(--color-line)", color: "var(--color-dim)" }} aria-label="Reset demo" title="Reset demo">
          <RotateCcw size={15} />
        </button>
        <Link href="/account" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-[13px]"
            style={{ background: "linear-gradient(135deg,#6e83ff,#c9ceff)" }}>KF</div>
          <div className="leading-tight">
            <div className="text-[11px]" style={{ color: "var(--color-faint)" }}>Account</div>
            <div className="num text-[12px] font-semibold">23-573010</div>
          </div>
        </Link>
      </div>

      <nav className="flex items-center h-7 px-4 gap-1 border-t" style={{ borderColor: "var(--color-line)" }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className="flex items-center gap-1.5 px-3 h-7 text-[12.5px]"
              style={{
                fontWeight: active ? 600 : 500,
                color: active ? "var(--color-accent)" : "var(--color-dim)",
                borderBottom: active ? "2px solid var(--color-accent)" : "2px solid transparent",
              }}>
              <Icon size={13} /> {label}
            </Link>
          );
        })}
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--color-up)" }}>
          <span className="animate-pulse-dot w-[7px] h-[7px] rounded-full" style={{ background: "var(--color-up)" }} /> Markets live
        </div>
      </nav>

      {confirmReset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(7,10,22,0.55)" }} onClick={() => setConfirmReset(false)}>
          <div className="rounded-2xl w-full max-w-[380px] p-5 animate-slide-in" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-[15px] font-semibold mb-1.5"><RotateCcw size={16} style={{ color: "var(--color-accent)" }} /> Reset demo</div>
            <p className="text-[12.5px] mb-4" style={{ color: "var(--color-dim)" }}>Restores the starting portfolio and clears all orders, model allocations, suitability answers, and copilot actions. Use this between demos so each viewer starts fresh.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmReset(false)} className="flex-1 h-10 rounded-lg text-[13px] font-medium" style={{ background: "var(--color-subtle)", color: "var(--color-dim)" }}>Cancel</button>
              <button onClick={doReset} className="flex-1 h-10 rounded-lg text-[13px] font-semibold text-white" style={{ background: "var(--color-accent)" }}>Reset to clean state</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
