import { AppShell } from "@/components/layout/AppShell";

export default function AnalyzerPage() {
  return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="font-display text-[24px] mb-2" style={{ color: "var(--color-content)" }}>Portfolio Analyzer</div>
          <div className="text-[13px]" style={{ color: "var(--color-faint)" }}>Coming in the next build stage.</div>
        </div>
      </div>
    </AppShell>
  );
}
