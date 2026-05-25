// ============================================================
// Core domain types — the contracts the whole app builds against.
// Mock implementations satisfy these now; real BOS / Model Studio
// APIs implement the same interfaces later with zero component changes.
// ============================================================

export type AssetClass = "stock" | "etf" | "fund" | "option";
export type AIRating = "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  assetClass: AssetClass;
  sector: string;
  aiRating: AIRating;
  aiScore: number; // 0-100
}

// ---- Options ----
export type OptionRight = "call" | "put";
export type OptionAction = "long" | "short";

// A single option leg in a contract/strategy.
export interface OptionLeg {
  right: OptionRight;
  action: OptionAction;
  strike: number;
  qty: number;          // contracts (x100 multiplier)
  premium: number;      // per-share premium
}

// Describes the option instrument attached to an order/position.
// `legs` length 1 = single-leg; >1 = multi-leg strategy.
export interface OptionContract {
  underlying: string;
  expiry: string;       // ISO date or "55d" style label for the mock
  strategy: string;     // e.g. "Bull Call Spread" or "Single Call"
  legs: OptionLeg[];
  netPrice: number;     // net debit (+) / credit (-) per strategy, per-share basis
}

export type Instrument = "equity" | "option";

export interface Position {
  symbol: string;
  shares: number;
  avgCost: number;
  source: "self-directed" | "model";
  modelId?: string;
  instrument?: Instrument;   // defaults to "equity" when absent
  option?: OptionContract;   // present when instrument === "option"
}

export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit" | "stop" | "stop-limit";
export type TimeInForce = "day" | "gtc" | "ioc" | "fok";
export type OrderStatus = "working" | "filled" | "canceled" | "rejected";

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  limitPrice?: number;
  stopPrice?: number;
  tif: TimeInForce;
  status: OrderStatus;
  filledQty: number;
  avgFillPrice?: number;
  createdAt: number;
  instrument?: Instrument;   // defaults to "equity" when absent
  option?: OptionContract;   // present when instrument === "option"
}

export interface ModelHolding {
  symbol: string;
  targetWeight: number;
}

// "discretionary" = TE Advisors manages the sleeve under an IMA (RIA path).
// "self-directed" = user copies target weights into their own account (BD path).
export type ModelProductType = "discretionary" | "self-directed";

export interface ModelPortfolio {
  id: string;
  name: string;
  manager: string;
  productType: ModelProductType;
  risk: "Conservative" | "Moderate" | "Growth" | "Aggressive";
  riskScore: number;            // 1-5, for suitability matching against profile
  advisoryFeePct: number;       // annual advisory fee for discretionary sleeves
  minInvestment: number;
  ytdReturn: number;
  sinceInception: number;
  allocated: number;
  holdings: ModelHolding[];
  actualWeights: Record<string, number>;
}

// ---- Suitability & account compliance state ----
// NOTE: placeholder structure for a prototype. Real questionnaire content,
// scoring rules, fee schedule, and disclosures must be defined by the RIA/CCO.
export type RiskTolerance = "Conservative" | "Moderate" | "Growth" | "Aggressive";

export interface SuitabilityProfile {
  completed: boolean;
  riskTolerance: RiskTolerance;
  riskScore: number;            // 1-5 derived from questionnaire
  horizonYears: number;
  liquidityNeed: "low" | "medium" | "high";
  updatedAt: number | null;
}

// Account-level, one-time gates (checked once, then stored).
export interface AccountCompliance {
  kycVerified: boolean;
  imaSigned: boolean;           // investment management agreement (discretionary)
  discretionGranted: boolean;
  advCrsDelivered: boolean;     // Form ADV 2A/2B + Form CRS
  regBiAck: boolean;            // best-interest acknowledgment (self-directed)
}

// A user's allocation into a model.
export interface ModelAllocation {
  id: string;
  modelId: string;
  productType: ModelProductType;
  amount: number;
  createdAt: number;
}

// Data-access interface — the seam. Swap the mock impl for a real one later.
export interface MarketDataSource {
  getQuotes(): Record<string, Quote>;
  subscribe(cb: (quotes: Record<string, Quote>) => void): () => void;
}

export interface BrokerageSource {
  getPositions(): Position[];
  getOrders(): Order[];
  placeOrder(draft: Omit<Order, "id" | "status" | "filledQty" | "createdAt">): Order;
  cancelOrder(id: string): void;
}

// ---- AI Copilot ----
export type ProposalKind = "concentration" | "drift" | "idle-cash";
export type ProposalStatus = "proposed" | "approved" | "dismissed" | "executed";

// A single action the copilot proposes, with a compliance rail the user reviews.
export interface ProposedAction {
  label: string;          // human description, e.g. "Sell 20 NVDA"
  symbol: string;
  side: OrderSide;
  qty: number;
  kind: "equity" | "allocation";
}

export interface CopilotProposal {
  id: string;
  kind: ProposalKind;
  title: string;
  rationale: string;       // why the AI is suggesting this (plain language)
  actions: ProposedAction[];
  complianceChecks: { label: string; pass: boolean }[];
  estImpact: string;       // e.g. "Reduces semiconductor concentration to 33%"
  status: ProposalStatus;
  createdAt: number;
}

// Ambient insight shown across surfaces (non-actionable, informational).
export interface CopilotInsight {
  id: string;
  tone: "positive" | "warning" | "neutral";
  text: string;
}

// The seam: a scripted impl now; a live Claude-API impl drops in later.
export interface CopilotSource {
  getInsights(): CopilotInsight[];
  getProposals(): CopilotProposal[];
  // ask the copilot to (re)generate proposals from current portfolio state
  analyze(): void;
  approve(id: string): void;
  dismiss(id: string): void;
}
