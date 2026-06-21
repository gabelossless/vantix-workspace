import type {
  AgentFleetRecord as AgentFleetRecordResponse,
  HealthStatus,
  OrderBookLevel,
  OrderBookSnapshot,
  Side,
  SlippageEstimate,
} from "@/lib/api-types";
import type {
  AgentFleetEntry as AgentFleetEntryView,
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

export function toAgentFleetView(entries: AgentFleetRecordResponse[]): AgentFleetEntryView[] {
  return entries.map((entry) => ({
    name: entry.name,
    role: entry.role,
    status: entry.status,
    lastActive: entry.last_active,
    tasksCompleted: entry.tasks_completed,
  }));
}

export function buildAgentFleet(): AgentFleetEntryView[] {
  return [
    { name: "Orchestrator", role: "Primary dispatcher", status: "active", lastActive: "now", tasksCompleted: 0 },
    { name: "CEO Agent", role: "Strategy & vision", status: "idle", lastActive: "—", tasksCompleted: 0 },
    { name: "CTO Agent", role: "Architecture & quality", status: "idle", lastActive: "—", tasksCompleted: 0 },
    { name: "Protocol Engineer", role: "Exchange adapters", status: "active", lastActive: "now", tasksCompleted: 0 },
    { name: "Risk Quant", role: "Slippage & volatility", status: "active", lastActive: "now", tasksCompleted: 0 },
    { name: "Capital RAG Engineer", role: "Knowledge retrieval", status: "active", lastActive: "now", tasksCompleted: 0 },
    { name: "Terminal UX Engineer", role: "Panels & data viz", status: "active", lastActive: "now", tasksCompleted: 0 },
    { name: "Data Pipeline Engineer", role: "Storage & observability", status: "active", lastActive: "now", tasksCompleted: 0 },
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
