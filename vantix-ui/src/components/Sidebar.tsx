interface NavSection {
  id: string;
  label: string;
}

const sections: NavSection[] = [
  { id: "overview", label: "Overview" },
  { id: "orderbook", label: "Order Book" },
  { id: "slippage", label: "Slippage" },
  { id: "narrative", label: "Narrative" },
  { id: "fleet", label: "Fleet" },
  { id: "logs", label: "Logs" },
];

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="border-r border-white/10 bg-[#090b0d] px-4 py-5">
      <div className="mb-4 border border-white/10 bg-black px-3 py-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Navigation</div>
      </div>
      <nav className="space-y-2">
        {sections.map((section, index) => {
          const active = activeView === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onViewChange(section.id)}
              className={`flex w-full items-center justify-between border px-3 py-2 text-sm ${
                active
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-black text-zinc-300"
              }`}
            >
              <span>{section.label}</span>
              <span className="font-mono text-[11px] text-zinc-500">
                {String(index + 1).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="mt-5 border border-white/10 bg-black px-3 py-3 text-xs leading-5 text-zinc-500">
        Dense terminal view optimized for rapid readouts, polling stability, and low-friction
        operator workflows.
      </div>
    </aside>
  );
}
