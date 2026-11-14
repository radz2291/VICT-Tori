# Independent verification attempt 1

Verifier: `tori013-independent-verifier-20261114`, fresh session `/root/verifier`.
Candidate: `024afe5d7a9d72814d9aa12b7fe73fec71de6108`.
Contract: `8f1b68ecde71f3bd9dc2f90f9fd2fb09462256ab`.

The orchestrator released the artifact gate with both builder reports, the RV-01–13 map, and the candidate archive/fixture manifest. A fresh detached checkout was created. It had no tracked modifications. Windows Node was `22.13.1`; npm was `11.19.1`.

## Installation failure

`npm ci --prefer-offline --no-audit --no-fund` exited 1 during extraction with `TAR_ENTRY_ERROR ENOSPC: no space left on device, write`. The host reported zero free bytes. The existing `posthog-node@5.63.1` engine advisory preceded the disk failure. The incomplete installation was not used for product testing. The raw, non-secret failure log is retained locally as `.local/independent/install.log`.

Only the verifier's incomplete generated `node_modules` directory was proposed for cleanup, guarded by an exact resolved-path check. Automatic approval review rejected that command as blocked by policy; no deletion occurred. The orchestrator separately coordinated its disposable artifacts. No unrelated directory, dependency, user workspace, or product file was changed by the verifier.

## RV-03 / RV-09: retained out-of-order evidence remains missing

Independent source review identified that `projectRunReport` consumes `run.publicEvents` in capture order. For valid events from one stream received in order `[1, 3, 2]`, it records missing sequence 2 at sequence 3, then omits the retained sequence 2 because it is less than `stream.last`. The reported gap remains even though the source snapshot contains that authorized evidence. Full trace therefore omits an available event and reports a false missing range.

Expected: restore each originating stream's sequence order, reconcile gaps when retained events fill them, keep stable group identity, and preserve the authoritative terminal outcome. This must not invent a global order by sorting unrelated streams' timestamps.

The verifier sent this challenge before executable qualification. The orchestrator then reproduced the `[1, 3, 2]` failure using the installed integration and assigned a runtime repair. Attribution remains explicit: verifier source finding; orchestrator executable reproduction. This report does not claim an independently executed red test from the incomplete installation.

The orchestrator superseded this candidate and directed the verifier not to run full qualification on it. Its installation failure and replay finding remain retained. Verification awaits the exact replacement candidate and a complete fresh installation. No product PASS, live exchange, or owner acceptance is claimed.
