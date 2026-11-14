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

## Restarted Windows qualification and repair

- The fresh verifier installed the same 413 locked packages after disk space returned. It checked all 16 archives and confirmed the replay repair with 720 receipt permutations. Both worktrees passed 232 unit checks, including all 16 recovery cases, and production build against the original product `78a410f`. Main ran those bytes from evidence commit `4b6ba9e`.
- The verifier found that the completed live synthetic parent Run had an accepted assistant reply in its saved Session but a null public report result. `5addd6b` joins the exact accepted assistant message in that Session and preserves child output and the rejected-output canary. The main affected unit check passed 14/14. The isolated receipt browser attempt at that intermediate commit timed out before finding Studio navigation while the full unit runner was using the same worktree.
- Both main and the verifier reproduced a strict locator failure in A1–A4 at `78a410f`. Studio displayed the same step-limit failure in the Outcome alert and the Activity badge. Main's Background browser also reached the recovered Interrupted Run and then found that the restart reason appeared twice. `77604bb` keeps the Outcome and removes the repeated Activity label from the Runs panel. Sessions retains the problem indicator. Full trace retains the reason evidence.
- The older V1b browser check waited for the pre-Run-Visibility `Draft edit · applied` timeline label after an edit, save and retained receipt. `cd415e0` updates the driver to open Run Details and assert the applied draft-authoring receipt, including the delayed acknowledgement after Stop. That commit changes only the test relative to `77604bb`.
- While the full suite ran, a read-only browser check against the long-running cumulative preview timed out. A diagnostic browser run recorded Svelte `effect_orphan` with empty content, despite a healthy API. Earlier fixture and receipt browser runs used separate hosts. Keep that preview startup failure distinct from the runtime and product findings above.
- On `cd415e0`, independent A1–A4 passed the step-limit check and reached the parent link. An inherited broad locator matched links in both Outcome and Details. `058e685` scopes those test clicks to Outcome. The product is byte-identical to `cd415e0`.
- The main `cd415e0` full unit run hit the 480-second file timeout in Background after 15 matrix cases passed. The prior two complete unit runs and the parent-reply-only `5addd6b` run each passed 232 checks. The final matrix was started separately at `058e685` with a 900-second test-runner allowance. No product timeout or recovery policy changed.
- The cumulative host restarted on the repaired product against the same isolated store. The API returned all 14 saved Runs, and a browser opened all three detail levels, followed the parent/child links and restored the preference after reload. No operational writes occurred, and the stored Run list was identical before and after.
