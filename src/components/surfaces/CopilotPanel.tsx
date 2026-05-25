"use client";

import { useState } from "react";
import { X, Sparkles, ShieldCheck, CheckCircle2, AlertTriangle, TrendingUp, Wallet, Layers, Send } from "lucide-react";
import { useCopilot } from "@/lib/hooks/useMarket";
import { copilot } from "@/lib/data/copilot";
import type { CopilotProposal, ProposalKind } from "@/lib/types";

const KIND_ICON: Record<ProposalKind, React.ComponentType<{ size?: number }>> = {
  concentration: AlertTriangle, drift: Layers, "idle-cash": Wallet,
};

export function CopilotPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { insights, proposals } = useCopilot();
  const [thinking, setThinking] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runAnalysis = () => {
    setThinking(true);
    // simulated reasoning delay so it feels live but never fails
    setTimeout(() => { copilot.analyze(); setThinking(false); setHasRun(true); }, 1400);
  };

  const active = proposals.filter((p) => p.status === "proposed");
  const resolved = proposals.filter((p) => p.status === "executed" || p.status === "dismissed");

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(7,10,22,0.4)" }} onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-[420px] max-w-full flex flex-col animate-slide-in sc overflow-auto"
        style={{ background: "var(--color-panel)", borderLeft: "1px solid var(--color-line)" }}>
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 z-10" style={{ borderColor: "var(--color-line)", background: "var(--color-panel)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#5a72ff,#b79cff)" }}><Sparkles size={15} color="#fff" /></div>
            <div>
              <div className="text-[14px] font-semibold">AI Copilot</div>
              <div className="text-[11px]" style={{ color: "var(--color-faint)" }}>Proposes — you approve</div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "var(--color-dim)" }}><X size={18} /></button>
        </div>

        <div className="p-5 flex-1">
          {/* ambient insights */}
          <div className="text-[11px] uppercase font-semibold mb-2" style={{ color: "var(--color-faint)" }}>Insights</div>
          <div className="flex flex-col gap-2 mb-5">
            {insights.map((ins) => (
              <div key={ins.id} className="flex items-start gap-2 text-[12.5px] px-3 py-2.5 rounded-xl"
                style={{ background: ins.tone === "warning" ? "color-mix(in srgb, var(--color-hold) 12%, transparent)" : ins.tone === "positive" ? "color-mix(in srgb, var(--color-up) 10%, transparent)" : "var(--color-panel2)", color: ins.tone === "warning" ? "var(--color-hold)" : ins.tone === "positive" ? "var(--color-up)" : "var(--color-dim)" }}>
                {ins.tone === "warning" ? <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> : ins.tone === "positive" ? <TrendingUp size={14} className="mt-0.5 flex-shrink-0" /> : <Sparkles size={14} className="mt-0.5 flex-shrink-0" />}
                <span>{ins.text}</span>
              </div>
            ))}
          </div>

          {/* analyze trigger */}
          {!hasRun && !thinking && (
            <button onClick={runAnalysis} className="w-full h-11 rounded-xl font-semibold text-[14px] text-white flex items-center justify-center gap-2" style={{ background: "var(--color-accent)" }}>
              <Sparkles size={16} /> Analyze my portfolio
            </button>
          )}
          {thinking && (
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: "var(--color-inset)" }}>
              <div className="w-4 h-4 rounded-full border-2 animate-spin-slow" style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
              <span className="text-[13px]" style={{ color: "var(--color-dim)" }}>Analyzing positions, sector weights, and cash…</span>
            </div>
          )}

          {/* proposals */}
          {active.length > 0 && (
            <>
              <div className="text-[11px] uppercase font-semibold mb-2 mt-1" style={{ color: "var(--color-faint)" }}>Proposed actions ({active.length})</div>
              <div className="flex flex-col gap-3">
                {active.map((p) => <ProposalCard key={p.id} p={p} />)}
              </div>
            </>
          )}

          {hasRun && active.length === 0 && (
            <div className="text-center py-6">
              <CheckCircle2 size={34} style={{ color: "var(--color-up)" }} className="mx-auto mb-2" />
              <div className="text-[13px]" style={{ color: "var(--color-dim)" }}>No outstanding actions. Your portfolio is within all guidelines.</div>
            </div>
          )}

          {hasRun && (
            <button onClick={runAnalysis} className="w-full mt-3 h-9 rounded-lg text-[12.5px] font-medium" style={{ background: "var(--color-subtle)", color: "var(--color-dim)" }}>Re-analyze</button>
          )}

          {/* resolved log */}
          {resolved.length > 0 && (
            <div className="mt-5">
              <div className="text-[11px] uppercase font-semibold mb-2" style={{ color: "var(--color-faint)" }}>History</div>
              {resolved.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-[12px] py-1.5" style={{ color: "var(--color-faint)" }}>
                  {p.status === "executed" ? <CheckCircle2 size={13} style={{ color: "var(--color-up)" }} /> : <X size={13} />}
                  <span>{p.title}</span>
                  <span className="ml-auto capitalize">{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* footer note */}
        <div className="px-5 py-3 border-t text-[10.5px] flex items-center gap-1.5" style={{ borderColor: "var(--color-line)", color: "var(--color-faint)" }}>
          <ShieldCheck size={12} /> The copilot never executes autonomously. Every action requires your approval.
        </div>
      </div>
    </>
  );
}

function ProposalCard({ p }: { p: CopilotProposal }) {
  const Icon = KIND_ICON[p.kind];
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-panel2)", border: "1px solid var(--color-line)" }}>
      <div className="p-4">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}><Icon size={15} /></div>
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold">{p.title}</div>
            <div className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--color-dim)" }}>{p.rationale}</div>
          </div>
        </div>

        {/* proposed actions */}
        <div className="mt-3 flex flex-col gap-1.5">
          {p.actions.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-[12.5px] px-2.5 py-2 rounded-lg" style={{ background: "var(--color-panel)" }}>
              <Send size={12} style={{ color: a.side === "buy" ? "var(--color-up)" : "var(--color-down)" }} />
              <span className="font-semibold">{a.label}</span>
              <span className="ml-auto text-[11px] capitalize px-1.5 py-0.5 rounded" style={{ background: "var(--color-subtle)", color: "var(--color-dim)" }}>{a.side}</span>
            </div>
          ))}
        </div>

        {/* compliance rail */}
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 text-[11.5px] font-medium mt-3" style={{ color: "var(--color-accent)" }}>
          <ShieldCheck size={13} /> Compliance review ({p.complianceChecks.length} checks) {expanded ? "▲" : "▼"}
        </button>
        {expanded && (
          <div className="mt-2 flex flex-col gap-1.5">
            {p.complianceChecks.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: c.pass ? "var(--color-up)" : "var(--color-down)" }}>
                <CheckCircle2 size={13} /> {c.label}
              </div>
            ))}
          </div>
        )}

        <div className="text-[11.5px] mt-3 px-2.5 py-1.5 rounded-lg" style={{ background: "var(--color-inset)", color: "var(--color-dim)" }}>
          Est. impact: {p.estImpact}
        </div>
      </div>

      <div className="flex gap-0 border-t" style={{ borderColor: "var(--color-line)" }}>
        <button onClick={() => copilot.dismiss(p.id)} className="flex-1 py-2.5 text-[13px] font-medium" style={{ color: "var(--color-dim)" }}>Dismiss</button>
        <button onClick={() => copilot.approve(p.id)} className="flex-1 py-2.5 text-[13px] font-semibold text-white" style={{ background: "var(--color-accent)" }}>Approve &amp; route</button>
      </div>
    </div>
  );
}
