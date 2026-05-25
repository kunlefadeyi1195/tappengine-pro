import type { BrokerageSource, Order, Position } from "@/lib/types";
import { INITIAL_POSITIONS } from "./seed";
import { marketData } from "./marketData";
import { notifications } from "./notifications";

// Mock brokerage: holds positions and orders in memory, simulates fills.
// Real BOS brokerage API implements the same BrokerageSource interface.
class MockBrokerage implements BrokerageSource {
  private positions: Position[] = [...INITIAL_POSITIONS];
  private orders: Order[] = [];
  private listeners = new Set<() => void>();
  private snapshot: { positions: Position[]; orders: Order[] } = { positions: this.positions, orders: this.orders };

  onChange(cb: () => void) { this.listeners.add(cb); return () => this.listeners.delete(cb); }
  private emit() {
    // Rebuild a fresh cached snapshot reference whenever data changes so
    // useSyncExternalStore sees a stable reference between changes.
    this.snapshot = { positions: [...this.positions], orders: [...this.orders] };
    this.listeners.forEach((l) => l());
  }
  getSnapshot() { return this.snapshot; }

  getPositions() { return this.positions; }
  getOrders() { return this.orders; }

  placeOrder(draft: Omit<Order, "id" | "status" | "filledQty" | "createdAt">): Order {
    const id = "ord_" + Math.random().toString(36).slice(2, 9);
    const quotes = marketData.getQuotes();
    const isOption = draft.instrument === "option";
    // For options, the fill "price" is the contract net price (per share); for equity it's the market price.
    const mkt = isOption
      ? (draft.option?.netPrice ?? draft.limitPrice ?? 0)
      : (quotes[draft.symbol]?.price ?? draft.limitPrice ?? 0);

    // Market orders fill immediately; limit/stop start working then fill shortly (simulated).
    const fillsNow = draft.type === "market";
    const order: Order = {
      ...draft, id, createdAt: Date.now(),
      status: fillsNow ? "filled" : "working",
      filledQty: fillsNow ? draft.qty : 0,
      avgFillPrice: fillsNow ? mkt : undefined,
    };
    this.orders = [order, ...this.orders];
    if (fillsNow) {
      this.applyFill(order, mkt);
      notifications.notify("fill", "Order filled", `${draft.side === "buy" ? "Bought" : "Sold"} ${draft.qty} ${draft.symbol}${isOption ? " (option)" : ""} at ~${mkt.toFixed(2)}.`);
    } else {
      // simulate a working order filling after a short delay
      setTimeout(() => {
        const fillPx = isOption ? mkt : (draft.limitPrice ?? draft.stopPrice ?? mkt);
        order.status = "filled"; order.filledQty = order.qty; order.avgFillPrice = fillPx;
        this.applyFill(order, fillPx);
        notifications.notify("fill", "Working order filled", `${draft.side === "buy" ? "Bought" : "Sold"} ${draft.qty} ${draft.symbol} at ${fillPx.toFixed(2)}.`);
        this.emit();
      }, 4000);
    }
    this.emit();
    return order;
  }

  private applyFill(order: Order, price: number) {
    // Options create a distinct option position; no share-averaging.
    if (order.instrument === "option" && order.option) {
      this.positions = [...this.positions, {
        symbol: order.symbol,
        shares: order.qty,          // contracts
        avgCost: price,             // net price per share
        source: "self-directed",
        instrument: "option",
        option: order.option,
      }];
      return;
    }
    const dir = order.side === "buy" ? 1 : -1;
    const existing = this.positions.find((p) => p.symbol === order.symbol && p.source === "self-directed" && (p.instrument ?? "equity") === "equity");
    if (existing) {
      const newShares = existing.shares + dir * order.qty;
      if (newShares <= 0) {
        this.positions = this.positions.filter((p) => p !== existing);
      } else {
        if (dir > 0) {
          existing.avgCost = (existing.avgCost * existing.shares + price * order.qty) / newShares;
        }
        existing.shares = newShares;
      }
    } else if (dir > 0) {
      this.positions = [...this.positions, { symbol: order.symbol, shares: order.qty, avgCost: price, source: "self-directed", instrument: "equity" }];
    }
  }

  cancelOrder(id: string) {
    const o = this.orders.find((x) => x.id === id);
    if (o && o.status === "working") { o.status = "canceled"; this.emit(); }
  }

  reset() {
    this.positions = [...INITIAL_POSITIONS];
    this.orders = [];
    this.emit();
  }
}

export const brokerage = new MockBrokerage();
