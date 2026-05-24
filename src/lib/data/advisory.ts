import type { AccountCompliance, SuitabilityProfile, ModelAllocation, ModelPortfolio, RiskTolerance } from "@/lib/types";
import { INITIAL_COMPLIANCE, INITIAL_SUITABILITY } from "./seed";
import { brokerage } from "./brokerage";
import { marketData } from "./marketData";

// Advisory account state: compliance gates, suitability profile, model allocations.
// In production this is the RIA onboarding / CRM system; here it's an in-memory mock
// behind the same kind of seam as the brokerage.
class AdvisoryStore {
  private compliance: AccountCompliance = { ...INITIAL_COMPLIANCE };
  private suitability: SuitabilityProfile = { ...INITIAL_SUITABILITY };
  private allocations: ModelAllocation[] = [];
  private listeners = new Set<() => void>();
  private snapshot = this.build();

  private build() {
    return { compliance: { ...this.compliance }, suitability: { ...this.suitability }, allocations: [...this.allocations] };
  }
  onChange(cb: () => void) { this.listeners.add(cb); return () => this.listeners.delete(cb); }
  private emit() { this.snapshot = this.build(); this.listeners.forEach((l) => l()); }
  getSnapshot() { return this.snapshot; }

  // ---- suitability ----
  completeSuitability(p: { riskTolerance: RiskTolerance; riskScore: number; horizonYears: number; liquidityNeed: "low" | "medium" | "high" }) {
    this.suitability = { ...p, completed: true, updatedAt: Date.now() };
    this.emit();
  }

  // ---- account onboarding (discretionary) ----
  completeAdvisoryOnboarding() {
    this.compliance = { ...this.compliance, imaSigned: true, discretionGranted: true, advCrsDelivered: true };
    this.emit();
  }
  ackRegBi() { this.compliance = { ...this.compliance, regBiAck: true }; this.emit(); }

  // ---- gating logic ----
  // Is the account fully onboarded for discretionary advisory?
  isAdvisoryOnboarded() {
    const c = this.compliance;
    return c.kycVerified && c.imaSigned && c.discretionGranted && c.advCrsDelivered;
  }

  // Suitability check: is this model appropriate for the profile on file?
  // Returns severity so the UI can hard-stop or allow an acknowledged override.
  checkSuitability(model: ModelPortfolio): { ok: boolean; severity: "ok" | "warn" | "block"; reason?: string } {
    if (!this.suitability.completed) return { ok: false, severity: "block", reason: "Risk profile not completed." };
    const gap = model.riskScore - this.suitability.riskScore;
    if (gap >= 2) return { ok: false, severity: "block", reason: `This ${model.risk} model exceeds your ${this.suitability.riskTolerance} risk profile by a wide margin.` };
    if (gap === 1) return { ok: true, severity: "warn", reason: `This ${model.risk} model is slightly above your ${this.suitability.riskTolerance} profile. You may proceed with acknowledgment.` };
    if (model.minInvestment > 0 && this.suitability.horizonYears < 3 && model.riskScore >= 4)
      return { ok: true, severity: "warn", reason: "Short time horizon for a higher-risk model." };
    return { ok: true, severity: "ok" };
  }

  // ---- funding / allocation ----
  allocate(model: ModelPortfolio, amount: number) {
    const alloc: ModelAllocation = { id: "alloc_" + Math.random().toString(36).slice(2, 8), modelId: model.id, productType: model.productType, amount, createdAt: Date.now() };
    this.allocations = [alloc, ...this.allocations];
    this.emit();
    return alloc;
  }

  // Self-directed: translate target weights into a basket of market orders the USER places.
  placeSelfDirectedBasket(model: ModelPortfolio, amount: number) {
    const quotes = marketData.getQuotes();
    for (const h of model.holdings) {
      const q = quotes[h.symbol]; if (!q) continue;
      const dollars = amount * (h.targetWeight / 100);
      const shares = Math.max(1, Math.floor(dollars / q.price));
      brokerage.placeOrder({ symbol: h.symbol, side: "buy", type: "market", qty: shares, tif: "day", instrument: "equity" });
    }
    this.allocate(model, amount);
  }

  totalAllocated(modelId: string) {
    return this.allocations.filter((a) => a.modelId === modelId).reduce((s, a) => s + a.amount, 0);
  }
}

export const advisory = new AdvisoryStore();
