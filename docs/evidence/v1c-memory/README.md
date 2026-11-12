# TORI-006 implementation and verification

[Accepted Memory Foundation contract](../../implementation/MEMORY-FOUNDATION.md) at 8854562dda920f583e6cc1d80de51f6add6d7ba9. Work owns TORI-006; Radzi owns the review decision. The clean prepared baseline was 9e642977593b616422471d8260b8e8c585c6c844 on codex/tori-v1c-memory-foundation. The original Studio and earlier review worktrees were not edited.

## Review preview

[Open Studio](http://127.0.0.1:48830/) on product **2e95a06639244b78b7f00d190b85e303eb1b55df**. Quellight r1 is ready in a clean, dedicated preview workspace. The build uses the existing approved local Coding connection.

1. In **Sessions → New Session → Quellight → r1**, send “Remember that I prefer project updates in three short bullets.” Review the draft, then choose **Confirm and save**. The saved state shows the exact text.
2. From the preview checkout run **./scripts/memory-preview.ps1 -Port 48830 -Restart**. Reload Studio, open a fresh Quellight r1 Session, and send “Give me an Orchid project update.” In the Session sidebar, expand **Details**, then **Inspect runs**. Scroll to **Saved memory** to see the admitted revision.
3. In Session **Details → Saved memory**, choose **Correct memory**, change three to two, and save the correction. A fresh Session uses revision 2. Choose **Forget memory** and confirm. A fresh Run shows **0 memories admitted**; older Runs retain their receipt and show **Forgotten**.

To create this preview in a clean checkout, run **./scripts/memory-preview.ps1 -Port 48830** and **node scripts/seed-memory-preview.mjs http://127.0.0.1:48830** after installing the pinned packages. The restart command preserves that checkout's .data/memory-preview store.

## Acceptance evidence at the product candidate

Windows, Node 22.13.1, npm 11.19.1, Svelte 5.57.0, Vite 6.4.3, Chromium 153.0.8010.12 with Playwright Core 1.63.0. The lock blob is 746b69fbefb4a9123029f54ab4ca47a00aaa5310. Deterministic provider fixture b2d37c6ae8a9e2b45fbb7099e31a1fa41b325f26, browser driver 27e10cb499d7d9517ad8b12c47baa40490dfe439, memory tests 71b028841bd782cf75440092824e56b2b8343361. The [package manifest](../authoring-foundation/dependencies.json) records the original artifacts.

| Accepted criterion | Evidence |
| --- | --- |
| Explicit save and restart recall | **D/S/L.** The browser confirmed the exact draft. Live memory 8caafbab-180a-4a1d-ae90-e90d90c597e2 r1 was admitted to fresh Run 8f5616be-98bd-4ccb-8815-2ce037370fd3 after a process restart; Quellight gave three bullets. A separate history-only activation returned zero while the record was still saved. [Live observations](live/memory-observations.json) · [Live recall in Runs](live/memory-run-recall.png). |
| Governed, repeatable writes and read-only enforcement | **D/S.** The suite checks the VICT gate, atomic rollback with a failed receipt insert, a held SQLite writer, actor disable before retry, restart replay, changed payload and stale revision. The fixture captures the actual provider request with no memory write tool. The narrow browser exercised Stop during generation and again when the server had completed the draft but the browser was still awaiting the response. Neither created a memory. [Tests](../../../tests/memory.test.mjs) · [Browser](../../../tests/memory-browser.mjs). |
| Trusted isolation and missing storage | **D.** The trusted actor, project and stable agent cases share one SQLite file. Each independent change proves zero admissions and no cross-scope correction, deletion or confirmation; the authorized control reads the record. A later activation of the same definition can recall it. Request-supplied identities are ignored. A removed current revision produces storage unavailable / memory missing with explicit Run evidence. |
| Correct and forget | **D/S/L.** Live r2 was admitted to Run 4e811961-86d1-4a4c-9ecf-82db7b9332e4 after correction and restart; the response used two bullets. The fresh Run after Forget and the fresh Run after another restart had zero admissions. The memory store held zero content rows for the forgotten record. Old [recall](live/memory-run-forgotten.png) and [original save](live/memory-save-run-forgotten.png) Runs showed Forgotten with content-free audit evidence. |
| History and UI | **D/S.** Configure, the Agent node and optional Memory Policy node edit the same values through one journal. Browser checks exercised Off / Governed Memory, separate-node projection, Undo/Redo and empty Select focus recovery. The exact product completed 54 exchanges and verified the regular 100-message window, context before that window, and Session deletion. The independent 10/100-message probes checked both windows and preserved explicit paging. Installed controls were audited at 1531 × 850 and 390 × 844. The confirmation field measured 13.78:1 contrast. [Configure](studio/memory-policy-configure.png) · [Canvas](studio/memory-policy-canvas.png) · [Narrow confirmation](studio/memory-narrow-confirmation.png) · [Narrow forget](studio/memory-narrow-forget.png) · [Zero admissions](studio/memory-run-zero.png). |
| Phrasing boundaries | **D.** Affirmative variants were accepted. Negations, literal and reported quotes, recall questions, temporary restrictions, definitions and tool-originated phrases produced no grant. Vague requests were held for clarification. The provider fixture challenged a fabricated write tool call. |
| Context-dependent save | **D/S/L.** The 10-message window excluded the early marker from regular replies; draft context included it. The deterministic draft deliberately omitted the deadline; the operator corrected it before confirming. The live proposal cited three messages and the edited text was stored verbatim in Run 6b285e45-8dae-4e4d-b3cb-546e1308d291. [Confirmed contextual draft](live/memory-context-corrected.png). |
| Multi-record budget | **D/S.** The fixture admitted two and omitted two in the 2,048-byte context budget. The unit probe fixes timestamps and IDs to prove newest-change ordering and stable ties. The [memory panel](studio/memory-budget-panel.png) and [Run Details](studio/memory-budget-run.png) showed omissions. [Deterministic observations](studio/memory-observations.json). |

D is deterministic verification. S is installed Studio browser evidence. L is the permitted live provider walkthrough. Live screenshots and observations are from the exact review product. The deterministic screenshot set is from 53228b5; the later product change only adapted the server's scoped Mastra history listing and extended its regression test. UI, fixture and browser driver bytes were unchanged. The updated runtime path was independently rechecked. The [original independent failure](INDEPENDENT-A6CBB932.md) and the [40-message barrier failure](INDEPENDENT-53228B5.md) apply to their named earlier candidates.

## Verification and review status

The [signed independent report](INDEPENDENT.md) is PASS for the deterministic and Studio scope of the exact product. Verifier **Codex TORI-006 Independent Verifier** recorded report commit b2a0701415132a2a4858f0c3d01af09c9c295d33. The stage manager ran the separate permitted live walkthrough. Owner acceptance remains open.

| Check | Result |
| --- | --- |
| Pinned backing probes | Command exited 0 with the required per-probe FAIL / PASS / PASS and documented SQLite selection before implementation. |
| Exact build and deterministic regression | Independent production build exited 0 with Vite's existing chunk-size advisory. Serialized Node tests passed 18/18 on the exact product. The focused builder run completed 54 exchanges, and the independent history probe verified full scoped retrieval, unchanged explicit paging, and complete Session deletion. |
| Exact live Studio walkthrough | Passed the 1531 × 850 and 390 × 844 browser paths using GLM-5.3 Flash on the authorized Coding route. A fresh Session used three bullets from r1, then two after correction and restart, and zero after Forget and restart. The context-dependent draft was edited before confirmation. |
| Desktop and narrow deterministic Studio | The full fixture walkthrough passed at 53228b5. The verifier checked the unchanged UI, lockfile and fixture bytes, identical build assets and rechecked the affected server behavior on the exact product. |
| Earlier browser regressions | A1–A4 fixture browser passed at 53228b5 with nine model requests, rejected invalid output limits and restart isolation. The exact product passed the installed Authoring browser walkthrough after warming an isolated fixture host; two cold attempts timed out before Studio rendered. The exact Node suite covered A2, A3, A4, Authoring continuity and Research. |
| Installed independent consumer | Passed using the packed @tori-studio/memory 0.1.0 and installed public VICT archives. The independently tested package bytes are unchanged in the exact product. |
| Documentation | Integrity check passed; this only verifies files, links and identifiers. |

The remaining review is Radzi's hands-on acceptance. This slice does not assert delegated, background, semantic or observational memory coverage.

## Storage and authority

The [three conformance probes](PROBES.md), recorded before the first implementation commit at 1d049825e658563ae2319e6341ed3acf2465a7cf, selected the contract's dedicated SQLite fallback. Session history stays in VICT's dedicated LibSQL-backed Mastra store. The saved-memory store has its own revision, pending proposal and receipt tables. It commits the confirmed content and operation receipt in one SQLite transaction. If another SQLite writer holds the lock, a mutation fails promptly; retry uses the same operation and rechecks actor authority. Its secure-delete setting and deletion checks cover the local memory file and its queryable contents; historical Session messages and independently retained backups follow their own retention.

A direct Session derives actor, project and stable agent definition from trusted host state and its pinned activation. The saved-memory setting is independently pinned in the VICT memory-policy artifact. Older activations keep their existing history window and have saved memory off. Native working memory and semantic recall are off. The host resolves active VICT authority and revocation at the memory boundary. A draft is uncommitted and expires ten minutes after the turn starts; stopping or dismissing it produces no saved revision. Stop also withdraws the pending proposal if the model completes while the browser is still awaiting the turn response. Only explicit operator confirmation invokes the versioned tori.memory.save capability. A repeated operation returns its content-free receipt, including after forgetting, without restoring the memory.

Drafting uses complete, authorized exchanges from the current Session and the current source message, up to a separately declared 64 KiB of serialized input. If the required context is missing or exceeds that bound, Studio asks for clarification. The regular conversation window remains 10 or 100 messages. The [public store adaptation](../../../server/mastra-session-store.mjs) uses the installed LibSQL unpaged read only for VICT's scoped durability check. It leaves explicit history paging intact. Without it, LibSQL's implicit 40-row page made a continuing turn fail when the thread outgrew that page. Drafting and recalled values are separate user-data blocks; the trusted instruction tells the provider how to use them. The model does not receive a saved-memory write tool. An activation with a pinned structured-output contract can recall, but does not draft through that incompatible reply contract.

Admission uses latest changed first, then stable memory ID, and measures the full saved-memory block against a 2,048 UTF-8 byte budget. A saved value can use at most 1,024 UTF-8 bytes; over-limit drafts or edits are refused with feedback instead of being truncated. Admitted records update last used. A missing current revision produces an explicit omission with its ID and revision. Run receipts capture the data attached to the outbound request and never claim that a failed or interrupted provider response used it. Stored Run evidence carries no memory text. Authorized inspection resolves content from the memory store; after Forget both prior admission and original save Runs retain audit references and show Forgotten.

The reusable implementation is in [the memory package](../../../packages/memory/index.mjs), with Studio-specific authority and projection in [the host adapter](../../../server/saved-memory.mjs). The [installed consumer](consumer/) uses the packed public artifact and VICT runtime without Studio imports.

## Reproduce

Use Node 22.13.1, npm 11.19.1, the pinned [dependency archives](../authoring-foundation/dependencies.json), and a Playwright installation with Chromium. Use a separate worktree, port and store for parallel Vite browser processes.

~~~powershell
npm ci --no-audit --no-fund
node scripts/probe-memory-backing.mjs
node --test --test-concurrency=1 --test-timeout=150000 tests/*.test.mjs
npm run build
python scripts/check_docs.py
$env:TORI_PLAYWRIGHT_MODULE = '<installed Playwright module>'
node tests/memory-browser.mjs
$env:TORI_MEMORY_LIVE = '1'
node tests/memory-browser.mjs
~~~

The live command uses the existing approved local Coding connection with GLM-5.3 Flash and synthetic inputs. It launches its own loopback host and disposable store. With TORI_MEMORY_LIVE unset, the same browser exercises the installed app with a deterministic provider. Neither command overwrites an operator preview.

For the installed package consumer, copy the [consumer files](consumer/) to a new directory with a packs/ folder. Copy the matching contracts, kernel, runtime and sdk VICT archives into it. Pack the memory package with **npm pack ./packages/memory --pack-destination &lt;consumer-packs&gt;**. In the independent consumer directory run **npm install --no-audit --no-fund** and **node consumer.mjs**. No package is published.

[Early owner walkthrough](OWNER-PREVIEW.md) · [Installed UI control audit](UI-AUDIT.md) · [Retained findings and repairs](FINDINGS.md)
