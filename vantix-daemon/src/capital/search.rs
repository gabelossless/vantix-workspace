use super::corpus::{seed_documents, CapitalDocument};
use super::embedder::{Embedder, MockEmbedder};
use super::errors::CapitalError;
use base64::Engine;
use serde::Serialize;
use std::cmp::Ordering;
use std::path::PathBuf;

#[derive(Clone, Debug, Serialize)]
pub struct CapitalSearchResult {
    pub id: String,
    pub source: String,
    pub title: String,
    pub content: String,
    pub score: f32,
}

#[derive(Clone, Debug, Serialize)]
pub struct CapitalSearchResponse {
    pub query: String,
    pub mode: String,
    pub dimensions: usize,
    pub results: Vec<CapitalSearchResult>,
    pub total: usize,
    pub next_cursor: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct CapitalHealth {
    pub mode: String,
    pub dimensions: usize,
    pub model_loaded: bool,
}

pub struct EmbeddedDocument {
    pub doc: CapitalDocument,
    pub embedding: Vec<f32>,
}

pub enum CapitalSearchState {
    #[cfg_attr(feature = "local-embeddings", allow(dead_code))]
    Mock {
        embedder: MockEmbedder,
        documents: Vec<EmbeddedDocument>,
    },
    #[cfg(feature = "local-embeddings")]
    Local {
        embedder: super::embedder::LocalEmbedder,
        documents: Vec<EmbeddedDocument>,
    },
    #[cfg_attr(not(feature = "local-embeddings"), allow(dead_code))]
    Unavailable { error: CapitalError },
}

pub struct CapitalSearchService {
    state: CapitalSearchState,
}

impl CapitalSearchService {
    #[cfg_attr(feature = "local-embeddings", allow(dead_code))]
    pub fn mock() -> Result<Self, CapitalError> {
        let embedder = MockEmbedder::default();
        let documents = index_documents(&embedder, &seed_documents())?;
        Ok(Self {
            state: CapitalSearchState::Mock {
                embedder,
                documents,
            },
        })
    }

    pub fn from_model_dir(model_dir: impl Into<PathBuf>) -> Result<Self, CapitalError> {
        #[cfg(feature = "local-embeddings")]
        {
            let model_dir = model_dir.into();
            match super::embedder::LocalEmbedder::load(&model_dir) {
                Ok(embedder) => {
                    let documents = index_documents(&embedder, &seed_documents())?;
                    Ok(Self {
                        state: CapitalSearchState::Local {
                            embedder,
                            documents,
                        },
                    })
                }
                Err(error) => Ok(Self {
                    state: CapitalSearchState::Unavailable { error },
                }),
            }
        }

        #[cfg(not(feature = "local-embeddings"))]
        {
            let _ = model_dir.into();
            Self::mock()
        }
    }

    pub fn health(&self) -> CapitalHealth {
        match &self.state {
            CapitalSearchState::Mock { embedder, .. } => CapitalHealth {
                mode: embedder.mode().to_string(),
                dimensions: embedder.dimensions(),
                model_loaded: true,
            },
            #[cfg(feature = "local-embeddings")]
            CapitalSearchState::Local { embedder, .. } => CapitalHealth {
                mode: embedder.mode().to_string(),
                dimensions: embedder.dimensions(),
                model_loaded: true,
            },
            CapitalSearchState::Unavailable { .. } => CapitalHealth {
                mode: "local".to_string(),
                dimensions: 384,
                model_loaded: false,
            },
        }
    }

    pub fn search(
        &self,
        query: &str,
        limit: usize,
        cursor: Option<&str>,
    ) -> Result<CapitalSearchResponse, CapitalError> {
        let query = query.trim();
        if query.is_empty() {
            return Err(CapitalError::MissingQuery);
        }

        match &self.state {
            CapitalSearchState::Mock {
                embedder,
                documents,
            } => search_documents(embedder, documents, query, limit, cursor),
            #[cfg(feature = "local-embeddings")]
            CapitalSearchState::Local {
                embedder,
                documents,
            } => search_documents(embedder, documents, query, limit, cursor),
            CapitalSearchState::Unavailable { error } => {
                Err(CapitalError::LocalRuntimeUnavailable {
                    message: error.to_string(),
                })
            }
        }
    }
}

fn index_documents(
    embedder: &impl Embedder,
    documents: &[CapitalDocument],
) -> Result<Vec<EmbeddedDocument>, CapitalError> {
    documents
        .iter()
        .cloned()
        .map(|doc| {
            let embedding = embedder.embed(doc.content)?;
            Ok(EmbeddedDocument { doc, embedding })
        })
        .collect()
}

fn decode_cursor(raw: &str) -> Result<usize, CapitalError> {
    let engine = base64::engine::general_purpose::URL_SAFE_NO_PAD;
    let bytes = engine
        .decode(raw)
        .map_err(|_| CapitalError::InvalidCursor)?;
    let s = String::from_utf8(bytes).map_err(|_| CapitalError::InvalidCursor)?;
    s.parse::<usize>().map_err(|_| CapitalError::InvalidCursor)
}

fn encode_cursor(index: usize) -> String {
    let engine = base64::engine::general_purpose::URL_SAFE_NO_PAD;
    engine.encode(index.to_string())
}

fn search_documents(
    embedder: &impl Embedder,
    documents: &[EmbeddedDocument],
    query: &str,
    limit: usize,
    cursor: Option<&str>,
) -> Result<CapitalSearchResponse, CapitalError> {
    let query_embedding = embedder.embed(query)?;
    let mut scored: Vec<_> = documents
        .iter()
        .map(|entry| CapitalSearchResult {
            id: entry.doc.id.to_string(),
            source: entry.doc.source.to_string(),
            title: entry.doc.title.to_string(),
            content: entry.doc.content.to_string(),
            score: cosine_similarity(&query_embedding, &entry.embedding),
        })
        .collect();

    scored.sort_by(|left, right| {
        right
            .score
            .partial_cmp(&left.score)
            .unwrap_or(Ordering::Equal)
    });

    let total = scored.len();
    let start = match cursor {
        Some(c) => decode_cursor(c)?
            .checked_add(1)
            .ok_or(CapitalError::InvalidCursor)?,
        None => 0,
    };

    if start > total {
        return Err(CapitalError::InvalidCursor);
    }

    let cap = limit.max(1);
    let page: Vec<_> = scored.into_iter().skip(start).take(cap).collect();

    let next_cursor = if start + page.len() < total {
        Some(encode_cursor(start + page.len() - 1))
    } else {
        None
    };

    Ok(CapitalSearchResponse {
        query: query.to_string(),
        mode: embedder.mode().to_string(),
        dimensions: embedder.dimensions(),
        total,
        results: page,
        next_cursor,
    })
}

fn cosine_similarity(left: &[f32], right: &[f32]) -> f32 {
    let len = left.len().min(right.len());
    if len == 0 {
        return 0.0;
    }

    let mut dot = 0.0;
    let mut left_norm = 0.0;
    let mut right_norm = 0.0;

    for index in 0..len {
        let l = left[index];
        let r = right[index];
        dot += l * r;
        left_norm += l * l;
        right_norm += r * r;
    }

    if left_norm == 0.0 || right_norm == 0.0 {
        0.0
    } else {
        dot / (left_norm.sqrt() * right_norm.sqrt())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mock_search_returns_ranked_results() {
        let service = CapitalSearchService::mock().expect("mock search service");
        let response = service
            .search("slippage based on order book depth", 3, None)
            .expect("search");
        assert_eq!(response.mode, "mock");
        assert!(!response.results.is_empty());
        assert!(response.results.len() <= 3);
        assert!(response.total >= response.results.len());
        assert_eq!(response.next_cursor.is_some(), response.total > 3);
    }

    #[test]
    fn missing_query_is_structured() {
        let service = CapitalSearchService::mock().expect("mock search service");
        let error = service
            .search("   ", 3, None)
            .expect_err("expected missing query");
        assert_eq!(error.status_code(), axum::http::StatusCode::BAD_REQUEST);
        let details = error.details();
        assert_eq!(details.code, "MISSING_QUERY");
    }

    #[cfg(feature = "local-embeddings")]
    #[test]
    fn local_mode_reports_missing_model_files() {
        let dir = tempfile::tempdir().expect("temp dir");
        let error = super::super::embedder::LocalEmbedder::validate_model_dir(dir.path())
            .expect_err("expected missing files");

        match error {
            CapitalError::ModelFilesMissing { missing_files, .. } => {
                assert!(missing_files.iter().any(|file| file == "model.onnx"));
                assert!(missing_files.iter().any(|file| file == "tokenizer.json"));
            }
            other => panic!("unexpected error: {other}"),
        }
    }
}
