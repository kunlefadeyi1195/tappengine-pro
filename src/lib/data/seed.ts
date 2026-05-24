import type { Quote, Position, ModelPortfolio, AssetClass, AIRating } from "@/lib/types";

interface Seed {
  symbol: string; name: string; price: number; prevClose: number;
  assetClass: AssetClass; sector: string; aiRating: AIRating; aiScore: number;
}

export const SEEDS: Seed[] = [
  { symbol: "NVDA", name: "NVIDIA Corp", price: 174.32, prevClose: 169.10, assetClass: "stock", sector: "Semiconductors", aiRating: "Strong Buy", aiScore: 92 },
  { symbol: "MU", name: "Micron Technology", price: 142.88, prevClose: 138.20, assetClass: "stock", sector: "Semiconductors", aiRating: "Buy", aiScore: 78 },
  { symbol: "ASML", name: "ASML Holding", price: 1042.50, prevClose: 1028.00, assetClass: "stock", sector: "Semiconductors", aiRating: "Buy", aiScore: 81 },
  { symbol: "GEV", name: "GE Vernova", price: 612.40, prevClose: 598.10, assetClass: "stock", sector: "Power", aiRating: "Strong Buy", aiScore: 88 },
  { symbol: "CEG", name: "Constellation Energy", price: 308.75, prevClose: 312.40, assetClass: "stock", sector: "Power", aiRating: "Hold", aiScore: 61 },
  { symbol: "NOW", name: "ServiceNow", price: 1088.20, prevClose: 1071.00, assetClass: "stock", sector: "Software", aiRating: "Buy", aiScore: 75 },
  { symbol: "CRM", name: "Salesforce", price: 332.15, prevClose: 329.80, assetClass: "stock", sector: "Software", aiRating: "Hold", aiScore: 58 },
  { symbol: "MSFT", name: "Microsoft Corp", price: 478.90, prevClose: 474.20, assetClass: "stock", sector: "Software", aiRating: "Strong Buy", aiScore: 90 },
  { symbol: "AVGO", name: "Broadcom Inc", price: 1722.10, prevClose: 1689.00, assetClass: "stock", sector: "Semiconductors", aiRating: "Buy", aiScore: 79 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", price: 521.66, prevClose: 518.20, assetClass: "etf", sector: "Index", aiRating: "Buy", aiScore: 72 },
  { symbol: "SMH", name: "VanEck Semiconductor", price: 288.40, prevClose: 282.90, assetClass: "etf", sector: "Sector", aiRating: "Buy", aiScore: 77 },
  { symbol: "VTI", name: "Vanguard Total Mkt", price: 298.10, prevClose: 296.40, assetClass: "etf", sector: "Index", aiRating: "Hold", aiScore: 64 },
  { symbol: "VTSAX", name: "Vanguard Total Stock Idx", price: 132.18, prevClose: 131.40, assetClass: "fund", sector: "Index", aiRating: "Hold", aiScore: 66 },
  { symbol: "FXAIX", name: "Fidelity 500 Index", price: 198.55, prevClose: 197.10, assetClass: "fund", sector: "Index", aiRating: "Buy", aiScore: 71 },
];

export const INITIAL_POSITIONS: Position[] = [
  { symbol: "NVDA", shares: 120, avgCost: 151.20, source: "self-directed" },
  { symbol: "MU", shares: 80, avgCost: 127.10, source: "self-directed" },
  { symbol: "ASML", shares: 15, avgCost: 945.00, source: "self-directed" },
  { symbol: "GEV", shares: 22, avgCost: 540.00, source: "self-directed" },
  { symbol: "CEG", shares: 30, avgCost: 287.50, source: "self-directed" },
  { symbol: "MSFT", shares: 40, avgCost: 436.00, source: "self-directed" },
  { symbol: "QQQ", shares: 60, avgCost: 476.30, source: "self-directed" },
];

export const MODELS: ModelPortfolio[] = [
  {
    id: "ai-infra", name: "AI Infrastructure Growth", manager: "TE Advisors", risk: "Aggressive",
    ytdReturn: 24.6, sinceInception: 61.2, allocated: 184200,
    holdings: [
      { symbol: "NVDA", targetWeight: 24 }, { symbol: "AVGO", targetWeight: 18 }, { symbol: "ASML", targetWeight: 14 },
      { symbol: "MU", targetWeight: 12 }, { symbol: "SMH", targetWeight: 16 }, { symbol: "NOW", targetWeight: 10 }, { symbol: "MSFT", targetWeight: 6 },
    ],
    actualWeights: { NVDA: 28.4, AVGO: 16.1, ASML: 13.2, MU: 10.8, SMH: 14.0, NOW: 9.9, MSFT: 7.6 },
  },
  {
    id: "power-grid", name: "Power & Electrification", manager: "TE Advisors", risk: "Growth",
    ytdReturn: 18.1, sinceInception: 33.4, allocated: 92000,
    holdings: [
      { symbol: "GEV", targetWeight: 30 }, { symbol: "CEG", targetWeight: 28 }, { symbol: "VTI", targetWeight: 22 }, { symbol: "QQQ", targetWeight: 20 },
    ],
    actualWeights: { GEV: 31.2, CEG: 26.4, VTI: 22.1, QQQ: 20.3 },
  },
  {
    id: "balanced", name: "Core Balanced 60/40", manager: "TE Advisors", risk: "Moderate",
    ytdReturn: 9.2, sinceInception: 14.8, allocated: 0,
    holdings: [{ symbol: "VTI", targetWeight: 40 }, { symbol: "QQQ", targetWeight: 20 }, { symbol: "VTSAX", targetWeight: 40 }],
    actualWeights: {},
  },
];

export const CASH_BALANCE = 168420;

// Formatting helpers
export const fmt = (n: number, d = 2) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtUSD = (n: number, d = 2) => "$" + fmt(Math.abs(n), d);
export const fmtPct = (n: number, d = 2) => (n >= 0 ? "+" : "") + fmt(n, d) + "%";

export function aiRatingColor(rating: AIRating): string {
  if (rating === "Strong Buy" || rating === "Buy") return "var(--color-up)";
  if (rating === "Sell" || rating === "Strong Sell") return "var(--color-down)";
  return "var(--color-hold)";
}
