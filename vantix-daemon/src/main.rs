mod api;
mod capital;
mod exchange;
mod health;
mod fleet;
mod models;
mod risk;
mod slippage;
mod storage;

use exchange::ExchangeAdapter;
use std::sync::Arc;
use tokio::sync::RwLock;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_target(true)
        .with_line_number(true)
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".parse().expect("valid default log level")),
        )
        .json()
        .init();

    let symbol = std::env::var("VANTIX_SYMBOL").unwrap_or_else(|_| "btcusdt".to_string());
    let bind_addr = std::env::var("VANTIX_BIND").unwrap_or_else(|_| "127.0.0.1:8787".to_string());
    let db_path = std::env::var("VANTIX_DB").unwrap_or_else(|_| "vantix_market.db".to_string());

    tracing::info!("Booting Vantix Spine for {}", symbol.to_uppercase());
    let _pool = storage::db::init_db(&db_path).await?;
    tracing::info!("SQLite initialized successfully.");

    let latest_book = Arc::new(RwLock::new(None));
    let capital = Arc::new(capital::CapitalSearchService::from_model_dir(
        "storage/models/embeddings",
    )?);
    let health = Arc::new(RwLock::new(health::AppHealth::new()));

    let binance_symbol = symbol.clone();
    let binance_book = latest_book.clone();
    let binance_health = health.clone();
    let binance = exchange::binance::BinanceAdapter::new();
    tokio::spawn(async move {
        binance
            .subscribe_and_stream(&binance_symbol, binance_book, binance_health)
            .await;
    });

    let mock_symbol = symbol.clone();
    let mock_book = latest_book.clone();
    let mock_health = health.clone();
    let mock = exchange::mock_exchange::MockExchange::new();
    tokio::spawn(async move {
        mock.subscribe_and_stream(&mock_symbol, mock_book, mock_health)
            .await;
    });

    let state = Arc::new(api::AppState {
        latest_book,
        capital,
        health,
        boot_time: chrono::Utc::now(),
    });

    api::serve_api(state, &bind_addr).await;
    Ok(())
}
