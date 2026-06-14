import { formatPrice, formatQuantity, formatUsd } from "@/lib/format";
import type { OrderBookLevelView } from "@/lib/view-types";

function buildRows(levels: OrderBookLevelView[]) {
  let cumulative = 0;
  return levels.map((level) => {
    cumulative += level.notionalUsd;
    return { ...level, cumulativeNotionalUsd: cumulative };
  });
}

function Cell({ value, tone }: { value: string; tone?: "positive" | "negative" | "neutral" }) {
  const toneClasses = {
    positive: "text-emerald-400",
    negative: "text-rose-400",
    neutral: "text-zinc-100",
  }[tone ?? "neutral"];

  return <span className={`font-mono text-[12px] ${toneClasses}`}>{value}</span>;
}

interface OrderBookDepthProps {
  bids: OrderBookLevelView[];
  asks: OrderBookLevelView[];
}

export function OrderBookDepth({ bids, asks }: OrderBookDepthProps) {
  const bidRows = buildRows(bids.slice(0, 10));
  const askRows = buildRows(asks.slice(0, 10));

  return (
    <section className="border border-white/10 bg-[#0b0d10] p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold tracking-[0.18em] text-zinc-100">Order Book Depth</h2>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
          Top 10 bids and asks with cumulative notional
        </p>
      </div>

      <div className="overflow-x-auto border border-white/10">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-black">
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              <th className="px-3 py-2">Bid price</th>
              <th className="px-3 py-2">Bid qty</th>
              <th className="px-3 py-2">Bid cum USD</th>
              <th className="px-3 py-2">Ask price</th>
              <th className="px-3 py-2">Ask qty</th>
              <th className="px-3 py-2">Ask cum USD</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }, (_, index) => {
              const bid = bidRows[index];
              const ask = askRows[index];
              return (
                <tr key={index} className="border-b border-white/5 last:border-b-0">
                  <td className="px-3 py-2">
                    <Cell value={formatPrice(bid?.price)} tone="positive" />
                  </td>
                  <td className="px-3 py-2">
                    <Cell value={formatQuantity(bid?.quantity)} tone="positive" />
                  </td>
                  <td className="px-3 py-2">
                    <Cell value={formatUsd(bid?.cumulativeNotionalUsd)} tone="positive" />
                  </td>
                  <td className="px-3 py-2">
                    <Cell value={formatPrice(ask?.price)} tone="negative" />
                  </td>
                  <td className="px-3 py-2">
                    <Cell value={formatQuantity(ask?.quantity)} tone="negative" />
                  </td>
                  <td className="px-3 py-2">
                    <Cell value={formatUsd(ask?.cumulativeNotionalUsd)} tone="negative" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
