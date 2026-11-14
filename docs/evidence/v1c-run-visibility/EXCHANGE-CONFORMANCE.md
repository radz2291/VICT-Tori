# Governed agent-to-agent exchange candidate probe

**Result:** Mastra mechanism and the synthetic shared reservation/Stop composition passed. The installed VICT adapter still has no shared exchange execution scope. This is a probe package for Radzi's separate VICT-change authorization.

Phase 0 selected the pending tool result and public tool-free Mastra step in [the installed-pin survey](EXCHANGE-PHASE-0.md), recorded on the TORI branch at `0559a39cc1a415ef40b4292dd6302f4e1acace99`. The first wiring is a live delegation. Runtime identities are asker and answerer. Each pair admits one request/response operation per question. Future fan-out/fan-in graphs compose independently authorized pairs.

## Reproduction and limits

Run `node scripts/probe-exchange-phase-0.mjs` and `node scripts/probe-exchange-candidate.mjs` in the pinned install. Executed on Linux Node 24.22.1 with Mastra 1.64.0, VICT 0.4.0-rc.1 and lock blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310`. Both scripts use installed public Mastra APIs and deterministic fixture models. The candidate keeps a synthetic ledger and receipts in-process, separate from the installed VICT adapter. No live provider, dependency upgrade, public endpoint, runtime feature or VICT repository edit was used.

The first harness attempt instrumented only the streaming model hook while invoking `generate`. The assertion correctly found zero instrumented answer calls. The final harness invokes and drains the selected public `stream` path. The expected ordinary step-limit diagnostic is part of the one- and zero-budget scenarios.

| Decisive test | Executed result / remaining proof |
| --- | --- |
| One answerer step left | One ordinary dispatch and one charged answer. The original asker received the tool result and completed in its same stream with two steps. The next ordinary answerer dispatch was refused before fixture model invocation. |
| Zero steps left | One initial ordinary dispatch, zero answer dispatches, a typed limit result to the original asker. No receipt claiming an answer and no subsequent ordinary dispatch. |
| Duplicate | A repeated operation joined the same in-flight promise. One question reservation, one answer dispatch and one synthetic successful receipt in the one-step case. Durable duplicate lookup, conflicting-body reuse and post-settlement replay are adapter acceptance work. |
| Stop and loss | Stop from either role while the answer was in flight produced zero successful answer receipts and no second asker model step. Existing TORI-007 process-loss reconciliation is referenced separately. A killed-process exchange-specific check of both original Run dispositions remains open. |
| Authorized data | The answer step had zero tools, received the synthetic allowed context and excluded the private answerer instruction. Only the allowlisted answer reached the asker. Production bilateral projections, current scope/revocation and response validation must be proven through governed ports. |
| Identity, deadlines and activation | The single original asker stream was consumed in-place and every observed run identity matched. The harness reuses paired absolute deadlines and refused a missing/wrong synthetic binding without dispatch. It did not force each deadline to expire, exercise real wiring/activation or allocate strict VICT sequences. Those are required end-to-end checks. |

Recorded counts, in order: ordinary calls / answer calls / asker steps / unique questions / successful synthetic receipts / refused later ordinary dispatches.

- One: 1 / 1 / 2 / 1 / 1 / 1.
- Zero: 1 / 0 / 2 / 1 / 0 / 1.
- Stop asker: 1 / 1 / 1 / 1 / 0 / 0.
- Stop answerer: 1 / 1 / 1 / 1 / 0 / 0.

## Proposed adapter change for owner review

- **Runtime/executor:** issue an opaque handle for a server-verified live wired pair of pinned occurrences. Bind both invocation/activation identities, original absolute deadlines and the current authorization relationship. There is no standalone inbound exchange endpoint. Key reservations by verified operation identity and immutable request contents. The same request joins/reads its disposition, while conflicting reuse is refused.
- **Mastra adapter:** keep the asker's tool pending and reuse Mastra's public one-step streaming for the answer. Use the answerer's pinned model and allowed context only. Disable tools, memory and transcript writes. One VICT-owned model-step reservation gate precedes ordinary and answer dispatches. It must also account for provider attempts/retries without treating a retry as a fresh granted step. Reserve the ask once in the asker's existing tool gate.
- **Cancellation and evidence:** propagate both Stops and the earliest original deadline to the pending exchange. Recheck authorization and liveness before dispatch and before delivery. Fence late results. Emit a closed, separately versioned exchange receipt carrying safe request/answer or typed refusal, both occurrence references, reservation, timing and disposition. Keep strict `vict.agent-stream@1` and its sequence owner. Recover orphaned exchanges through existing Interrupted/Uncertain reconciliation. Never use a recovered receipt to re-execute.
- **Release proof:** run the owner's six decisive checks from a fresh installed public consumer and one authorized synthetic live TORI delegation after separate adapter authorization. Include retry accounting, both expiry orderings, cross-scope and revoked admission, duplicate/changed body and lost-process cases. Preserve original stream and replay compatibility. The exchange cap is a separate policy decision.

The probe establishes a viable Mastra execution shape. The remaining change is VICT governance around that shape, and production conformance remains open until the authorized adapter and TORI integration are tested.
