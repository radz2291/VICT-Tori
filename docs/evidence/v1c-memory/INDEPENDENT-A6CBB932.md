# TORI-006 independent verification of a6cbb932

**Verdict FAIL for the original candidate.** The accepted Phrasing Boundaries, cancellation, write-time authority, historical evidence and policy-control checks have reproduced findings. Signed off by **Codex TORI-006 Independent Verifier** on 12 November 2026. Owner review and live-model evidence are separate.

## Attribution and setup

- Repository `radz2291/VICT-Tori`. Product `a6cbb93272c9936689e660585e23e611ec2c3d83` from `codex/tori-v1c-memory-foundation`. Accepted contract `8854562dda920f583e6cc1d80de51f6add6d7ba9`. TORI-005 base `4c035cd75f63c68bd002dee5683ca3fa02e778cf`. The independent checkout started clean and detached.
- Node `22.13.1`, npm `11.19.1`, Vite `6.4.3`, Svelte `5.57.0`, Playwright Core `1.63.0` and Chromium `153.0.8010.12` on Windows. The product install used all 16 VICT `0.4.0-rc.1` tarballs, copied into this checkout and verified against their lockfile SHA-512 integrity values. `node_modules` and the VICT package directories were ordinary directories. Lock blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310`, file SHA-256 `81662465b62c7f2dca9f38557eab724f82a9e11a5b5d73ea9fda29a2077d7140`. [Source and archive pins](../authoring-foundation/dependencies.json)
- Memory provider fixture blob `3b8f5faafe25bf2a763d34c774e566371a17f565`, browser driver `bc663cd7fe5a4a08a2362d3b459808f6b13bf621`. Synthetic data and disposable stores only. The two browser sessions used loopback ports `48841` and `48842`. L evidence was outside this verifier's assignment.

## Findings

| ID | Evidence | Observation |
| --- | --- | --- |
| I1 | D | “Remember means to recall.”, “Remember is a verb.”, “Remember that synthetic preference only for this reply; do not store it.” and “Would you remember the marker if I asked you tomorrow?” each produced a pending confirmation and zero committed records. The required outcome is zero grants. |
| I2 | D/S | After a slow deterministic draft completed on the server, I held the terminal response to the 390 × 844 browser. The visible Stop button sent the matching Session and Run. `/stop-turn` returned `not-running` and the released response exposed the pending proposal again. Browser Run `c7ec3c7b-6d39-4e94-95ee-7452e58247f3`. |
| I3 | D | With an approved synthetic actor-directory fixture and a second SQLite handle holding `BEGIN IMMEDIATE`, the authorization read observed active at epoch ms `1794491123356`. The actor was disabled at `1794491124159` while SQLite waited. The receipt committed at `1794491124214`. Subsequent inspection was denied and replay returned 403, with the row already committed. Run `f5ff4fca-835c-4b2f-985d-5e2baca60b80`. |
| I4 | D/S | After forgetting, the original draft Run `4fc138e0-673c-4dd3-8af0-7ff966095af9` retained its content-free saved receipt but reported no current status for that saved record. The older recall Run rendered the tombstone. The original save Run should also show the record is forgotten. |
| I5 | S | The public saved-memory Select allows its empty “Choose an option” row. After choosing it, Configure showed a blank selection while reopening restored the canonical `governed@1` value. The empty row should be unavailable or handled by the canonical field transaction. |

## Verified on this candidate

- The normal Studio flow saved memory `0acbbb61-89b5-432f-8040-ba0558386bb0` r1, recalled it with three bullets after restarting Studio in a fresh Session and admitted zero under a history-only activation. It corrected to r2, recalled it with two bullets and admitted zero after Forget and again after restart. The contextual proposal cited both the source and request messages and preserved the operator's correction verbatim. The 10-message normal history window and longer authorized drafting context were separately exercised. The multi-record fixture recorded omissions in both Run details and the memory panel. The draft field measured 13.78:1 contrast.
- The deterministic suite verified actor, project and agent isolation through the trusted fixture and same memory store, static actor disable and revocation on an older activation, policy-off behavior, denied model/tool writes, active-turn Stop, exact receipt replay and payload conflict. Forced receipt insertion failure rolled back the record. The budget test verified newest change first, stable ID ties, UTF-8 byte accounting and last-used timestamps.
- The independent host probe deleted a source Session and still admitted its saved preference with source references. Correction preserved authorized r1 provenance. Removing the active r2 row in the disposable store gave zero admissions and `storage-unavailable` in the panel and Run. Forget then removed the remaining revision, both content strings were absent from the closed saved-memory file, and the old admission retained a content-free tombstone. Memory `3333ad88-e7b4-498a-a1e7-21d78c7f1859`, damaged Run `466c7013-b392-4dba-80e3-4f35df2a40dd`. The injected fault used `PRAGMA secure_delete=ON` so the fixture itself did not create residual copies.
- The backing probes reproduced the documented SQLite fallback. VICT `@victframework/mastra` rejected the resource-scope field and Mastra accepted an invalid programmatic revision. The LibSQL retention probe removed one old thread and message while preserving the saved resource row across reopen. The isolated write/receipt probe reconciled once and exposed zero memory-write tools with native writes disabled. Installed Mastra core `1.64.0`, memory `1.28.2` and libsql `1.22.3`. [Backing evidence](PROBES.md)

## Installed UI inventory

The browser and installed source agree on these public exports, all `0.4.0-rc.1`. The checks covered desktop 1531 × 850 and narrow 390 × 844, with keyboard focus and narrow touch on the correction/confirmation path.

| Surface | Roles and installed exports exercised |
| --- | --- |
| Shared shell and unavailable Workflows/Creative | `ui-svelte/primitives` `Menubar` and `Button.Root` for menus and task buttons. Workflows and Creative were disabled buttons and had no task-specific controls. The narrow panels and confirmation dialogs used public `Dialog`. |
| Agents Configure and Canvas | `ui-svelte` `Select` for the history and saved-memory choice plus model/output choices, `ui-ai-svelte` `Input`/`Textarea` for editable fields, `ui-svelte/catalog/dropdown-menu` `DropdownMenu` for node actions, and `ui-flow-svelte` public Flow components for the connected node, edge, port and resize roles. Configure/Canvas edits shared undo and redo. I5 describes the empty option state. |
| Sessions | `ui-ai-svelte` `Conversation`, `Patterns.PromptInput` and `Textarea` for chat, send/Stop and confirmation/correction text. `ui-svelte` `Button`, `Feedback` and `StatusBadge` for confirm/dismiss/correct/forget, recoverable 1,025-byte validation error, and outcome. `ui-svelte/primitives` `Dialog` for correction and forget. Escape returned focus to the invoking correction button on narrow. |
| Runs | `ui-svelte` `Button`, `StatusBadge` and `Feedback` for inspection navigation and admission states. Zero, admitted, budget omitted and forgotten evidence were visible in the browser. The browser fixture labelled the simulated route. I4 describes the original save Run. |

## Commands and results

| Command | Result |
| --- | --- |
| `npm ci --no-audit --no-fund --offline` | 0, 413 installed. npm reported the known PostHog Node engine and esbuild install-script warnings. |
| `npm run build` | 0, Vite reported its chunk-size advisory. |
| `npm test` | 1, 17 passing and one A4 failure when overlapping Vite processes hit Windows `EPERM` renaming the dependency cache. The blocked test worker was stopped after the suite hung. |
| `node --test --test-timeout=90000 tests/a4.test.mjs` | 0, both A4 tests passed with the cache to themselves. |
| `node scripts/probe-memory-backing.mjs` | 0, expected probe outcomes FAIL/PASS/PASS and SQLite fallback. |
| `npm pack ./packages/memory --pack-destination <consumer packs> --ignore-scripts --offline`, then `npm install --offline --no-audit --no-fund --ignore-scripts`, `npm ls --all` and `node consumer.mjs` in the isolated consumer | 0 throughout. Installed package `@tori-studio/memory@0.1.0` saved, replayed the original receipt, admitted zero for the other agent and forgot. Local tarball SHA-1 `8d9b9e1a62c00ede8e4456743c35dcb661c709fa`. |
| `TORI_MEMORY_LIVE=0 TORI_MEMORY_EARLY=0 TORI_MEMORY_PORT=48841 node tests/memory-browser.mjs` | 0, full deterministic browser walkthrough. The Playwright module path used the separately installed read-only Playwright Core. |
| `node .local/adversarial.mjs`, `TORI_MEMORY_PORT=48842 node .local/independent-ui.mjs` | 1 and 1 with the findings above. The first adversarial harness run stopped before the timing cases due to its own cleanup after direct fixture damage. The rerun fixed the harness and kept both logs. |

Synthetic screenshots, wire observations, the control-role inventory and failed checks are retained under `.local` in `the detached verifier checkout`. Key files are `adversarial.log`, `independent-ui.log`, `independent-ui-a6cbb932/inventory.json`, `browser-48841/memory-observations.json` and the command logs. This verdict covers the exact candidate above and does not transfer to a follow-up product commit.

Public copy of verifier report commit 89cf463fc252df26e498cff052e0ca820ee27a34; the absolute local checkout path was removed.
