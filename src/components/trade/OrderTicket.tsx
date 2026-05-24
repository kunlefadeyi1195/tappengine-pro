"use client";

import { useState } from "react";
import { Minus, Plus, ShieldCheck, CheckCircle2, ChevronLeft } from "lucide-react";
import type { OrderSide, OrderType, TimeInForce, Quote, OptionContract } from "@/lib/types";
import { brokerage } from "@/lib/data/brokerage";
import { bs } from "@/lib/options";
import { fmt, fmtUSD, CASH_BALANCE } from "@/lib/data/seed";

const ORDER_TYPES: OrderType[] = ["market", "limit", "stop", "stop-limit"];
const TIFS: { value: TimeInForce; label: string }[] = [
  { value: "day", label: "Day" }, { value: "gtc", label: "GTC" },
  { value: "ioc", label: "IOC" }, { value: "fok", label: "FOK" },
];

export function OrderTicket({ quote }: { quote: Quote | undefined }) {
  const [instrument, setInstrument] = useState<"equity" | "option">("equity");
  const [side, setSide] = useState<OrderSide>("buy");
  const [type, setType] = useState<OrderType>("market");
  const [qty, setQty] = useState(10);
  const [limit, setLimit] = useState("");
  const [stop, setStop] = useState("");
  const [tif, setTif] = useState<TimeInForce>("day");
  const [stage, setStage] = useState<"entry" | "review" | "done">("entry");
  const [placed, setPlaced] = useState<{ side: OrderSide; qty: number; symbol: string } | null>(null);
  // single-leg option state
  const [optRight, setOptRight] = useState<"call" | "put">("call");
  const [optStrike, setOptStrike] = useState<number | null>(null);

  if (!quote) return <div className="p-4 text-sm" style={{ color: "var(--color-faint)" }}>Select a symbol to trade.</div>;

  const px = quote.price;
  const optStep = px > 500 ? 10 : px > 100 ? 5 : 2.5;
  const strike = optStrike ?? Math.max(optStep, Math.round((px * 1.02) / optStep) * optStep);
  const optPremium = bs(optRight, px, strike, 45 / 365, 0.045, 0.42).price;
  const isOption = instrument === "option";
  const est = isOption ? optPremium * qty * 100 : qty * (type === "limit" && limit ? parseFloat(limit) : px);
  const needsLimit = !isOption && (type === "limit" || type === "stop-limit");
  const needsStop = !isOption && (type === "stop" || type === "stop-limit");
  const valid = qty > 0 && (!needsLimit || parseFloat(limit) > 0) && (!needsStop || parseFloat(stop) > 0);

  const submit = () => {
    if (isOption) {
      const contract: OptionContract = {
        underlying: quote.symbol,
        expiry: "45d",
        strategy: `Single ${optRight === "call" ? "Call" : "Put"}`,
        legs: [{ right: optRight, action: side === "buy" ? "long" : "short", strike, qty, premium: optPremium }],
        netPrice: (side === "buy" ? 1 : -1) * optPremium * qty,
      };
      brokerage.placeOrder({ symbol: quote.symbol, side, type: "market", qty, tif, instrument: "option", option: contract });
    } else {
      brokerage.placeOrder({
        symbol: quote.symbol, side, type, qty,
        limitPrice: needsLimit ? parseFloat(limit) : undefined,
        stopPrice: needsStop ? parseFloat(stop) : undefined,
        tif,
      });
    }
    setPlaced({ side, qty, symbol: quote.symbol });
    setStage("done");
  };

  const reset = () => { setStage("entry"); setPlaced(null); };

  if (stage === "done" && placed) {
    return (
      <div className="p-5 animate-slide-in">
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <CheckCircle2 size={40} style={{ color: "var(--color-up)" }} />
          <div className="text-lg font-semibold">Order {type === "market" ? "filled" : "submitted"}</div>
          <div className="text-sm" style={{ color: "var(--color-dim)" }}>
            {placed.side === "buy" ? "Buy" : "Sell"} {placed.qty} {placed.symbol}
            {type === "market" ? ` @ ~${fmt(px)}` : ` · ${type} order working`}
          </div>
          <button onClick={reset} className="mt-2 px-4 h-9 rounded-lg text-[13px] font-semibold text-white" style={{ background: "var(--color-accent)" }}>
            Place another order
          </button>
        </div>
      </div>
    );
  }

  if (stage === "review") {
    return (
      <div className="p-4 animate-slide-in">
        <button onClick={() => setStage("entry")} className="flex items-center gap-1 text-[12px] mb-3" style={{ color: "var(--color-dim)" }}>
          <ChevronLeft size={14} /> Back to edit
        </button>
        <div className="text-[15px] font-semibold mb-3">Review order</div>
        <div className="rounded-xl p-4 mb-3 space-y-2 text-[13px]" style={{ background: "var(--color-panel2)", border: "1px solid var(--color-line)" }}>
          <Row label="Action" value={isOption ? `${side === "buy" ? "Buy to Open" : "Sell to Open"} ${quote.symbol} ${fmt(strike, 0)} ${optRight === "call" ? "Call" : "Put"}` : `${side === "buy" ? "Buy" : "Sell"} ${quote.symbol}`} bold />
          <Row label={isOption ? "Contracts" : "Quantity"} value={String(qty)} />
          {isOption ? <Row label="Expiry" value="45 days" /> : <Row label="Order type" value={type.toUpperCase()} />}
          {isOption && <Row label="Est. premium" value={fmt(optPremium) + "/sh"} />}
          {needsLimit && <Row label="Limit price" value={fmt(parseFloat(limit))} />}
          {needsStop && <Row label="Stop price" value={fmt(parseFloat(stop))} />}
          <Row label="Time in force" value={tif.toUpperCase()} />
          <Row label={isOption ? "Est. cost" : "Est. value"} value={fmtUSD(est)} />
        </div>
        <div className="flex items-center gap-2 text-[11px] mb-3" style={{ color: "var(--color-faint)" }}>
          <ShieldCheck size={13} style={{ color: "var(--color-accent)" }} /> Cleared via TAPP Engine Securities · SIPC
        </div>
        <button onClick={submit}
          className="w-full h-11 rounded-xl font-semibold text-[14px] text-white"
          style={{ background: side === "buy" ? "var(--color-up)" : "var(--color-down)" }}>
          Confirm {side === "buy" ? "Buy" : "Sell"}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex gap-1 rounded-lg p-0.5 mb-3" style={{ background: "var(--color-inset)" }}>
        {(["equity", "option"] as const).map((inst) => (
          <button key={inst} onClick={() => { setInstrument(inst); if (inst === "option") setType("market"); }}
            className="flex-1 py-1.5 rounded-md text-[12px] font-semibold"
            style={{ background: instrument === inst ? "var(--color-panel)" : "transparent", color: instrument === inst ? "var(--color-accent)" : "var(--color-dim)", border: instrument === inst ? "1px solid var(--color-line)" : "1px solid transparent" }}>
            {inst === "equity" ? "Shares" : "Options"}
          </button>
        ))}
      </div>

      <div className="flex gap-1 rounded-lg p-0.5 mb-3" style={{ background: "var(--color-panel2)" }}>
        {(["buy", "sell"] as OrderSide[]).map((s) => (
          <button key={s} onClick={() => setSide(s)}
            className="flex-1 py-2 rounded-md text-[13px] font-semibold capitalize"
            style={{
              background: side === s ? (s === "buy" ? "var(--color-up)" : "var(--color-down)") : "transparent",
              color: side === s ? "#fff" : "var(--color-dim)",
            }}>{isOption ? (s === "buy" ? "Buy to Open" : "Sell to Open") : s}</button>
        ))}
      </div>

      {isOption && (
        <div className="mb-3">
          <div className="flex gap-1 rounded-lg p-0.5 mb-2.5" style={{ background: "var(--color-panel2)" }}>
            {(["call", "put"] as const).map((rt) => (
              <button key={rt} onClick={() => setOptRight(rt)}
                className="flex-1 py-1.5 rounded-md text-[12px] font-semibold capitalize"
                style={{ background: optRight === rt ? "var(--color-accent-soft)" : "transparent", color: optRight === rt ? "var(--color-accent)" : "var(--color-dim)", border: `1px solid ${optRight === rt ? "var(--color-accent)" : "var(--color-line)"}` }}>{rt}</button>
            ))}
          </div>
          <label className="text-[10.5px] uppercase font-semibold" style={{ color: "var(--color-faint)" }}>Strike</label>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => setOptStrike(Math.max(optStep, strike - optStep))} className="p-2 rounded-md border" style={{ borderColor: "var(--color-line)" }}><Minus size={13} /></button>
            <div className="num flex-1 text-center rounded-md py-2 text-[15px]" style={{ background: "var(--color-panel2)", border: "1px solid var(--color-line)" }}>{fmt(strike, 0)}</div>
            <button onClick={() => setOptStrike(strike + optStep)} className="p-2 rounded-md border" style={{ borderColor: "var(--color-line)" }}><Plus size={13} /></button>
          </div>
          <div className="flex justify-between text-[11px] mt-1.5" style={{ color: "var(--color-faint)" }}>
            <span>45d expiry · est. premium</span><span className="num">{fmt(optPremium)}/sh</span>
          </div>
        </div>
      )}

      {!isOption && (
        <div className="flex gap-1.5 mb-3">
          {ORDER_TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)}
              className="flex-1 py-1.5 rounded-md text-[10.5px] font-medium capitalize"
              style={{
                background: type === t ? "var(--color-accent-soft)" : "transparent",
                color: type === t ? "var(--color-accent)" : "var(--color-dim)",
                border: `1px solid ${type === t ? "var(--color-accent)" : "var(--color-line)"}`,
              }}>{t}</button>
          ))}
        </div>
      )}

      <label className="text-[10.5px] uppercase font-semibold" style={{ color: "var(--color-faint)" }}>{isOption ? "Contracts" : "Quantity"}</label>
      <div className="flex items-center gap-2 mt-1 mb-3">
        <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 rounded-md border" style={{ borderColor: "var(--color-line)" }}><Minus size={13} /></button>
        <input className="num flex-1 text-center rounded-md py-2 text-[15px] outline-none"
          style={{ background: "var(--color-panel2)", border: "1px solid var(--color-line)", color: "var(--color-content)" }}
          value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
        <button onClick={() => setQty(qty + 1)} className="p-2 rounded-md border" style={{ borderColor: "var(--color-line)" }}><Plus size={13} /></button>
      </div>

      {needsLimit && (
        <div className="mb-3">
          <label className="text-[10.5px] uppercase font-semibold" style={{ color: "var(--color-faint)" }}>Limit price</label>
          <input className="num w-full mt-1 rounded-md py-2 px-3 text-[14px] outline-none"
            style={{ background: "var(--color-panel2)", border: "1px solid var(--color-line)", color: "var(--color-content)" }}
            placeholder={fmt(px)} value={limit} onChange={(e) => setLimit(e.target.value)} />
        </div>
      )}
      {needsStop && (
        <div className="mb-3">
          <label className="text-[10.5px] uppercase font-semibold" style={{ color: "var(--color-faint)" }}>Stop price</label>
          <input className="num w-full mt-1 rounded-md py-2 px-3 text-[14px] outline-none"
            style={{ background: "var(--color-panel2)", border: "1px solid var(--color-line)", color: "var(--color-content)" }}
            placeholder={fmt(px)} value={stop} onChange={(e) => setStop(e.target.value)} />
        </div>
      )}

      <label className="text-[10.5px] uppercase font-semibold" style={{ color: "var(--color-faint)" }}>Time in force</label>
      <div className="flex gap-1.5 mt-1 mb-3">
        {TIFS.map((t) => (
          <button key={t.value} onClick={() => setTif(t.value)}
            className="flex-1 py-1.5 rounded-md text-[11px] font-medium"
            style={{
              background: tif === t.value ? "var(--color-accent-soft)" : "transparent",
              color: tif === t.value ? "var(--color-accent)" : "var(--color-dim)",
              border: `1px solid ${tif === t.value ? "var(--color-accent)" : "var(--color-line)"}`,
            }}>{t.label}</button>
        ))}
      </div>

      <div className="rounded-lg p-3 mb-3 text-[12px] num space-y-1" style={{ background: "var(--color-panel2)" }}>
        <Row label="Est. value" value={fmtUSD(est)} />
        <Row label="Buying power" value={fmtUSD(CASH_BALANCE, 0)} />
        <Row label="Commission" value="$0.00" />
      </div>

      <button disabled={!valid} onClick={() => setStage("review")}
        className="w-full h-11 rounded-xl font-semibold text-[14px] text-white disabled:opacity-50"
        style={{ background: side === "buy" ? "var(--color-up)" : "var(--color-down)" }}>
        Review {side === "buy" ? "Buy" : "Sell"} {qty} {isOption ? `${quote.symbol} ${fmt(strike, 0)}${optRight === "call" ? "C" : "P"}` : quote.symbol}
      </button>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: "var(--color-dim)" }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}
