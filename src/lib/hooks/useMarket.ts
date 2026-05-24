"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Quote, Order, Position } from "@/lib/types";
import { marketData } from "@/lib/data/marketData";
import { brokerage } from "@/lib/data/brokerage";

// Live quotes hook — subscribes to the market data source.
export function useQuotes(): Record<string, Quote> {
  const [quotes, setQuotes] = useState<Record<string, Quote>>(() => marketData.getQuotes());
  useEffect(() => marketData.subscribe(setQuotes), []);
  return quotes;
}

export function useQuote(symbol: string): Quote | undefined {
  const quotes = useQuotes();
  return quotes[symbol];
}

// Brokerage state via external store subscription.
export function useBrokerage(): { positions: Position[]; orders: Order[] } {
  return useSyncExternalStore(
    (cb) => brokerage.onChange(cb),
    () => brokerage.getSnapshot(),
    () => brokerage.getSnapshot()
  );
}
