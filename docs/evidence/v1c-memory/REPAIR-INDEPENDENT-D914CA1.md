# TORI-006 independent repair challenge at d914ca19

**FAIL for Groups A1 and A2.** Codex TORI-006 Repair Recheck <codex@users.noreply.github.com>, 13 November 2026. Local, deterministic evidence.

The detached candidate was d914ca19d874d1b90765f0ca9a593722a7a50941, tree b27fbec210b52bf090dc6d2311c0147ad6326353, from radz2291/VICT-Tori on codex/tori-v1c-memory-foundation. The only change since e2a412a596e14ee3e5d974c3392539a5534fe805 was the Windows clipboard line-ending assertion. The criteria were the [owner addendum](OWNER-REVIEW.md) at 129c6dca734b328d85cff5108ed47bdcef396998 and the [accepted base](../../implementation/MEMORY-FOUNDATION.md) at 8854562dda920f583e6cc1d80de51f6add6d7ba9.

The lock blob was 746b69fbefb4a9123029f54ab4ca47a00aaa5310 and the SHA-256 was 81662465b62c7f2dca9f38557eab724f82a9e11a5b5d73ea9fda29a2077d7140. The provider fixture blob was 8bae77ef93a625aef48be6cc598fd39c3a233de6 and the intent matrix blob was 622ae64ba5802eda070ce793d8d4700c3a3bf73e. On Windows with Node 22.13.1 and npm 11.19.1, the offline npm install returned ENOTCACHED and the exact online install added 413 packages with exit 0. The lock stayed unchanged. The independent host used the installed VICT 0.4.0-rc.1 packages, a new synthetic state directory and the fixture provider.

## A2. Ineligible requests generated pending proposals

In the exact candidate's host, the earlier em-dash rescission and the colon or sentence-final temporary examples had no draft or proposal. The following simple variations were each classified as explicit and non-contextual and produced a pending proposal. The verifier dismissed the proposals. Each Run had zero saved records and no receipt.

| Operator input | Expected reason | Run |
| --- | --- | --- |
| Remember that for the rest of this chat I want short notes. | temporary-request | 342789d4-92da-403c-b0f2-64fec3c56001 |
| Remember: for this conversation use short titles. | temporary-request | 3f6fcb93-6125-4178-b6cb-7cb03c2029b6 |
| Remember that I prefer short notes — on second thought don’t save it. | negated-request | f40ac810-bb34-43a4-995a-91ab21ccb551 |
| Remember that I prefer short notes. Actually, I don’t want you to save it. | negated-request | 5265f740-7f8e-4ab1-84ba-c24667a240f0 |

A negative preference, “Remember that I do not want long reports,” still produced a proposal as expected. Recall and reported-speech controls produced no proposal.

## A1. Unconfirmed claims reached both histories

The verifier created a separate Session per input and intercepted the provider locally. Each reply was delivered in two text deltas split across multiple network chunks. A follow-up ordinary turn exposed the assistant history sent to the provider. On an explicit memory turn the exact earlier claim, “I saved that preference permanently,” was withheld with TORI_MEMORY_REPLY_UNCONFIRMED. It produced no proposal, transcript reply or next-turn history entry.

| Provider reply | Operator intent | Run |
| --- | --- | --- |
| Your preference has been stored for future sessions. | Explicit | c8b97e0f-195d-4a93-844d-2f0a87ee20ab |
| I saved your project update preference. | Explicit | dcd67cf0-c103-4d90-866a-20100621d9d9 |
| Your preference is now in my long-term memory. | Explicit | 75526604-6d8c-4f67-a0e1-36c9b3c9c3a7 |
| I have updated your saved preferences. | Explicit | b0aa5cc8-496f-4efc-b6c4-19e7f7157b4a |
| I saved that preference permanently. | Negated | fa1f236c-3694-4702-a9c2-887bdf0f08e8 |

These five replies each appeared verbatim in the Session and in the next provider request's assistant history without a save receipt or record. The four explicit turns produced pending proposals. The negated turn, “Please don’t remember that I prefer blue cards,” produced no proposal. The ordinary character reply control remained in the transcript and next wire history.

The retained local command is node .local/host-challenge.mjs (exit 0, with outcomes in .local/host-challenge-observations.json). The command recorded behavior, including failures, without rewriting product or fixture files. The full browser, deterministic and build checks were deferred to the replacement candidate. This targeted report does not give a Group B verdict or a live-model verdict.
