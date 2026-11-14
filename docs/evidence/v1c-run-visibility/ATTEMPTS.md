# Retained Run Visibility attempts

## Host integration, 14 November 2026

The first working-tree host integration above package `94b6fbb` captured full strictly valid public events. `node --test --test-concurrency=1 --test-timeout=480000 tests/a4.test.mjs tests/saved-research.test.mjs` failed the A4 rejection-canary assertion at `tests/a4.test.mjs:63`: a `text.delta` contained `UNACCEPTED-FIXTURE-CANARY` after structured output was rejected. The old Studio correctly withheld the candidate output; adding full event payloads to its public snapshot violated that boundary. This was a synthetic fixture, not private user content. Parent-to-child cancellation passed in that attempt.

The manager returned the defect to the runtime builder before final integration. The reusable capture must retain operational identity/sequence and explicit payload availability without publishing unaccepted response payload. The strict VICT stream/parser remains unchanged and accepted Run output is the text authority. A package cherry-pick during this initial non-frozen test also caused Vite to restart; this attempt cannot serve as final qualification. The complete local TAP is retained under `.local/run-visibility/host-integration.tap`. Later candidate rechecks must name exact frozen bytes.

## Environment tooling

The initial manifest writer verified all archive hashes but failed to create its nested output directory because its file-URL parent calculation resolved too high. Replacing that calculation with `dirname(out)` fixed the tooling; the rerun verified all 16 archive SHA-256/SHA-512 pins and unchanged lock. No product or dependency changed.

Git commit initially failed because this checkout had no configured author identity. Per-command existing project agent attribution was used; no global Git configuration changed.
