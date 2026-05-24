# TAPP Engine Pro

Pro trading terminal for TAPP Engine — Next.js 15 (App Router), TypeScript, Tailwind CSS v4.

This is **Stage 1** of the graduated build: the project scaffold, design-token system, mock data layer behind typed seams, and the first complete workflow — a real **order ticket** and **Positions & Orders** view.

## Prerequisites

- Node.js 20.9 or later
- npm (or pnpm/yarn)

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## What's in this stage

- **Terminal** (`/`) — symbol list + live quotes + a real order ticket (market / limit / stop / stop-limit, time-in-force, review-and-confirm). Placing an order updates positions.
- **Positions & Orders** (`/positions`) — open positions with live P&L, working orders (cancelable), and recent fills. Orders placed in the ticket appear here.
- **Explore / Analyzer / Models** — placeholder routes; built in the next stages.

Light/dark theme toggle is in the top bar (navy/royal-blue brand tokens, Gelasio + Geist).

## Architecture

```
src/
  app/                  App Router pages (one folder per route)
  components/
    layout/             TopBar, AppShell, ThemeProvider
    trade/              OrderTicket, PositionsView, TradeSurface
  lib/
    types/              Domain types + data-source INTERFACES (the seams)
    data/               Mock implementations (marketData tick engine, brokerage)
    hooks/              useQuotes / useBrokerage React bindings
```

### The data-source seam

`src/lib/types/index.ts` defines `MarketDataSource` and `BrokerageSource` interfaces. The mock implementations in `src/lib/data/` satisfy them. To connect real BOS / Model Studio APIs later, implement the same interfaces and swap the exported instance — **no component changes required.**

## Coming next

- Stage 2: Terminal candlestick chart (lightweight-charts) with indicators; Explore/screener surface.
- Stage 3: Portfolio Analyzer, Models, AI copilot with the agentic compliance-rail flow (live Claude API).

## Notes

- Data is simulated (a tick engine), so prices move without a market connection — useful for demos any time.
- No real money movement: order placement updates in-memory state only.
