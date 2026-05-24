"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Moon, Sun, LineChart, Briefcase, Layers, Compass, Wallet } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const METRICS: [string, string, string?][] = [
  ["Morning Value", "12,420"],
  ["Online Value", "14,690"],
  ["Free Margin", "20,440"],
  ["Daily PNL", "820.44", "up"],
  ["Buying power", "168,420"],
];

const NAV = [
  { href: "/", label: "Terminal", icon: LineChart },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/positions", label: "Positions & Orders", icon: Wallet },
  { href: "/analyzer", label: "Analyzer", icon: Briefcase },
  { href: "/models", label: "Models", icon: Layers },
];

export function TopBar() {
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
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

        <button className="relative" aria-label="Notifications">
          <Bell size={18} style={{ color: "var(--color-dim)" }} />
          <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold w-[15px] h-[15px] rounded-full flex items-center justify-center text-white"
            style={{ background: "var(--color-accent)" }}>3</span>
        </button>
        <button onClick={toggle} className="p-1.5 rounded-lg border" style={{ borderColor: "var(--color-line)", color: "var(--color-dim)" }} aria-label="Toggle theme">
          {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-[13px]"
            style={{ background: "linear-gradient(135deg,#6e83ff,#c9ceff)" }}>KF</div>
          <div className="leading-tight">
            <div className="text-[11px]" style={{ color: "var(--color-faint)" }}>Account</div>
            <div className="num text-[12px] font-semibold">23-573010</div>
          </div>
        </div>
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
    </div>
  );
}
