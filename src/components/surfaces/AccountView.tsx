"use client";

import { useState } from "react";
import { useAdvisory } from "@/lib/hooks/useMarket";
import { useTheme } from "@/components/layout/ThemeProvider";
import { CASH_BALANCE, fmt, fmtUSD } from "@/lib/data/seed";
import { User, ShieldCheck, Bell, Palette, FileText, CheckCircle2, XCircle, Moon, Sun } from "lucide-react";

export function AccountView() {
  const { compliance, suitability, allocations } = useAdvisory();
  const { theme, toggle } = useTheme();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [marketAlerts, setMarketAlerts] = useState(false);

  const totalAllocated = allocations.reduce((a, x) => a + x.amount, 0);

  return (
    <div className="sc flex-1 overflow-auto p-6">
      <div className="max-w-[860px] mx-auto">
        {/* profile header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-semibold text-[24px]" style={{ background: "linear-gradient(135deg,#6e83ff,#c9ceff)" }}>KF</div>
          <div>
            <h1 className="font-display text-[26px]">Kunle Fadeyi</h1>
            <div className="text-[13px]" style={{ color: "var(--color-dim)" }}>Individual brokerage · Account 23-573010</div>
          </div>
        </div>

        {/* account details */}
        <Section icon={User} title="Account details">
          <Field label="Account holder" value="Kunle Fadeyi" />
          <Field label="Account number" value="23-573010" />
          <Field label="Account type" value="Individual taxable brokerage" />
          <Field label="Custodian" value="TAPP Engine Securities, LLC · SIPC" />
          <Field label="Cash balance" value={fmtUSD(Math.max(0, CASH_BALANCE - totalAllocated), 0)} />
          <Field label="In managed models" value={fmtUSD(totalAllocated, 0)} last />
        </Section>

        {/* compliance & suitability */}
        <Section icon={ShieldCheck} title="Suitability & compliance">
          <StatusRow label="KYC / identity verified" ok={compliance.kycVerified} />
          <StatusRow label="Risk profile completed" ok={suitability.completed} detail={suitability.completed ? `${suitability.riskTolerance} · ${suitability.horizonYears}yr horizon` : "Not yet completed"} />
          <StatusRow label="Investment management agreement (IMA)" ok={compliance.imaSigned} detail={compliance.imaSigned ? "Signed" : "Required for discretionary models"} />
          <StatusRow label="Discretionary authority granted" ok={compliance.discretionGranted} />
          <StatusRow label="Form ADV 2A/2B + Form CRS delivered" ok={compliance.advCrsDelivered} />
          <StatusRow label="Best-interest acknowledgment (self-directed)" ok={compliance.regBiAck} last />
          <p className="text-[11px] mt-3" style={{ color: "var(--color-faint)" }}>These statuses are set as you complete the model investment flows. Real onboarding content is defined by TE Advisors / compliance.</p>
        </Section>

        {/* preferences */}
        <Section icon={Palette} title="Appearance">
          <div className="flex items-center justify-between py-2.5">
            <div>
              <div className="text-[13px] font-medium">Theme</div>
              <div className="text-[11.5px]" style={{ color: "var(--color-faint)" }}>Light or dark interface</div>
            </div>
            <button onClick={toggle} className="flex items-center gap-2 px-3 h-9 rounded-lg border text-[12.5px] font-medium" style={{ borderColor: "var(--color-line)", color: "var(--color-dim)" }}>
              {theme === "light" ? <><Moon size={14} /> Dark</> : <><Sun size={14} /> Light</>}
            </button>
          </div>
        </Section>

        {/* notification prefs */}
        <Section icon={Bell} title="Notifications">
          <Toggle label="Order fills & confirmations" desc="When orders fill or strategies route" on={emailNotifs} set={setEmailNotifs} />
          <Toggle label="Copilot suggestions" desc="When the AI proposes portfolio actions" on={pushNotifs} set={setPushNotifs} />
          <Toggle label="Market alerts" desc="Large moves in your holdings" on={marketAlerts} set={setMarketAlerts} last />
        </Section>

        {/* documents */}
        <Section icon={FileText} title="Documents & statements">
          <DocRow label="Account agreement" />
          <DocRow label="Form CRS (Relationship Summary)" />
          <DocRow label="Form ADV Part 2A/2B" />
          <DocRow label="Q1 2026 account statement" last />
          <p className="text-[11px] mt-3" style={{ color: "var(--color-faint)" }}>Document links are placeholders in this prototype.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ size?: number }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl mb-4 overflow-hidden" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)" }}>
      <div className="flex items-center gap-2 px-5 py-3.5 border-b text-[14px] font-semibold" style={{ borderColor: "var(--color-line)" }}>
        <Icon size={16} /> {title}
      </div>
      <div className="px-5 py-2">{children}</div>
    </div>
  );
}

function Field({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: last ? "none" : "1px solid var(--color-subtle)" }}>
      <span className="text-[12.5px]" style={{ color: "var(--color-dim)" }}>{label}</span>
      <span className="num text-[13px] font-medium">{value}</span>
    </div>
  );
}

function StatusRow({ label, ok, detail, last }: { label: string; ok: boolean; detail?: string; last?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: last ? "none" : "1px solid var(--color-subtle)" }}>
      <span className="text-[12.5px]">{label}</span>
      <span className="flex items-center gap-2 text-[12px]" style={{ color: ok ? "var(--color-up)" : "var(--color-faint)" }}>
        {detail && <span style={{ color: "var(--color-faint)" }}>{detail}</span>}
        {ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
      </span>
    </div>
  );
}

function Toggle({ label, desc, on, set, last }: { label: string; desc: string; on: boolean; set: (v: boolean) => void; last?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: last ? "none" : "1px solid var(--color-subtle)" }}>
      <div>
        <div className="text-[13px] font-medium">{label}</div>
        <div className="text-[11.5px]" style={{ color: "var(--color-faint)" }}>{desc}</div>
      </div>
      <button onClick={() => set(!on)} className="w-11 h-6 rounded-full p-0.5 transition-all" style={{ background: on ? "var(--color-accent)" : "var(--color-line)" }}>
        <div className="w-5 h-5 rounded-full bg-white transition-all" style={{ transform: on ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );
}

function DocRow({ label, last }: { label: string; last?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: last ? "none" : "1px solid var(--color-subtle)" }}>
      <span className="text-[12.5px] flex items-center gap-2"><FileText size={14} style={{ color: "var(--color-faint)" }} /> {label}</span>
      <span className="text-[12px] font-medium" style={{ color: "var(--color-accent)" }}>Download</span>
    </div>
  );
}
