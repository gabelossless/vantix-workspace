import type { Side } from "@/lib/api-types";

export type LogLevel = "info" | "warning" | "error";
export type DaemonStatus = "online" | "offline" | "degraded" | "unknown";
export type FetchErrorKind =
  | "daemon_offline"
  | "json_parse_failure"
  | "invalid_payload"
  | "http_error"
  | "unexpected_error";

export interface OrderBookLevelView {
  price: number;
  quantity: number;
  notionalUsd: number;
}

export interface OrderBookSnapshotView {
  exchange: string;
  pair: string;
  bids: OrderBookLevelView[];
  asks: OrderBookLevelView[];
  bestBid: number | null;
  bestAsk: number | null;
  midPrice: number | null;
  spread: number | null;
  spreadBps: number | null;
  fetchedAt: string;
  sourceTimestamp: string | null;
}

export interface HealthSnapshotView {
  status: DaemonStatus;
  online: boolean;
  message: string;
  exchange: string;
  pair: string;
  version: string | null;
  fetchedAt: string;
  sourceTimestamp: string | null;
}

export interface SlippageEstimateView {
  side: Side;
  requestedNotionalUsd: number;
  filledQuantity: number;
  bestPrice: number | null;
  vwap: number | null;
  slippageBps: number | null;
  fullyFilled: boolean;
  source: "daemon";
  fetchedAt: string;
}

export interface RiskSnapshot {
  volatilityStatus: "Low" | "Moderate" | "Elevated";
  liquidityRisk: "Low" | "Moderate" | "High";
  spreadRisk: "Low" | "Moderate" | "High";
  depthRisk: "Low" | "Moderate" | "High";
  dataFreshness: "Fresh" | "Stale" | "Offline";
}

export interface AgentFleetEntry {
  name: string;
  role: string;
  status: "active" | "idle" | "offline";
  lastActive: string;
  tasksCompleted: number;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  title: string;
  detail: string;
}

export interface CapitalSearchResultView {
  id: string;
  source: string;
  title: string;
  content: string;
  score: number;
}

export interface CapitalSearchView {
  query: string;
  mode: string;
  dimensions: number;
  results: CapitalSearchResultView[];
  total: number;
  nextCursor: string | null;
  fetchedAt: string;
}

export interface CapitalHealthView {
  status: string;
  mode: string;
  dimensions: number;
  modelLoaded: boolean;
  uptimeHint: string;
  fetchedAt: string;
}
