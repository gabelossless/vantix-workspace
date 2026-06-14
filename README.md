# Vantix Workspace

Workspace root: `./` (project root)

This workspace contains two projects:

- `vantix-ui` at `./vantix-ui`
- `vantix-daemon` at `./vantix-daemon`

## Documentation

See the consolidated docs index:

- [`docs/README.md`](docs/README.md)

## Project Notes

- The UI is a Next.js App Router app that talks to the local daemon.
- The daemon is the Rust service that serves market data, slippage, and capital search endpoints.

## Agent Board

- [`docs/agent-board.md`](docs/agent-board.md) — AGI / crypto / revenue agent organizational structure
- `.opencode/agents/` — opencode agent configs for the R&D product team (8 agents, orchestrator as default)
- `.opencode/opencode.json` — project-level opencode config routing to orchestrator

## Sprint 1 Complete

- Exchange Adapter trait + MockExchange adapter implemented
- `/v1/capital/health` route live — reports mock/local/degraded state
- Model sourcing documented in `MODELS.md`
- Narrative Engine + Agent Fleet panels scaffolded with sidebar view switching
- All builds and tests pass in both default and local-embeddings modes
