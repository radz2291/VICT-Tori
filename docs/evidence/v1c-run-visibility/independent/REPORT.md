# Independent Run Visibility verification

**Whole-slice verdict: HELD.** The pinned public runtime cannot continue a child occurrence through a typed parent-question/answer exchange while preserving its accumulated authority, budgets and deadline. RV-06 and the corresponding question-policy, exchange-race and exchange-accounting clauses remain NOT DEMONSTRATED. This is a required product capability, not an optional test exclusion. Owner walkthrough and acceptance remain pending.

Verifier: `tori013-independent-verifier-20261114`, fresh delegated session `/root/verifier`. The verifier made no product repairs, upstream changes, dependency changes, live provider calls or publication. Builders and the orchestrator owned all repairs. The commit containing this report is the verifier evidence commit; the orchestrator records its full SHA in the integrated handoff.

## Exact lineage and environment

| Item | Pin / evidence |
| --- | --- |
| Repository | `radz2291/VICT-Tori` |
| Immutable contract | `8f1b68ecde71f3bd9dc2f90f9fd2fb09462256ab` |
| Inherited product | `bffe61268523360ea2d238383fc838645ecdd772` |
| First integrated candidate | `024afe5d7a9d72814d9aa12b7fe73fec71de6108`; superseded after replay finding; failed install retained |
| Fresh installed full-unit candidate | `78a410ffe5c26f0367b3dc51acf1dc359ec5b596` |
| Final candidate | `058e685acd00a97dfdf7b23e40585390c14c21e3`; product bytes from `77604bb87fed69d04fad7c37fc8bc7f553724529` |
| Final product/affected/browser rechecks | `cd415e07f2592d36d7ebb32317d7111fc01f7e76`, followed by test-only `058e685` for scoped A1–A4 navigation and final manifest/control recheck |
| Repairs after 78a410f | Exact same-Session accepted reply join (`5addd6be4ea17621728f5ae8865f9f27e4457483`), exact duplicate Outcome-message suppression (`77604bb`), V1b browser receipt-selector correction (`cd415e0`) |
| Host | Windows x64 `10.0.26300`, Node `22.13.1`, npm `11.19.1`, Playwright Core `1.63.0`, Chromium `153.0.8010.12` |
| Lock | Git blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310` |
| Dependencies | All 16 VICT archives `0.4.0-rc.1`; Mastra core `1.64.0`, memory `1.28.2`, LibSQL `1.22.3`; OpenAI-compatible connector `2.0.0` |
| Isolation | Fresh detached checkout and pinned `npm ci`; private disposable stores; independent browser ports 48931/48932; separate from manager ports |

The first three installs failed due to disk exhaustion / an uncached offline package. No executable verdict used those incomplete installations. Attempt 4 installed 413 packages successfully. [Attempt 1](ATTEMPT-01.md) and [attempt 2](ATTEMPT-02.md) retain the failures and attribution. There was no source alias into Studio for the independent package consumer.

## Independent commands and observations

The checked-in [qualification harness](qualify.mjs) runs the repository's candidate tests in isolated fixture mode. Its only adaptations are external launcher copies with verifier ports. Commands, exit codes, exact candidate and timestamps are retained in the evidence index. These are independently executed checks, not a reinterpretation of builder logs.

At `78a410f`:

- `npm ci --prefer-offline --no-audit --no-fund`: PASS on attempt 4.
- `scripts/run-visibility-manifest.mjs`: PASS; all 16 archive hashes/integrities, lock and tracked fixture/test/package identities recorded.
- [projection-challenge.mjs](projection-challenge.mjs): PASS across all 720 permutations of six source events, duplicates, filled gaps, stable groups, immutable inputs, terminal truth, wrong-actor filtering, rejected output/private-field withholding and unique accounting. [reproduce-prior.mjs](reproduce-prior.mjs) independently re-executed the exact old `024afe5` source and confirmed its red result.
- `scripts/probe-run-visibility.mjs`: PASS as a boundary probe; required continuation capability BLOCKED. Strict kinds number 13. Unknown question kind, correlation field and private reasoning are rejected. Reusing turn IDs calls `runTurn` again, starts sequence 1 again and admits a fresh `[allowed, denied]` tool gate. Installed public runner exposes activation and `runTurn`, without resume/answer. Repeated turns are not accepted as continuation.
- `scripts/probe-run-visibility-consumer.mjs`: PASS. Fresh npm-packed artifact SHA-256 `678dbac4519b313930bd6d6345dbae60d0c5539746a90b5d1bc0c4293e7c001b` installed in an independent consumer, resolved through `node_modules/@tori/run-visibility/index.mjs`, with zero dispatch.
- `node --test --test-concurrency=1 --test-timeout=480000 tests/*.test.mjs`: PASS, **232/232**, including all 16 recovery cases, Directive, Memory, Authoring and A1–A4 deterministic cases.
- `npm run build`: PASS.
- Actual governed receipt browser and labelled presentation-fixture browser: PASS at desktop 1531×850 and narrow 390×844. Same Run/receipts, local detail preference, keyboard groups, parent/child links and no overflow or extra dispatch were checked.
- Supplemental actual-control audit: PASS on Configure, Canvas Selection and narrow Configure. Two initial verifier-only toggle-selector errors were preserved before correction to the actual `Assembly / Selection` label.
- A1–A4 browser: FAIL on duplicate quiet step-limit sentence, independently reproducing the manager's finding. Both messages were visible; the problem was presentation noise, not hidden failure. Original red retained.

At `cd415e0`, the exact manifest, independent accepted-reply adversarial harness, 17 affected deterministic tests, production build, actual governed-receipt browser, desktop/narrow fixture browser, corrected V1b browser and full Memory, Directive, Authoring, Assembly and Background browsers passed. The same saved live parent result was independently re-read after restart and exactly matched its accepted reply. The later A1–A4 parent-link locator ambiguity is preserved; the full corrected A1–A4 browser and exact manifest passed at test-only successor `058e685`.

The final lineage changes only four product files after `78a410f`: `server/studio.mjs`, `server/workspace-actions.mjs`, `src/RunActivity.svelte` and `src/Studio.svelte`. The affected host/authoring/privacy checks and complete final browser set exercise those changes. All package and dependency bytes are unchanged, so the independently executed original 232-test full suite and installed consumer remain explicitly attributed to `78a410f`, with affected rechecks on final product bytes. `058e685` differs from `cd415e0` only in the A1–A4 browser selector; its manifest records the exact new test hash.

The manager separately reported a final full-unit run with 226 passing tests and a cancelled file at its 480-second timeout, then an exact `058e685` split recovery run passing 23/23 (including all 16 matrix cases). Those manager results and timeout belong in the aggregate report, not in this verifier's independent totals. The verifier's own full 232-test command completed without cancellation, followed by the final 17 affected tests.

## Findings and public controls

[FINDINGS.md](FINDINGS.md) records the replay defect, missing accepted parent report result, quiet duplicate and rechecks. The verifier did not repair the product.

Installed public VICT `Select` covers Activity detail and Parent questions; the latter is disabled because no supported continuation exists. The maximum-exchanges input is the public AI `Input`, disabled with proposed default 1 and range 0–2. Configure and Canvas show that unavailable policy; these controls do not claim activation enforcement. Public VICT Accordion, Button, StatusBadge, Feedback, Detail and existing Conversation/fields cover the presented roles. The installed exports were checked, then the actual controls were exercised; no new primitive or undocumented UI exception was accepted.

The final control audit also passed at exact `058e685`, including visible parent Final result, Configure, Canvas Selection and 390px Configure; public VICT Select/Input identities and disabled proposed 1 within 0–2 were checked. Four fixture provider calls and nine child event rows remained unchanged by view/control inspection. Its actual parent/child/revision identities and screenshots are in `artifacts/final/control`.

The disabled proposal does not satisfy RV-05's editable, saveable, activation-pinned question settings. Existing execution configuration, history, readiness and pin isolation retain their own regression evidence.

## Criterion verdicts

| Criterion | Independent result and limits |
| --- | --- |
| RV-01 | PASS for exact pins, strict-event and installed continuation/accounting probes; precise public gap recorded. |
| RV-02 | PASS for supported D/S display behavior on final product bytes. Manager live records were independently read, with no verifier live dispatch. |
| RV-03 | PASS for supported source-sequence ordering, stable groups, duplicates/gaps, post-answer boundaries, terminal truth and read-only replay. Old red and 720-permutation repair proof retained. |
| RV-04 | NOT DEMONSTRATED as a whole. Exact activation/revision, task, accepted result, tool/context receipts and links pass; F2 is repaired. Expected-result metadata and question exchange history are unavailable at the pin and remain explicit. |
| RV-05 | NOT DEMONSTRATED for required question policy editing/activation/pin enforcement. Disabled shared proposal is honest but cannot establish that capability. Existing authoring policy regressions are separate. |
| RV-06 | NOT DEMONSTRATED / external public capability BLOCKED. No supported child question → parent answer → original child continuation, and no live exchange receipt. |
| RV-07 | NOT DEMONSTRATED for exchange caps, duplicate answers, adversarial correlation and bidirectional exchange races. Strict unknown-event rejection and inherited cancellation/recovery pass do not substitute for these tests. |
| RV-08 | PASS for supported per-run and deduplicated combined receipts, unknown usage and absent shared cap; NOT DEMONSTRATED for question-exchange charging/reservation/deadline behavior. |
| RV-09 | PASS for strict original consumer, sanitized public evidence, rejected output/private-field exclusion and zero-dispatch replay/projection. |
| RV-10 | PASS for supported control inventory, keyboard and desktop/narrow views; final quiet repair rechecked. Proposed numeric policy is explicitly inactive and unratified. |
| RV-11 | PASS across the independently executed regression lineage: full 78a410f 232-unit/build, all 16 recovery cases; final product 17 affected tests/build and complete inherited browser suite, with corrected A1–A4 at exact 058e685. The entire original unit command was not rerun by this verifier at final SHA. |
| RV-12 | PASS for fresh checkout/install, independent public installed consumer and independent challenge. Package bytes unchanged by subsequent host/UI repairs; final manifest confirmed. |
| RV-13 | NOT DEMONSTRATED for full cumulative owner review. Final cumulative deterministic browsers pass; ten manager-executed synthetic live memory/Directive recalls and actual parent/child records independently read, including repaired existing parent result. Radzi walkthrough remains pending. |

## Live evidence attribution and remaining acceptance

The verifier made zero live provider/tool calls. It independently read the manager's existing synthetic capture (SHA-256 `563097129ca27378e65b1d31df226b0c6e01e0dcac27de2740f3825e559c285b`) and a read-only Studio snapshot. Five same-Session and five post-restart cases admitted the same memory revision, created no proposal/request, used two bullets for the preference/status prompts, and declined unsupported English/Malay last-week recall. The actual live parent and child were completed with two model steps and one admitted tool call each. Combined four steps/four attempts/two tools were observed; no shared team cap was invented. Those are manager-executed live receipts independently reviewed, not independently executed live qualification.

The original parent Run `4fa613bc-f0b5-4155-9dbe-0902a7eb9aea` had a null report final answer while its exact same-Session accepted assistant message retained `TOPIC-104`. The child `af5bb3fa-8de2-4572-a6e4-178dc031eded` retained its result. This concrete mismatch produced F2 and an orchestrator repair. The verifier then independently re-read both original records from the restarted `cd415e0` preview: the parent report exactly matches the accepted reply, with the same IDs and retained child result. No new Run or live dispatch was made by the verifier.

TORI-007 and TORI-009 remain in Review. The owner has not accepted this delivery, the proposed question bounds, or the cumulative walkthrough. No whole-slice PASS, private-reasoning support, physical reboot proof, durable restart continuation or live 2,048-output-cap proof is claimed. The narrow next dependency is a separately authorized public continuation/event/activation contract or an explicit owner scope decision; this verifier did not invent a second runtime to bypass it.

Signed 14 November 2026 by `tori013-independent-verifier-20261114`. Final supported regression/display/report subset verified with F1–F3 repaired; whole-slice **HELD** for the required clauses above. The verifier evidence commit changes documentation, synthetic evidence and independent test harnesses only.
