# Model Placement

The local embeddings feature reads files from:

`storage/models/embeddings/`

Place the embedding assets exactly here:

- `storage/models/embeddings/model.onnx`
- `storage/models/embeddings/tokenizer.json`
- `storage/models/embeddings/config.json` optional, but recommended
- `storage/models/embeddings/tokenizer_config.json` optional
- `storage/models/embeddings/special_tokens_map.json` optional

Required files:

- `model.onnx`
- `tokenizer.json`

Expected behavior:

- `cargo run` uses `MockEmbedder` by default.
- `cargo run --features local-embeddings` loads the ONNX embedder from this directory when the required files exist.
- If the required files are missing, `/v1/capital/search` returns a structured JSON error and the daemon keeps running.

## Sourcing Models

The ONNX model and tokenizer files originate from Hugging Face
[sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2).

### Export to ONNX

Use the `optimum-cli` tool from the Hugging Face Optimum library:

```sh
pip install optimum onnx onnxruntime
optimum-cli export onnx --model sentence-transformers/all-MiniLM-L6-v2 storage/models/embeddings/
```

This produces:

- `storage/models/embeddings/model.onnx`
- `storage/models/embeddings/tokenizer.json`
- `storage/models/embeddings/config.json`

### Manual conversion (alternative)

If `optimum-cli` is not available, export manually with `transformers.js`:

```sh
npx transformers-cli export onnx --model sentence-transformers/all-MiniLM-L6-v2 storage/models/embeddings/
```

### Notes

- The directory is resolved relative to the daemon working directory.
- Keep the model folder local to the repository and do not hardcode absolute paths.

