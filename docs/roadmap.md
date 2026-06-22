# Vantix Roadmap

Workspace: `./` (project root)
Last updated: June 21, 2026

---

## Milestone 1: Unified Type Validation ✅ COMPLETE

**Goal:** Synchronize TypeScript UI types with Rust daemon contract structs.

**Delivered:**
- `api-types.ts` — exact mirror of active Rust JSON contracts (11 types)
- `view-types.ts` — UI-only derived models (10 types: dashboard, risk, fleet, logs)
- `adapters.ts` — 5 pure transformation functions from daemon contracts to UI view models
- `fetcher.ts` — typed fetcher with 5 error kinds, timeout handling, slippage fallback
- `types.ts` — compatibility barrel re-exporting both layers

**Verification:**
- `npm run lint` ✅
- `npm run build` ✅ (Next.js 16.2.9, Turbopack)
- `cargo check` ✅ (default mode, no model assets required)
- `cargo check --features local-embeddings` ✅
- `cargo test` ✅
- `cargo test --features local-embeddings` ✅

---

## Milestone 2: Exchange Adapter System ✅ COMPLETE

**Goal:** Decouple hardcoded Binance feed into a modular Exchange Cartridge system.

**Delivered:**
- `ExchangeAdapter` trait in `src/exchange/mod.rs` with `subscribe_and_stream`, `name`, `health_status`
- `BinanceAdapter` refactored to implement the trait, with `AtomicBool` connection tracking and exponential backoff reconnection
- `MockExchange` new adapter generating varied order book data every 500ms with cycling offset
- Both adapters spawned concurrently in `src/main.rs` via `tokio::spawn`

**Known Issue — Orphaned Mock Data:**
MockExchange writes to its own `mock_book` `Arc<RwLock>` that is never wired into `AppState`. The `/orderbook/latest` endpoint only returns Binance data. When Binance is disconnected, the API returns 503 even though mock data is running. Fix: merge mock data into `latest_book` when Binance is disconnected, or alternate between feeds.

---

## Milestone 3: Capital Health & Observability

### 3.1 ✅ Capital Health Route
- `GET /v1/capital/health` returns `{status, mode, dimensions, model_loaded, uptime_hint}`
- Works in mock, local-loaded, and local-degraded states
- TypeScript `CapitalHealth` interface in `api-types.ts`

### 3.2 ✅ Model Documentation
- "Sourcing Models" section in `MODELS.md` with `optimum-cli` / `transformers.js` export steps

### 3.3 ✅ Structured JSON Logging
- `tracing_subscriber::fmt().json()` configured in `main.rs`
- Trace events at info/warn/error levels across adapter lifecycle, health checks, capital searches
- Env-filter support via `RUST_LOG`

### 3.4 ✅ Connection Health Metrics in `/health`
- `/health` now returns `exchange_connected`, `last_trade_message_age_secs`, `adapters_running`
- `AppHealth` shared state updated by adapters on connection/disconnection/message

### 3.5 Capital Search Enhancement
- [ ] Wire UI proxy route and component for `/v1/capital/search` (type contracts exist, UI lacks fetch/display)
- [ ] Wire UI proxy route for `/v1/capital/health` (type contract exists)
- [ ] Add source filtering (e.g., `source=capital_brief`)
- [ ] Add score threshold parameter
- [ ] Benchmark mock vs local-embeddings latency

### 3.6 Embeddings & Model Loading
- [ ] Cache tokenizer + session to avoid re-load on each request
- [ ] Model cache warming on startup with health-reported status

### 3.7 Order Book Resilience
- [ ] Fix orphaned mock data — merge into shared `latest_book` as fallback
- [ ] Implement backpressure for stale order book snapshots
- [ ] Add sequence/gap detection for Binance depth stream

### 3.8 Observability (Remaining)
- [ ] `/metrics` endpoint (Prometheus format) for latency, error rates, queue depths
- [ ] Correlation IDs propagated from UI → daemon → Binance WS

---

## Milestone 4: Narrative Engine & Agent Fleet ✅ COMPLETE

**Goal:** Scaffold new dashboard panels and wire sidebar navigation.

**Delivered:**
- `NarrativeEnginePanel.tsx` — Dense table log viewer with timestamp, level badge, title, detail columns
- `AgentFleetPanel.tsx` — Grid of 8 AI worker cards with status, last active, tasks completed
- `Sidebar.tsx` — 6-section nav with active state highlighting and index numbering
- `page.tsx` — `ViewState` union, conditional panel rendering, view switching via sidebar

**Data Status:**
- Narrative Engine: Wired to local `SystemLogEntry[]` state — working
- Agent Fleet: Wired to daemon `/v1/agent-fleet` and rendered in `AgentFleetPanel` — fallback only when offline

---

## Milestone 5: Capital RAG Spine

### 5.1 Knowledge Base
- [ ] Ingest Markdown/JSON capital briefs into SQLite FTS5 or Tantivy
- [ ] Add document versioning and hash-based change detection
- [ ] Build embedding index build script (offline, CI-friendly)

### 5.2 Search Quality
- [ ] Hybrid search: keyword (FTS) + vector (ONNX embeddings) with reciprocal rank fusion
- [ ] Query rewrite for common aliases (e.g., "slip" → "slippage")
- [ ] Evaluation harness: golden queries + expected top-k doc IDs

### 5.3 Generation (Future)
- [ ] `/v1/capital/generate-report` — structured LLM-backed briefs
- [ ] Citation format linking back to source docs + scores
- [ ] Streaming response for long reports

---

## Milestone 6: Real-Time Risk & Analytics

### 6.1 Risk From Order Book
- [ ] Volatility estimation from order book microstructure (spread, depth, imbalance)
- [ ] Funding rate + basis tracking (perp vs spot)
- [ ] Liquidation distance calculator per symbol

### 6.2 Portfolio View
- [ ] Position ingestion (CSV/API) → mark-to-market PnL
- [ ] Greeks approximation for option positions
- [ ] Margin health / liquidation risk dashboard

### 6.3 Risk Infrastructure
- [ ] Dedicated risk endpoint in daemon (`GET /v1/risk`)
- [ ] Replace client-side `RiskSnapshot` heuristics with daemon-sourced risk data
- [ ] Risk model trait + implementations (like `ExchangeAdapter`)

---

## Milestone 7: UX & Terminal Polish

### 7.1 Layout
- [ ] Add `loading.tsx`, `error.tsx`, `not-found.tsx` boundary files
- [ ] Command palette (⌘K) for quick navigation
- [ ] Persist active view to localStorage
- [ ] Responsive breakpoint testing (tablet/vertical monitor)

### 7.2 Data Density
- [ ] Sparklines in status bar (bid/ask spread, volume)
- [ ] Heatmap toggle for order book depth
- [ ] Export current view as CSV/JSON

### 7.3 Theming
- [ ] High-contrast accessibility mode
- [ ] Monochrome/green-phosphor preset

---

## Milestone 8: Agent Fleet Backend

### 8.1 Daemon Endpoint
- [x] Implement `GET /v1/agent-fleet` returning agent roster data from `src/fleet.rs`
- [x] Wire TypeScript contracts in `api-types.ts`
- [x] Add adapter in `adapters.ts` converting daemon rows into view models

### 8.2 Agent Telemetry
- [ ] Agent status lifecycle (active/idle/offline)
- [ ] Task completion tracking with timestamps
- [ ] Agent health reporting

---

## Milestone 9: External Skill Bridges (Future)

### 9.1 Binance AI Agent Skills Evaluation
- [ ] Evaluate Binance's announced AI Agent Skills as an optional external adapter surface
- [ ] Map `Binance Spot Skill` to a quarantined execution bridge, not the core daemon path
- [ ] Reuse the local-first risk model and require explicit operator confirmation for all remote execution
- [ ] Define a minimal MCP or HTTP contract for wallet / token / market-data skill calls

### 9.2 Integration Guardrails
- [ ] Keep Binance skill usage behind a feature flag or separate process boundary
- [ ] Preserve daemon-owned market data and risk as the source of truth
- [ ] Add audit logging for any remote skill invocation or trade action

---

## Technical Debt & Hygiene

| Item | Status |
|---|---|
| Git remote (GitHub) | ✅ Done |
| GitHub Actions CI pipeline | ✅ Done (daemon: fmt+check+test, UI: lint+build) |
| Pre-commit hooks (cargo fmt, npm lint) | ✅ Done (husky) |
| `.gitignore` for runtime artifacts | ✅ Done (logs, db, env) |
| `.gitattributes` for line endings | ✅ Done |
| Path sanitization (absolute→relative) | ✅ Done |
| `.opencode/skills/` project skills | ✅ Done (5 skills) |
| `.opencode/agents/` refined configs | ✅ Done (8 agents) |
| Dynamic agent fleet endpoint | ✅ Done |
| Risk endpoint in daemon | ✅ Done |
| Capital search UI integration | ✅ Done |
| `/metrics` endpoint | ❌ Not started |
| Correlation IDs | ❌ Not started |
| `cargo clippy` in CI | ✅ Done |
| Rust `deny(warnings)` in CI | ❌ Not started |
| Dependency audit (`cargo audit` / `npm audit`) | ⚠️ Partial |
| TypeScript strict mode audit | ⚠️ Partial |
| Integration test harness (UI + daemon) | ❌ Not started |
| Storybook / component catalog | ❌ Not started |
| Self-host fonts (remove Google Fonts dep) | ❌ Not started |

---

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06-13 | Split `api-types` / `view-types` / `adapters` | Enforces contract boundary; prevents UI leakage into daemon types |
| 2026-06-13 | Tuple `[price, qty]` for `OrderBookLevel` | Matches Rust `(f64, f64)` serde array encoding exactly |
| 2026-06-13 | `local-embeddings` feature flag | Keeps default build fast and dependency-free |
| 2026-06-13 | `ExchangeAdapter` trait with `async-trait` crate | Enables polymorphic exchange adapters while keeping trait object safety |
| 2026-06-13 | View state routing in page.tsx via `useState` union | No router dependency; SWR stays as the only data layer |
| 2026-06-13 | Agent Fleet panel uses inline placeholder data | No backend endpoint exists yet; data schema can stabilize before API contract |
| 2026-06-14 | Orphaned mock data is a bug, not a feature | Mock should write to `latest_book` so `/orderbook/latest` works when Binance is down |
| 2026-06-14 | Skills registry as `.opencode/skills/` with SKILL.md | Follows opencode skill convention; agents load relevant skills via `skill` tool |
| 2026-06-21 | Five milestone tracks renumbered for clarity | M3→M4 (Narrative/Fleet) done; M3 split into Capital+Risk+Agent Fleet milestones |
| 2026-06-21 | `GET /v1/risk` moved to daemon-sourced microstructure analysis | Replaces client-only heuristics with a shared risk contract |
| 2026-06-21 | `GET /v1/agent-fleet` added to daemon and UI | Fleet panel now renders configured agent roster from the daemon |
| 2026-06-21 | Capital search UI wired to daemon endpoints | Capital health and search are now reachable through `/api/v1/capital/*` |
| 2026-06-21 | Binance AI Agent Skills are an external bridge, not core infra | Keep local-first daemon ownership of data/risk; evaluate remote skills only behind opt-in boundaries |

---

## Product Vision (North Star)

**Vantix Oracle** — A local-first, zero-telemetry crypto risk terminal for systematic traders and market makers.

- **Local-first:** No cloud dependencies, no external API keys required for core operation.
- **Deterministic types:** Every byte on the wire is described by a shared contract (`api-types.ts` ↔ Rust structs).
- **Degradable:** Daemon offline → UI stays up, surfaces error state, recovers automatically.
- **Extensible:** Capital RAG spine enables institutional knowledge retrieval without leaving the terminal.

---

## Next Actions (This Sprint)

### Priority 1 — Agent Telemetry (M8.2)
- [ ] Add agent status lifecycle events (active / idle / offline)
- [ ] Track task completion counts and last-active timestamps from the orchestrator
- [ ] Surface agent health and uptime in the fleet endpoint

### Priority 2 — Observability
- [ ] Add `/metrics` endpoint (Prometheus format) for latency, error rates, queue depths
- [ ] Propagate correlation IDs from UI → daemon → exchange WS

### Priority 3 — Capital Search Quality
- [ ] Add source filtering (e.g., `source=capital_brief`)
- [ ] Add score threshold parameter
- [ ] Benchmark mock vs local-embeddings latency

### Priority 4 — Risk Maturation
- [ ] Add volatility estimation from order book microstructure
- [ ] Track funding rate + basis
- [ ] Add liquidation distance calculator per symbol

### Priority 5 — CI / UX Hardening
- [ ] Add `cargo deny` / `cargo audit` coverage
- [ ] Add Rust `deny(warnings)` to CI
- [ ] Self-host fonts to remove Google Fonts dependency

### Priority 6 — External Skill Bridge Evaluation
- [ ] Review Binance AI Agent Skills against Vantix trust boundaries
- [ ] Decide whether to support remote execution skills as an optional adapter
- [ ] If adopted, define the smallest possible integration surface and audit trail
