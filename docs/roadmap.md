# Vantix Roadmap

Workspace: `./` (project root)
Last updated: June 13, 2026

---

## Milestone 1: Unified Type Validation ✅ COMPLETE

**Goal:** Synchronize TypeScript UI types with Rust daemon contract structs.

**Delivered:**
- `api-types.ts` — exact mirror of active Rust JSON contracts
- `view-types.ts` — UI-only derived models (dashboard state, formatted rows, risk models, logs)
- `adapters.ts` — pure transformations from daemon contracts to UI view models
- `fetcher.ts` — typed to `api-types.ts`, validates and returns daemon contract types
- `types.ts` — compatibility barrel re-exporting both layers

**Verification:**
- `npm run lint` ✅
- `npm run build` ✅ (Next.js 16.2.9, Turbopack)
- `cargo check` ✅ (default mode, no model assets required)
- `cargo check --features local-embeddings` ✅
- `cargo test` ✅ (2 tests)
- `cargo test --features local-embeddings` ✅ (3 tests)

**Active Contracts:**
- `GET /health` → `HealthStatus`
- `GET /orderbook/latest` → `OrderBookSnapshot` (tuple levels `[price, quantity]`)
- `GET /estimate/slippage` → `SlippageEstimate` (snake_case fields)
- `GET /v1/capital/search` → `CapitalSearchResponse` / `CapitalErrorBody`

**Not Yet Implemented:**
- `/v1/capital/health`
- `/v1/capital/generate-report`

---

## Milestone 2: Exchange Adapter System ✅ COMPLETE

**Goal:** Decouple hardcoded Binance feed into a modular Exchange Cartridge system.

**Delivered:**
- `ExchangeAdapter` trait in `src/exchange/mod.rs` with `subscribe_and_stream`, `name`, `health_status`
- `BinanceAdapter` refactored to implement the trait, with `AtomicBool` connection tracking
- `MockExchange` new adapter generating varied order book data every 500ms
- Both adapters spawned concurrently in `src/main.rs` via `tokio::spawn`

**Verification:**
- `cargo check` ✅ / `cargo check --features local-embeddings` ✅
- `cargo test` ✅ / `cargo test --features local-embeddings` ✅

## Milestone 3: Capital Health & Observability (In Progress)

### 3.1 ✅ Capital Health Route
- [x] `GET /v1/capital/health` returns `{status, mode, dimensions, model_loaded, uptime_hint}`
- [x] Works in mock, local-loaded, and local-degraded states
- [x] TypeScript `CapitalHealth` interface in `api-types.ts`

### 3.2 ✅ Model Documentation
- [x] "Sourcing Models" section in `MODELS.md` with `optimum-cli` / `transformers.js` export steps

### 3.3 Capital Search Enhancement
- [ ] Add pagination cursor support to `/v1/capital/search`
- [ ] Add source filtering (e.g., `source=capital_brief`)
- [ ] Add score threshold parameter
- [ ] Benchmark mock vs local-embeddings latency

### 3.4 Embeddings & Model Loading
- [ ] Cache tokenizer + session to avoid re-load on each request
- [ ] Model cache warming on startup with health-reported status

### 3.5 Order Book Resilience
- [ ] Add connection health metrics to `/health` (WS reconnect count, last message age)
- [ ] Implement backpressure for stale order book snapshots
- [ ] Add sequence/gap detection for Binance depth stream

### 3.6 Observability
- [ ] Structured JSON logging (tracing + serde_json)
- [ ] `/metrics` endpoint (Prometheus format) for latency, error rates, queue depths
- [ ] Correlation IDs propagated from UI → daemon → Binance WS

## Milestone 4: Narrative Engine & Agent Fleet ✅ COMPLETE

**Goal:** Scaffold new dashboard panels and wire sidebar navigation.

**Delivered:**
- `NarrativeEnginePanel.tsx` — Dense log viewer rendering `SystemLogEntry[]` with timestamps and level badges
- `AgentFleetPanel.tsx` — Grid of 8 AI worker cards with status, last active, tasks completed
- `Sidebar.tsx` — Updated with clickable nav items, `activeView`/`onViewChange` props, active state highlighting
- `page.tsx` — Added `ViewState` union, conditional panel rendering, view switching via sidebar

**Verification:**
- `npm run lint` ✅ / `npm run build` ✅ (Next.js 16.2.9, Turbopack)

---

## Milestone 3: Capital RAG Spine

### 3.1 Knowledge Base
- [ ] Ingest Markdown/JSON capital briefs into SQLite FTS5 or Tantivy
- [ ] Add document versioning and hash-based change detection
- [ ] Build embedding index build script (offline, CI-friendly)

### 3.2 Search Quality
- [ ] Hybrid search: keyword (FTS) + vector (ONNX embeddings) with reciprocal rank fusion
- [ ] Query rewrite for common aliases (e.g., "slip" → "slippage")
- [ ] Evaluation harness: golden queries + expected top-k doc IDs

### 3.3 Generation (Future)
- [ ] `/v1/capital/generate-report` — structured LLM-backed briefs
- [ ] Citation format linking back to source docs + scores
- [ ] Streaming response for long reports

---

## Milestone 4: Risk & Analytics

### 4.1 Real-Time Risk
- [ ] Volatility estimation from order book microstructure (spread, depth, imbalance)
- [ ] Funding rate + basis tracking (perp vs spot)
- [ ] Liquidation distance calculator per symbol

### 4.2 Portfolio View
- [ ] Position ingestion (CSV/API) → mark-to-market PnL
- [ ] Greeks approximation for option positions
- [ ] Margin health / liquidation risk dashboard

---

## Milestone 5: UX & Terminal Polish

### 5.1 Layout
- [ ] Responsive breakpoint testing (tablet/vertical monitor)
- [ ] Command palette (⌘K) for quick navigation
- [ ] Persist panel layout to localStorage

### 5.2 Data Density
- [ ] Sparklines in status bar (bid/ask spread, volume)
- [ ] Heatmap toggle for order book depth
- [ ] Export current view as CSV/JSON

### 5.3 Theming
- [ ] High-contrast accessibility mode
- [ ] Monochrome/green-phosphor preset

---

## Technical Debt & Hygiene

| Item | Status |
|---|---|
| Git remote + CI pipeline | ❌ Not started |
| Pre-commit hooks (cargo fmt, eslint, typecheck) | ❌ Not started |
| Dependency audit schedule | ❌ Not started |
| TypeScript strict mode audit | ⚠️ Partial |
| Rust `clippy` + `deny(warnings)` in CI | ❌ Not started |
| Integration test harness (UI + daemon) | ❌ Not started |
| Storybook / component catalog | ❌ Not started |

---

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06-13 | Split `api-types` / `view-types` / `adapters` | Enforces contract boundary; prevents UI leakage into daemon types |
| 2026-06-13 | Tuple `[price, qty]` for `OrderBookLevel` | Matches Rust `(f64, f64)` serde array encoding exactly |
| 2026-06-13 | `local-embeddings` feature flag | Keeps default build fast and dependency-free |
| 2026-06-13 | No `/v1/capital/health` or `/generate-report` until Rust exists | Prevents phantom frontend contracts |
| 2026-06-13 | `ExchangeAdapter` trait with `async-trait` crate | Enables polymorphic exchange adapters while keeping trait object safety |
| 2026-06-13 | `/v1/capital/health` returns `{status, mode, dimensions, model_loaded, uptime_hint}` | Single endpoint covers both mock and local modes without branching |
| 2026-06-13 | View state routing in page.tsx via `useState` union | No router dependency; SWR stays as the only data layer |
| 2026-06-13 | Agent Fleet panel uses inline placeholder data | No backend endpoint exists yet; data schema can stabilize before API contract |

---

## Product Vision (North Star)

**Vantix Oracle** — A local-first, zero-telemetry crypto risk terminal for systematic traders and market makers.

- **Local-first:** No cloud dependencies, no external API keys required for core operation.
- **Deterministic types:** Every byte on the wire is described by a shared contract (`api-types.ts` ↔ Rust structs).
- **Degradable:** Daemon offline → UI stays up, surfaces error state, recovers automatically.
- **Extensible:** Capital RAG spine enables institutional knowledge retrieval without leaving the terminal.

---

## Next Actions (This Sprint)

1. [ ] Initialize git remote, add GitHub Actions CI (lint + typecheck + cargo check/test both features)
2. [ ] Add `cursor` + `limit` pagination to `/v1/capital/search`
3. [ ] Connect Agent Fleet panel to daemon data (live or mock endpoint)
4. [ ] Add connection health metrics to `/health` (WS reconnect count, last message age)
5. [ ] Add pre-commit hooks (husky + cargo fmt + eslint --fix)
6. [ ] Implement structured JSON logging in daemon (tracing + serde_json)