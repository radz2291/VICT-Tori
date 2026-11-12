# TORI-006 independent verification

**PASS for the independent deterministic and Studio scope of product `2e95a06639244b78b7f00d190b85e303eb1b55df`.** Signed off by **Codex TORI-006 Independent Verifier**, 12 November 2026. The stage manager holds the separate live-model evidence. Radzi owns acceptance.

## Candidate and pins

- `radz2291/VICT-Tori`, `codex/tori-v1c-memory-foundation`, clean detached candidate. Accepted memory contract `8854562dda920f583e6cc1d80de51f6add6d7ba9` and accepted TORI-005 base `4c035cd75f63c68bd002dee5683ca3fa02e778cf`.
- The fresh offline install used all 16 matching public VICT `0.4.0-rc.1` archives in the verifier checkout. Every archive matched its lockfile SHA-512 and the installed package directories were ordinary directories. Lock blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310`, SHA-256 `81662465b62c7f2dca9f38557eab724f82a9e11a5b5d73ea9fda29a2077d7140`. The lock stayed unchanged throughout the challenge. [Source and archive pins](../authoring-foundation/dependencies.json)
- Windows, Node `22.13.1`, npm `11.19.1`, Vite `6.4.3`, Svelte `5.57.0`, Mastra core `1.64.0`, memory `1.28.2` and LibSQL `1.22.3`. Browser runs used Playwright Core `1.63.0`, Chromium `153.0.8010.12`, desktop 1531 × 850 and narrow 390 × 844. Deterministic provider fixture blob `b2d37c6ae8a9e2b45fbb7099e31a1fa41b325f26` and browser driver `27e10cb499d7d9517ad8b12c47baa40490dfe439`. All data was synthetic and local.
- The original backing probes repeated the documented FAIL/PASS/PASS at these pins. The public VICT policy rejected Mastra's resource-scope field, the LibSQL saved-resource row survived retention, and the isolated reconciliation probe committed one receipt and exposed zero write tools with native working memory disabled. The accepted fallback uses dedicated local SQLite for saved memory. [Backing evidence](PROBES.md)

## Deterministic evidence at 2e95a06

| Criterion | Observation |
| --- | --- |
| Explicit save and recall | Normal save `68be4548-72fc-42b5-bf92-6560082fc3ba` admitted r1 in fresh Run `b70233e2-a51b-4a6e-9413-2d06871efe41`. The history-only activation admitted zero. The revised activation admitted the same record while authorized. |
| Exact scope and revocation | The same store and existing record gave zero cross-scope admissions, empty or denied inspection, and refused mutations through the actor, project and agent fixtures. Body-supplied scope fields could not select a scope. Disabled actor and revocation narrowed the older enabled activation. |
| Governed, repeatable writes | Nine negative, quoted-reference, temporary, recall-question and ambiguous challenge inputs produced zero proposals and zero writes. A vague demonstrative produced a clarification outcome. Tool and model-originated save attempts produced no receipt. The provider wire used distinct user-data blocks and exposed zero saved-memory write tools. A forced receipt failure rolled back the save. Identical replay returned the original receipt and a conflicting payload returned 409. |
| Cancellation and contention | Active-turn Stop, proposal expiry and late Stop prevented a save. Late-Stop Run `ae369b64-82e1-45df-ba44-daa9f0395bdb` went from pending to cancelled. Contended Run `d9900bc8-4726-4e62-93ec-e953467f7f7d` returned 503 with zero committed operations. Once the trusted fixture actor was disabled, retry returned 403 and inspection was denied. |
| Correction, missing storage and deletion | Correction made r2 and retained authorized r1 provenance. With r2 removed from the disposable store, Run `fa97a652-75b3-48d5-98ef-9b111872bcf7` and the list reported `storage-unavailable` with zero admissions. Forget removed remaining revision content and bytes for `c0b2cfa0-ae6d-4fbb-9250-6a8e8debe33b` and retained a content-free tombstone. Original save Run `9f44e361-3b6c-4ecd-9a33-15beae4be2e7` showed the original receipt and current forgotten status. Restart admitted zero. Existing Session conversation follows Session retention. |
| History, contextual draft and paging repair | The independent probe reached both windows and observed five/50 preceding user messages from the 10/100 history policies. The drafts received 19/109 authorized frames and cited the earlier source, including `4a177fa4-5814-4627-89aa-6fc194fc9860-user` in draft Run `c6b88233-e9b5-4958-b8e2-605a7e51308b`. The public store's raw default returned 40 and the adapted scoped read returned all 110. Explicit seven-item, page-only and unscoped requests matched the raw port. Another resource returned zero. VICT completed the application-domain and memory-store deletion steps for Session `7be0a0e7-884c-4140-990a-f0623411c4ab`. The raw thread and its 110 messages were gone. A new Session admitted separately saved memory `d9aee263-c982-4323-aa9b-74e1a9e38b10` in Run `a79945c5-1e8c-43f1-8b84-a9ee98019e60`. |
| Multi-record budget | The 2,048 UTF-8 byte admission budget used latest change first and stable ID ordering on ties. Actual admitted payload bytes, omission reasons, age and last-used timestamps matched store and Run evidence. |

## Studio evidence and installed controls

The full fixture walkthrough and the independent touch/focus probe ran on `53228b5a9a11668bba544a2958954182fab5babc`. The exact diff to `2e95a06` adds the public store adapter and updates Studio's server composition and the memory regression. A targeted diff confirmed identical `src`, browser driver, deterministic provider fixture, memory package, saved-memory host and lockfile bytes. The build emitted the same browser asset names. The final-candidate deterministic checks above reran the affected Session and persistence behavior.

The desktop and narrow walkthroughs saved memory `901ff5bb-2984-4099-a490-a99fbe974693`, recalled three bullets after restart, corrected to r2 and recalled two bullets, and admitted zero after Forget and restart. The original save and recall Runs showed the forgotten state. The contextual confirmation stored the operator's exact edit. The panel and Run both showed two budget omissions. The narrow delayed-response Stop cancelled the pending proposal. Touch confirmation recovered from a 1,025-byte error and Escape restored dialog-invoker focus. Configure and Canvas shared the selected policy through undo and redo. Choosing the empty row restored the canonical value and focus. View → Fit exposed the connected node in the narrow canvas.

| Presented surface | Installed public controls exercised at `0.4.0-rc.1` |
| --- | --- |
| Shell, Workflows and Creative | `ui-svelte/primitives` Menubar, Button and Dialog. The Workflows and Creative task buttons rendered disabled and had no task-specific controls. |
| Agents, Configure and nodes | `ui-svelte` Select for history, saved memory and other fixed choices. `ui-ai-svelte` Input and Textarea. `ui-svelte/catalog` DropdownMenu, Tabs and Accordion. `ui-flow-svelte` SvelteFlow, Handle, edge and resize roles. |
| Sessions | `ui-ai-svelte` Conversation, Patterns.PromptInput and Textarea. `ui-svelte` Button, Feedback and StatusBadge for confirm, dismiss, correct, forget, errors and outcomes. `ui-svelte/primitives` Dialog for correction and forget confirmation. |
| Runs | `ui-svelte` Button, Feedback and StatusBadge for inspection, zero and admitted memory states, budget omissions and historical outcomes. Browser evidence labelled fixture execution. |

## Commands and retained results

| Command | Result |
| --- | --- |
| `npm ci --no-audit --no-fund --offline` | 0, 413 packages from the pinned lock. Existing PostHog engine and esbuild install-script warnings. |
| `node --test --test-concurrency=1 --test-timeout=150000 tests/*.test.mjs` | 0, 18/18 at `2e95a06`, including the long-history test and existing A2, A3, A4, continuity and Research regressions. |
| `npm run build` | 0 at `2e95a06`. Vite emitted its existing chunk-size advisory. |
| `node .local/history-2e95a06.mjs` and `node .local/adversarial-53228b5.mjs` with HEAD at `2e95a06` | 0 and 0. The history harness reran both windows and the public port and deletion comparisons. The adversarial harness reran the independent prompt, scope, Stop, contention and missing-storage probes. |
| `node scripts/probe-memory-backing.mjs` | 0 on the original independent checkout with the same artifacts. Expected native probe failure confirmed the documented fallback. |
| `npm pack ./packages/memory --pack-destination <consumer packs> --ignore-scripts --offline`, `npm install --package-lock-only --offline --no-audit --no-fund --ignore-scripts`, `npm ci --offline --no-audit --no-fund --ignore-scripts`, `npm ls --all`, `node consumer.mjs` | 0 throughout on the independent `53228b5` consumer. The five VICT dependencies came from pinned local archives. Memory package files are byte-identical at `2e95a06`. Tarball SHA-1 `be06742bcc46d3179143a9451e29ec1796ec67bd`. |
| `node tests/memory-browser.mjs` with `TORI_MEMORY_LIVE=0`, `TORI_MEMORY_EARLY=0` and port `48843`, then `node .local/independent-ui-53228b5.mjs` on `48844` | 0 and 0 at `53228b5`. The second script captured the rendered control inventory, touch recovery and Stop timing. |

The failed original challenge is signed at `89cf463fc252df26e498cff052e0ca820ee27a34`. The failed 40-row regression at `53228b5` is signed at `dc9ef6294ecb4f4f93e4f5f92d3b162c254cd8f4`. The first `2e95a06` regression and history attempts failed at Vite startup with Windows `ENOSPC`. Both passed after space was recovered. The original logs, independent scripts, rendered screenshots and synthetic observations are retained under `.local` in `the detached verifier checkout`.

Public copy of verifier report commit b2a0701415132a2a4858f0c3d01af09c9c295d33; the absolute local checkout path was removed.
