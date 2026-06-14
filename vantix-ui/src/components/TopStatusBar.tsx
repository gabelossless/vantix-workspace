import { formatTimestamp } from "@/lib/format";

interface TopStatusBarProps {
  daemonOnline: boolean;
  daemonStatus: string;
  activeExchange: string;
  activePair: string;
  lastUpdate: string | null;
  stale: boolean;
}

export function TopStatusBar({
  daemonOnline,
  daemonStatus,
  activeExchange,
  activePair,
  lastUpdate,
  stale,
}: TopStatusBarProps) {
  return (
    <header className="border-b border-white/10 bg-[#0b0d10] px-4 py-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-white/15 bg-black text-[11px] font-semibold tracking-[0.24em] text-zinc-200">
            VO
          </div>
          <div>
            <div className="text-sm font-semibold tracking-[0.18em] text-zinc-100">
              Vantix Oracle
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Local-first crypto risk terminal
            </div>
          </div>
        </div>

        <div className="grid gap-2 text-xs text-zinc-400 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center xl:justify-end xl:gap-4">
          <div className="flex items-center gap-2 border border-white/10 bg-black px-3 py-2">
            <span
              className={`h-2 w-2 rounded-full ${daemonOnline ? "bg-emerald-500" : "bg-rose-500"}`}
            />
            <span className="uppercase tracking-[0.16em] text-zinc-300">Daemon</span>
            <span className={daemonOnline ? "text-emerald-400" : "text-rose-400"}>
              {daemonStatus}
            </span>
          </div>
          <div className="border border-white/10 bg-black px-3 py-2">
            <span className="uppercase tracking-[0.16em] text-zinc-500">Exchange</span>{" "}
            <span className="font-mono text-zinc-200">{activeExchange}</span>
          </div>
          <div className="border border-white/10 bg-black px-3 py-2">
            <span className="uppercase tracking-[0.16em] text-zinc-500">Pair</span>{" "}
            <span className="font-mono text-zinc-200">{activePair}</span>
          </div>
          <div className="border border-white/10 bg-black px-3 py-2">
            <span className="uppercase tracking-[0.16em] text-zinc-500">Last update</span>{" "}
            <span className={stale ? "font-mono text-amber-400" : "font-mono text-zinc-200"}>
              {formatTimestamp(lastUpdate)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

