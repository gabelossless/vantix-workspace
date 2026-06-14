import { formatBps, formatNumber, formatPrice, formatUsd } from "@/lib/format";
import type { Side } from "@/lib/api-types";
import type { SlippageEstimateView } from "@/lib/view-types";

interface SlippageEstimatorProps {
  side: Side;
  notionalUsd: number;
  loading: boolean;
  estimate: SlippageEstimateView | null;
  onSideChange: (side: Side) => void;
  onNotionalChange: (notionalUsd: number) => void;
  onSimulate: (side: Side, notionalUsd: number) => void;
}

function ActionButton({
  active,
  children,
  tone,
  onClick,
}: {
  active: boolean;
  children: string;
  tone: "positive" | "negative";
  onClick: () => void;
}) {
  const activeClasses =
    tone === "positive"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : "border-rose-500/40 bg-rose-500/10 text-rose-300";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-2 text-xs uppercase tracking-[0.18em] transition-none ${
        active ? activeClasses : "border-white/10 bg-black text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

export function SlippageEstimator({
  side,
  notionalUsd,
  loading,
  estimate,
  onSideChange,
  onNotionalChange,
  onSimulate,
}: SlippageEstimatorProps) {
  return (
    <section className="border border-white/10 bg-[#0b0d10] p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold tracking-[0.18em] text-zinc-100">Slippage Estimator</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
            Simulate market impact for a notional size
          </p>
        </div>
        <div className="text-right text-xs uppercase tracking-[0.18em] text-zinc-500">
          {loading ? "Estimating" : estimate ? estimate.source : "Idle"}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[180px_minmax(0,1fr)]">
        <label className="block border border-white/10 bg-black px-3 py-3">
          <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Notional USD</span>
          <input
            type="number"
            min="0"
            step="1000"
            value={notionalUsd}
            onChange={(event) => onNotionalChange(Number(event.target.value) || 0)}
            className="mt-2 w-full bg-transparent font-mono text-[15px] text-zinc-100 outline-none"
          />
        </label>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <ActionButton
              active={side === "buy"}
              tone="positive"
              onClick={() => {
                onSideChange("buy");
                onSimulate("buy", notionalUsd);
              }}
            >
              Simulate Buy
            </ActionButton>
            <ActionButton
              active={side === "sell"}
              tone="negative"
              onClick={() => {
                onSideChange("sell");
                onSimulate("sell", notionalUsd);
              }}
            >
              Simulate Sell
            </ActionButton>
            <button
              type="button"
              onClick={() => onSimulate(side, notionalUsd)}
              className="border border-white/10 bg-black px-3 py-2 text-xs uppercase tracking-[0.18em] text-zinc-300"
            >
              Run Estimate
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Stat label="Requested notional" value={formatUsd(estimate?.requestedNotionalUsd ?? notionalUsd)} />
            <Stat label="Filled quantity" value={formatNumber(estimate?.filledQuantity ?? null, 6)} />
            <Stat label="Best price" value={formatPrice(estimate?.bestPrice ?? null)} />
            <Stat label="VWAP" value={formatPrice(estimate?.vwap ?? null)} />
            <Stat label="Slippage bps" value={formatBps(estimate?.slippageBps ?? null)} />
            <Stat
              label="Fully filled"
              value={estimate ? (estimate.fullyFilled ? "YES" : "NO") : "—"}
              tone={estimate?.fullyFilled ? "positive" : "warning"}
            />
          </div>
        </div>
      </div>
    </section>
  );
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
      <div className={`mt-2 font-mono text-[14px] ${toneClasses}`}>{value}</div>
    </div>
  );
}
