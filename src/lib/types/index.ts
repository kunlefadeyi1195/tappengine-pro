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

export interface ModelPortfolio {
  id: string;
  name: string;
  manager: string;
  risk: "Conservative" | "Moderate" | "Growth" | "Aggressive";
  ytdReturn: number;
  sinceInception: number;
  allocated: number;
  holdings: ModelHolding[];
  actualWeights: Record<string, number>;
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
