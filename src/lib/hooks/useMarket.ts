"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Quote, Order, Position } from "@/lib/types";
import { marketData } from "@/lib/data/marketData";
import { brokerage } from "@/lib/data/brokerage";
import { advisory } from "@/lib/data/advisory";
import { copilot } from "@/lib/data/copilot";

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

// Advisory state (compliance, suitability, allocations).
export function useAdvisory() {
  return useSyncExternalStore(
    (cb) => advisory.onChange(cb),
    () => advisory.getSnapshot(),
    () => advisory.getSnapshot()
  );
}

// AI copilot state (insights + proposals).
export function useCopilot() {
  return useSyncExternalStore(
    (cb) => copilot.onChange(cb),
    () => copilot.getSnapshot(),
    () => copilot.getSnapshot()
  );
}
