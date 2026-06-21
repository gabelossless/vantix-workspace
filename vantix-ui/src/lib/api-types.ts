export type Side = "buy" | "sell";

export interface HealthStatus {
  status: string;
  uptime_seconds: number;
  version: string;
  exchange_connected: boolean;
  last_trade_message_age_secs: number;
  adapters_running: number;
}

export type OrderBookLevel = [price: number, quantity: number];

export interface OrderBookSnapshot {
  exchange: string;
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: string;
}

export interface SlippageRequest {
  side: Side;
  notional_usd: number;
}

export interface SlippageEstimate {
  requested_notional_usd: number;
  filled_quantity: number;
  best_price: number;
  vwap: number;
  slippage_bps: number;
  fully_filled: boolean;
}

export interface CapitalSearchRequest {
  q?: string;
  limit?: number;
  cursor?: string;
}

export interface CapitalSearchResult {
  id: string;
  source: string;
  title: string;
  content: string;
  score: number;
}

export interface CapitalSearchResponse {
  query: string;
  mode: string;
  dimensions: number;
  results: CapitalSearchResult[];
  total: number;
  next_cursor: string | null;
}

export interface CapitalErrorDetails {
  code: string;
  message: string;
  model_dir?: string;
  missing_files?: string[];
}

export interface CapitalErrorBody {
  error: CapitalErrorDetails;
}

export interface CapitalHealth {
  status: string;
  mode: string;
  dimensions: number;
  model_loaded: boolean;
  uptime_hint: string;
}

export interface RiskSnapshotResponse {
  volatility_status: string;
  liquidity_risk: string;
  spread_risk: string;
  depth_risk: string;
  data_freshness: string;
}
