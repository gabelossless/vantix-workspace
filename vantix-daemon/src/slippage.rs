use crate::models::OrderBookSnapshot;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct SlippageEstimate {
    pub requested_notional_usd: f64,
    pub filled_quantity: f64,
    pub best_price: f64,
    pub vwap: f64,
    pub slippage_bps: f64,
    pub fully_filled: bool,
}

pub fn estimate_execution(
    book: &OrderBookSnapshot,
    side: &str,
    notional_usd: f64,
) -> Result<SlippageEstimate, String> {
    let levels = match side.to_lowercase().as_str() {
        "buy" => &book.asks,
        "sell" => &book.bids,
        _ => return Err("Side must be 'buy' or 'sell'".to_string()),
    };

    if levels.is_empty() {
        return Err("Order book is empty".to_string());
    }

    let best_price = levels[0].0;
    let mut remaining_usd = notional_usd;
    let mut total_filled_qty = 0.0;
    let mut total_spent_usd = 0.0;

    for (price, qty) in levels {
        let level_usd_value = price * qty;
        if remaining_usd <= level_usd_value {
            let qty_needed = remaining_usd / price;
            total_filled_qty += qty_needed;
            total_spent_usd += remaining_usd;
            remaining_usd = 0.0;
            break;
        } else {
            total_filled_qty += qty;
            total_spent_usd += level_usd_value;
            remaining_usd -= level_usd_value;
        }
    }

    let vwap = if total_filled_qty > 0.0 {
        total_spent_usd / total_filled_qty
    } else {
        best_price
    };
    let slippage_bps = ((vwap - best_price).abs() / best_price) * 10000.0;

    Ok(SlippageEstimate {
        requested_notional_usd: notional_usd,
        filled_quantity: total_filled_qty,
        best_price,
        vwap,
        slippage_bps,
        fully_filled: remaining_usd == 0.0,
    })
}
