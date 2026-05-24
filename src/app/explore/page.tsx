import { AppShell } from "@/components/layout/AppShell";

export default function ExplorePage() {
  return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="font-display text-[24px] mb-2" style={{ color: "var(--color-content)" }}>Explore</div>
          <div className="text-[13px]" style={{ color: "var(--color-faint)" }}>Screener &amp; discovery — coming in the next build stage.</div>
        </div>
      </div>
    </AppShell>
  );
}
