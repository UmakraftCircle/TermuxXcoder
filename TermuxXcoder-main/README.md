# TermuxXCoder — Audited Rebuild

This is a **security-audited rebuild** of the TermuxXCoder prototype. It addresses every Critical/High finding from the deep audit by replacing unsafe server primitives, fake cryptography, fake build verification, and overbroad Android permissions with honest, minimal implementations.

## What changed vs. the original

| Audit finding | Fix |
|---|---|
| C-01/C-02 Unauthenticated command exec | **Removed.** No `child_process` routes exist. |
| C-03 Hardcoded Turso token | **Removed.** No Turso credentials in source; memory is local-only by default. |
| C-04 AI keys in localStorage | Keys now live only in an in-memory session object and are never persisted. |
| C-05 SSRF via custom endpoint | Custom endpoint is **not proxied** by the server. AI calls are made client-side only. |
| C-06 Fake AES-256 vault | Real **Web Crypto AES-GCM** with a derived key; UI labels reflect actual state. |
| C-07 Fake local model | "Local AI" is honestly labeled `heuristic-fallback`. No fake `.gguf` files. |
| C-08 Silent AI fallback | Fallback is **visible** and labeled; no cloud call happens without explicit provider config. |
| C-09 Fake build verification | `/api/verify-build` returns `not-run` honestly; no synthetic "100% readiness". |
| C-10 Incomplete Android project | Wrapper, proguard rules, and single-module graph added. |
| C-11/C-12 Overbroad storage / silent fallback | `MANAGE_EXTERNAL_STORAGE` removed; app-private dirs by default; failures are explicit. |
| C-13 Path traversal | All workspace paths are canonicalized and root-bounded. |
| C-15 ZIP bomb | Extraction enforces size, count, ratio, and traversal limits. |
| C-16 Fake SHA-256 | Real `crypto.subtle.digest("SHA-256")`. |
| C-17 Fake GitHub push | Endpoint removed; GitHub integration is client-side only. |
| C-18 Aggressive service | No boot receiver, no wake lock, no START_STICKY. |
| C-19 FileProvider root | Narrowed to app-specific external files dir only. |
| C-20 Plaintext fallback | SecureStorage fails closed. |
| C-21 Misleading claims | All status text is observable, not absolute. |

## Status

This is a **prototype**. It is not a production Android IDE, autonomous agent, or verified build system. Treat it as a UI demonstration with honest security primitives.
