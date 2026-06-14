import type { AgentFleetEntry } from "@/lib/view-types";

const statusStyles: Record<string, string> = {
  active: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  idle: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  offline: "text-rose-400 border-rose-500/30 bg-rose-500/10",
};

interface Props {
  agents: AgentFleetEntry[];
}

export function AgentFleetPanel({ agents }: Props) {
  return (
    <section className="border border-white/10 bg-[#0b0d10] p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold tracking-[0.18em] text-zinc-100">Agent Fleet</h2>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
          {agents.length} AI workers monitoring market conditions
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className="flex flex-col border border-white/10 bg-black px-3 py-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-zinc-200">{agent.name}</span>
              <span
                className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] font-mono ${statusStyles[agent.status]}`}
              >
                {agent.status}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">{agent.role}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div className="text-zinc-500">Last active</div>
              <div className="font-mono text-right text-zinc-300">{agent.lastActive}</div>
              <div className="text-zinc-500">Tasks done</div>
              <div className="font-mono text-right text-zinc-300">{agent.tasksCompleted}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
