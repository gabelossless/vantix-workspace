use crate::capital::{
    CapitalErrorBody, CapitalHealth, CapitalSearchResponse, CapitalSearchService,
};
use crate::health::AppHealth;
use crate::models::OrderBookSnapshot;
use crate::slippage::{estimate_execution, SlippageEstimate};
use axum::{
    extract::{Query, State},
    http::{header, HeaderValue, Method, StatusCode},
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;

pub struct AppState {
    pub latest_book: Arc<RwLock<Option<OrderBookSnapshot>>>,
    pub capital: Arc<CapitalSearchService>,
    pub boot_time: chrono::DateTime<chrono::Utc>,
    pub health: Arc<RwLock<AppHealth>>,
}

#[derive(Serialize)]
pub struct HealthResponse {
    status: String,
    uptime_seconds: i64,
    version: String,
    exchange_connected: bool,
    last_trade_message_age_secs: i64,
    adapters_running: usize,
}

#[derive(Deserialize)]
pub struct SlippageQuery {
    side: String,
    notional_usd: f64,
}

pub async fn serve_api(state: Arc<AppState>, bind_addr: &str) {
    let cors = CorsLayer::new()
        .allow_origin(["http://localhost:3000".parse::<HeaderValue>().unwrap()])
        .allow_methods([Method::GET])
        .allow_headers([header::CONTENT_TYPE, header::ACCEPT]);

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/orderbook/latest", get(get_latest_book))
        .route("/estimate/slippage", get(get_slippage))
        .route("/v1/capital/search", get(capital_search))
        .route("/v1/capital/health", get(capital_health))
        .layer(cors)
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(bind_addr)
        .await
        .expect("bind API listener");
    tracing::info!("API locked onto http://{}", bind_addr);
    axum::serve(listener, app).await.expect("serve API");
}

async fn health_check(State(state): State<Arc<AppState>>) -> Json<HealthResponse> {
    let health = state.health.read().await;
    let last_trade_message_age_secs = health
        .last_trade_time
        .map(|t| (chrono::Utc::now() - t).num_seconds())
        .unwrap_or(-1);

    tracing::debug!("Health check served");

    Json(HealthResponse {
        status: "ok".to_string(),
        uptime_seconds: (chrono::Utc::now() - state.boot_time).num_seconds(),
        version: "0.1.0".to_string(),
        exchange_connected: health.exchange_connected,
        last_trade_message_age_secs,
        adapters_running: health.adapters_running,
    })
}

async fn get_latest_book(
    State(state): State<Arc<AppState>>,
) -> Result<Json<OrderBookSnapshot>, (StatusCode, String)> {
    let book = state.latest_book.read().await;
    match &*book {
        Some(snapshot) => Ok(Json(snapshot.clone())),
        None => Err((
            StatusCode::SERVICE_UNAVAILABLE,
            "Syncing book...".to_string(),
        )),
    }
}

async fn get_slippage(
    Query(params): Query<SlippageQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<SlippageEstimate>, (StatusCode, String)> {
    let book_guard = state.latest_book.read().await;
    let book = match &*book_guard {
        Some(snapshot) => snapshot,
        None => {
            return Err((
                StatusCode::SERVICE_UNAVAILABLE,
                "Book not initialized".to_string(),
            ))
        }
    };

    match estimate_execution(book, &params.side, params.notional_usd) {
        Ok(est) => Ok(Json(est)),
        Err(err) => Err((StatusCode::BAD_REQUEST, err)),
    }
}

#[derive(Deserialize)]
struct CapitalSearchQuery {
    q: Option<String>,
    limit: Option<usize>,
    cursor: Option<String>,
}

async fn capital_search(
    Query(params): Query<CapitalSearchQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<CapitalSearchResponse>, (StatusCode, Json<CapitalErrorBody>)> {
    let query = params.q.unwrap_or_default();
    let limit = params.limit.unwrap_or(3);

    tracing::info!("Capital search query: q=\"{}\", limit={}", query, limit);

    match state
        .capital
        .search(&query, limit, params.cursor.as_deref())
    {
        Ok(response) => Ok(Json(response)),
        Err(error) => Err((error.status_code(), Json(error.body()))),
    }
}

#[derive(Serialize)]
struct CapitalHealthResponse {
    status: String,
    mode: String,
    dimensions: usize,
    model_loaded: bool,
    uptime_hint: String,
}

async fn capital_health(State(state): State<Arc<AppState>>) -> Json<CapitalHealthResponse> {
    let health: CapitalHealth = state.capital.health();
    Json(CapitalHealthResponse {
        status: if health.model_loaded {
            "ok".to_string()
        } else {
            "degraded".to_string()
        },
        mode: health.mode,
        dimensions: health.dimensions,
        model_loaded: health.model_loaded,
        uptime_hint: format!("{}s", (chrono::Utc::now() - state.boot_time).num_seconds()),
    })
}
