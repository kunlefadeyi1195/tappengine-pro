import type { MarketDataSource, Quote } from "@/lib/types";
import { SEEDS } from "./seed";

// Mock market data with a simulated tick engine.
// Implements MarketDataSource — a real websocket feed can replace this
// by implementing the same interface.
class MockMarketData implements MarketDataSource {
  private quotes: Record<string, Quote> = {};
  private subscribers = new Set<(q: Record<string, Quote>) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    for (const s of SEEDS) {
      this.quotes[s.symbol] = {
        symbol: s.symbol, name: s.name, price: s.price, prevClose: s.prevClose,
        change: s.price - s.prevClose, changePct: ((s.price - s.prevClose) / s.prevClose) * 100,
        assetClass: s.assetClass, sector: s.sector, aiRating: s.aiRating, aiScore: s.aiScore,
      };
    }
  }

  private tick = () => {
    const next: Record<string, Quote> = {};
    for (const sym of Object.keys(this.quotes)) {
      const q = this.quotes[sym];
      if (q.assetClass === "fund") { next[sym] = q; continue; }
      const vol = q.assetClass === "etf" ? 0.0006 : 0.0011;
      const drift = (Math.random() - 0.495) * vol;
      const price = Math.max(0.5, q.price * (1 + drift));
      next[sym] = { ...q, price, change: price - q.prevClose, changePct: ((price - q.prevClose) / q.prevClose) * 100 };
    }
    this.quotes = next;
    this.subscribers.forEach((cb) => cb(this.quotes));
  };

  getQuotes() { return this.quotes; }

  subscribe(cb: (q: Record<string, Quote>) => void) {
    this.subscribers.add(cb);
    if (!this.timer) this.timer = setInterval(this.tick, 1100);
    cb(this.quotes);
    return () => {
      this.subscribers.delete(cb);
      if (this.subscribers.size === 0 && this.timer) { clearInterval(this.timer); this.timer = null; }
    };
  }
}

export const marketData: MarketDataSource = new MockMarketData();
