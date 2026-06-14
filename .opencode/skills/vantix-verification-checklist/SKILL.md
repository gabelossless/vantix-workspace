---
name: vantix-verification-checklist
description: Verification steps for ensuring changes are correct and integrated. Use when completing a task or subagent dispatch.
---

# Vantix Verification Checklist

Before marking a task as completed, you must run the following verification sequence.

## 1. TypeScript (UI) Verification

Required for any changes in `vantix-ui/`.

- [ ] `npm run lint` — Check for stylistic and type-safety issues.
- [ ] `npm run build` — Ensure Next.js compilation and type-checking pass.
- [ ] **Contract Sync**: Verify that `adapters.ts` correctly maps any new `api-types.ts` changes to `view-types.ts`.

## 2. Rust (Daemon) Verification

Required for any changes in `vantix-daemon/`.

- [ ] `cargo check` — Fast compilation check.
- [ ] `cargo check --features local-embeddings` — Ensure feature-flagged code is valid.
- [ ] `cargo test` — Run core logic tests.
- [ ] `cargo test --features local-embeddings` — Run tests specifically for local embedding mode.
- [ ] **Formatting**: `cargo fmt --check`

## 3. Integration & Contract Verification

Required when changing endpoints or data structures.

- [ ] **Contract Mirroring**: Ensure `api-types.ts` matches the Rust struct field names and types (including snake_case vs camelCase).
- [ ] **Array Encoding**: For tuple types (e.g., `OrderBookLevel`), verify Rust `(f64, f64)` matches TS `[number, number]`.
- [ ] **Feature Parity**: Verify that functionality works in both default mode and `local-embeddings` mode.
- [ ] **Error Handling**: Ensure that missing model files or daemon-offline states yield structured JSON errors, not crashes.

## 4. Documentation & Hygiene

- [ ] **README/Docs**: Update relevant `docs/` or `README.md` files if API, project structure, or run commands changed.
- [ ] **Git Hygiene**: Verify no `.log`, `.db`, or `.err` files are staged for commit.
- [ ] **Path Sanitization**: Ensure no absolute paths (e.g., `C:\Users\...`) were introduced in documentation.

## Summary of Commands

| Task | Command |
|---|---|
| **UI Lint** | `npm run lint` |
| **UI Build** | `npm run build` |
| **Daemon Check** | `cargo check` |
| **Daemon Feature Check** | `cargo check --features local-embeddings` |
| **Daemon Test** | `cargo test` |
| **Daemon Feature Test** | `cargo test --features local-embeddings` |
