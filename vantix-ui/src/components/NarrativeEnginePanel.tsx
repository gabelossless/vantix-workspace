import { formatTimestamp } from "@/lib/format";
import type { SystemLogEntry } from "@/lib/view-types";

interface NarrativeEnginePanelProps {
  logs: SystemLogEntry[];
}

export function NarrativeEnginePanel({ logs }: NarrativeEnginePanelProps) {
  const levelStyles: Record<string, string> = {
    info: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    error: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  };

  return (
    <section className="border border-white/10 bg-[#0b0d10] p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold tracking-[0.18em] text-zinc-100">Narrative Engine</h2>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
          System event log with severity levels
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="border border-white/10 bg-black px-3 py-3 text-sm text-zinc-500">
          No events recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/10">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-black">
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Level</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-white/5 last:border-b-0"
                >
                  <td className="px-3 py-2 font-mono text-[11px] text-zinc-500">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] font-mono ${levelStyles[log.level] ?? levelStyles.info}`}
                    >
                      {log.level}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm font-medium text-zinc-200">
                    {log.title}
                  </td>
                  <td className="px-3 py-2 text-sm text-zinc-400">
                    {log.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
