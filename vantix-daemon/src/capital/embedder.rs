use crate::capital::errors::CapitalError;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

pub trait Embedder: Send + Sync {
    fn mode(&self) -> &'static str;
    fn dimensions(&self) -> usize;
    fn embed(&self, text: &str) -> Result<Vec<f32>, CapitalError>;
}

#[derive(Debug, Clone, Copy)]
pub struct MockEmbedder {
    dimensions: usize,
}

impl Default for MockEmbedder {
    fn default() -> Self {
        Self { dimensions: 384 }
    }
}

impl MockEmbedder {
    fn tokenize(text: &str) -> impl Iterator<Item = &str> {
        text.split(|c: char| !c.is_alphanumeric())
            .filter(|token| !token.is_empty())
    }
}

impl Embedder for MockEmbedder {
    fn mode(&self) -> &'static str {
        "mock"
    }

    fn dimensions(&self) -> usize {
        self.dimensions
    }

    fn embed(&self, text: &str) -> Result<Vec<f32>, CapitalError> {
        let mut vector = vec![0.0f32; self.dimensions];
        let mut token_count = 0.0f32;

        for token in Self::tokenize(text) {
            token_count += 1.0;
            let mut hasher = DefaultHasher::new();
            token.hash(&mut hasher);
            let hashed = hasher.finish() as usize;
            let index = hashed % self.dimensions;
            vector[index] += 1.0;
        }

        if token_count > 0.0 {
            for value in &mut vector {
                *value /= token_count;
            }
        }

        normalize(&mut vector);
        Ok(vector)
    }
}

fn normalize(vector: &mut [f32]) {
    let norm = vector.iter().map(|value| value * value).sum::<f32>().sqrt();
    if norm > 0.0 {
        for value in vector.iter_mut() {
            *value /= norm;
        }
    }
}

#[cfg(feature = "local-embeddings")]
mod local {
    use super::*;
    use crate::capital::errors::CapitalError;
    use serde::Deserialize;
    use std::{
        fs,
        path::{Path, PathBuf},
    };
    use tokenizers::Tokenizer;
    use tract_onnx::prelude::*;

    #[derive(Debug, Deserialize, Default)]
    struct EmbeddingConfig {
        #[serde(default = "default_dimensions")]
        embedding_dimensions: usize,
        #[serde(default = "default_max_tokens")]
        max_tokens: usize,
    }

    fn default_dimensions() -> usize {
        384
    }

    fn default_max_tokens() -> usize {
        512
    }

    pub struct LocalEmbedder {
        tokenizer: Tokenizer,
        model: TypedRunnableModel<TypedModel>,
        dimensions: usize,
        max_tokens: usize,
    }

    impl LocalEmbedder {
        pub fn load(model_dir: impl AsRef<Path>) -> Result<Self, CapitalError> {
            let model_dir = model_dir.as_ref().to_path_buf();
            let manifest = EmbeddingManifest::validate(&model_dir)?;
            let config = manifest.load_config()?;
            let tokenizer = Tokenizer::from_file(&manifest.tokenizer_json).map_err(|err| {
                CapitalError::LocalRuntimeUnavailable {
                    message: format!(
                        "failed to load tokenizer from {}: {}",
                        manifest.tokenizer_json.display(),
                        err
                    ),
                }
            })?;

            let model = tract_onnx::onnx()
                .model_for_path(&manifest.model_onnx)
                .map_err(|err| CapitalError::LocalRuntimeUnavailable {
                    message: format!(
                        "failed to load ONNX model from {}: {}",
                        manifest.model_onnx.display(),
                        err
                    ),
                })?
                .into_optimized()
                .map_err(|err| CapitalError::LocalRuntimeUnavailable {
                    message: format!("failed to optimize ONNX model: {err}"),
                })?
                .into_runnable()
                .map_err(|err| CapitalError::LocalRuntimeUnavailable {
                    message: format!("failed to prepare ONNX model: {err}"),
                })?;

            Ok(Self {
                tokenizer,
                model,
                dimensions: config.embedding_dimensions,
                max_tokens: config.max_tokens,
            })
        }

        #[cfg_attr(not(test), allow(dead_code))]
        pub fn validate_model_dir(model_dir: impl AsRef<Path>) -> Result<(), CapitalError> {
            EmbeddingManifest::validate(model_dir.as_ref()).map(|_| ())
        }
    }

    impl Embedder for LocalEmbedder {
        fn mode(&self) -> &'static str {
            "local"
        }

        fn dimensions(&self) -> usize {
            self.dimensions
        }

        fn embed(&self, text: &str) -> Result<Vec<f32>, CapitalError> {
            let encoding = self.tokenizer.encode(text, true).map_err(|err| {
                CapitalError::LocalRuntimeUnavailable {
                    message: format!("tokenization failed: {err}"),
                }
            })?;

            let ids = encoding.get_ids();
            let masks = encoding.get_attention_mask();
            let len = ids.len().min(self.max_tokens).max(1);

            let input_ids: Vec<i64> = ids.iter().take(len).map(|value| *value as i64).collect();
            let attention_mask: Vec<i64> =
                masks.iter().take(len).map(|value| *value as i64).collect();

            let ids_tensor = tract_onnx::prelude::Tensor::from_shape(&[1, len], &input_ids)
                .map_err(|err| CapitalError::LocalRuntimeUnavailable {
                    message: format!("failed to build input tensor: {err}"),
                })?;
            let mask_tensor = tract_onnx::prelude::Tensor::from_shape(&[1, len], &attention_mask)
                .map_err(|err| CapitalError::LocalRuntimeUnavailable {
                message: format!("failed to build attention tensor: {err}"),
            })?;

            let outputs = self
                .model
                .run(tract_onnx::prelude::tvec!(
                    ids_tensor.into(),
                    mask_tensor.into()
                ))
                .map_err(|err| CapitalError::SearchFailed {
                    message: format!("local embedding inference failed: {err}"),
                })?;

            let output = outputs.first().ok_or_else(|| CapitalError::SearchFailed {
                message: "local embedding model returned no outputs".to_string(),
            })?;

            let view = output
                .to_array_view::<f32>()
                .map_err(|err| CapitalError::SearchFailed {
                    message: format!("failed to read embedding output: {err}"),
                })?;

            let shape = view.shape().to_vec();
            let slice = view.as_slice().ok_or_else(|| CapitalError::SearchFailed {
                message: "embedding output is not contiguous".to_string(),
            })?;

            let mut vector = if shape.len() == 2 {
                slice.to_vec()
            } else if shape.len() == 3 {
                let seq_len = shape[1];
                let hidden = shape[2];
                let mut pooled = vec![0.0f32; hidden];
                let mut counted = 0.0f32;

                for index in 0..seq_len {
                    if attention_mask.get(index).copied().unwrap_or(0) == 0 {
                        continue;
                    }

                    let offset = index * hidden;
                    for hidden_index in 0..hidden {
                        pooled[hidden_index] += slice[offset + hidden_index];
                    }
                    counted += 1.0;
                }

                if counted > 0.0 {
                    for value in &mut pooled {
                        *value /= counted;
                    }
                }
                pooled
            } else {
                return Err(CapitalError::SearchFailed {
                    message: format!("unsupported embedding output rank: {}", shape.len()),
                });
            };

            normalize(&mut vector);
            Ok(vector)
        }
    }

    pub struct EmbeddingManifest {
        pub model_onnx: PathBuf,
        pub tokenizer_json: PathBuf,
        pub config_json: Option<PathBuf>,
    }

    impl EmbeddingManifest {
        pub fn validate(model_dir: &Path) -> Result<Self, CapitalError> {
            let model_onnx = model_dir.join("model.onnx");
            let tokenizer_json = model_dir.join("tokenizer.json");
            let config_json = model_dir.join("config.json");
            let mut missing_files = Vec::new();

            if !model_onnx.exists() {
                missing_files.push("model.onnx".to_string());
            }
            if !tokenizer_json.exists() {
                missing_files.push("tokenizer.json".to_string());
            }

            if !missing_files.is_empty() {
                return Err(CapitalError::ModelFilesMissing {
                    model_dir: model_dir.to_path_buf(),
                    missing_files,
                });
            }

            Ok(Self {
                model_onnx,
                tokenizer_json,
                config_json: config_json.exists().then_some(config_json),
            })
        }

        fn load_config(&self) -> Result<EmbeddingConfig, CapitalError> {
            match &self.config_json {
                Some(path) => {
                    let raw = fs::read_to_string(path).map_err(|err| {
                        CapitalError::LocalRuntimeUnavailable {
                            message: format!(
                                "failed to read embedding config {}: {}",
                                path.display(),
                                err
                            ),
                        }
                    })?;
                    serde_json::from_str::<EmbeddingConfig>(&raw).map_err(|err| {
                        CapitalError::LocalRuntimeUnavailable {
                            message: format!(
                                "failed to parse embedding config {}: {}",
                                path.display(),
                                err
                            ),
                        }
                    })
                }
                None => Ok(EmbeddingConfig::default()),
            }
        }
    }
}

#[cfg(feature = "local-embeddings")]
pub use local::LocalEmbedder;
