use crate::exchange::ExchangeAdapter;
use crate::health::AppHealth;
use crate::models::OrderBookSnapshot;
use async_trait::async_trait;
use chrono::Utc;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{sleep, Duration};
use tracing::info;

pub struct MockExchange;

impl MockExchange {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl ExchangeAdapter for MockExchange {
    fn name(&self) -> &'static str {
        "Mock"
    }

    fn health_status(&self) -> String {
        "ok".to_string()
    }

    async fn subscribe_and_stream(
        &self,
        symbol: &str,
        state: Arc<RwLock<Option<OrderBookSnapshot>>>,
        health: Arc<RwLock<AppHealth>>,
    ) {
        info!("Starting Mock exchange feed for {}", symbol);
        let mut iteration = 0u64;

        loop {
            let offset = (iteration % 20) as f64 / 2.0;
            let num_levels = 5 + (iteration % 6) as usize;
            let mut bids = Vec::with_capacity(num_levels);
            let mut asks = Vec::with_capacity(num_levels);

            for j in 0..num_levels {
                bids.push((100.0 - offset - j as f64 * 0.5, (num_levels - j) as f64));
                asks.push((101.0 + offset + j as f64 * 0.5, (num_levels - j) as f64));
            }

            let snapshot = OrderBookSnapshot {
                exchange: "MOCK".to_string(),
                symbol: symbol.to_uppercase(),
                bids,
                asks,
                timestamp: Utc::now(),
            };

            *state.write().await = Some(snapshot);

            {
                let mut h = health.write().await;
                h.last_trade_time = Some(chrono::Utc::now());
            }

            iteration += 1;
            sleep(Duration::from_millis(500)).await;
        }
    }
}
