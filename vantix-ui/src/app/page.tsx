"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import {
  buildAgentFleet,
  toHealthSnapshotView,
  toOrderBookSnapshotView,
  toSlippageEstimateView,
} from "@/lib/adapters";
import { fetchRouteJson } from "@/lib/fetcher";
import {
  formatNumber,
  formatPrice,
  formatTimestamp,
} from "@/lib/format";
import type {
  CapitalHealth,
  CapitalSearchResponse,
  HealthStatus,
  OrderBookSnapshot,
  RiskSnapshotResponse,
  Side,
  SlippageEstimate,
} from "@/lib/api-types";
import type {
  AgentFleetEntry,
  CapitalHealthView,
  CapitalSearchResultView,
  HealthSnapshotView,
  OrderBookSnapshotView,
  RiskSnapshot,
  SlippageEstimateView,
  SystemLogEntry,
} from "@/lib/view-types";
import { HEALTH_POLL_INTERVAL_MS, ORDERBOOK_POLL_INTERVAL_MS, STALE_ORDERBOOK_THRESHOLD_MS } from "@/lib/config";
import { TopStatusBar } from "@/components/TopStatusBar";
import { Sidebar } from "@/components/Sidebar";
import { MarketOverview } from "@/components/MarketOverview";
import { OrderBookDepth } from "@/components/OrderBookDepth";
import { ImbalancePanel } from "@/components/ImbalancePanel";
import { SlippageEstimator } from "@/components/SlippageEstimator";
import { RiskSnapshot as RiskSnapshotPanel } from "@/components/RiskSnapshot";
import { SystemLogs } from "@/components/SystemLogs";
import { NarrativeEnginePanel } from "@/components/NarrativeEnginePanel";
import { AgentFleetPanel } from "@/components/AgentFleetPanel";
import { CapitalSearchPanel } from "@/components/CapitalSearchPanel";
import { DaemonFetchError } from "@/lib/fetcher";

type ViewState = "overview" | "orderbook" | "slippage" | "capital" | "narrative" | "fleet" | "logs";

function createLog(
  level: SystemLogEntry["level"],
  title: string,
  detail: string,
  index: number,
): SystemLogEntry {
  return {
    id: `${Date.now()}-${index}`,
    timestamp: new Date().toISOString(),
    level,
    title,
    detail,
  };
}

function extractErrorDetail(error: unknown) {
  if (error instanceof DaemonFetchError) {
    return {
      title:
        error.kind === "daemon_offline"
          ? "Daemon offline"
          : error.kind === "json_parse_failure"
            ? "JSON parse failure"
            : error.kind === "invalid_payload"
              ? "Invalid payload"
              : "Fetch error",
      detail: error.message,
      kind: error.kind,
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return { title: "Fetch error", detail: message, kind: "unexpected_error" as const };
}

function computeImbalance(book: OrderBookSnapshotView | undefined) {
  if (!book) return { bidDepthUsd: null, askDepthUsd: null, imbalanceScore: null };
  const bidDepthUsd = book.bids.reduce((sum, level) => sum + level.notionalUsd, 0);
  const askDepthUsd = book.asks.reduce((sum, level) => sum + level.notionalUsd, 0);
  const total = bidDepthUsd + askDepthUsd;
  const imbalanceScore = total > 0 ? ((bidDepthUsd - askDepthUsd) / total) * 100 : null;
  return { bidDepthUsd, askDepthUsd, imbalanceScore };
}

function summarizeAge(fetchedAt: string | null | undefined) {
  if (!fetchedAt) return null;
  const age = Date.now() - new Date(fetchedAt).getTime();
  return Number.isFinite(age) ? age : null;
}

export default function Home() {
  const [view, setView] = useState<ViewState>("overview");
  const agents: AgentFleetEntry[] = useMemo(() => buildAgentFleet(), []);
  const [slippageSide, setSlippageSide] = useState<Side>("buy");
  const [slippageNotionalUsd, setSlippageNotionalUsd] = useState(50_000);
  const [slippageEstimate, setSlippageEstimate] = useState<SlippageEstimateView | null>(null);
  const [slippageLoading, setSlippageLoading] = useState(false);
  const [capitalQuery, setCapitalQuery] = useState("");
  const [capitalResults, setCapitalResults] = useState<CapitalSearchResultView[]>([]);
  const [capitalTotal, setCapitalTotal] = useState(0);
  const [capitalLoading, setCapitalLoading] = useState(false);
  const [logs, setLogs] = useState<SystemLogEntry[]>([
    createLog("info", "Terminal initialized", "Awaiting daemon heartbeat and order book data.", 0),
  ]);
  const logIndex = useRef(1);
  const lastHealthErrorSignature = useRef<string | null>(null);
  const lastBookErrorSignature = useRef<string | null>(null);
  const lastStaleState = useRef(false);

  const {
    data: health,
    error: healthError,
  } = useSWR<HealthSnapshotView>(
    "/api/health",
    async (path: string) => toHealthSnapshotView(await fetchRouteJson<HealthStatus>(path)),
    {
      refreshInterval: HEALTH_POLL_INTERVAL_MS,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 250,
    },
  );

  const {
    data: orderbook,
    error: orderbookError,
  } = useSWR<OrderBookSnapshotView>(
    "/api/orderbook/latest",
    async (path: string) =>
      toOrderBookSnapshotView(await fetchRouteJson<OrderBookSnapshot>(path)),
    {
      refreshInterval: ORDERBOOK_POLL_INTERVAL_MS,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 150,
    },
  );

  const {
    data: capitalHealth,
    error: capitalHealthError,
  } = useSWR<CapitalHealthView>(
    view === "capital" ? "/api/v1/capital/health" : null,
    async (path: string) => {
      const raw = await fetchRouteJson<CapitalHealth>(path);
      return {
        status: raw.status,
        mode: raw.mode,
        dimensions: raw.dimensions,
        modelLoaded: raw.model_loaded,
        uptimeHint: raw.uptime_hint,
        fetchedAt: new Date().toISOString(),
      };
    },
    {
      refreshInterval: 10_000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 5000,
    },
  );

  const {
    data: daemonRisk,
  } = useSWR<RiskSnapshotResponse>(
    orderbook ? "/api/v1/risk" : null,
    async (path: string) => fetchRouteJson<RiskSnapshotResponse>(path),
    {
      refreshInterval: 5000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 2500,
    },
  );

  const lastUpdate = orderbook?.fetchedAt ?? health?.fetchedAt ?? null;
  const orderbookAgeMs = summarizeAge(orderbook?.fetchedAt);
  const stale = orderbookAgeMs !== null && orderbookAgeMs > STALE_ORDERBOOK_THRESHOLD_MS;
  const daemonOnline = Boolean(health?.online && !healthError);
  const daemonStatus = healthError
    ? extractErrorDetail(healthError).title
    : health?.status ?? "unknown";
  const activeExchange =
    orderbook?.exchange && orderbook.exchange !== "Unknown exchange"
      ? orderbook.exchange
      : health?.exchange ?? "Unknown exchange";
  const activePair =
    orderbook?.pair && orderbook.pair !== "Unknown pair"
      ? orderbook.pair
      : health?.pair ?? "Unknown pair";
  const imbalance = computeImbalance(orderbook);

  const riskSnapshot: RiskSnapshot = daemonRisk
    ? {
        volatilityStatus: daemonRisk.volatility_status as RiskSnapshot["volatilityStatus"],
        liquidityRisk: daemonRisk.liquidity_risk as RiskSnapshot["liquidityRisk"],
        spreadRisk: daemonRisk.spread_risk as RiskSnapshot["spreadRisk"],
        depthRisk: daemonRisk.depth_risk as RiskSnapshot["depthRisk"],
        dataFreshness: daemonRisk.data_freshness as RiskSnapshot["dataFreshness"],
      }
    : {
        volatilityStatus: "Moderate",
        liquidityRisk: stale ? "Moderate" : "Low",
        spreadRisk: orderbook?.spreadBps !== null && orderbook?.spreadBps !== undefined && orderbook.spreadBps > 15
          ? "High"
          : orderbook?.spreadBps !== null && orderbook?.spreadBps !== undefined && orderbook.spreadBps > 5
            ? "Moderate"
            : "Low",
        depthRisk:
          imbalance.imbalanceScore === null
            ? "Moderate"
            : Math.abs(imbalance.imbalanceScore) > 25
              ? "High"
              : Math.abs(imbalance.imbalanceScore) > 12
                ? "Moderate"
                : "Low",
        dataFreshness: healthError ? "Offline" : stale ? "Stale" : "Fresh",
      };

  useEffect(() => {
    if (!healthError) {
      lastHealthErrorSignature.current = null;
      return;
    }

    const signature = `${healthError instanceof DaemonFetchError ? healthError.kind : "unexpected"}:${healthError.message}`;
    if (signature !== lastHealthErrorSignature.current) {
      const detail = extractErrorDetail(healthError);
      setLogs((current) => [
        createLog("error", detail.title, detail.detail, logIndex.current++),
        ...current,
      ].slice(0, 80));
      lastHealthErrorSignature.current = signature;
    }
  }, [healthError]);

  useEffect(() => {
    if (!orderbookError) {
      lastBookErrorSignature.current = null;
      return;
    }

    const signature = `${orderbookError instanceof DaemonFetchError ? orderbookError.kind : "unexpected"}:${orderbookError.message}`;
    if (signature !== lastBookErrorSignature.current) {
      const detail = extractErrorDetail(orderbookError);
      setLogs((current) => [
        createLog(
          "error",
          detail.kind === "daemon_offline" ? "Order book offline" : "Order book fetch failed",
          detail.detail,
          logIndex.current++,
        ),
        ...current,
      ].slice(0, 80));
      lastBookErrorSignature.current = signature;
    }
  }, [orderbookError]);

  useEffect(() => {
    const staleSignature = stale;
    if (staleSignature && !lastStaleState.current) {
      setLogs((current) => [
        createLog(
          "warning",
          "Stale order book",
          `Last successful order book update is older than ${formatNumber(STALE_ORDERBOOK_THRESHOLD_MS / 1000, 1)} seconds.`,
          logIndex.current++,
        ),
        ...current,
      ].slice(0, 80));
    }
    lastStaleState.current = staleSignature;
  }, [stale]);

  useEffect(() => {
    if (!healthError && health?.online && lastHealthErrorSignature.current !== null) {
      setLogs((current) => [
        createLog("info", "Daemon reachable", "Health polling recovered and the Rust daemon is responding.", logIndex.current++),
        ...current,
      ].slice(0, 80));
      lastHealthErrorSignature.current = null;
    }
  }, [health, healthError]);

  async function runSlippageSimulation(side: Side, notionalUsd: number) {
    setSlippageSide(side);
    setSlippageLoading(true);
    try {
      const estimate = await fetchRouteJson<SlippageEstimate>(
        `/api/estimate/slippage?side=${side}&notional_usd=${encodeURIComponent(String(notionalUsd))}`,
      );
      setSlippageEstimate(toSlippageEstimateView(estimate, side));
    } catch (error) {
      const detail = extractErrorDetail(error);
      setLogs((current) => [
        createLog("error", detail.title, detail.detail, logIndex.current++),
        ...current,
      ].slice(0, 80));
    } finally {
      setSlippageLoading(false);
    }
  }

  async function handleCapitalSearch(query: string) {
    setCapitalQuery(query);
    setCapitalLoading(true);
    try {
      const response = await fetchRouteJson<CapitalSearchResponse>(
        `/api/v1/capital/search?q=${encodeURIComponent(query)}&limit=10`,
      );
      setCapitalResults(
        response.results.map((r) => ({
          id: r.id,
          source: r.source,
          title: r.title,
          content: r.content,
          score: r.score,
        })),
      );
      setCapitalTotal(response.total);
    } catch (error) {
      const detail = extractErrorDetail(error);
      setCapitalResults([]);
      setCapitalTotal(0);
      setLogs((current) => [
        createLog("error", detail.title, detail.detail, logIndex.current++),
        ...current,
      ].slice(0, 80));
    } finally {
      setCapitalLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070809] text-zinc-100">
      <TopStatusBar
        daemonOnline={daemonOnline}
        daemonStatus={daemonStatus}
        activeExchange={activeExchange}
        activePair={activePair}
        lastUpdate={lastUpdate}
        stale={stale}
      />

      <div className="grid min-h-[calc(100vh-65px)] lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar activeView={view} onViewChange={(v) => setView(v as ViewState)} />

        <main className="space-y-4 p-4">
          {view === "overview" && (
            <>
              <MarketOverview
                bestBid={orderbook?.bestBid ?? null}
                bestAsk={orderbook?.bestAsk ?? null}
                midPrice={orderbook?.midPrice ?? null}
                spread={orderbook?.spread ?? null}
                spreadBps={orderbook?.spreadBps ?? null}
                lastUpdate={lastUpdate}
                stale={stale}
                daemonOnline={daemonOnline}
              />

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
                <OrderBookDepth bids={orderbook?.bids ?? []} asks={orderbook?.asks ?? []} />
                <ImbalancePanel
                  bidDepthUsd={imbalance.bidDepthUsd}
                  askDepthUsd={imbalance.askDepthUsd}
                  imbalanceScore={imbalance.imbalanceScore}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <SlippageEstimator
                  side={slippageSide}
                  notionalUsd={slippageNotionalUsd}
                  loading={slippageLoading}
                  estimate={slippageEstimate}
                  onSideChange={setSlippageSide}
                  onNotionalChange={setSlippageNotionalUsd}
                  onSimulate={runSlippageSimulation}
                />
                <RiskSnapshotPanel snapshot={riskSnapshot} />
              </div>

              <SystemLogs logs={logs} />

              <div className="grid gap-3 border border-white/10 bg-[#0b0d10] p-4 text-xs text-zinc-500 sm:grid-cols-3">
                <div className="border border-white/10 bg-black px-3 py-2">
                  <div className="uppercase tracking-[0.18em] text-zinc-500">Best bid</div>
                  <div className="mt-1 font-mono text-zinc-200">{formatPrice(orderbook?.bestBid ?? null)}</div>
                </div>
                <div className="border border-white/10 bg-black px-3 py-2">
                  <div className="uppercase tracking-[0.18em] text-zinc-500">Best ask</div>
                  <div className="mt-1 font-mono text-zinc-200">{formatPrice(orderbook?.bestAsk ?? null)}</div>
                </div>
                <div className="border border-white/10 bg-black px-3 py-2">
                  <div className="uppercase tracking-[0.18em] text-zinc-500">Update age</div>
                  <div className="mt-1 font-mono text-zinc-200">
                    {lastUpdate ? formatTimestamp(lastUpdate) : "—"}
                  </div>
                </div>
              </div>
            </>
          )}

          {view === "orderbook" && (
            <OrderBookDepth bids={orderbook?.bids ?? []} asks={orderbook?.asks ?? []} />
          )}

          {view === "slippage" && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <SlippageEstimator
                side={slippageSide}
                notionalUsd={slippageNotionalUsd}
                loading={slippageLoading}
                estimate={slippageEstimate}
                onSideChange={setSlippageSide}
                onNotionalChange={setSlippageNotionalUsd}
                onSimulate={runSlippageSimulation}
              />
              <RiskSnapshotPanel snapshot={riskSnapshot} />
            </div>
          )}

          {view === "capital" && (
            <CapitalSearchPanel
              results={capitalResults}
              total={capitalTotal}
              loading={capitalLoading}
              query={capitalQuery}
              health={capitalHealth ?? null}
              healthError={Boolean(capitalHealthError)}
              onSearch={handleCapitalSearch}
            />
          )}

          {view === "narrative" && <NarrativeEnginePanel logs={logs} />}

          {view === "fleet" && <AgentFleetPanel agents={agents} />}

          {view === "logs" && <SystemLogs logs={logs} />}
        </main>
      </div>
    </div>
  );
}
