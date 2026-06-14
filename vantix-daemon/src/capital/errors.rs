use axum::http::StatusCode;
use serde::Serialize;
use std::path::PathBuf;
use thiserror::Error;

#[derive(Debug, Error)]
#[cfg_attr(not(feature = "local-embeddings"), allow(dead_code))]
pub enum CapitalError {
    #[error("search query is required")]
    MissingQuery,
    #[error("model files missing in {model_dir}")]
    ModelFilesMissing {
        model_dir: PathBuf,
        missing_files: Vec<String>,
    },
    #[error("local embedding runtime unavailable: {message}")]
    LocalRuntimeUnavailable { message: String },
    #[error("invalid pagination cursor")]
    InvalidCursor,
    #[error("capital search failed: {message}")]
    SearchFailed { message: String },
}

#[derive(Debug, Serialize)]
pub struct CapitalErrorDetails {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_dir: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub missing_files: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct CapitalErrorBody {
    pub error: CapitalErrorDetails,
}

impl CapitalError {
    pub fn status_code(&self) -> StatusCode {
        match self {
            Self::MissingQuery | Self::InvalidCursor => StatusCode::BAD_REQUEST,
            Self::ModelFilesMissing { .. } | Self::LocalRuntimeUnavailable { .. } => {
                StatusCode::SERVICE_UNAVAILABLE
            }
            Self::SearchFailed { .. } => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    pub fn details(&self) -> CapitalErrorDetails {
        match self {
            Self::MissingQuery => CapitalErrorDetails {
                code: "MISSING_QUERY".to_string(),
                message: self.to_string(),
                model_dir: None,
                missing_files: None,
            },
            Self::ModelFilesMissing {
                model_dir,
                missing_files,
            } => CapitalErrorDetails {
                code: "MODEL_FILES_MISSING".to_string(),
                message: self.to_string(),
                model_dir: Some(model_dir.display().to_string()),
                missing_files: Some(missing_files.clone()),
            },
            Self::InvalidCursor => CapitalErrorDetails {
                code: "INVALID_CURSOR".to_string(),
                message: self.to_string(),
                model_dir: None,
                missing_files: None,
            },
            Self::LocalRuntimeUnavailable { .. } => CapitalErrorDetails {
                code: "LOCAL_EMBEDDINGS_UNAVAILABLE".to_string(),
                message: self.to_string(),
                model_dir: None,
                missing_files: None,
            },
            Self::SearchFailed { .. } => CapitalErrorDetails {
                code: "CAPITAL_SEARCH_FAILED".to_string(),
                message: self.to_string(),
                model_dir: None,
                missing_files: None,
            },
        }
    }

    pub fn body(&self) -> CapitalErrorBody {
        CapitalErrorBody {
            error: self.details(),
        }
    }
}
