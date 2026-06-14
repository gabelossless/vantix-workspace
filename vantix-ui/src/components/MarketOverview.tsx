import { formatBps, formatPrice, formatTimestamp, formatUsd } from "@/lib/format";

interface MarketOverviewProps {
  bestBid: number | null;
  bestAsk: number | null;
  midPrice: number | null;
  spread: number | null;
  spreadBps: number | null;
  lastUpdate: string | null;
  stale: boolean;
  daemonOnline: boolean;
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning" | "negative";
}) {
  const toneClasses = {
    neutral: "text-zinc-100",
    positive: "text-emerald-400",
    warning: "text-amber-400",
    negative: "text-rose-400",
  }[tone];

  return (
    <div className="border border-white/10 bg-black px-3 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className={`mt-2 font-mono text-[15px] ${toneClasses}`}>{value}</div>
    </div>
  );
}

export function MarketOverview({
  bestBid,
  bestAsk,
  midPrice,
  spread,
  spreadBps,
  lastUpdate,
  stale,
  daemonOnline,
}: MarketOverviewProps) {
  const statusLabel = !daemonOnline ? "Offline" : stale ? "Stale data warning" : lastUpdate ? "Data fresh" : "Awaiting data";
  return (
    <section className="border border-white/10 bg-[#0b0d10] p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold tracking-[0.18em] text-zinc-100">Market Overview</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
            Best prices, spread, and freshness
          </p>
        </div>
        <div
          className={
            !daemonOnline
              ? "text-xs uppercase tracking-[0.18em] text-rose-400"
              : stale
                ? "text-xs uppercase tracking-[0.18em] text-amber-400"
                : "text-xs uppercase tracking-[0.18em] text-zinc-500"
          }
        >
          {statusLabel}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Best bid" value={formatPrice(bestBid)} tone="positive" />
        <Stat label="Best ask" value={formatPrice(bestAsk)} tone="negative" />
        <Stat label="Mid price" value={formatPrice(midPrice)} />
        <Stat label="Spread" value={formatUsd(spread)} tone={spread && spread > 0 ? "warning" : "neutral"} />
        <Stat label="Spread bps" value={formatBps(spreadBps)} tone={spreadBps && spreadBps > 0 ? "warning" : "neutral"} />
        <Stat label="Last update" value={formatTimestamp(lastUpdate)} />
      </div>
    </section>
  );
}
