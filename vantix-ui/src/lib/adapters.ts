import type {
  HealthStatus,
  OrderBookLevel,
  OrderBookSnapshot,
  Side,
  SlippageEstimate,
} from "@/lib/api-types";
import type {
  AgentFleetEntry,
  HealthSnapshotView,
  OrderBookLevelView,
  OrderBookSnapshotView,
  SlippageEstimateView,
} from "@/lib/view-types";

function toOrderBookLevelView([price, quantity]: OrderBookLevel): OrderBookLevelView {
  return {
    price,
    quantity,
    notionalUsd: price * quantity,
  };
}

export function toHealthSnapshotView(
  health: HealthStatus,
  fetchedAt = new Date().toISOString(),
): HealthSnapshotView {
  const normalizedStatus = health.status.trim().toLowerCase();
  const online = ["ok", "online", "healthy", "up"].includes(normalizedStatus);

  return {
    status: online ? "online" : normalizedStatus === "degraded" ? "degraded" : "unknown",
    online,
    message: health.status,
    exchange: "Unknown exchange",
    pair: "Unknown pair",
    version: health.version,
    fetchedAt,
    sourceTimestamp: null,
  };
}

export function toOrderBookSnapshotView(
  orderBook: OrderBookSnapshot,
  fetchedAt = new Date().toISOString(),
): OrderBookSnapshotView {
  const bids = orderBook.bids
    .map(toOrderBookLevelView)
    .sort((left, right) => right.price - left.price)
    .slice(0, 10);
  const asks = orderBook.asks
    .map(toOrderBookLevelView)
    .sort((left, right) => left.price - right.price)
    .slice(0, 10);
  const bestBid = bids[0]?.price ?? null;
  const bestAsk = asks[0]?.price ?? null;
  const midPrice = bestBid !== null && bestAsk !== null ? (bestBid + bestAsk) / 2 : null;
  const spread = bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null;
  const spreadBps =
    spread !== null && midPrice !== null && midPrice > 0 ? (spread / midPrice) * 10_000 : null;

  return {
    exchange: orderBook.exchange,
    pair: orderBook.symbol,
    bids,
    asks,
    bestBid,
    bestAsk,
    midPrice,
    spread,
    spreadBps,
    fetchedAt,
    sourceTimestamp: orderBook.timestamp,
  };
}

export function buildAgentFleet(): AgentFleetEntry[] {
  return [
    { name: "Bookkeeper", role: "General Ledger", status: "active", lastActive: "now", tasksCompleted: 1423 },
    { name: "Sales Rep", role: "Client Engagement", status: "active", lastActive: "2s ago", tasksCompleted: 987 },
    { name: "Customer Support", role: "Ticket Resolution", status: "active", lastActive: "1s ago", tasksCompleted: 654 },
    { name: "Recruiter", role: "Talent Pipeline", status: "idle", lastActive: "34s ago", tasksCompleted: 312 },
    { name: "Protocol Engineer", role: "Exchange Adapters", status: "active", lastActive: "now", tasksCompleted: 788 },
    { name: "Risk Quant", role: "Slippage & Volatility", status: "idle", lastActive: "2m ago", tasksCompleted: 445 },
    { name: "RAG Engineer", role: "Knowledge Retrieval", status: "active", lastActive: "3s ago", tasksCompleted: 231 },
    { name: "Data Engineer", role: "Data Pipeline", status: "offline", lastActive: "15m ago", tasksCompleted: 89 },
  ];
}

export function toSlippageEstimateView(
  estimate: SlippageEstimate,
  side: Side,
  fetchedAt = new Date().toISOString(),
): SlippageEstimateView {
  return {
    side,
    requestedNotionalUsd: estimate.requested_notional_usd,
    filledQuantity: estimate.filled_quantity,
    bestPrice: estimate.best_price,
    vwap: estimate.vwap,
    slippageBps: estimate.slippage_bps,
    fullyFilled: estimate.fully_filled,
    source: "daemon",
    fetchedAt,
  };
}
