import type { RiskSnapshot as RiskSnapshotData } from "@/lib/view-types";

interface RiskSnapshotProps {
  snapshot: RiskSnapshotData;
}

function Row({ label, value }: { label: string; value: string }) {
  const tone =
    value === "Low" || value === "Fresh"
      ? "text-emerald-400"
      : value === "Moderate"
        ? "text-amber-400"
        : value === "Stale" || value === "Offline" || value === "High"
          ? "text-rose-400"
          : "text-zinc-100";

  return (
    <div className="flex items-center justify-between gap-4 border border-white/10 bg-black px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className={`font-mono text-[13px] ${tone}`}>{value}</div>
    </div>
  );
}

export function RiskSnapshot({ snapshot }: RiskSnapshotProps) {
  return (
    <section className="border border-white/10 bg-[#0b0d10] p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold tracking-[0.18em] text-zinc-100">Risk Snapshot</h2>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
          Placeholder framework for future daemon endpoints
        </p>
      </div>

      <div className="space-y-2">
        <Row label="Volatility status" value={snapshot.volatilityStatus} />
        <Row label="Liquidity risk" value={snapshot.liquidityRisk} />
        <Row label="Spread risk" value={snapshot.spreadRisk} />
        <Row label="Depth risk" value={snapshot.depthRisk} />
        <Row label="Data freshness" value={snapshot.dataFreshness} />
      </div>
    </section>
  );
}
