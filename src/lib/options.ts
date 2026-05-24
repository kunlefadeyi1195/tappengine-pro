// Black-Scholes option pricing and Greeks. Pure functions, no dependencies.

function cnd(x: number): number {
  const a1 = 0.319381530, a2 = -0.356563782, a3 = 1.781477937, a4 = -1.821255978, a5 = 1.330274429;
  const k = 1 / (1 + 0.2316419 * Math.abs(x));
  const w = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-x * x / 2) * (a1 * k + a2 * k * k + a3 * k ** 3 + a4 * k ** 4 + a5 * k ** 5);
  return x < 0 ? 1 - w : w;
}
function npdf(x: number): number { return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-x * x / 2); }

export type OptType = "call" | "put";
export type OptSide = "long" | "short";

export interface Greeks { price: number; delta: number; gamma: number; theta: number; vega: number; }

export function bs(type: OptType, S: number, K: number, T: number, r: number, sig: number): Greeks {
  S = Math.max(S, 0.01); K = Math.max(K, 0.01); T = Math.max(T, 1 / 365); sig = Math.max(sig, 0.01);
  const d1 = (Math.log(S / K) + (r + sig * sig / 2) * T) / (sig * Math.sqrt(T));
  const d2 = d1 - sig * Math.sqrt(T);
  let price: number, delta: number;
  if (type === "call") { price = S * cnd(d1) - K * Math.exp(-r * T) * cnd(d2); delta = cnd(d1); }
  else { price = K * Math.exp(-r * T) * cnd(-d2) - S * cnd(-d1); delta = cnd(d1) - 1; }
  const gamma = npdf(d1) / (S * sig * Math.sqrt(T));
  const theta = (-(S * npdf(d1) * sig) / (2 * Math.sqrt(T)) - (type === "call" ? 1 : -1) * r * K * Math.exp(-r * T) * cnd((type === "call" ? 1 : -1) * d2)) / 365;
  const vega = S * npdf(d1) * Math.sqrt(T) / 100;
  return { price, delta, gamma, theta, vega };
}

export interface Leg { id: string; type: OptType; side: OptSide; strike: number; qty: number; premium: number; iv: number; }

// P&L of a single leg at expiry given underlying price ST
export function legPL(l: Leg, ST: number): number {
  const intrinsic = l.type === "call" ? Math.max(0, ST - l.strike) : Math.max(0, l.strike - ST);
  const sign = l.side === "long" ? 1 : -1;
  const cost = l.side === "long" ? -l.premium : l.premium;
  return (sign * intrinsic + cost) * l.qty * 100;
}
