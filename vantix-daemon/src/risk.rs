use crate::models::OrderBookSnapshot;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct RiskSnapshot {
    pub volatility_status: String,
    pub liquidity_risk: String,
    pub spread_risk: String,
    pub depth_risk: String,
    pub data_freshness: String,
}

fn classify_spread_risk(spread_bps: f64) -> String {
    if spread_bps > 15.0 {
        "High".to_string()
    } else if spread_bps > 5.0 {
        "Moderate".to_string()
    } else {
        "Low".to_string()
    }
}

fn classify_depth_risk(bid_depth_usd: f64, ask_depth_usd: f64) -> String {
    let total = bid_depth_usd + ask_depth_usd;
    if total == 0.0 {
        return "High".to_string();
    }
    let imbalance = ((bid_depth_usd - ask_depth_usd) / total * 100.0).abs();
    if imbalance > 25.0 {
        "High".to_string()
    } else if imbalance > 12.0 {
        "Moderate".to_string()
    } else {
        "Low".to_string()
    }
}

fn classify_liquidity_risk(bid_depth_usd: f64, ask_depth_usd: f64, levels: usize) -> String {
    let total_depth = bid_depth_usd + ask_depth_usd;
    if total_depth < 1000.0 || levels < 3 {
        "High".to_string()
    } else if total_depth < 5000.0 || levels < 5 {
        "Moderate".to_string()
    } else {
        "Low".to_string()
    }
}

fn classify_volatility(spread_bps: f64, imbalance_pct: f64) -> String {
    let composite = spread_bps * 0.5 + imbalance_pct * 0.5;
    if composite > 20.0 {
        "Elevated".to_string()
    } else if composite > 8.0 {
        "Moderate".to_string()
    } else {
        "Low".to_string()
    }
}

fn classify_freshness(book: &OrderBookSnapshot) -> String {
    let age_secs = (chrono::Utc::now() - book.timestamp).num_seconds();
    if age_secs > 5 {
        "Stale".to_string()
    } else {
        "Fresh".to_string()
    }
}

pub fn compute_risk(book: &OrderBookSnapshot) -> RiskSnapshot {
    let bid_depth_usd: f64 = book.bids.iter().map(|(p, q)| p * q).sum();
    let ask_depth_usd: f64 = book.asks.iter().map(|(p, q)| p * q).sum();
    let total_depth = bid_depth_usd + ask_depth_usd;

    let best_bid = book.bids.first().map(|(p, _)| *p).unwrap_or(0.0);
    let best_ask = book.asks.first().map(|(p, _)| *p).unwrap_or(0.0);
    let mid = if best_bid > 0.0 && best_ask > 0.0 {
        (best_bid + best_ask) / 2.0
    } else {
        0.0
    };
    let spread_bps = if mid > 0.0 {
        ((best_ask - best_bid) / mid * 10_000.0).abs()
    } else {
        0.0
    };

    let imbalance_pct = if total_depth > 0.0 {
        ((bid_depth_usd - ask_depth_usd) / total_depth * 100.0).abs()
    } else {
        0.0
    };

    let levels = book.bids.len().max(book.asks.len());

    RiskSnapshot {
        volatility_status: classify_volatility(spread_bps, imbalance_pct),
        liquidity_risk: classify_liquidity_risk(bid_depth_usd, ask_depth_usd, levels),
        spread_risk: classify_spread_risk(spread_bps),
        depth_risk: classify_depth_risk(bid_depth_usd, ask_depth_usd),
        data_freshness: classify_freshness(book),
    }
}
