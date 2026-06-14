use chrono::{DateTime, Utc};

pub struct AppHealth {
    pub exchange_connected: bool,
    pub last_trade_time: Option<DateTime<Utc>>,
    pub adapters_running: usize,
}

impl AppHealth {
    pub fn new() -> Self {
        Self {
            exchange_connected: false,
            last_trade_time: None,
            adapters_running: 2,
        }
    }
}
