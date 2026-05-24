"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  createChart, ColorType, CrosshairMode,
  type IChartApi, type ISeriesApi, type CandlestickData, type HistogramData, type UTCTimestamp,
} from "lightweight-charts";
import type { Quote } from "@/lib/types";
import { useTheme } from "@/components/layout/ThemeProvider";

type ChartType = "candles" | "line" | "area";
const TYPES: ChartType[] = ["candles", "line", "area"];
const RANGES = ["1D", "1W", "1M", "3M", "1Y"];

// Deterministic seeded OHLC generator so the chart is stable per symbol/range
function genCandles(seedStr: string, base: number, count: number): CandlestickData[] {
  let s = 0;
  for (let i = 0; i < seedStr.length; i++) s = (s * 31 + seedStr.charCodeAt(i)) >>> 0;
  const rand = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const out: CandlestickData[] = [];
  let price = base * (0.82 + rand() * 0.05);
  const now = Math.floor(Date.now() / 1000);
  const step = 86400;
  for (let i = count; i > 0; i--) {
    const open = price;
    const drift = (rand() - 0.46) * 0.03;
    const close = Math.max(1, open * (1 + drift));
    const high = Math.max(open, close) * (1 + rand() * 0.012);
    const low = Math.min(open, close) * (1 - rand() * 0.012);
    out.push({ time: (now - i * step) as UTCTimestamp, open, high, low, close });
    price = close;
  }
  // pin last close near the live base
  if (out.length) {
    const last = out[out.length - 1];
    const adj = base / last.close;
    out[out.length - 1] = { ...last, close: base, high: Math.max(last.high * adj, base), low: Math.min(last.low * adj, base) };
  }
  return out;
}

export function PriceChart({ quote }: { quote: Quote | undefined }) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | ISeriesApi<"Area"> | null>(null);
  const volSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [ctype, setCtype] = useState<ChartType>("candles");
  const [range, setRange] = useState("3M");

  const count = range === "1D" ? 1 : range === "1W" ? 7 : range === "1M" ? 30 : range === "3M" ? 90 : 252;
  const symbol = quote?.symbol ?? "";
  const base = quote?.price ?? 100;

  const candles = useMemo(() => (symbol ? genCandles(symbol + range, base, count) : []), [symbol, range, count]); // eslint-disable-line react-hooks/exhaustive-deps

  // Create chart once on mount
  useEffect(() => {
    if (!containerRef.current) return;
    const dark = theme === "dark";
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: dark ? "#8a92a8" : "#4a5163", fontFamily: "Geist, sans-serif" },
      grid: { vertLines: { color: dark ? "#20283c" : "#edeff3" }, horzLines: { color: dark ? "#20283c" : "#edeff3" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: dark ? "#20283c" : "#dbe0ea" },
      timeScale: { borderColor: dark ? "#20283c" : "#dbe0ea", timeVisible: false },
      height: containerRef.current.clientHeight || 360,
      width: containerRef.current.clientWidth,
    });
    chartRef.current = chart;

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; mainSeriesRef.current = null; volSeriesRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-theme without rebuilding
  useEffect(() => {
    const chart = chartRef.current; if (!chart) return;
    const dark = theme === "dark";
    chart.applyOptions({
      layout: { textColor: dark ? "#8a92a8" : "#4a5163" },
      grid: { vertLines: { color: dark ? "#20283c" : "#edeff3" }, horzLines: { color: dark ? "#20283c" : "#edeff3" } },
      rightPriceScale: { borderColor: dark ? "#20283c" : "#dbe0ea" },
      timeScale: { borderColor: dark ? "#20283c" : "#dbe0ea" },
    });
  }, [theme]);

  // Build/rebuild the main series when chart type changes
  useEffect(() => {
    const chart = chartRef.current; if (!chart) return;
    if (mainSeriesRef.current) { chart.removeSeries(mainSeriesRef.current); mainSeriesRef.current = null; }
    const up = "#0fa86b", down = "#f5333f", accent = "#4361fb";
    if (ctype === "candles") {
      mainSeriesRef.current = chart.addCandlestickSeries({ upColor: up, downColor: down, borderUpColor: up, borderDownColor: down, wickUpColor: up, wickDownColor: down });
    } else if (ctype === "line") {
      mainSeriesRef.current = chart.addLineSeries({ color: accent, lineWidth: 2 });
    } else {
      mainSeriesRef.current = chart.addAreaSeries({ lineColor: accent, topColor: "rgba(67,97,251,0.25)", bottomColor: "rgba(67,97,251,0)", lineWidth: 2 });
    }
    // feed data immediately after (re)creating series
    feedData();
  }, [ctype]); // eslint-disable-line react-hooks/exhaustive-deps

  // Volume series created once
  useEffect(() => {
    const chart = chartRef.current; if (!chart || volSeriesRef.current) return;
    const vol = chart.addHistogramSeries({ priceFormat: { type: "volume" }, priceScaleId: "" });
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volSeriesRef.current = vol;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function feedData() {
    const main = mainSeriesRef.current; if (!main) return;
    if (ctype === "candles") {
      (main as ISeriesApi<"Candlestick">).setData(candles);
    } else {
      const lineData = candles.map((c) => ({ time: c.time, value: c.close }));
      (main as ISeriesApi<"Line">).setData(lineData);
    }
    if (volSeriesRef.current) {
      const vols: HistogramData[] = candles.map((c) => ({ time: c.time, value: Math.abs(c.close - c.open) * 1e6, color: c.close >= c.open ? "rgba(15,168,107,0.4)" : "rgba(245,51,63,0.4)" }));
      volSeriesRef.current.setData(vols);
    }
    chartRef.current?.timeScale().fitContent();
  }

  // Refeed when symbol/range/data changes
  useEffect(() => { feedData(); }, [candles]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)", height: 420 }}>
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b flex-shrink-0" style={{ borderColor: "var(--color-line)" }}>
        <div className="flex gap-1">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setCtype(t)} className="px-2.5 py-1 rounded-md text-[11.5px] font-medium capitalize"
              style={{ background: ctype === t ? "var(--color-accent-soft)" : "transparent", color: ctype === t ? "var(--color-accent)" : "var(--color-dim)", border: `1px solid ${ctype === t ? "var(--color-accent)" : "var(--color-line)"}` }}>{t}</button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setRange(r)} className="px-2.5 py-1 rounded-md text-[11.5px] font-medium"
              style={{ background: range === r ? "var(--color-accent-soft)" : "transparent", color: range === r ? "var(--color-accent)" : "var(--color-dim)", border: `1px solid ${range === r ? "var(--color-accent)" : "var(--color-line)"}` }}>{r}</button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
