# Vantix Oracle

Vantix Oracle is a local-first crypto risk terminal built with Next.js App Router, TypeScript, Tailwind CSS, and SWR.

Project path: `C:\Users\Walt & Carter\Documents\Playground\vantix-workspace\vantix-ui`

It proxies a Rust daemon at `http://127.0.0.1:8787` and presents:

- Top status bar
- Left navigation sidebar
- Market overview
- Order book depth
- Depth imbalance
- Slippage estimator
- Risk snapshot
- System logs

## Requirements

- Node.js 20.9 or newer
- Rust daemon running at `http://127.0.0.1:8787`

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open the app in your browser at the local URL printed by Next.js.

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Daemon endpoints

The app expects the Rust daemon to expose:

- `GET /health`
- `GET /orderbook/latest`
- `GET /estimate/slippage?side=buy&notional_usd=50000`

The Next.js app uses same-origin route handlers under `/api/*` to proxy those endpoints safely from the browser.

## Type contracts

- `src/lib/api-types.ts` mirrors the active Rust JSON contracts exactly.
- `src/lib/view-types.ts` contains UI-only derived models.
- `src/lib/adapters.ts` converts API payloads into dashboard view models.
- `src/lib/fetcher.ts` validates and returns daemon contract types.

The current daemon has a capital search route, but it does not yet expose
capital health or report-generation routes.

## Notes

- The UI is dark mode only.
- The layout intentionally avoids gradients, glass effects, decorative visuals, and heavy motion.
- If the daemon is offline, the terminal stays up and surfaces the error state in the status bar and logs.
- Workspace docs live in [`../docs/README.md`](../docs/README.md).
