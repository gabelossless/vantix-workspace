# Vantix Daemon

Project path: `C:\Users\Walt & Carter\Documents\Playground\vantix-workspace\vantix-daemon`

## Purpose

Vantix Daemon is the local Rust API and market-data engine for the terminal.

## Stack

- Rust
- Axum
- Tokio
- SQLite
- Binance websocket ingestion

## Runtime

- Default run: `cargo run`
- Local embeddings mode: `cargo run --features local-embeddings`
- Build: `cargo build`
- Test: `cargo test`
- Feature tests: `cargo test --features local-embeddings`

## Local Embeddings

The local embedding loader reads files from:

- `storage/models/embeddings/`

Required files:

- `model.onnx`
- `tokenizer.json`

Optional files:

- `config.json`
- `tokenizer_config.json`
- `special_tokens_map.json`

If required files are missing, the daemon returns structured JSON errors and keeps running.

## HTTP API

The daemon serves:

- `GET /health`
- `GET /orderbook/latest`
- `GET /estimate/slippage?side=buy&notional_usd=50000`
- `GET /estimate/slippage?side=sell&notional_usd=50000`
- `GET /v1/capital/search?q=...&limit=...`
