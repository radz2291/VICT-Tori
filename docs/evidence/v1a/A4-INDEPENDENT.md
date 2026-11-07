# A4 independent verification

**Independent verdict: PASS with one minor presentation finding.** Candidate `e94e2b7c903263bc62a7c2ae0bc52edaa56638fd`. A4 remains in owner Review. The fresh verifier, `/root/a3_verifier`, matched all 99 tracked blobs and all 16 [VICT tarball hashes](vict-artifacts.json). A clean `npm ci` in the isolated verifier checkout installed 413 packages from the unchanged lock using Node 24.15.0 and npm 11.19.1.

| Criterion | Independent result |
| --- | --- |
| Pinned structured output | Valid JSON passed `tori.output.finding@1`. Malformed text and a syntactically valid object with an extra field failed with `VICT_AGENT_STRUCTURED_OUTPUT_REJECTED`. The extra-field canary produced no accepted assistant message or artifact in the Studio domain database. After reopen, the rejected Session still refused a follow-up before a second provider request. |
| Authorized delegation | One child completed under the pinned activation, with one model step, no tools and a separate temporary thread. The parent received the bounded child result. The child Run references the parent Run, VICT turn and governed invocation. |
| Unauthorized delegation | Revoking the grant produced `TORI_CHILD_SCOPE_DENIED` and no child Run. |
| Parent cancellation | The Studio host deadline cancelled the real governed parent turn with `TORI_TURN_DEADLINE`. The child model had already entered and observed the inherited signal abort. The child Run settled as cancelled with `response.cancelled`, the same parent and invocation identifiers, and no model continuation. There was one outbound parent model request. |
| Bidirectional Run links | The A2+A3+A4 Playwright suite opened the child from its parent and returned to the parent. The [completed Run receipts](a4-independent-linked-runs.json) match the VICT turn and invocation IDs. |

The [supplemental harness](a4-verifier.test.mjs) substitutes a stalled offline child model and deterministic provider responses. It runs the actual Studio executor, VICT cancellation and persistence. To reproduce, copy the harness to the root of the exact candidate checkout and run `node --experimental-test-module-mocks --test a4-verifier.test.mjs` under Node 24.15.0. The [supplemental receipts](a4-independent-receipts.json) contain the synthetic correlation IDs and counts. The module mock flag is required for this probe. The candidate's own test suite requires no module mocking.

The child Run Agent row displays a bare `r` suffix because it renders the parent-style draft number instead of the child revision field. The child activation and both Run links remain visible. This is a presentation finding on the reviewed candidate.

The sequential candidate suite passed 11/11. The two supplemental probes passed. The unmodified Playwright 1.63.0 browser ran with `TORI_BROWSER_A2=1`, `TORI_BROWSER_A3=1` and `TORI_BROWSER_A4=1`. The production build passed with the existing chunk-size warning. All requests used deterministic fixtures. The [builder report](A4.md) gives the running review route.
