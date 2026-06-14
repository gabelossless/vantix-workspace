---
name: vantix-type-contract
description: Three-layer type boundary pattern for Rust↔TypeScript contract alignment. Use when maintaining api-types.ts, view-types.ts, adapters.ts, or adding new daemon endpoints.
---

# Vantix Type Contract Pattern

The Vantix Oracle enforces a strict four-file type boundary between the Rust daemon and TypeScript UI.

## File Roles

| File | Role | Importable By |
|---|---|---|
| `vantix-ui/src/lib/api-types.ts` | Exact mirror of active Rust JSON contracts — every field, nesting, and encoding must match | `fetcher.ts`, `adapters.ts` |
| `vantix-ui/src/lib/view-types.ts` | UI-only derived models — dashboard state, formatted rows, risk models, system logs | Components only |
| `vantix-ui/src/lib/adapters.ts` | Pure transformation functions from `api-types` to `view-types` | Components only |
| `vantix-ui/src/lib/fetcher.ts` | Typed fetch logic returning `api-types` contracts — SWR-compatible | Components via SWR |

## Rules

1. **Never import `api-types.ts` directly into a component.** Always go through `adapters.ts`.
2. **`view-types.ts` never references `api-types.ts`.** It stands alone — components depend on it, not on wire types.
3. **`adapters.ts` is the only conversion boundary** — one function per mapping.
4. **`api-types.ts` fields must exactly match Rust serde output.** For arrays, use Rust tuple encoding: `OrderBookLevel = [number, number]` matches `(f64, f64)`.
5. **When a daemon endpoint changes, update in this order:** (a) Rust struct, (b) `api-types.ts`, (c) `adapters.ts`, (d) components.
6. **Do not model frontend contracts for routes that don't exist in Rust.** Verify by inspecting Rust structs and router before adding types.

## Adding a New Endpoint

1. Add the Rust request/response structs and route handler
2. Mirror in `api-types.ts`
3. Add fetch function in `fetcher.ts` typed to the new contract
4. Build adapter function in `adapters.ts`
5. Create view model in `view-types.ts` if needed
6. Wire into the component

## Verification

- `npm run build` catches type mismatches between layers
- `cargo check` confirms Rust structs compile
- Spot-check adapter output against raw API responses
