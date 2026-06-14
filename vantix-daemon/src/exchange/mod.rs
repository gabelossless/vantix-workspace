pub mod binance;
pub mod mock_exchange;

use crate::health::AppHealth;
use crate::models::OrderBookSnapshot;
use async_trait::async_trait;
use std::sync::Arc;
use tokio::sync::RwLock;

#[async_trait]
pub trait ExchangeAdapter: Send + Sync {
    async fn subscribe_and_stream(
        &self,
        symbol: &str,
        state: Arc<RwLock<Option<OrderBookSnapshot>>>,
        health: Arc<RwLock<AppHealth>>,
    );

    fn name(&self) -> &'static str;

    fn health_status(&self) -> String;
}
