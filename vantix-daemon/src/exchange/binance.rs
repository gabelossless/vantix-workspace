use crate::exchange::ExchangeAdapter;
use crate::health::AppHealth;
use crate::models::{OrderBookLevel, OrderBookSnapshot};
use async_trait::async_trait;
use chrono::Utc;
use futures_util::StreamExt;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{sleep, Duration};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use tracing::{error, info, warn};

fn parse_levels(levels: &serde_json::Value) -> Vec<OrderBookLevel> {
    let mut parsed = Vec::new();
    let Some(array) = levels.as_array() else {
        return parsed;
    };

    for level in array {
        let Some(items) = level.as_array() else {
            continue;
        };
        let price = items
            .first()
            .and_then(|v| v.as_str())
            .and_then(|s| s.parse::<f64>().ok())
            .unwrap_or(0.0);
        let qty = items
            .get(1)
            .and_then(|v| v.as_str())
            .and_then(|s| s.parse::<f64>().ok())
            .unwrap_or(0.0);
        if price > 0.0 && qty >= 0.0 {
            parsed.push((price, qty));
        }
    }

    parsed
}

pub struct BinanceAdapter {
    connected: Arc<AtomicBool>,
}

impl BinanceAdapter {
    pub fn new() -> Self {
        Self {
            connected: Arc::new(AtomicBool::new(false)),
        }
    }
}

#[async_trait]
impl ExchangeAdapter for BinanceAdapter {
    fn name(&self) -> &'static str {
        "Binance"
    }

    fn health_status(&self) -> String {
        if self.connected.load(Ordering::SeqCst) {
            "connected".to_string()
        } else {
            "disconnected".to_string()
        }
    }

    async fn subscribe_and_stream(
        &self,
        symbol: &str,
        latest_book: Arc<RwLock<Option<OrderBookSnapshot>>>,
        health: Arc<RwLock<AppHealth>>,
    ) {
        let urls = [
            format!(
                "wss://stream.binance.com:9443/ws/{}@depth20@100ms",
                symbol.to_lowercase()
            ),
            format!(
                "wss://data-stream.binance.vision/ws/{}@depth20@100ms",
                symbol.to_lowercase()
            ),
        ];
        let mut backoff = 1u64;

        loop {
            let mut connected = false;

            for url in &urls {
                info!("Connecting to Binance WebSocket: {}", url);
                match connect_async(url).await {
                    Ok((ws_stream, _)) => {
                        info!("Binance WebSocket connected successfully.");
                        connected = true;
                        backoff = 1;
                        self.connected.store(true, Ordering::SeqCst);
                        health.write().await.exchange_connected = true;
                        let (_, mut read) = ws_stream.split();

                        while let Some(msg) = read.next().await {
                            match msg {
                                Ok(Message::Text(data)) => {
                                    if let Ok(parsed) =
                                        serde_json::from_str::<serde_json::Value>(&data)
                                    {
                                        let bids = parse_levels(&parsed["bids"]);
                                        let asks = parse_levels(&parsed["asks"]);

                                        let snapshot = OrderBookSnapshot {
                                            exchange: "BINANCE".to_string(),
                                            symbol: symbol.to_uppercase(),
                                            bids,
                                            asks,
                                            timestamp: Utc::now(),
                                        };
                                        *latest_book.write().await = Some(snapshot);
                                        health.write().await.last_trade_time =
                                            Some(chrono::Utc::now());
                                    }
                                }
                                Ok(Message::Ping(_)) | Ok(Message::Pong(_)) => {}
                                Ok(Message::Binary(_)) => {}
                                Ok(Message::Frame(_)) => {}
                                Ok(Message::Close(_)) => {
                                    warn!("Binance WebSocket closed.");
                                    break;
                                }
                                Err(err) => {
                                    error!("Binance WebSocket read error: {}", err);
                                    break;
                                }
                            }
                        }

                        self.connected.store(false, Ordering::SeqCst);
                        health.write().await.exchange_connected = false;
                    }
                    Err(err) => {
                        error!("Binance WebSocket connection failed: {}", err);
                    }
                }
            }

            if !connected {
                warn!("All Binance websocket hosts failed; retrying with backoff.");
            }
            sleep(Duration::from_secs(backoff)).await;
            backoff = std::cmp::min(backoff * 2, 60);
        }
    }
}
