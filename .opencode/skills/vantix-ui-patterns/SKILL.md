---
name: vantix-ui-patterns
description: Next.js terminal UI patterns — SWR fetching, adapter-based data flow, brutalist styling, sidebar view switching, offline resilience. Use when working on vantix-ui/src/.
---

# Vantix UI Patterns

## Data Flow

```
Daemon HTTP → fetcher.ts (typed fetch) → api-types.ts → adapters.ts → view-types.ts → Component
```

- **fetcher.ts**: Wraps `fetch()` with type safety, returns `api-types` contracts. Works with SWR.
- **adapters.ts**: Pure functions that transform daemon contracts into view-ready models.
- **view-types.ts**: UI-only types — never references `api-types.ts`.

## SWR Data Fetching

Use SWR custom hooks per resource:

```typescript
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { HealthStatus } from '@/lib/api-types';

export function useHealth() {
  return useSWR<HealthStatus>('/api/health', fetcher, {
    refreshInterval: 5000,
    onError: () => {}, // silent fail — UI shows error state
  });
}
```

Rules:
- `refreshInterval` for polling (daemon doesn't push)
- `onError` handler must never throw — log and let the UI show degraded state
- Components destructure `{ data, error, isLoading }` and render all three states

## Brutalist Terminal Styling

```typescript
// tailwind.config.ts
colors: {
  terminal: {
    bg: '#070809',
    surface: '#0e1011',
    border: 'rgba(255,255,255,0.08)',
    text: '#c8c8c8',
    muted: '#666',
    accent: '#e8e8e8',
    green: '#4ade80',
    red: '#f87171',
    yellow: '#fbbf24',
  }
}
```

- Background: `#070809` — near-black
- Borders: `white/10` — thin, subtle
- Font: `font-mono` everywhere
- No gradients, glassmorphism, box shadows, animations, or decorative visuals
- Every pixel carries information — dense data panels

## Sidebar View Switching

View state is managed via `useState<ViewState>` in `page.tsx`:

```typescript
type ViewState = 'overview' | 'orderbook' | 'slippage' | 'narrative' | 'fleet' | 'logs';
```

- No router dependency — `<Sidebar activeView={view} onViewChange={setView} />`
- Conditional rendering in page body: `{view === 'orderbook' && <OrderBookDepth />}`
- Each panel is independently loaded with its own SWR hooks

## Offline Resilience

- All SWR hooks have fallback values for when daemon is offline
- Status bar shows connection state via `/health` poll
- Panels render empty/error state when `error` is set in SWR return
- Lint and build must pass without a running daemon

## Adding a New Panel

1. Define view model in `view-types.ts`
2. If daemon data needed, add/verify contract in `api-types.ts`
3. Add adapter function in `adapters.ts`
4. Create SWR hook or use `useState` for local data
5. Create panel component in `src/components/`
6. Add to `ViewState` union and wire in `page.tsx`
