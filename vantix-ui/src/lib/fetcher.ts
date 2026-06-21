import { API_BASE_URL, DAEMON_TIMEOUT_MS } from "@/lib/config";
import type {
  CapitalHealth,
  CapitalSearchResponse,
  HealthStatus,
  OrderBookLevel,
  OrderBookSnapshot,
  Side,
  SlippageEstimate,
} from "@/lib/api-types";
import type { FetchErrorKind } from "@/lib/view-types";

export class DaemonFetchError extends Error {
  kind: FetchErrorKind;
  statusCode: number;
  details?: unknown;

  constructor(message: string, kind: FetchErrorKind, statusCode: number, details?: unknown) {
    super(message);
    this.name = "DaemonFetchError";
    this.kind = kind;
    this.statusCode = statusCode;
    this.details = details;
  }
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function invalidPayload(endpoint: string, payload: unknown): never {
  throw new DaemonFetchError(
    `Invalid JSON contract from ${endpoint}`,
    "invalid_payload",
    502,
    payload,
  );
}

async function fetchDaemonJson(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DAEMON_TIMEOUT_MS);

  try {
    const response = await fetch(new URL(path, API_BASE_URL), {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    });
    const rawText = await response.text();

    if (!response.ok) {
      throw new DaemonFetchError(
        `Daemon responded with HTTP ${response.status}`,
        response.status === 503 ? "daemon_offline" : "http_error",
        response.status,
        rawText,
      );
    }

    if (!rawText.trim()) {
      throw new DaemonFetchError("Empty JSON payload from daemon", "invalid_payload", 502);
    }

    try {
      return JSON.parse(rawText) as unknown;
    } catch (error) {
      throw new DaemonFetchError("JSON parse failure from daemon", "json_parse_failure", 502, {
        rawText,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } catch (error) {
    if (error instanceof DaemonFetchError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new DaemonFetchError("Daemon request timed out", "daemon_offline", 503);
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new DaemonFetchError(message || "Unexpected daemon error", "daemon_offline", 503, error);
  } finally {
    clearTimeout(timeout);
  }
}

function parseHealthStatus(payload: unknown): HealthStatus {
  if (
    !isRecord(payload) ||
    typeof payload.status !== "string" ||
    !isFiniteNumber(payload.uptime_seconds) ||
    typeof payload.version !== "string" ||
    typeof payload.exchange_connected !== "boolean" ||
    !isFiniteNumber(payload.last_trade_message_age_secs) ||
    !isFiniteNumber(payload.adapters_running)
  ) {
    return invalidPayload("/health", payload);
  }

  return {
    status: payload.status,
    uptime_seconds: payload.uptime_seconds,
    version: payload.version,
    exchange_connected: payload.exchange_connected,
    last_trade_message_age_secs: payload.last_trade_message_age_secs,
    adapters_running: payload.adapters_running,
  };
}

function parseOrderBookLevel(payload: unknown): OrderBookLevel | null {
  if (
    !Array.isArray(payload) ||
    payload.length < 2 ||
    !isFiniteNumber(payload[0]) ||
    !isFiniteNumber(payload[1])
  ) {
    return null;
  }

  return [payload[0], payload[1]];
}

function parseOrderBookLevels(payload: unknown): OrderBookLevel[] | null {
  if (!Array.isArray(payload)) return null;

  const levels = payload.map(parseOrderBookLevel);
  return levels.every((level): level is OrderBookLevel => level !== null) ? levels : null;
}

function parseOrderBookSnapshot(payload: unknown): OrderBookSnapshot {
  if (
    !isRecord(payload) ||
    typeof payload.exchange !== "string" ||
    typeof payload.symbol !== "string" ||
    typeof payload.timestamp !== "string"
  ) {
    return invalidPayload("/orderbook/latest", payload);
  }

  const bids = parseOrderBookLevels(payload.bids);
  const asks = parseOrderBookLevels(payload.asks);
  if (bids === null || asks === null) {
    return invalidPayload("/orderbook/latest", payload);
  }

  return {
    exchange: payload.exchange,
    symbol: payload.symbol,
    bids,
    asks,
    timestamp: payload.timestamp,
  };
}

function parseSlippageEstimate(payload: unknown): SlippageEstimate {
  if (
    !isRecord(payload) ||
    !isFiniteNumber(payload.requested_notional_usd) ||
    !isFiniteNumber(payload.filled_quantity) ||
    !isFiniteNumber(payload.best_price) ||
    !isFiniteNumber(payload.vwap) ||
    !isFiniteNumber(payload.slippage_bps) ||
    typeof payload.fully_filled !== "boolean"
  ) {
    return invalidPayload("/estimate/slippage", payload);
  }

  return {
    requested_notional_usd: payload.requested_notional_usd,
    filled_quantity: payload.filled_quantity,
    best_price: payload.best_price,
    vwap: payload.vwap,
    slippage_bps: payload.slippage_bps,
    fully_filled: payload.fully_filled,
  };
}

export async function fetchDaemonHealth(): Promise<HealthStatus> {
  return parseHealthStatus(await fetchDaemonJson("/health"));
}

export async function fetchDaemonOrderBookLatest(): Promise<OrderBookSnapshot> {
  return parseOrderBookSnapshot(await fetchDaemonJson("/orderbook/latest"));
}

export async function fetchDaemonSlippageEstimate(
  side: Side,
  notionalUsd: number,
): Promise<SlippageEstimate> {
  const normalizedSide: Side = side === "sell" ? "sell" : "buy";
  const safeNotional = Number.isFinite(notionalUsd) && notionalUsd > 0 ? notionalUsd : 0;
  const query = new URLSearchParams({
    side: normalizedSide,
    notional_usd: String(safeNotional),
  });

  try {
    return parseSlippageEstimate(
      await fetchDaemonJson(`/estimate/slippage?${query.toString()}`),
    );
  } catch {
    return buildSlippageFromOrderBook(
      await fetchDaemonOrderBookLatest(),
      normalizedSide,
      safeNotional,
    );
  }
}

function buildSlippageFromOrderBook(
  orderBook: OrderBookSnapshot,
  side: Side,
  notionalUsd: number,
): SlippageEstimate {
  const levels = side === "buy" ? orderBook.asks : orderBook.bids;
  const bestPrice = levels[0]?.[0] ?? 0;
  let remainingNotional = notionalUsd;
  let filledQuantity = 0;
  let executedNotional = 0;

  for (const [price, quantity] of levels) {
    if (remainingNotional <= 0) break;
    const levelNotional = price * quantity;
    const takeNotional = Math.min(levelNotional, remainingNotional);
    filledQuantity += takeNotional / price;
    executedNotional += takeNotional;
    remainingNotional -= takeNotional;
  }

  const vwap = filledQuantity > 0 ? executedNotional / filledQuantity : 0;
  const slippageBps =
    bestPrice > 0 && vwap > 0
      ? side === "buy"
        ? ((vwap - bestPrice) / bestPrice) * 10_000
        : ((bestPrice - vwap) / bestPrice) * 10_000
      : 0;

  return {
    requested_notional_usd: notionalUsd,
    filled_quantity: filledQuantity,
    best_price: bestPrice,
    vwap,
    slippage_bps: slippageBps,
    fully_filled: remainingNotional <= 0.000001,
  };
}

function parseErrorMessage(payload: unknown, fallback: string) {
  if (!isRecord(payload)) return fallback;
  const message = payload.error ?? payload.message ?? payload.detail;
  return typeof message === "string" ? message : fallback;
}

export async function fetchRouteJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });
  const rawText = await response.text();
  let payload: unknown = null;

  if (rawText.trim()) {
    try {
      payload = JSON.parse(rawText) as unknown;
    } catch (error) {
      throw new DaemonFetchError("JSON parse failure from app route", "json_parse_failure", 502, {
        rawText,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (!response.ok) {
    throw new DaemonFetchError(
      parseErrorMessage(payload, `Request failed with HTTP ${response.status}`),
      isRecord(payload) && typeof payload.kind === "string"
        ? (payload.kind as FetchErrorKind)
        : "http_error",
      response.status,
      payload,
    );
  }

  return payload as T;
}

function parseCapitalSearchResult(payload: unknown) {
  if (
    !isRecord(payload) ||
    typeof payload.id !== "string" ||
    typeof payload.source !== "string" ||
    typeof payload.title !== "string" ||
    typeof payload.content !== "string" ||
    !isFiniteNumber(payload.score)
  ) {
    return null;
  }
  return { id: payload.id, source: payload.source, title: payload.title, content: payload.content, score: payload.score };
}

function parseCapitalSearchResponse(payload: unknown): CapitalSearchResponse {
  if (
    !isRecord(payload) ||
    typeof payload.query !== "string" ||
    typeof payload.mode !== "string" ||
    !isFiniteNumber(payload.dimensions) ||
    !Array.isArray(payload.results) ||
    !isFiniteNumber(payload.total)
  ) {
    return invalidPayload("/v1/capital/search", payload);
  }

  const results = payload.results.map(parseCapitalSearchResult).filter(
    (r): r is NonNullable<typeof r> => r !== null,
  );

  return {
    query: payload.query,
    mode: payload.mode,
    dimensions: payload.dimensions,
    results,
    total: payload.total,
    next_cursor: typeof payload.next_cursor === "string" ? payload.next_cursor : null,
  };
}

function parseCapitalHealthResponse(payload: unknown): CapitalHealth {
  if (
    !isRecord(payload) ||
    typeof payload.status !== "string" ||
    typeof payload.mode !== "string" ||
    !isFiniteNumber(payload.dimensions) ||
    typeof payload.model_loaded !== "boolean" ||
    typeof payload.uptime_hint !== "string"
  ) {
    return invalidPayload("/v1/capital/health", payload);
  }

  return {
    status: payload.status,
    mode: payload.mode,
    dimensions: payload.dimensions,
    model_loaded: payload.model_loaded,
    uptime_hint: payload.uptime_hint,
  };
}

export async function fetchDaemonCapitalSearch(
  query: string,
  limit?: number,
  cursor?: string,
): Promise<CapitalSearchResponse> {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (limit && limit > 0) params.set("limit", String(limit));
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();
  return parseCapitalSearchResponse(
    await fetchDaemonJson(`/v1/capital/search${qs ? `?${qs}` : ""}`),
  );
}

export async function fetchDaemonCapitalHealth(): Promise<CapitalHealth> {
  return parseCapitalHealthResponse(await fetchDaemonJson("/v1/capital/health"));
}
