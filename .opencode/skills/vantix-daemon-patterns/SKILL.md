---
name: vantix-daemon-patterns
description: Rust daemon architecture patterns — ExchangeAdapter trait, feature flags, health system, structured logging, AppHealth shared state. Use when working on vantix-daemon/src/.
---

# Vantix Daemon Patterns

## Exchange Adapter Trait

All exchange connectors implement the `ExchangeAdapter` trait in `src/exchange/mod.rs`:

```rust
#[async_trait]
pub trait ExchangeAdapter: Send + Sync {
    fn name(&self) -> &'static str;
    fn health_status(&self) -> bool;
    async fn subscribe_and_stream(
        self: Box<Self>,
        symbol: String,
        tx: mpsc::UnboundedSender<OrderBookLevel>,
        shutdown: CancellationToken,
    );
}
```

### Adding a New Exchange
1. Create `src/exchange/<name>.rs` with a struct implementing `ExchangeAdapter`
2. Register in `src/exchange/mod.rs` (pub mod + re-export)
3. Spawn in `src/main.rs` via `tokio::spawn`
4. Wire into the shared `Arc<OrderBookState>` via the channel receiver

### Patterns
- **BinanceAdapter**: Real WebSocket feed with `tokio_tungstenite`, `AtomicBool` connection tracking, reconnection loop
- **MockExchange**: Generates synthetic order book data every 500ms with varying price/quantity
- Both adapters run concurrently via `tokio::spawn` — the `mpsc::UnboundedSender` fans into a shared `tokio::sync::broadcast`

### Guardrails
- Every adapter must degrade gracefully: log errors, never crash the daemon
- Use `CancellationToken` for graceful shutdown
- Connection health tracked via `AtomicBool` or `AppHealth`

## Feature Flags

Use Rust `[features]` in `Cargo.toml` for optional dependencies:

```toml
[features]
local-embeddings = ["ort", "tokenizers"]
```

Pattern:
- Default build is fast and dependency-free
- Feature flag guards only the `mod` declaration and conditional compilation blocks
- Flagged code paths return structured JSON errors when deps are unavailable

## AppHealth Shared State

Defined in `src/health.rs`:

```rust
pub struct AppHealth {
    pub exchange_connected: Arc<AtomicBool>,
    pub last_trade_message: Arc<Mutex<Instant>>,
    pub adapters_running: Arc<AtomicU32>,
}
```

- `AppHealth` is constructed in `main.rs` and cloned into adapter spawns and route handlers
- Route handlers read health state to populate `/health` response
- Adapters update health state on connection/disconnection and each message

## Structured Logging

Initialized in `main.rs`:

```rust
tracing_subscriber::fmt()
    .json()
    .with_max_level(tracing::Level::INFO)
    .init();
```

Key events to trace at appropriate levels:
- `info!` — lifecycle events (startup, adapter spawn, route registered)
- `warn!` — recoverable failures (reconnection, stale data)
- `error!` — unrecoverable failures that keep the daemon running
- `debug!` — per-message data (depth updates, health check responses)

## Route Registration

Routes are registered in `src/api.rs` using Axum's Router:

```rust
let app = Router::new()
    .route("/health", get(health_handler))
    .route("/orderbook/latest", get(orderbook_latest))
    .route("/estimate/slippage", get(slippage_estimate));
```

Shared state is passed via Axum's `State` extractor using `Arc<T>`.
