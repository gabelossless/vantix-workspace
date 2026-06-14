import { formatNumber, formatUsd } from "@/lib/format";

interface ImbalancePanelProps {
  bidDepthUsd: number | null;
  askDepthUsd: number | null;
  imbalanceScore: number | null;
}

function ToneLabel({ value }: { value: string }) {
  return <span className="font-mono text-[13px] text-zinc-100">{value}</span>;
}

export function ImbalancePanel({ bidDepthUsd, askDepthUsd, imbalanceScore }: ImbalancePanelProps) {
  const total = (bidDepthUsd ?? 0) + (askDepthUsd ?? 0);
  const bidPercentage = total > 0 ? (bidDepthUsd ?? 0) / total * 100 : null;
  const askPercentage = total > 0 ? (askDepthUsd ?? 0) / total * 100 : null;
  const scoreTone =
    imbalanceScore === null ? "text-zinc-100" : imbalanceScore > 0 ? "text-emerald-400" : "text-rose-400";

  return (
    <section className="border border-white/10 bg-[#0b0d10] p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold tracking-[0.18em] text-zinc-100">Depth Imbalance</h2>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
          Bid depth vs ask depth across the top 10 levels
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border border-white/10 bg-black px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Bid depth</div>
          <div className="mt-2 font-mono text-[15px] text-emerald-400">{formatUsd(bidDepthUsd)}</div>
        </div>
        <div className="border border-white/10 bg-black px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Ask depth</div>
          <div className="mt-2 font-mono text-[15px] text-rose-400">{formatUsd(askDepthUsd)}</div>
        </div>
        <div className="border border-white/10 bg-black px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Imbalance score</div>
          <div className={`mt-2 font-mono text-[15px] ${scoreTone}`}>{formatNumber(imbalanceScore, 2)}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border border-white/10 bg-black px-3 py-3 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Bid share</div>
          <ToneLabel value={bidPercentage === null ? "—" : `${formatNumber(bidPercentage, 2)}%`} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Ask share</div>
          <ToneLabel value={askPercentage === null ? "—" : `${formatNumber(askPercentage, 2)}%`} />
        </div>
      </div>
    </section>
  );
}

