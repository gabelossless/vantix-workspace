---
name: vantix-security-hygiene
description: Security practices for the Vantix workspace — what not to commit, path sanitization, .gitignore patterns, log/DB exclusion. Use before any git operation.
---

# Vantix Security Hygiene

## Never Commit

| Artifact | Pattern | Reason |
|---|---|---|
| Log files | `*.log`, `*.out`, `*.err` | May contain network IPs, request paths, error stack traces |
| Database files | `*.db`, `*.db-shm`, `*.db-wal` | May contain market data or cached documents |
| Model binaries | `*.onnx`, `*.bin` | Large files, not suitable for git |
| Environment files | `.env`, `.env.*.local` | API keys, secrets, local configuration |
| OS metadata | `.DS_Store`, `Thumbs.db` | System files, irrelevant to code |

## .gitignore Protection

The project `.gitignore` covers all patterns above. If adding a new runtime directory that produces artifacts, add corresponding patterns.

## Path Sanitization

**Never use absolute filesystem paths** in committed documentation or config files:

- ❌ `C:\Users\Username\projects\vantix-workspace`
- ✅ `./` (project root), `./vantix-ui`, `./vantix-daemon`

Check for absolute paths before committing:
```
git grep 'C:\\Users' -- '*.md' '*.rs' '*.ts' '*.tsx' '*.toml' '*.json'
```

## .gitattributes

Use `.gitattributes` to:
- Normalize line endings (`* text=auto`)
- Mark binary files (`.onnx`, `.db*`, `.ico`, `.png`)
- Ensure shell scripts use LF (`*.sh text eol=lf`)

## Pre-commit Verification

The `.husky/pre-commit` hook runs:
- `cargo fmt --check` — Rust formatting
- `npm run lint` — TypeScript linting

If adding new checks, keep them fast (< 5 seconds). Heavy verification belongs in CI.
