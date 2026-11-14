# Retained Run Visibility attempts

## Host integration, 14 November 2026

The first working-tree host integration above package `94b6fbb` captured full strictly valid public events. `node --test --test-concurrency=1 --test-timeout=480000 tests/a4.test.mjs tests/saved-research.test.mjs` failed the A4 rejection-canary assertion at `tests/a4.test.mjs:63`: a `text.delta` contained `UNACCEPTED-FIXTURE-CANARY` after structured output was rejected. The old Studio correctly withheld the candidate output; adding full event payloads to its public snapshot violated that boundary. This was a synthetic fixture, not private user content. Parent-to-child cancellation passed in that attempt.

The manager returned the defect to the runtime builder before final integration. The reusable capture must retain operational identity/sequence and explicit payload availability without publishing unaccepted response payload. The strict VICT stream/parser remains unchanged and accepted Run output is the text authority. A package cherry-pick during this initial non-frozen test also caused Vite to restart; this attempt cannot serve as final qualification. The complete local TAP is retained under `.local/run-visibility/host-integration.tap`. Later candidate rechecks must name exact frozen bytes.

## Environment tooling

The initial manifest writer verified all archive hashes but failed to create its nested output directory because its file-URL parent calculation resolved too high. Replacing that calculation with `dirname(out)` fixed the tooling; the rerun verified all 16 archive SHA-256/SHA-512 pins and unchanged lock. No product or dependency changed.

Git commit initially failed because this checkout had no configured author identity. Per-command existing project agent attribution was used; no global Git configuration changed.

## Frozen candidate and repair attempts

- `024afe5d7a9d72814d9aa12b7fe73fec71de6108`: TORI-013 independently identified that captures `[1,3,2]` leave sequence 2 missing. Main reproduced the report in its pinned install. Runtime `7acd3ee` passed 10 package checks, including two regressions that fail on the prior package. Integrated repair `acc2a43` restores order per stream before projecting gaps or terminal boundaries.
- `024afe5`: the verifier's fresh install and main's serial Windows run hit ENOSPC. The first live walkthrough failed during seeding and left a partially seeded isolated store. The retry used a different store.
- `78a410f`: the verifier's offline attempt hit `ENOTCACHED` for `zwitch@2.0.4`. Its subsequent pinned install and main's serial qualification hit ENOSPC again. No independent executable verification is claimed. Cleanup of disposable generated directories was rejected by automatic approval review as blocked by policy. Verifier install logs and both serial logs remain local.
- `78a410f` fixture launcher: Windows treated the absolute `--import` preload path as a `c:` URL. The launcher now uses a relative module path from the fixed Studio working directory. The fixture host then started and returned two labelled runs with reports.
