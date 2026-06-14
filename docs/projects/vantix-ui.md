# Vantix UI

Project path: `./vantix-ui`

## Purpose

Vantix UI is the local-first crypto risk terminal frontend.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- SWR

## Runtime

- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

## Daemon Dependency

The UI expects the local daemon at:

- `http://127.0.0.1:8787`

Endpoints used by the UI:

- `GET /health`
- `GET /orderbook/latest`
- `GET /estimate/slippage?side=buy&notional_usd=50000`
- `GET /estimate/slippage?side=sell&notional_usd=50000`
- `GET /v1/capital/search?q=...&limit=...`

## Type Boundary

- `src/lib/api-types.ts`: exact active Rust request and response contracts.
- `src/lib/view-types.ts`: derived dashboard state, formatted rows, risk models, and logs.
- `src/lib/adapters.ts`: pure transformations from daemon contracts to UI view models.
- `src/lib/types.ts`: re-export barrel for compatibility.
- `src/lib/fetcher.ts`: daemon and app-route fetch logic returning API contract types.

The current Rust daemon does not expose `/v1/capital/health` or
`/v1/capital/generate-report`. Do not model those as live contracts until their
Rust routes and structs exist.

## Notes

- The UI polls the daemon.
- The daemon does not push data to the UI.
- The layout is dark mode only and intentionally avoids decorative effects.
