use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

pub type OrderBookLevel = (f64, f64);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderBookSnapshot {
    pub exchange: String,
    pub symbol: String,
    pub bids: Vec<OrderBookLevel>,
    pub asks: Vec<OrderBookLevel>,
    pub timestamp: DateTime<Utc>,
}
