# TORI-009 review repair

TORI-009 is in Work Review for Radzi. The repair candidate is `bffe61268523360ea2d238383fc838645ecdd772` on `codex/tori-directive-foundation` under contract `69d0485ca78345fcca01dac8f991b3020f4b065a`. The 14 November Work discussion covers ordinary saved-memory recall and the reply guard. [Owner walkthrough](../WALKTHROUGH.md) · [Original Windows qualification](../REPORT.md)

## Confirmed revision and dated recall

Product `76022e09b58c22ae618f0361225ec058ab3b813b` confirmed two bullets at `2026-11-13T15:59:59.713Z`. The first ordinary recall after confirmation said it would use the earlier three-bullet request. The following English and Malay replies attributed the newly saved preference to last week without dated source evidence. In the original capture, `follow` happened before confirmation and `quiet` contains the three replies after confirmation. The original fresh Session used two bullets. [Preserved original live capture](../live-walkthrough.json)

The ordinary provider now receives the admitted revision's actual commit time and the host's Session and Run timestamps in UTC. It receives the earlier three-bullet request in the original transcript. The read-only guide applies the confirmed revision to standing preferences, respects a clear current-turn instruction and requires dated evidence when asked about a past conversation. The revision time establishes when the save committed. The source conversation retains its provenance pointer. The timestamp counts toward the existing 2,048-byte admission budget. [Classification and public controls](../CLASSIFICATION.md)

The exact-candidate walkthrough used live Coding with synthetic messages on Windows. The corrected proposal was revision 2. Its receipt saved memory `a4910d7d-5910-4fc9-8521-9f90f47a6e44` at memory revision 1, `2026-11-13T17:12:46.948Z`, 33 ms before the next Run began. The fresh Session used the same admitted revision. [Live walkthrough capture](live-walkthrough.json)

| Case | Original Session after confirmation | Fresh Session after process restart |
| --- | --- | --- |
| Which standing preference applies? | Identified two short bullets. | Identified two short bullets. |
| Give me an Orchid project update. | Exactly two bullet lines. | Exactly two bullet lines. |
| What we talked about last week, English | Said there was no record from last week. | Said there was no record from last week. |
| What we discussed last week, English | Distinguished the admitted format preference from the missing dated discussion. | Distinguished the admitted format preference from the missing dated discussion. |
| What we discussed last week, Malay | Said there was no record from last week and described the limits of the preference evidence. | Said there was no record from last week and described the limits of the preference evidence. |

All ten Runs settled Directive status `none`, with no save request, proposal or clarification. The exact live JSON SHA-256 is `3854f6465507dacb052eeb1d8fde4482ec49a422d036943b7379d377b32be843`. The replies use the supplied UTC clocks for date wording. The live driver checks storage, admission, format and selected text markers. The builder and verifier also read the actual replies for meaning. [Walkthrough driver](../live-walkthrough.mjs) · [Independent verification](INDEPENDENT.md)

## Reply integrity before confirmation

Replaying the earlier product through the Windows Studio stream reproduced four missed completed-save claims and two withheld benign quotations in 13 fixture cases. The missed statements were “Saved to memory,” “I've saved that,” “Saya dah simpan pilihan ini dalam memori” and “Pilihan anda telah disimpan.” In all cases the memory, revision, operation and save-attempt tables had zero rows and there was no save receipt. [Original validator execution](baseline-validator.ndjson) · [Original Windows Studio replay](baseline-guard.json)

| Exact repair check | Completed-effect claims withheld | Benign replies published | Before confirmation |
| --- | ---: | ---: | --- |
| Permanent Windows Studio provider fixture | 30/30 | 18/18 | Zero writes in all four tables and zero receipts in all 48 cases. |
| Fresh independent Windows HTTP fixture | 30/30 | 28/28 | Zero writes and receipts in all 58 cases. The public activity stayed waiting while the fixture held a provider frame before validation. |

The claims include terse acknowledgements, qualified English and Malay clauses, explicit memory destinations, and statements about what the saved item would be used for. The controls include quoted and fenced examples, negations, questions, external-product destinations and ordinary uses of “save.” A withheld reply produces no public assistant text and reports `TORI_MEMORY_REPLY_UNCONFIRMED`. The verifier also tested stale confirmation, exact receipt replay and retained admission after restart. Language coverage is limited to the measured forms. [Permanent fixture observations](reply-guard.json) · [Independent HTTP observations and earlier mismatches](independent-guard.json)

## Windows qualification

Windows 11 x64, build 26300, Node 22.13.1, npm 11.19.1, Playwright Core 1.63.0 and Chromium 153.0.8010.12. The lock blob is `746b69fbefb4a9123029f54ab4ca47a00aaa5310`. The isolated installation matched SHA-512 for all 16 locked archives and SHA-256 against the accepted manifest. The audit matched the installed public VICT 0.4.0-rc.1 UI exports to the roles used, including the confirmation Float, feedback, Buttons, fixed-choice Select and Run Details. [Archive manifest](../../windows/environment.json) · [Control audit](../CLASSIFICATION.md)

| Command or suite | Result |
| --- | --- |
| `node --test --test-concurrency=1 --test-timeout=480000 tests/*.test.mjs` | Exit 0 in 410.6 s on the exact candidate, 222/222, with zero failures or cancellations. All 16 Background recovery cells and three additional memory commit/reconciliation fault cases passed. |
| `node --test --test-concurrency=1 --test-timeout=240000 tests/directive.test.mjs tests/memory.test.mjs tests/provider-stream.test.mjs tests/assembly.test.mjs` | Exit 0, 14/14 on the exact candidate, including retention, Stop and late-output fencing, scope, legacy activation and admission budget. The fresh verifier ran the same four files and passed 14/14. |
| `npm run build` | Exit 0 on the exact candidate with the existing Vite large-chunk advisory. |
| `node tests/directive-browser.mjs` | Exit 0 on the exact candidate at desktop and phone sizes. Verified pending interpretation, corrected and saved cards, quiet ordinary replies, same-Session follow-up, and restart. The independent browser also opened actual Run Details. [Browser observation](directive-browser.json) |
| `node tests/memory-browser.mjs` | Exit 0 on the exact candidate. Exercised legacy save, correction, historical activation, quiet recall, Forget and restart. [Browser observation](memory-browser.json) |
| `node docs/evidence/directive-foundation/implementation/live-walkthrough.mjs --live-walkthrough` | Exit 0 on the exact candidate. Four format checks and six English/Malay recall checks with the live provider. |
| `npm pack ./packages/directive ./packages/memory`, scratch `npm ci --offline --no-audit --no-fund`, `node installed-consumer.mjs` | Exit 0 from separate Windows packed-artifact installation. Verified 204 default admission bytes and 243 dated bytes, exact replay and one versioned receipt. The checked packages match the exact candidate's package code. |

The packed Directive and memory SHA-256s are `c2587ed204a0de43aac739aedc0c54fd18cefe4204b2700b31b060e8820c6635` and `abc69db0b399b586ebde621799ed2a6582535e3a15bb965956dc41df79f76a58`. The independent interpreter blob `06708cf5a4c8956f92105ef98f575b010ab22813` and the policy, provider route, model and token allowance retain their original qualification pins. The 63/65 result and two measured timeouts belong to that qualification. [Packed consumer](../../installed-consumer.mjs) · [Recognition results and actual drafts](../REPORT.md)

## Earlier attempts and Review

The early repair's live driver rejected a correct Malay answer saying there was insufficient evidence (using `bukti`) at `5905e08`. A later driver rejected a correct answer that contrasted the applicable two-bullet preference with the earlier three-bullet request at `3b0b06e`. Both attempts stopped before restart and the partial outputs are retained. The current driver accepts those constructions with the same expected content. Earlier browser attempts coincided with Vite reloads while source files were edited. The `7b5ccf0` legacy Memory attempt used an occupied loopback port and never reached the target Studio. [Malay attempt](attempts/01-live-5905e08.json) · [Historical wording attempt](attempts/02-live-3b0b06e.json)

The original qualification and the fresh verifier's scoped PASS are available in Work. The independent report was committed at `2d0080d009e016dae319c49f77da4ac01e38001f` directly above the product candidate. Radzi's hands-on walkthrough and wording criterion are pending. Work declined a new run claim from Review, so the execution and evidence are recorded in the existing ticket's discussion. [Independent verdict](INDEPENDENT.md)
