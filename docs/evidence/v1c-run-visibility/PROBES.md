# TORI-011 installed boundary probes

14 November 2026. Builder `tori-011-runtime-20261114`, baseline `8f1b68ecde71f3bd9dc2f90f9fd2fb09462256ab`. Windows Node 22.13.1, npm 11.19.1. VICT 0.4.0-rc.1, Mastra core 1.64.0, unchanged lock `746b69fbefb4a9123029f54ab4ca47a00aaa5310`. These probes precede the projection implementation. This is builder evidence, not an independent verdict.

## Public boundary

`node scripts/probe-run-visibility.mjs` passed. `@victframework/contracts` publicly exports `AGENT_STREAM_EVENT_KINDS`, `validateAgentStreamEvent`, wire-envelope validation and the schema marker. The exact 13 kinds are response.started, text.delta, content.completed, tool.requested, tool.started, tool.awaiting_approval, tool.completed, tool.failed, memory.updated, usage.updated, response.completed, response.failed and response.cancelled. Unknown kind `child.question`, unknown correlation field `parentRunId`, and a reasoning field fail validation. The parser/stream remain unchanged.

The public context carries stream, turn, thread, actor, agentProfileVersion, optional trace/VICT Run/activation/Mastra Run/invocation/attempt IDs and positive per-stream sequence. It has no timestamp or parent-child link; TORI must join its authorized existing Run receipts, record capture timestamps separately and never append invented stream fields. `content.completed` supplies a contentRef, not text. Tools supply identities and stable failure codes, not arguments/results. Authoritative run output and script/authoring receipts remain separate accepted records.

## Continuation challenge and blocked rows

`ProductAgentPort` and `PinnedAgentTurnRunner` expose `runTurn` only. `MastraProductAgent` exposes metadata, capabilityBudgetGate, flush, agentProfileVersion and runTurn. Outcome is completed, failed or cancelled. No public typed parent-question outcome, answer step, resumption handle or remaining-budget input exists at this pinned boundary.

The synchronous callback alternative was considered explicitly: an admitted child read-capability may await its callback while the original child remains running. That preserves the child occurrence. But its parent is already awaiting the delegation tool result. No public method injects an answer model step into that still-running parent's loop and existing budget scope. Calling the parent's runner again is a second turn invocation, not an answer within the original scope. Calling the private Mastra agent or provider directly would bypass the pinned public authority/budget mechanism and is outside this contract.

The executable challenge calls the same installed adapter/runner twice with the same turn, thread, Run and activation identities. Each starts sequence 1. Each capability budget probe returns `[allowed, denied]` at maxToolCalls 1; the next call again returns `[allowed, denied]`. This deliberately exceeds the gate to show its fail-closed state, and both outcomes are failed. Reusing IDs does not preserve the budget scope. Installed adapter source `dist/adapter.js` starts a new AsyncLocalStorage turn scope, full remainingToolCalls and sequence counter on each `runTurn`; public declarations offer no continuation argument. This is a negative capability probe, not a product continuation implementation.

Raw Mastra suspend/resume is a different boundary. The inherited Background [probe report](../v1c-background/PROBES.md) recorded same-ID raw resume re-entering a tool and no governed continuation API; raw crash recovery entered an effect twice. It does not satisfy this slice's parent budget, current authorization or original occurrence requirements.

**RV-06 is BLOCKED** at the pinned public VICT/Mastra boundary. Question-specific RV-05/RV-07 and live exchange portions of RV-04/RV-08 remain unproven. No exchange endpoint, second runtime, fake question receipt or enabled capability is introduced. Smallest future dependency: an owner-authorized public governed parent answer/child continuation contract preserving invocation identity, original deadlines, accumulated parent/child budgets and cancellation both ways. An upstream change or contract amendment is not authorized here. Continue the independent display/projection work.

## Projection interface checkpoint

The orchestrator approved `tori.run-report@1` before dependent implementation. Input is the already-authorized persisted Run and its authorized related Runs. New capture is `run.publicEvents: [{event,at}]` where event is strictly validated VICT public data; text.delta payload is not retained by the projection capture. Projection preserves the observation identity and capture order, deduplicates stream/seq, reports gaps/conflicts, uses content.completed as answer boundaries and never infers completion from transport. Historical label-only events remain explicitly historical and have no fabricated sequence/correlation.

`projectRunReport({run,relatedRuns=[]})` returns Run origin/state/final answer, groups, problems, summaries, specialist provenance/links, individual and combined observed budget rows, gap records and an unavailable public-reasoning slot. Null accounting means Unavailable. Combined caps/remaining are null and teamLimit is Not configured: individual caps never create an aggregate enforcement claim.

Existing source-backed counters are Run.modelSteps, providerAttempts, toolCalls or governance.admittedCalls, and usage token counts. Child capture needs the same execution pins and counters; the orchestrator owns server integration. Parent/child totals deduplicate by Run identity. A parent's delegation invocation and the child's own internal invocation are distinct admitted operations; no event replay is counted as a new dispatch.
