"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { TopBar } from "./TopBar";
import { CopilotPanel } from "@/components/surfaces/CopilotPanel";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [copilotOpen, setCopilotOpen] = useState(false);
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--color-bg)" }}>
      <TopBar onOpenCopilot={() => setCopilotOpen(true)} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {children}
      </div>

      {/* floating copilot trigger */}
      {!copilotOpen && (
        <button onClick={() => setCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 pl-3.5 pr-4 h-12 rounded-full font-semibold text-[13.5px] text-white shadow-lg"
          style={{ background: "linear-gradient(135deg,#5a72ff,#b79cff)", boxShadow: "0 8px 24px rgba(90,114,255,0.4)" }}>
          <Sparkles size={17} /> Ask Copilot
        </button>
      )}

      <CopilotPanel open={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}
