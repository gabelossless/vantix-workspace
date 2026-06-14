#[derive(Clone, Debug)]
pub struct CapitalDocument {
    pub id: &'static str,
    pub source: &'static str,
    pub title: &'static str,
    pub content: &'static str,
}

pub fn seed_documents() -> Vec<CapitalDocument> {
    vec![
        CapitalDocument {
            id: "doc_market_structure",
            source: "capital_brief",
            title: "Market structure",
            content: "Bid depth, ask depth, spread, and mid price determine execution quality and liquidity risk.",
        },
        CapitalDocument {
            id: "doc_slippage",
            source: "capital_brief",
            title: "Slippage estimation",
            content: "Estimated slippage is derived from current order book depth and depends on side, notional size, and available resting liquidity.",
        },
        CapitalDocument {
            id: "doc_risk_snapshot",
            source: "capital_brief",
            title: "Risk snapshot",
            content: "Volatility, spread, depth, and freshness are monitored independently and should be surfaced with explicit warning states.",
        },
        CapitalDocument {
            id: "doc_logs",
            source: "capital_brief",
            title: "System logs",
            content: "Daemon offline events, fetch failures, JSON parse failures, and stale data warnings should be retained in a dense operator log.",
        },
        CapitalDocument {
            id: "doc_exchange",
            source: "capital_brief",
            title: "Exchange connectivity",
            content: "The exchange feed is continuously updated locally, while the UI polls the daemon on a fixed interval.",
        },
    ]
}
