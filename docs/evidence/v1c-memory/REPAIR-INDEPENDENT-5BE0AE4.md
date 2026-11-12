# TORI-006 independent repair challenge at 5be0ae4

**FAIL for Groups A1 and A2. PASS for the Group B migration and activation checks.** Codex TORI-006 Repair Recheck <codex@users.noreply.github.com>, 13 November 2026.

Detached product 5be0ae43a3ac87ab60976a13b09157ce427fb89d, tree a2a2375a2d95cb105a1f7d04add9f37cc364ef92, from radz2291/VICT-Tori on codex/tori-v1c-memory-foundation. [Owner addendum](OWNER-REVIEW.md) 129c6dca734b328d85cff5108ed47bdcef396998 and [accepted base](../../implementation/MEMORY-FOUNDATION.md) 8854562dda920f583e6cc1d80de51f6add6d7ba9. The exact online npm install in this detached checkout used unchanged lock blob 746b69fbefb4a9123029f54ab4ca47a00aaa5310 and SHA-256 81662465b62c7f2dca9f38557eab724f82a9e11a5b5d73ea9fda29a2077d7140. Windows, Node 22.13.1, npm 11.19.1, installed public VICT 0.4.0-rc.1. Browser driver blob 5d3530d5d06f5b18b0db063a5f0acb2bf47b93ee, provider fixture ffa44bda5611ef65e7d87717ff9b427ee63f7e98, intent matrix f2854f26cb83f7292b55ed2ae96dc340f0fcf4c3, schema fixture b557f7be4499869dcc17a57083336dfd5d4e5bf0 and integrated memory test 7984b6b9b2f31075b5fc531387428c5011d6961b.

## A2. Temporary directives and explicit rescission

The four previously failed d914ca19 inputs now produced no drafts, proposals or receipts. Four additional inputs were classified as explicit and non-contextual. In the isolated host, each produced a pending proposal and zero saved records or receipts. The verifier dismissed each proposal.

| Operator input | Expected reason | Run |
| --- | --- | --- |
| Remember: use short titles in this chat. | temporary-request | c1b44cb8-355d-4106-a886-79652f169a07 |
| Remember that I want short notes during this chat. | temporary-request | ab38f14b-b94c-449a-9fae-90897769f7a7 |
| Remember that I want short notes until this chat ends. | temporary-request | d1979353-baf9-450a-b417-ba76af7d94d8 |
| Remember that I prefer short notes, but please do not put that in your memory. | negated-request | 530d81ac-8f51-47a7-b6c7-4290fbe76c34 |

## A1. Distinguish unconfirmed writes from historical recall

The same independently authored split-SSE challenge withheld all five claims that reached the transcript on d914ca19. The clean conversational control survived. Three further cases differed from the expected behavior. Each test had its own synthetic Session and made an ordinary follow-up turn to inspect the provider's next assistant history.

| Provider reply | Observed outcome | Run |
| --- | --- | --- |
| I’m saving that preference for future sessions. | Explicit request produced a pending proposal, zero receipts and this verbatim claim in both the Session and next provider history. | 3e21cb6f-9b8d-4fbe-a3a5-836111dced9e |
| We have made that preference permanent. | Explicit request produced a pending proposal, zero receipts and this verbatim claim in both histories. | 329636d1-4e66-4e31-ad18-fc8cd3616f11 |
| I remember that the last planning brief was due on Monday. | Ordinary historical recall in response to “Do you remember what the date was?” was withheld as an unconfirmed memory effect. The Run failed without an assistant reply. | bf06b644-bb99-4327-943f-a8e6b1ea75f0 |

## Passing checks and limits

- The deterministic regression suite passed 187/187 with node --test --test-reporter=spec --test-concurrency=1 --test-timeout=150000 tests/*.test.mjs. The production build passed with Vite's chunk-size advisory.
- The installed Chromium browser suite passed on loopback 48839 with Playwright Core 1.63.0 and synthetic provider state. The local captures are in .local/browser-5be0ae4. The over-interpreted card Run dabbeedb-0cab-4173-ba93-708c91be625d persisted under its own turn and the fresh Run d3d26b7e-3bed-4da1-8d3a-f03524b956b0 admitted the exact correction. The browser suite covered 1531 × 850 and 390 × 844, keyboard focus, Dismiss, Stop, reopen and the repair vocabulary controls.
- The verifier archived the shipped 2e95a06639244b78b7f00d190b85e303eb1b55df source into a local scratch directory, used it to generate a real version-0 SQLite store and three immutable activation records, then opened the same state at 5be0ae43. Three memory headers, three revision rows, five operation receipts and all activation records were preserved. The new schema and a fresh store reported version 1. Empty lineage and organizer off were effective. Recall Run 0ec9f977-7f07-427c-a8ef-0f1b344d7654 admitted only revision 2 for memory 99673e49-dd16-4c14-9235-ebe04a890dd5. The old history-only Run 5a1ba7a3-2ef8-42ab-8159-a32445a327b3 admitted zero.
- Already retained pre-repair Session messages still show the old proposal sentence and the old provider draft JSON can still appear in that historical Mastra thread. The new-turn checks used fresh Sessions. The review used deterministic fixtures and no live provider credentials.

Local repro commands node .local/host-challenge-expanded.mjs and node .local/baseline-upgrade.mjs both exited 0 as observation harnesses. The former records its discrepancies explicitly. Logs and synthetic observations remain in the verifier checkout.
