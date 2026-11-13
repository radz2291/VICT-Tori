# TORI-008 Windows probe report

13 November 2026, Windows 11 x64. The fixed trial, transcript-size experiment and paired Studio turns ran against Z.AI Coding **GLM-5.3 Flash** with synthetic data. This is the decision package for Radzi. The Directive contract remains in review and the Studio product under test is unchanged. [Pinned Windows authorization](../WINDOWS-HANDOFF.md) · [Directive review draft](../../../implementation/DIRECTIVE-FOUNDATION.md)

## Decision requested

| Measure | Measured baseline / held-out | Proposed for owner selection | Tradeoff |
| --- | --- | --- | --- |
| Missed saves among valid save results | 0/61 (0%) / 0/6 (0%) | **≤5%** in each group, with **≥95% overall proposal delivery** from all expected saves | Valid-only misses conceal invalid responses. Baseline delivery was 61/65 (93.85%), below the proposal. Manual drafting remains important for missed eligible turns. |
| Unwanted proposals | 1/100 (1.00%) / 0/16 (0%) | **≤1%** in each group and zero on grant or protected-action cases | One quote became an unwanted draft. A tighter gate protects the quiet UI. With 16 eligible held-out cases, one error alone would be 6.25%. |
| Substantively incorrect draft text | 0/61 (0%) / 0/6 (0%) | **Zero** observed invented, omitted or changed meaning in each review set, with grounding checked per draft | This increases review effort and may favor a clarification. Surface wording and correctly grounded paraphrases can pass. Radzi should inspect the two held-out phrasing notes. |
| Clarification mismatches | 4/161 (2.48%) / 1/22 (4.55%) | **≤3%** in each group and zero interruptions on the agreed recall walkthrough | The held-out rate is above the proposal. All five mismatches were unnecessary clarifications, including the exact English recall walkthrough input in the baseline. |
| Invalid responses | 6/167 (3.59%) / 1/23 (4.35%) | **≤2%** per group | Both groups exceed it. All seven invalid responses consumed the experimental 768 output tokens. A longer timer alone leaves the observed token exhaustion unresolved. |
| Provider unavailable and coverage | 0/167 (0%) / 0/23 (0%); attempted 167/167 and 23/23 | **≤1% unavailable** per group, complete planned coverage for a qualification claim | Provider misses consume time without helping. Report them separately, and end the run on HTTP 401, 403 or 429. |
| Transcript read | 3/3 grounded proposals at each of 1, 4, 8 and 16 KiB. The evicted-source case clarified at 8 KiB. | **8,192 UTF-8 bytes** for the serialized authorized history array, with the latest message carried intact outside that cap | In this fixture, 8 KiB used 2,154 input tokens versus 4,040 at 16 KiB, about 47% fewer. Four KiB reduces cost further and evicts sources sooner. Keep complete authorized messages and stable IDs. A referent lost to the bound requires visible context-unavailable handling, with no substitute draft. |
| Interpretation deadline | Provider completion p95 14.251 s / 14.752 s, longest usable draft 20.165 s, longest valid result 25.274 s | **22 s hard limit from acceptance of the originating turn**. Target **≤15 s p95** across all attempted interpretations, including timeouts, while the conversational reply and next Send proceed independently. | A 22 s provider-only cutoff would retain all 67 delivered genuine proposals and drop one valid clarification. At 15 or 20 s it would retain 66/67. The 22 s product clock must also cover dispatch and local work. Verify it end to end after Float is independent. The existing ten-minute proposal lifetime still starts at turn acceptance. |

Use the same denominator definitions and report counts as well as rates when evaluating these values. The 25-case held-out group includes six save requests and one exact English recall duplicate from the baseline. The baseline also repeats prompt forms. These fractions describe this trial. A future rate claim needs a larger fresh held-out set covering contextual saves, quiet recall, varied transcript text and Malay or mixed-language scope. Review the [draft table](DRAFT-REVIEW.md) before selecting the values. The held-out group becomes development data if used for tuning. Zero unauthorized writes, zero non-operator calls and confirmation-time scope checks remain deterministic requirements.

## Fixed recognition trial

The first live execution used the exact classifier at 061d0ea, the original corpus and labels, one trial, temperature zero, a 30 s per-call cutoff and a 768-token output cap. The recognizer had no tools or save path. The two later additions to the harness export the same classifier for bounded-context measurements and distinguish unexpected tool or over-bound output from unavailable transport. The fixed file has no ambiguous generic errors. The sanitized per-case file records parsed output and metrics, with the invalid public bodies omitted by the original harness. The reported token counts are usage metadata. [Fixed capture](recognition.ndjson) · [Synthetic inputs and outcomes](cases.json) · [Rates](metrics.json)

| Quantity | Baseline | Held-out |
| --- | ---: | ---: |
| Cases, operator calls, non-operator cases gated | 173, 167, 6 | 25, 23, 2 |
| Valid coverage of operator cases | 161/167 (96.41%) | 22/23 (95.65%) |
| Expected saves lost to invalid / unavailable / unattempted | 4 / 0 / 0 of 65 | 0 / 0 / 0 of 6 |
| Unnecessary clarification among valid non-clarification cases | 4/151 (2.65%) | 1/20 (5.00%) |
| Missing clarification among valid expected clarifications | 0/10 (0%) | 0/2 (0%) |
| Strict/anchor flags among returned genuine proposals | 4/61 (6.56%) | 1/6 (16.67%) |
| First public interpretation text p50 / p95 | 4.439 / 11.612 s, n=161 | 4.937 / 13.284 s, n=22 |
| Interpretation completion p50 / p95 | 4.696 / 14.251 s, n=167 | 5.116 / 14.752 s, n=23 |
| Input / output / reasoning tokens in output | 42,140 / 38,212 / 36,185 | 5,935 / 7,132 / 6,817 |
| Coverage for input, output and reasoning usage | 167/167 each | 23/23 each |
| Observed model | glm-5.3-flash, 167/167 | glm-5.3-flash, 23/23 |

All 190 eligible calls were attempted and all eight ineligible cases dispatched zero calls. Each of the seven invalid calls used 768 output tokens, with 765–768 reported as reasoning and no public text event. Cap exhaustion is consistent with that telemetry. The original harness did not record the provider finish reason in these rows. Four invalid baseline cases were expected saves, including both spelling variants of the request for next month’s brief. The fixed labels retain those variants as saves. The date remains a substantive qualification if a future draft is produced. Reasons for the five clarification mismatches and the exact unwanted quotation draft are joined with inputs in the case evidence.

Both reviewers read every returned draft, 68 total. The five exact-text anchor flags were acceptable paraphrases. Held-out case 4 leans toward Indonesian in a Malay/English turn and emphasizes the next chat. Case 25 preserves two bullets and omits the budget, with a possible broad reading of “future updates” worth Radzi’s review. The cited message in case 25 still contains both the format and the excluded budget, so exact cited spans matter if the owner later chooses provenance snapshots. The independent reviewer and probe operator both scored the draft itself as preserving the intended Orchid referent. The earlier grammar matches 173/173 legacy labels and misses 6/6 held-out saves, with two missing clarifications. That comparison is deterministic and has no model draft-text denominator. [Verbatim draft review](DRAFT-REVIEW.md) · [Grammar fixture](grammar-fixture.json)

## Transcript read and placement

The context probe froze one synthetic referent and the same latest message before this extension ran. At each size the source appeared near the head, middle and tail in otherwise equivalent histories. The exclusion case removed complete older messages under an 8 KiB cap while keeping the latest message and all retained IDs intact. The live model returned a closed clarification when it lacked the source; actual product feedback remains for a later Studio test. [Frozen plan](context-plan.json) · [Exact context results](context.ndjson)

| History cap | Serialized history / authorized JSON / HTTP body, bytes | Input tokens per call | Completion head / middle / tail | Result |
| --- | --- | ---: | --- | --- |
| 1 KiB | 896 / 1,048 / 2,427 | 474 | 8.961 / 5.294 / 9.078 s | 3/3 grounded |
| 4 KiB | 4,045 / 4,197 / 5,828 | 1,204 | 4.012 / 4.455 / 5.448 s | 3/3 grounded |
| 8 KiB | 8,128 / 8,280 / 10,235 | 2,154 | 4.212 / 11.740 / 3.847 s | 3/3 grounded |
| 16 KiB | 16,277 / 16,429 / 19,032 | 4,040 | 10.060 / 6.887 / 5.021 s | 3/3 grounded |
| 8 KiB, source evicted | 8,150 / 8,302 / 10,257 | 2,147 | 5.135 s | 1/1 clarify |

The 13 context calls reported 25,763 input, 3,944 output and 3,437 reasoning tokens within the output total. First public text p50/p95 was 4.968/11.340 s. Completion p50/p95 was 5.294/11.740 s, both with n=13. At the 12, 15, 20 and 22 s provider-only cutoffs the fixed corpus would deliver 63, 66, 66 and 67 of the 71 expected saves, respectively. The 22 s cutoff would lose one valid baseline clarification at 25.274 s. These are elapsed-time filters on the observations, without new trials. This source placement experiment uses a single synthetic rule and repeated distractors. It gives a cost and latency comparison with limited evidence about broader transcript distributions.

The paired host probe used the existing Studio route, four new sessions, the same synthetic operator input, and order off/on then on/off. The first public text time is an observation bound from polling Studio activity every 15 ms. The host buffered the provider reply through its existing reply guard on all four turns. Each enabled turn made one separate legacy draft request after the reply. No writes were made. [Live host observations and exact replies](placement.ndjson) · [Paired harness self-check](placement-fixture.ndjson)

| Trial | Policy | First Studio text observed by | /turn returned | Draft provider elapsed | Next Send while draft pending | Next Send sampled after return |
| --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | Off | 10.200 s | 10.797 s | — | — | At 10.807 s, 200, reply completed |
| 1 | On | 4.787 s | 7.468 s | 2.101 s | At 6.039 s, 409 | At 7.470 s, 200, reply completed |
| 2 | On | 4.634 s | 11.171 s | 5.964 s | At 7.392 s, 409 | At 11.172 s, 200, reply completed |
| 2 | Off | 5.575 s | 6.135 s | — | — | At 6.135 s, 200, reply completed |

The legacy draft requests used 221 and 220 input tokens, 80 and 259 output tokens, including 31 and 214 reasoning tokens. Across the four ordinary requests, two draft requests and four subsequent Send checks, usage was reported in all 10 calls. Totals were 1,115 input and 1,663 output tokens, including 1,459 reasoning. The observed 409 and later success bound the acceptance window. Main reply latency varied across pairs. The result does not estimate a causal on/off latency difference. An enabled reply and a policy-off reply both used forward-looking language despite the injected reply guide. The current baseline couples the Send slot to draft completion and adds memory instructions to the ordinary reply context. Both are Float findings.

## Authorization, failure and Stop

- The recognition fixture gates the eight non-operator messages before dispatch. The live route and prompt carry no tool or write grant. Pinned Studio’s memory integration test ran an operator-requested governed read whose tool output contains a save attempt. It produced no memory request. The existing direct-turn host resolves the authenticated actor and Session separately from model/client text. [Focused evidence](validation.json) · [Memory and authority tests](../../../../tests/memory.test.mjs)
- The pipeline refused four forged confirmations, including an enabled draft with a forged operation and actor. Successful drafting without an operator confirmation yielded zero memories, revisions, operations and save attempts. The live paired host also left all four tables at zero. The pinned memory tests exercise expiry, dismissed and cancelled proposals, wrong actor/project/agent/Session, revocation, stale saved-memory revision, conflicting replay and exact receipt replay. New Directive proposal-revision enforcement remains a later product test. [Pipeline observations](pipeline-fixture.json) · [Live host rows](placement.ndjson)
- In the unchanged Studio fixture, the separate draft received a simulated HTTP 500. The ordinary reply completed, the reason was draft-failed, and there was no proposal or receipt. On Stop, the fixture released a valid-shaped provider response after its abort signal. The reply remained completed and the cancelled draft yielded no proposal or receipt. The existing host abort checks fence that publication. Those probes exercise legacy drafting, including its 409 while pending. [Pipeline observations](pipeline-fixture.json)
- The installed VICT activation fixture restored the exact referenced revision and failed closed on missing, substituted and tampered bindings. It did not exercise a new Studio binding. The existing pinned path retains pointer-only provenance while Radzi’s snapshot decision is open. The 30-day setting applies to the VICT dedicated Mastra messages and threads. Indefinite retention was refused by the installed public helper. Application-domain transcript pruning has separate evidence requirements. [Activation fixture](activation-fixture.json) · [Owner decisions](../../../governance/DECISIONS.md#directive-foundation-closure-decisions--13-november-2026)

## Windows reproduction and coverage

| Identity | Value |
| --- | --- |
| Product | fe25266c098840d98cdfa70bd5e4dcbf8a8f7d1d |
| Accepted memory | d49bedf362d3521bcbf714bc6be7a04b34289bb7 |
| Probe authority and fixed runner | 061d0ea0c70812a22c5d6c26a50e490c1dae2c32, recognizer blob 7cb3a1e41e05e6ac9beb30060c08cc44f00afa6d, corpus blob d13cd40be624e6f7c7f744aa358d4d626001706c |
| Unchanged lock blob | 746b69fbefb4a9123029f54ab4ca47a00aaa5310 |
| Host and runner | Windows 11 Home 10.0.26300 x64, Node 22.13.1, npm 11.19.1, Playwright Core 1.63.0, Chromium 153.0.8010.12 |
| Installed stack | Mastra core 1.64.0, LibSQL 1.22.3, memory 1.28.2, OpenAI-compatible connector 2.0.0, 16 VICT 0.4.0-rc.1 archives verified against lockfile SHA-512 |

Use an isolated checkout with the exact archives, disposable data, and the existing authorized Coding credential loader. The three live harnesses resolve it inside their respective processes. Only one fixed trial ran. Reproduction of that exact command uses the recognizer at 061d0ea with the probe loader. Stop all live work on HTTP 401, 403 or 429 before starting the next live command. The installed product and dependency manifests are identical to the pinned product. The environment manifest lists every archive's SHA-256, lock integrity and size. [Environment manifest](environment.json)

| Command or suite | Result |
| --- | --- |
| npm ci --no-audit --no-fund | Exit 0, 413 packages, npm install and engine advisories. No dependency substitution. |
| node --test tests/memory-intent.test.mjs tests/memory.test.mjs | Exit 0, 178/178. |
| node docs/evidence/directive-foundation/recognition.mjs | Exit 0, pinned connector and grammar fixtures. |
| node docs/evidence/directive-foundation/pipeline.mjs | Initial exit 1 on a Windows LibSQL teardown lock after all assertions completed. Exit 0 after probe-only teardown handling. |
| node docs/evidence/directive-foundation/activation.mjs | Exit 0, installed VICT registry and separate disposable resolver. |
| node docs/evidence/directive-foundation/windows-coding-loader.mjs --live | Exit 0, invoked the exact fixed recognizer with 198 result rows and two group summaries. |
| node docs/evidence/directive-foundation/windows-context.mjs --plan --context-probe and then --context-probe <fixed.ndjson> | Exits 0, 13 frozen rows and 13 live measurements. |
| node docs/evidence/directive-foundation/windows-placement.mjs --fixture and then <fixed.ndjson> <context.ndjson> | Exits 0, fixture self-check then two pairs on live Coding. |
| npm test | Initial parallel attempt hit EPERM renaming a shared Vite cache during A2 and stalled. Stopped that fixture runner. |
| node --test --test-concurrency=1 --test-timeout=360000 tests/*.test.mjs | Exit 0, 218/218, including all 16 recovery cells. |
| npm run build | Exit 0, 1,856 modules; Vite chunk-size warning. |
| node tests/a1-browser.mjs | Exit 0 on 48931, TORI_BROWSER_A2/A3/A4=1, capture fixture and live disabled. Nine model-budget captures and restart isolation. |
| node tests/v1b-browser.mjs | Exit 0 on 48932, TORI_V1B_LIVE=0. Disposable provider and data. |
| node tests/memory-browser.mjs | Exit 0 on 48933, TORI_MEMORY_LIVE=0 and TORI_MEMORY_EARLY=0, full disposable memory fixture and restart. |
| node docs/evidence/directive-foundation/browser/windows-warm-browser.mjs authoring | Exit 0 on 48934, warm the locally spawned synthetic host, then run the existing Authoring driver in fixture mode. |
| docs/evidence/directive-foundation/browser/windows-background.ps1 | Exit 0 on 48935 with TORI_BACKGROUND_STEP=full and fixture enabled. The script seeds Quellight/Research, terminates the exact fixture process and reopens the same disposable store. The first attempt failed the Research receipt assertion. Using the public tool name in the probe provider produced the governed read receipt on two reruns. Windows left the replacement fixture listening after the driver wrote its result. The operator matched its PID file, port and command line, stopped it explicitly, and confirmed the port closed. |
| node docs/evidence/directive-foundation/browser/windows-warm-browser.mjs assembly | Exit 1 on 48936. The old optional browser driver stops on the missing inspector-agent-name selector. Current Assembly and shared editing coverage comes from the passing A1–A4 driver. |

Set TORI_PLAYWRIGHT_MODULE to the installed Playwright Core package path for the browser commands. The fixture runs use fresh stores, loopback ports, fixed synthetic providers, and no live flags. The Background driver verified dropped start and observation acknowledgements, reattachment to the same Running Run, governed child read, Stop, restart without replay, a retained save receipt and uncertain-save reconciliation. [Validation totals and preserved initial failures](validation.json) · [Background browser observation](background-browser.json) · [Memory browser observation](memory-browser.json)

Receipt identities in published evidence are synthetic disposable records. The normalized LF SHA-256 values for the three live captures are 6b8045ddd5539ca09a114867814c90fd110358d19a108056487f7f40d27b9982 (recognition), aca6cacb64805bf5cfc90b2d38436a39c247753254e81d1112b94575c21dd697 (context) and e1e2ac9b89c87be5c2bf7c3ea4ffc688b2ba0a15fadc53c53ea4b442ef47cd5b (placement). Run score-windows-recognition.mjs with this directory to regenerate the review table, case evidence and metrics from the capture and semantic notes.

## Owner review

Select the quality thresholds, transcript read limit and interpretation deadline, and review the actual draft text and open provenance choice. The measurements support that decision and leave the failed quality targets and Float defects visible. Final contract pinning follows Radzi’s decision. The implementation scope, dependency pins, current activation behavior and TORI-007 review status were preserved.
