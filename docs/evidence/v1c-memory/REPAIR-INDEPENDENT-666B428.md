# TORI-006 independent repair challenge at 666b428

**FAIL for the TORI-006 Groups A and B checkpoint.** Two Group A requirements fail at product `666b428bc52e8a761b0c434c460fbab586f9aba0`. Signed off by **Codex TORI-006 Repair Independent Verifier**, 12 November 2026. Radzi owns acceptance.

## Candidate and dependency pins

- `radz2291/VICT-Tori` on `codex/tori-v1c-memory-foundation`. The verifier used a clean detached worktree with tree `42813bbbd4b5d96722b62c33d11b96b36dbce4f8`. The prior product was `2e95a06639244b78b7f00d190b85e303eb1b55df`. The [owner repair addendum](OWNER-REVIEW.md) is pinned at `129c6dca734b328d85cff5108ed47bdcef396998`, under the [accepted base contract](../../implementation/MEMORY-FOUNDATION.md) at `8854562dda920f583e6cc1d80de51f6add6d7ba9`.
- Windows, Node `22.13.1`, npm `11.19.1`, Vite `6.4.3`, Svelte `5.57.0`, Mastra core `1.64.0`, memory `1.28.2` and LibSQL `1.22.3`. All 16 local VICT archive SHA-512 values matched the lock. The installed public VICT versions were `0.4.0-rc.1`. The lock blob is `746b69fbefb4a9123029f54ab4ca47a00aaa5310` and its SHA-256 is `81662465b62c7f2dca9f38557eab724f82a9e11a5b5d73ea9fda29a2077d7140`. [Dependency archive identities](../authoring-foundation/dependencies.json)
- The default offline cache lacked `zwitch@2.0.4`. After verifying the lock matched, I copied the installed dependencies from the prior independent checkout into this worktree and excluded Vite caches. `npm ls --all --json` reported an installed `runed` peer range of Zod `^4.1.0` against the locked root Zod `3.25.76` in both independent checkouts. The host and store probes ran against the copied install with isolated synthetic data and a synthetic provider key.
- Provider fixture blob `e4be250099688b8fe7189df0bcea94f94e5214a6`, pinned intent fixtures `b2cb5244db96484cd0f832091439a128c5f0e90b`, intent test `5052c9a78f963d4cca4fb863ef43ac3517f50910` and schema test `b557f7be4499869dcc17a57083336dfd5d4e5bf0`.

## Blocking observations

### A1. An unconfirmed claim reached the Session and later assistant history

The independent host probe activated governed memory and sent `Remember that my independent challenge preference is amber.` I extended only the synthetic provider response in the verifier harness. The character reply emitted `I saved that ` and `preference permanently.` as successive SSE text deltas. The separate drafting request used the candidate's deterministic provider fixture.

Run `284150f1-2e44-4eb7-a24f-710fd4251825` completed. Session `80be76af-b713-4c6f-8710-97f9be4cb5ac` persisted `I saved that preference permanently.` as its assistant message. The turn had a pending proposal, zero committed records and no receipt. The next regular provider request for `Please describe the project in one sentence.` carried that claim verbatim in assistant history. The same run sequence withheld the existing fixture's `I've saved …` plus `Memory proposal` example with `TORI_MEMORY_REPLY_UNCONFIRMED`. The [provider's reply guard](../../../server/studio.mjs) covers several status phrases but misses the first-person simple-past claim exercised here.

### A2. A rescission and temporary requests produced pending proposals

All three inputs below reached the real Studio dispatch path. `memoryIntent` classified each as `explicit`, non-contextual. Studio made each proposal pending for its originating Run. The records list stayed empty because the probe left every proposal unconfirmed. The owner requires the current operator message to affirm the save intent before the host opens a proposal.

| Operator message | Expected | Observed Run |
| --- | --- | --- |
| `Remember that our marker is amber — do not save it.` | Ineligible, negated or rescinded request | `146c9238-fae3-482b-b705-7a50eb740c13` |
| `Remember this for this chat: The temporary marker is amber.` | Ineligible, temporary request | `7f30e932-29c9-440b-8bd1-701a113c70f5` |
| `Remember that I prefer an amber marker just for the rest of this chat.` | Ineligible, temporary request | `6c519f16-a21c-472b-999f-7d45cae38a4b` |

The control `Remember to send the amber note.` produced `memory-or-reminder` feedback with zero proposals for that turn and zero records. The pinned vocabulary suite passed its 147 cases, including both apostrophe forms and the untrusted origins. The failures extend the cases for the required rescission and temporary boundaries. [Intent implementation](../../../packages/memory/intent.mjs)

## Group B evidence

The schema tests passed for an unversioned store and a fresh version 1 store. An independent probe also produced a version 0 database by importing the exact legacy `index.mjs` and `intent.mjs` Git blobs from `2e95a06` and writing through the legacy store API. Opening and reopening it with `666b428` set `user_version=1`. The probe compared the original settings, five receipts, four proposals and three revision rows, including the exact multiline revision 2 text, prior revision content and the other actor's scoped record. The current and historical revisions, original save replay, uncommitted proposal and content-free tombstone survived both opens. All three record headers gained `derivedFrom=[]` and `compactedInto=null`. The active record was `d1a20f99-069c-4915-a910-d7a4d55120cf` and the tombstone was `0e08fd55-a8c1-4400-8ff9-64e7ccdeb2f5`.

The new governed activation `v1_d570a87cc0eb743aaba6c0c11805fc975737cd335df2d3599c14401b3e51369e` returned `memoryPolicy.organizer: off` at the host boundary. The exact old-activation and hidden-control checks remain for the next candidate walkthrough.

## Commands and retained results

| Command | Result |
| --- | --- |
| `npm ci --offline --no-audit --no-fund` | Exit 1, `ENOTCACHED` on `zwitch@2.0.4` after pinned archives were staged. The same-lock dependency copy above enabled the targeted checks. |
| `node --test --test-reporter=spec tests/memory-intent.test.mjs` | Exit 0, 148 passing including the enclosing test. |
| `node --test --test-reporter=spec tests/memory-schema.test.mjs` | Exit 0, two passing. |
| `node .local/independent-host-666b428.mjs` | Exit 1 on the A1 and A2 assertions above. The probe used Studio's dispatcher, the public runtime and a synthetic SSE provider. |
| `node .local/independent-real-v0-666b428.mjs` | Exit 0, real legacy version 0 migrated and reopened twice. |

The original synthetic harnesses and failed log are retained under `.local` in the detached verifier worktree. Host harness SHA-256 `0ec2642fcd55a552ed9fc08592cfb3a5fbf03ed358cb796291b5594f935af068`. Host observations SHA-256 `420776563d106eef5e0d76398d1fb19eaa610ae0526c1f33acb1b12654350e8a`. Migration harness SHA-256 `27015da207d513951a47468c0ac1a5aa96b5c8e2fdccda74c293ad8bc424dbae`.

Following the stage manager's direction after the host failures, the full build and desktop/narrow browser walkthrough are reserved for the replacement candidate. The installed-package source audit alone gives no browser verdict on turn placement, exact correction, Stop, Dismiss, focus, or presented public control roles. This is deterministic host and store evidence. It records no live provider, no Group C work and no owner decision.
