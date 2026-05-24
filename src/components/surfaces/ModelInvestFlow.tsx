"use client";

import { useState } from "react";
import { X, CheckCircle2, ShieldCheck, AlertTriangle, ChevronRight, FileText, Scale } from "lucide-react";
import type { ModelPortfolio, RiskTolerance } from "@/lib/types";
import { advisory } from "@/lib/data/advisory";
import { useAdvisory } from "@/lib/hooks/useMarket";
import { fmt, fmtUSD, fmtPct } from "@/lib/data/seed";

type Step = "suitability" | "agreement" | "regbi" | "fund" | "done";

const RISK_OPTIONS: { value: RiskTolerance; score: number; label: string }[] = [
  { value: "Conservative", score: 2, label: "Preserve capital, low volatility" },
  { value: "Moderate", score: 3, label: "Balanced growth and stability" },
  { value: "Growth", score: 4, label: "Growth-focused, tolerate swings" },
  { value: "Aggressive", score: 5, label: "Maximum growth, high volatility" },
];

export function ModelInvestFlow({ model, onClose }: { model: ModelPortfolio; onClose: () => void }) {
  const { compliance, suitability } = useAdvisory();
  const isDiscretionary = model.productType === "discretionary";

  // Determine the entry step based on what's already satisfied.
  const initialStep = (): Step => {
    if (!suitability.completed) return "suitability";
    if (isDiscretionary && !advisory.isAdvisoryOnboarded()) return "agreement";
    if (!isDiscretionary && !compliance.regBiAck) return "regbi";
    return "fund";
  };
  const [step, setStep] = useState<Step>(initialStep);
  const [amount, setAmount] = useState(model.minInvestment > 0 ? model.minInvestment : 10000);
  const [overrideAck, setOverrideAck] = useState(false);

  // suitability form
  const [risk, setRisk] = useState<RiskTolerance>(suitability.riskTolerance);
  const [horizon, setHorizon] = useState(suitability.horizonYears);
  const [liquidity, setLiquidity] = useState<"low" | "medium" | "high">(suitability.liquidityNeed);

  const suit = advisory.checkSuitability(model);

  const advanceFromSuitability = () => {
    const score = RISK_OPTIONS.find((r) => r.value === risk)?.score ?? 3;
    advisory.completeSuitability({ riskTolerance: risk, riskScore: score, horizonYears: horizon, liquidityNeed: liquidity });
    if (isDiscretionary && !advisory.isAdvisoryOnboarded()) setStep("agreement");
    else if (!isDiscretionary && !compliance.regBiAck) setStep("regbi");
    else setStep("fund");
  };

  const fund = () => {
    if (isDiscretionary) advisory.allocate(model, amount);
    else advisory.placeSelfDirectedBasket(model, amount);
    setStep("done");
  };

  const annualFee = (amount * model.advisoryFeePct) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(7,10,22,0.55)" }} onClick={onClose}>
      <div className="rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-auto sc animate-slide-in" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }} onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 z-10" style={{ borderColor: "var(--color-line)", background: "var(--color-panel)" }}>
          <div>
            <div className="text-[15px] font-semibold">{step === "done" ? "Allocation complete" : `Invest in ${model.name}`}</div>
            <div className="text-[12px] flex items-center gap-1.5 mt-0.5" style={{ color: "var(--color-faint)" }}>
              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold" style={{ background: isDiscretionary ? "var(--color-accent-soft)" : "var(--color-subtle)", color: isDiscretionary ? "var(--color-accent)" : "var(--color-dim)" }}>
                {isDiscretionary ? "DISCRETIONARY · TE ADVISORS" : "SELF-DIRECTED TEMPLATE"}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "var(--color-dim)" }}><X size={18} /></button>
        </div>

        {/* step indicator */}
        {step !== "done" && (
          <div className="flex items-center gap-1.5 px-5 pt-4 text-[11px]" style={{ color: "var(--color-faint)" }}>
            <Stepper label="Suitability" active={step === "suitability"} done={suitability.completed} />
            <ChevronRight size={12} />
            {isDiscretionary
              ? <Stepper label="Agreement" active={step === "agreement"} done={advisory.isAdvisoryOnboarded()} />
              : <Stepper label="Best Interest" active={step === "regbi"} done={compliance.regBiAck} />}
            <ChevronRight size={12} />
            <Stepper label="Fund" active={step === "fund"} done={false} />
          </div>
        )}

        <div className="p-5">
          {/* ---- SUITABILITY ---- */}
          {step === "suitability" && (
            <div>
              <div className="flex items-center gap-2 text-[14px] font-semibold mb-1"><Scale size={15} style={{ color: "var(--color-accent)" }} /> Risk profile</div>
              <p className="text-[12.5px] mb-4" style={{ color: "var(--color-dim)" }}>Your advisor uses this to determine whether a model is suitable for you. <span style={{ color: "var(--color-faint)" }}>(Prototype questionnaire — real content set by TE Advisors.)</span></p>

              <label className="text-[11px] uppercase font-semibold" style={{ color: "var(--color-faint)" }}>Risk tolerance</label>
              <div className="grid grid-cols-2 gap-2 mt-1.5 mb-4">
                {RISK_OPTIONS.map((r) => (
                  <button key={r.value} onClick={() => setRisk(r.value)} className="text-left p-3 rounded-xl"
                    style={{ background: risk === r.value ? "var(--color-inset)" : "var(--color-panel)", border: `1px solid ${risk === r.value ? "var(--color-accent)" : "var(--color-line)"}` }}>
                    <div className="text-[13px] font-semibold">{r.value}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--color-faint)" }}>{r.label}</div>
                  </button>
                ))}
              </div>

              <label className="text-[11px] uppercase font-semibold" style={{ color: "var(--color-faint)" }}>Time horizon: {horizon} years</label>
              <input type="range" min={1} max={30} value={horizon} onChange={(e) => setHorizon(parseInt(e.target.value))} className="w-full mt-2 mb-4" style={{ accentColor: "var(--color-accent)" }} />

              <label className="text-[11px] uppercase font-semibold" style={{ color: "var(--color-faint)" }}>Liquidity need</label>
              <div className="flex gap-1.5 mt-1.5 mb-5">
                {(["low", "medium", "high"] as const).map((l) => (
                  <button key={l} onClick={() => setLiquidity(l)} className="flex-1 py-2 rounded-lg text-[12px] font-medium capitalize"
                    style={{ background: liquidity === l ? "var(--color-accent-soft)" : "transparent", color: liquidity === l ? "var(--color-accent)" : "var(--color-dim)", border: `1px solid ${liquidity === l ? "var(--color-accent)" : "var(--color-line)"}` }}>{l}</button>
                ))}
              </div>

              <button onClick={advanceFromSuitability} className="w-full h-11 rounded-xl font-semibold text-[14px] text-white" style={{ background: "var(--color-accent)" }}>
                Save profile &amp; continue
              </button>
            </div>
          )}

          {/* ---- DISCRETIONARY AGREEMENT ---- */}
          {step === "agreement" && (
            <div>
              <div className="flex items-center gap-2 text-[14px] font-semibold mb-1"><FileText size={15} style={{ color: "var(--color-accent)" }} /> Advisory agreement</div>
              <p className="text-[12.5px] mb-4" style={{ color: "var(--color-dim)" }}>Investing in a TE Advisors managed model requires an investment management agreement granting discretionary authority.</p>

              {/* suitability verdict */}
              <SuitabilityBanner suit={suit} model={model} overrideAck={overrideAck} setOverrideAck={setOverrideAck} />

              <div className="rounded-xl p-4 my-4 space-y-2 text-[12.5px]" style={{ background: "var(--color-panel2)", border: "1px solid var(--color-line)" }}>
                <Row label="Advisory fee" value={fmtPct(model.advisoryFeePct).replace("+", "") + " / yr"} />
                <Row label="Manager" value={model.manager} />
                <Row label="Discretionary authority" value="Granted to TE Advisors" />
                <Row label="Minimum investment" value={fmtUSD(model.minInvestment, 0)} />
              </div>

              <div className="space-y-2 text-[12px] mb-4" style={{ color: "var(--color-dim)" }}>
                <Check text="I have received Form ADV Part 2A/2B and Form CRS" />
                <Check text="I authorize discretionary management of this sleeve" />
                <Check text="I consent to the advisory fee shown above" />
              </div>

              <button
                disabled={!suit.ok || (suit.severity === "warn" && !overrideAck)}
                onClick={() => { advisory.completeAdvisoryOnboarding(); setStep("fund"); }}
                className="w-full h-11 rounded-xl font-semibold text-[14px] text-white disabled:opacity-50"
                style={{ background: "var(--color-accent)" }}>
                Sign agreement &amp; continue
              </button>
            </div>
          )}

          {/* ---- SELF-DIRECTED REG BI ---- */}
          {step === "regbi" && (
            <div>
              <div className="flex items-center gap-2 text-[14px] font-semibold mb-1"><ShieldCheck size={15} style={{ color: "var(--color-accent)" }} /> Best-interest acknowledgment</div>
              <p className="text-[12.5px] mb-4" style={{ color: "var(--color-dim)" }}>This is a self-directed template. You place the trades into your own account — TAPP Engine does not manage it. No advisory fee applies.</p>

              <SuitabilityBanner suit={suit} model={model} overrideAck={overrideAck} setOverrideAck={setOverrideAck} />

              <div className="rounded-xl p-4 my-4 text-[12px]" style={{ background: "var(--color-panel2)", border: "1px solid var(--color-line)", color: "var(--color-dim)" }}>
                <Check text="I understand this is self-directed and not investment advice" />
                <Check text="I have reviewed the holdings and accept the risks" />
                <Check text="I am responsible for placing and managing these trades" />
              </div>

              <button
                disabled={!suit.ok || (suit.severity === "warn" && !overrideAck)}
                onClick={() => { advisory.ackRegBi(); setStep("fund"); }}
                className="w-full h-11 rounded-xl font-semibold text-[14px] text-white disabled:opacity-50"
                style={{ background: "var(--color-accent)" }}>
                Acknowledge &amp; continue
              </button>
            </div>
          )}

          {/* ---- FUND ---- */}
          {step === "fund" && (
            <div>
              <div className="text-[14px] font-semibold mb-1">Allocation amount</div>
              <p className="text-[12.5px] mb-4" style={{ color: "var(--color-dim)" }}>
                {isDiscretionary ? "TE Advisors will invest this into the model's target weights." : "We'll place market orders into your account matching the target weights."}
              </p>

              <div className="flex items-center gap-2 rounded-xl px-3 py-3 mb-2" style={{ background: "var(--color-panel2)", border: "1px solid var(--color-line)" }}>
                <span className="text-[18px] font-semibold" style={{ color: "var(--color-faint)" }}>$</span>
                <input value={amount} onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value.replace(/\D/g, "")) || 0))}
                  className="num bg-transparent outline-none text-[20px] font-semibold w-full" style={{ color: "var(--color-content)" }} />
              </div>
              <div className="flex gap-1.5 mb-4">
                {[10000, 25000, 50000, 100000].map((a) => (
                  <button key={a} onClick={() => setAmount(a)} className="flex-1 py-1.5 rounded-lg text-[11.5px] font-medium" style={{ background: "var(--color-subtle)", color: "var(--color-dim)" }}>{fmtUSD(a, 0)}</button>
                ))}
              </div>

              {model.minInvestment > 0 && amount < model.minInvestment && (
                <div className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-lg mb-3" style={{ background: "color-mix(in srgb, var(--color-down) 10%, transparent)", color: "var(--color-down)" }}>
                  <AlertTriangle size={13} /> Below the {fmtUSD(model.minInvestment, 0)} minimum for this model.
                </div>
              )}

              <div className="rounded-xl p-4 mb-4 space-y-2 text-[12.5px]" style={{ background: "var(--color-inset)" }}>
                <Row label="Allocation" value={fmtUSD(amount, 0)} bold />
                {isDiscretionary && <Row label="Est. annual advisory fee" value={fmtUSD(annualFee, 0) + ` (${fmt(model.advisoryFeePct)}%)`} />}
                <Row label="Holdings" value={`${model.holdings.length} positions`} />
                <Row label="Cash available" value={fmtUSD(168420, 0)} />
              </div>

              <button disabled={model.minInvestment > 0 && amount < model.minInvestment} onClick={fund}
                className="w-full h-11 rounded-xl font-semibold text-[14px] text-white disabled:opacity-50" style={{ background: "var(--color-up)" }}>
                {isDiscretionary ? `Allocate ${fmtUSD(amount, 0)}` : `Place basket · ${fmtUSD(amount, 0)}`}
              </button>
            </div>
          )}

          {/* ---- DONE ---- */}
          {step === "done" && (
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <CheckCircle2 size={42} style={{ color: "var(--color-up)" }} />
              <div className="text-[16px] font-semibold">{isDiscretionary ? "Allocation submitted" : "Basket order placed"}</div>
              <div className="text-[13px]" style={{ color: "var(--color-dim)" }}>
                {fmtUSD(amount, 0)} into {model.name}
              </div>
              <div className="text-[12px]" style={{ color: "var(--color-faint)" }}>
                {isDiscretionary
                  ? "TE Advisors will manage this sleeve. You'll see it under Models and Analyzer."
                  : "Market orders were sent to your account. Check Positions & Orders."}
              </div>
              <button onClick={onClose} className="mt-2 px-5 h-10 rounded-xl font-semibold text-[13px] text-white" style={{ background: "var(--color-accent)" }}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SuitabilityBanner({ suit, model, overrideAck, setOverrideAck }: { suit: { ok: boolean; severity: string; reason?: string }; model: ModelPortfolio; overrideAck: boolean; setOverrideAck: (v: boolean) => void }) {
  if (suit.severity === "ok") return (
    <div className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-lg" style={{ background: "color-mix(in srgb, var(--color-up) 10%, transparent)", color: "var(--color-up)" }}>
      <CheckCircle2 size={13} /> This {model.risk} model is suitable for your profile.
    </div>
  );
  if (suit.severity === "block") return (
    <div className="flex items-start gap-2 text-[12px] px-3 py-2.5 rounded-lg" style={{ background: "color-mix(in srgb, var(--color-down) 12%, transparent)", color: "var(--color-down)" }}>
      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> <span>{suit.reason} You cannot allocate to this model.</span>
    </div>
  );
  return (
    <div className="rounded-lg px-3 py-2.5" style={{ background: "color-mix(in srgb, var(--color-hold) 14%, transparent)" }}>
      <div className="flex items-start gap-2 text-[12px]" style={{ color: "var(--color-hold)" }}>
        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> <span>{suit.reason}</span>
      </div>
      <label className="flex items-center gap-2 mt-2 text-[12px] cursor-pointer" style={{ color: "var(--color-dim)" }}>
        <input type="checkbox" checked={overrideAck} onChange={(e) => setOverrideAck(e.target.checked)} style={{ accentColor: "var(--color-accent)" }} />
        I understand and accept the elevated risk relative to my profile.
      </label>
    </div>
  );
}

function Stepper({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <span className="flex items-center gap-1" style={{ color: active ? "var(--color-accent)" : done ? "var(--color-up)" : "var(--color-faint)", fontWeight: active ? 600 : 500 }}>
      {done && !active && <CheckCircle2 size={12} />} {label}
    </span>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: "var(--color-dim)" }}>{label}</span>
      <span className="num" style={{ fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}

function Check({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-up)" }} />
      <span>{text}</span>
    </div>
  );
}
