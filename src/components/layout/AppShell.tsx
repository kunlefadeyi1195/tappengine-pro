import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)" }}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 84px)" }}>
        {children}
      </div>
    </div>
  );
}
