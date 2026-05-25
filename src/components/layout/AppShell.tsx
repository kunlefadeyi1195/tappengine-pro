"use client";

import { useState } from "react";
import { Sparkles, HelpCircle } from "lucide-react";
import { TopBar } from "./TopBar";
import { CopilotPanel } from "@/components/surfaces/CopilotPanel";
import { WelcomeOverlay } from "./WelcomeOverlay";

// Module-level flag: shows the intro once per full page load, but not on every
// in-app route navigation (each route mounts a fresh AppShell). A hard refresh
// resets it — which is what we want for handing the demo to a new viewer.
let welcomeSeen = false;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(!welcomeSeen);

  const closeWelcome = () => { welcomeSeen = true; setWelcomeOpen(false); };
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--color-bg)" }}>
      <TopBar onOpenCopilot={() => setCopilotOpen(true)} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {children}
      </div>

      {/* floating controls */}
      {!copilotOpen && !welcomeOpen && (
        <div className="fixed bottom-6 right-6 z-30 flex items-center gap-2">
          <button onClick={() => setWelcomeOpen(true)}
            className="w-11 h-11 rounded-full flex items-center justify-center border"
            style={{ background: "var(--color-panel)", borderColor: "var(--color-line)", color: "var(--color-dim)" }} aria-label="Help / intro" title="Replay intro">
            <HelpCircle size={19} />
          </button>
          <button onClick={() => setCopilotOpen(true)}
            className="flex items-center gap-2 pl-3.5 pr-4 h-12 rounded-full font-semibold text-[13.5px] text-white shadow-lg"
            style={{ background: "linear-gradient(135deg,#5a72ff,#b79cff)", boxShadow: "0 8px 24px rgba(90,114,255,0.4)" }}>
            <Sparkles size={17} /> Ask Copilot
          </button>
        </div>
      )}

      <CopilotPanel open={copilotOpen} onClose={() => setCopilotOpen(false)} />
      {welcomeOpen && <WelcomeOverlay onClose={closeWelcome} onOpenCopilot={() => setCopilotOpen(true)} />}
    </div>
  );
}
