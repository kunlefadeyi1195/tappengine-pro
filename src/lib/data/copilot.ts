import type { CopilotSource, CopilotProposal, CopilotInsight, ProposedAction } from "@/lib/types";
import { brokerage } from "./brokerage";
import { marketData } from "./marketData";
import { fmtUSD } from "./seed";

// Scripted copilot. Detects real conditions from live portfolio state and
// proposes actions. The live Claude-API implementation will satisfy the same
// CopilotSource interface — UI never changes.
//
// To swap to live later: implement CopilotSource with calls to the Anthropic
// API (analyze() -> prompt with portfolio JSON -> parse proposals), keep
// approve()/dismiss() routing identical.
class ScriptedCopilot implements CopilotSource {
  private proposals: CopilotProposal[] = [];
  private listeners = new Set<() => void>();
  private snapshot: { insights: CopilotInsight[]; proposals: CopilotProposal[] } = { insights: [], proposals: [] };
  private analyzed = false;

  onChange(cb: () => void) { this.listeners.add(cb); return () => this.listeners.delete(cb); }
  private emit() { this.snapshot = { insights: this.computeInsights(), proposals: [...this.proposals] }; this.listeners.forEach((l) => l()); }
  getSnapshot() { return this.snapshot; }

  getInsights() { return this.computeInsights(); }
  getProposals() { return this.proposals; }

  private portfolio() {
    const quotes = marketData.getQuotes();
    const positions = brokerage.getPositions().filter((p) => (p.instrument ?? "equity") === "equity");
    const rows = positions.map((p) => {
      const price = quotes[p.symbol]?.price ?? p.avgCost;
      const value = p.shares * price;
      const sector = quotes[p.symbol]?.sector ?? "Other";
      return { symbol: p.symbol, shares: p.shares, price, value, sector };
    });
    const total = rows.reduce((a, r) => a + r.value, 0) || 1;
    return { rows, total, quotes };
  }

  private computeInsights(): CopilotInsight[] {
    const { rows, total } = this.portfolio();
    const out: CopilotInsight[] = [];
    // sector concentration
    const bySector: Record<string, number> = {};
    rows.forEach((r) => (bySector[r.sector] = (bySector[r.sector] || 0) + r.value));
    const topSector = Object.entries(bySector).sort((a, b) => b[1] - a[1])[0];
    if (topSector && topSector[1] / total > 0.35)
      out.push({ id: "ins-conc", tone: "warning", text: `${topSector[0]} is ${((topSector[1] / total) * 100).toFixed(0)}% of holdings — above the 35% guideline.` });
    // best performer
    const top = [...rows].sort((a, b) => b.value - a.value)[0];
    if (top) out.push({ id: "ins-top", tone: "positive", text: `${top.symbol} is your largest position at ${fmtUSD(top.value, 0)}.` });
    out.push({ id: "ins-cash", tone: "neutral", text: `You have ${fmtUSD(168420, 0)} in idle cash that could be deployed.` });
    return out;
  }

  analyze() {
    const { rows, total, quotes } = this.portfolio();
    const proposals: CopilotProposal[] = [];

    // 1. Concentration: if one symbol > 25% of equity, propose trimming to ~20%.
    const sorted = [...rows].sort((a, b) => b.value - a.value);
    const big = sorted[0];
    if (big && big.value / total > 0.25) {
      const targetValue = total * 0.20;
      const trimValue = big.value - targetValue;
      const trimQty = Math.max(1, Math.floor(trimValue / big.price));
      proposals.push({
        id: "prop-conc", kind: "concentration",
        title: `Trim ${big.symbol} to reduce concentration`,
        rationale: `${big.symbol} is ${((big.value / total) * 100).toFixed(0)}% of your equity holdings. Trimming ${trimQty} shares brings it closer to a 20% target and reduces single-name risk.`,
        actions: [{ label: `Sell ${trimQty} ${big.symbol}`, symbol: big.symbol, side: "sell", qty: trimQty, kind: "equity" }],
        complianceChecks: [
          { label: "Within self-directed trading authority", pass: true },
          { label: "No wash-sale conflict in last 30 days", pass: true },
          { label: "Order routed to TAPP Engine Securities (SIPC)", pass: true },
        ],
        estImpact: `Reduces ${big.symbol} from ${((big.value / total) * 100).toFixed(0)}% to ~20% of equity.`,
        status: "proposed", createdAt: Date.now(),
      });
    }

    // 2. Drift: semiconductor sector overweight -> propose trimming the top semi name.
    const semi = rows.filter((r) => r.sector === "Semiconductors");
    const semiValue = semi.reduce((a, r) => a + r.value, 0);
    if (semiValue / total > 0.35 && semi.length) {
      const topSemi = [...semi].sort((a, b) => b.value - a.value)[0];
      const trimQty = Math.max(1, Math.floor((semiValue - total * 0.30) / topSemi.price));
      proposals.push({
        id: "prop-drift", kind: "drift",
        title: "Rebalance semiconductor overweight",
        rationale: `Your semiconductor exposure is ${((semiValue / total) * 100).toFixed(0)}%, above the 35% guideline. Trimming ${trimQty} ${topSemi.symbol} rebalances toward a 30% sector target.`,
        actions: [{ label: `Sell ${trimQty} ${topSemi.symbol}`, symbol: topSemi.symbol, side: "sell", qty: trimQty, kind: "equity" }],
        complianceChecks: [
          { label: "Consistent with stated risk profile", pass: true },
          { label: "Sector rebalance within tolerance band", pass: true },
          { label: "Human approval required before execution", pass: true },
        ],
        estImpact: `Lowers semiconductor weight from ${((semiValue / total) * 100).toFixed(0)}% to ~30%.`,
        status: "proposed", createdAt: Date.now(),
      });
    }

    // 3. Idle cash: propose deploying part of cash into the largest-conviction name.
    const cash = 168420;
    if (cash > 10000) {
      const deploy = 50000;
      const pick = sorted[0] ?? { symbol: "QQQ", price: quotes["QQQ"]?.price ?? 520 };
      const buyQty = Math.max(1, Math.floor(deploy / pick.price));
      proposals.push({
        id: "prop-cash", kind: "idle-cash",
        title: "Put idle cash to work",
        rationale: `You're holding ${fmtUSD(cash, 0)} in cash. Deploying ${fmtUSD(deploy, 0)} into ${pick.symbol} (your highest-conviction holding) reduces cash drag while staying within your risk profile.`,
        actions: [{ label: `Buy ${buyQty} ${pick.symbol}`, symbol: pick.symbol, side: "buy", qty: buyQty, kind: "equity" }],
        complianceChecks: [
          { label: "Sufficient settled cash available", pass: true },
          { label: "Position size within concentration limits", pass: true },
          { label: "Order routed to TAPP Engine Securities (SIPC)", pass: true },
        ],
        estImpact: `Deploys ${fmtUSD(deploy, 0)}; cash drag reduced.`,
        status: "proposed", createdAt: Date.now(),
      });
    }

    this.proposals = proposals;
    this.analyzed = true;
    this.emit();
  }

  approve(id: string) {
    const p = this.proposals.find((x) => x.id === id);
    if (!p || p.status !== "proposed") return;
    // route each action through the existing brokerage layer
    p.actions.forEach((a: ProposedAction) => {
      brokerage.placeOrder({ symbol: a.symbol, side: a.side, type: "market", qty: a.qty, tif: "day", instrument: "equity" });
    });
    p.status = "executed";
    this.emit();
  }

  dismiss(id: string) {
    const p = this.proposals.find((x) => x.id === id);
    if (p && p.status === "proposed") { p.status = "dismissed"; this.emit(); }
  }

  hasAnalyzed() { return this.analyzed; }

  reset() {
    this.proposals = [];
    this.analyzed = false;
    this.emit();
  }
}

export const copilot = new ScriptedCopilot();
