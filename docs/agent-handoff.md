# Vantix Agent Handoff

Workspace path: `./` (project root — Vantix workspace)

Use this document as the first stop for any new coding agent joining the Vantix workspace.

## Project Map

- `vantix-ui` at `./vantix-ui`
- `vantix-daemon` at `./vantix-daemon`
- Workspace docs at `./docs`

## Read First

- [`../README.md`](../README.md)
- [`README.md`](README.md)
- [`projects/vantix-ui.md`](projects/vantix-ui.md)
- [`projects/vantix-daemon.md`](projects/vantix-daemon.md)
- [`../vantix-ui/AGENTS.md`](../vantix-ui/AGENTS.md)
- [`../vantix-ui/CLAUDE.md`](../vantix-ui/CLAUDE.md)
- [`../vantix-daemon/MODELS.md`](../vantix-daemon/MODELS.md)

## Current State

- The workspace has two active projects: a Next.js UI and a Rust daemon.
- The UI is a dark, institutional crypto risk terminal.
- The UI polls the daemon. The daemon does not push data to the UI.
- The daemon serves market data, slippage estimates, and capital search endpoints.
- Daemon JSON contracts are isolated in `vantix-ui/src/lib/api-types.ts`.
- Dashboard-only models are isolated in `vantix-ui/src/lib/view-types.ts`.
- `vantix-ui/src/lib/adapters.ts` is the explicit conversion boundary between those layers.
- `vantix-ui/src/lib/types.ts` is a compatibility re-export barrel only.
- Mock embedding mode is still the default.
- Real local embeddings are behind the `local-embeddings` feature flag.
- Missing embedding model files must return structured JSON errors, not crashes.

## Last Verified

Verified locally on June 13, 2026 (sprint 1):

- `cmd /c npm run lint`: passed.
- `cmd /c npm run build`: passed.
- `cargo fmt --check`: passed.
- `cargo check`: passed (1 warning: `name`/`health_status` unused — expected before /health extension).
- `cargo check --features local-embeddings`: passed.
- `cargo test`: passed (2 tests).
- `cargo test --features local-embeddings`: passed (3 tests — includes `local_mode_reports_missing_model_files`).

The production UI build requires network access while the existing
`next/font` Google font imports are present.

Git note: `vantix-workspace` is currently an untracked folder in the parent
`Playground` repository. All files are saved locally, but they are not committed
or backed up to a remote repository.

Sprint 1 deliverables: Exchange Adapter trait + MockExchange, `/v1/capital/health` route, model sourcing docs, Narrative Engine + Agent Fleet panels, sidebar view switching.

## Verified API Contract

Active Rust routes:

- `GET /health` returns `HealthStatus`.
- `GET /orderbook/latest` returns tuple levels as `[price, quantity]`.
- `GET /estimate/slippage` returns snake_case `SlippageEstimate` fields.
- `GET /v1/capital/search` returns `CapitalSearchResponse` or `CapitalErrorBody`.
- `GET /v1/capital/health` returns `CapitalHealth` `{status, mode, dimensions, model_loaded, uptime_hint}`.

Not implemented in the current daemon:

- `/v1/capital/generate-report`

Do not add frontend wire contracts for absent routes based only on stale prompts. Inspect the Rust structs and router before changing `api-types.ts`.

## Exchange Adapter System

The daemon now uses a modular `ExchangeAdapter` trait in `src/exchange/mod.rs`:

- `BinanceAdapter` — real WebSocket feed
- `MockExchange` — generates varied mock data every 500ms

Both are spawned concurrently in `src/main.rs`. New exchanges implement the trait and register in the router.

## Dashboard Panels

The UI now supports view switching via sidebar:

| View | Component | Data Source |
|---|---|---|
| Overview | dashboard panels (existing) | SWR → daemon |
| Order Book | OrderBookDepth | SWR → daemon `/orderbook/latest` |
| Slippage | SlippageEstimator | SWR → daemon `/estimate/slippage` |
| Narrative | NarrativeEnginePanel | Local `SystemLogEntry[]` state |
| Fleet | AgentFleetPanel | Placeholder data (no backend yet) |
| Logs | SystemLogs | Local `SystemLogEntry[]` state |

View state is managed via `useState<ViewState>` in `page.tsx` — no router dependency.

## Runtime Commands

### Vantix UI

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`

### Vantix Daemon

- `cargo run`
- `cargo run --features local-embeddings`
- `cargo test`
- `cargo test --features local-embeddings`
- `cargo check`
- `cargo check --features local-embeddings`

## Daemon Model Layout

Local embedding files must live at:

- `vantix-daemon/storage/models/embeddings/model.onnx`
- `vantix-daemon/storage/models/embeddings/tokenizer.json`

Optional files:

- `vantix-daemon/storage/models/embeddings/config.json`
- `vantix-daemon/storage/models/embeddings/tokenizer_config.json`
- `vantix-daemon/storage/models/embeddings/special_tokens_map.json`

## Senior Workflow Rules

- Do not fabricate test results or runtime status.
- Confirm the actual project path before editing.
- Prefer existing source files and docs over creating parallel copies.
- Use `apply_patch` for edits.
- Keep changes small, mechanical, and easy to review.
- If a feature flag changes behavior, test both default and feature builds.
- If a daemon or dev server is already running, confirm whether it is the latest process before trusting its output.
- If a command fails because of sandboxing or permissions, escalate only when needed.

## Sync Rules

- Update docs whenever architecture, run commands, file placement, or runtime behavior changes.
- Keep `README.md` and this handoff document in sync with the actual code.
- If a new project folder appears, add it to the project map and the docs index.
- If the daemon API changes, update both the UI README and the daemon model/API docs.
- Keep fetchers typed to `api-types.ts`; transform data through adapters before passing it to panels.
- Never place formatted metrics, panel props, or log models in `api-types.ts`.

## Verification Checklist

- UI builds and lints cleanly.
- Daemon builds and tests cleanly in both default and feature-flagged modes.
- `/health` returns the online state expected by the UI.
- `/orderbook/latest` returns data without crashing the daemon.
- `/estimate/slippage` works for buy and sell paths.
- `/v1/capital/search` works in mock mode and local-embeddings mode.
- Missing model files yield a structured JSON error body.

## Agent Board

The workspace defines an agent organizational structure in:

- [`docs/agent-board.md`](agent-board.md) — Full org chart, roles, and charters
- `.opencode/agents/` — Executable agent configs for opencode

### Orchestrator (Default)
| Agent | Config | Role |
|---|---|---|
| Orchestrator | `.opencode/agents/orchestrator.md` | Primary dispatcher — routes work to specialist agents |

### Executives
| Agent | Config |
|---|---|
| CEO Agent | `.opencode/agents/ceo.md` |
| CTO Agent | `.opencode/agents/cto.md` |

### R&D Product Team
| Agent | Config | Domain |
|---|---|---|
| Protocol Engineer | `.opencode/agents/protocol-engineer.md` | Exchange adapters, market data |
| Risk Quant | `.opencode/agents/risk-quant.md` | Slippage, volatility, risk |
| Capital RAG Engineer | `.opencode/agents/capital-rag-engineer.md` | Knowledge retrieval, embeddings |
| Terminal UX Engineer | `.opencode/agents/terminal-ux-engineer.md` | Panels, data viz, interaction |
| Data Pipeline Engineer | `.opencode/agents/data-pipeline-engineer.md` | Storage, streaming, observability |

### Board of Agents (Strategic Oversight)
AGI Strategist, Crypto Market Lead, Revenue Architect, Risk & Compliance Officer, Systems Architect — documented in `docs/agent-board.md`.

## Notes For Future Work

- Keep the terminal UI dense and serious.
- Avoid gradients, glassmorphism, decorative visuals, and heavy motion.
- Keep the daemon resilient. Offline or partial failure should degrade cleanly.
- If you add a new feature area, write the docs before handing it off.
- Route backend work (exchange adapters, capital search) to Protocol Engineer and Capital RAG Engineer.
- Route frontend work (panels, view models) to Terminal UX Engineer through the adapter pattern.
