import { formatTimestamp } from "@/lib/format";
import type { SystemLogEntry } from "@/lib/view-types";

interface SystemLogsProps {
  logs: SystemLogEntry[];
}

export function SystemLogs({ logs }: SystemLogsProps) {
  return (
    <section className="border border-white/10 bg-[#0b0d10] p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold tracking-[0.18em] text-zinc-100">System Logs</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
            Fetch errors, offline events, parse failures, and stale warnings
          </p>
        </div>
        <div className="font-mono text-xs text-zinc-500">{logs.length} entries</div>
      </div>

      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="border border-white/10 bg-black px-3 py-3 text-sm text-zinc-500">
            No system events recorded yet.
          </div>
        ) : (
          logs.map((log) => {
            const tone =
              log.level === "error"
                ? "text-rose-400"
                : log.level === "warning"
                  ? "text-amber-400"
                  : "text-emerald-400";
            return (
              <div key={log.id} className="border border-white/10 bg-black px-3 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="font-mono text-[11px] text-zinc-500">
                    {formatTimestamp(log.timestamp)}
                  </div>
                  <div className={`text-[11px] uppercase tracking-[0.18em] ${tone}`}>{log.level}</div>
                  <div className="text-sm font-medium text-zinc-200">{log.title}</div>
                </div>
                <div className="mt-2 text-sm leading-6 text-zinc-400">{log.detail}</div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
