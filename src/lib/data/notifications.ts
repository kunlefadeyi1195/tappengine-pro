import type { AppNotification, NotificationKind } from "@/lib/types";

// Notifications store. Seeded with a few realistic items; other stores can push
// new notifications (fills, copilot actions, allocations) via notify().
class NotificationStore {
  private items: AppNotification[] = [
    { id: "n1", kind: "copilot", title: "Copilot has 3 suggestions", body: "Concentration, sector drift, and idle cash were flagged in your portfolio.", createdAt: Date.now() - 1000 * 60 * 8, read: false },
    { id: "n2", kind: "alert", title: "NVDA up 2.9% today", body: "Your largest holding is leading the portfolio.", createdAt: Date.now() - 1000 * 60 * 35, read: false },
    { id: "n3", kind: "system", title: "Model rebalance scheduled", body: "AI Infrastructure Growth rebalances at quarter end.", createdAt: Date.now() - 1000 * 60 * 60 * 3, read: false },
  ];
  private listeners = new Set<() => void>();
  private snapshot: AppNotification[] = [...this.items];

  onChange(cb: () => void) { this.listeners.add(cb); return () => this.listeners.delete(cb); }
  private emit() { this.snapshot = [...this.items]; this.listeners.forEach((l) => l()); }
  getSnapshot() { return this.snapshot; }

  unreadCount() { return this.items.filter((n) => !n.read).length; }

  notify(kind: NotificationKind, title: string, body: string) {
    this.items = [{ id: "n_" + Math.random().toString(36).slice(2, 8), kind, title, body, createdAt: Date.now(), read: false }, ...this.items];
    this.emit();
  }

  markAllRead() { this.items = this.items.map((n) => ({ ...n, read: true })); this.emit(); }
  markRead(id: string) { this.items = this.items.map((n) => n.id === id ? { ...n, read: true } : n); this.emit(); }

  reset() {
    this.items = [
      { id: "n1", kind: "copilot", title: "Copilot has 3 suggestions", body: "Concentration, sector drift, and idle cash were flagged in your portfolio.", createdAt: Date.now() - 1000 * 60 * 8, read: false },
      { id: "n2", kind: "alert", title: "NVDA up 2.9% today", body: "Your largest holding is leading the portfolio.", createdAt: Date.now() - 1000 * 60 * 35, read: false },
      { id: "n3", kind: "system", title: "Model rebalance scheduled", body: "AI Infrastructure Growth rebalances at quarter end.", createdAt: Date.now() - 1000 * 60 * 60 * 3, read: false },
    ];
    this.emit();
  }
}

export const notifications = new NotificationStore();
