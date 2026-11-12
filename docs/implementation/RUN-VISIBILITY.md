# V1c Run visibility and specialist communication

**Status** Proposed slice contract for owner review.

**Baseline at drafting** TORI-005 accepted branch commit `4c035cd75f63c68bd002dee5683ca3fa02e778cf`, tested product `b349e547f4e144db47d63f89e0ef3c7c49db8c75`. The Background Foundation contract draft is `0d3d9238531586cc95de6c4ccdab60a923c4f610`. Its accepted product will supply this slice's implementation baseline. At handoff record that exact product and evidence commit, lockfile blob, and installed versions. The drafting baseline uses lockfile blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310`, `@victframework/contracts`, `runtime`, `control`, `mastra`, `store-sqlite`, `ui-svelte` and `ui-ai-svelte` at `0.4.0-rc.1`, Mastra core `1.64.0`, LibSQL adapter `1.22.3` and memory `1.28.2`. VICT packages use `6b420a3e9eada6f694cc2550debda7753316b5b3` plus control/contracts from `02c63c31f8f4dc42840fc8975927c98b21f30058`. [Lockfile](https://github.com/radz2291/VICT-Tori/blob/4c035cd75f63c68bd002dee5683ca3fa02e778cf/package-lock.json) · [Package provenance](../evidence/v1b/INTEGRATION.md) · [Background Foundation](BACKGROUND-FOUNDATION.md)

## Outcome

Choose how much activity you see on the same Run. Read a specialist's report with its input, safe result, receipts, budget and terminal reason. In a synchronous delegation, the specialist can ask its parent a question and continue the same work with the parent's answer. The Run timeline shows the linked question and answer and their actual outcome.

The accepted TORI-005 baseline pins parent and specialist activation revisions and execution settings. Direct and Authoring Runs show model steps and tool usage. Child Runs execute under their own pinned limits, with child budget and tool counts still missing from Run details. This slice fills that evidence gap and adds aggregate accounting. [Execution budget evidence](../evidence/authoring-foundation/EXECUTION-BUDGETS.md)

## Implementation decisions

### Detail levels

Persist the operator's choice as a local browser preference for the Studio workspace. Apply it when opening the same Run or its linked child. It changes presentation only. Record and retain the full permitted Run evidence and receipts independently of the level under the existing retention policy.

| Level | Presentation |
| --- | --- |
| **Quiet** (default) | Final message. Failures, denials and limit hits remain visible, at minimum as a badge on the collapsed activity group. A Run with no final message shows its known state and reason. |
| **Summary** | Final message plus one-line activity chips for sources read, delegations and step count when evidenced. Failures, denials and limit hits remain visible. |
| **Full trace** | Final message and all evidenced steps, tool calls and authorized results, timings, applied limits and terminal reasons, with correlated child Runs, receipts and gaps. |

### Working groups

Group consecutive evidenced non-final activity into collapsible phases such as **Working… (3 steps)** or **Working… (delegated: Research)**. Preserve identity through reconnect and level changes. Use actual step counts and child labels. An unavailable count remains unavailable. Keep activity after the committed final answer in a separate **Continued working** group linked to its actual Run. Use the established answer boundary and linked activity records to distinguish phases. Group states accept Background Foundation's Running, Finished, Interrupted and Uncertain outcomes and display their reasons. Duplicates and late events cannot reopen a settled group.

Use installed public VICT controls for the selector, badges and Accordion or Disclosure pattern. Use VICT tokens for composition CSS. A genuinely new primitive follows the [UI-exceptions process](../governance/UI-EXCEPTIONS.md).

### Event structure and reasoning

Check the installed artifacts at the exact implementation pin before relying on event fields. At the drafting pin, the VICT source declares per-stream `seq`, stream and turn IDs, optional `victRunId`, and tool requested, started, awaiting approval, completed and failed kinds. It has content and response boundaries. The normalized tool completion carries identity rather than the tool's full result payload, and the vocabulary has no model-step kind. Correlate the public stream with actual Studio Run/child links, step and timing evidence, and authorized tool/operation receipts to build groups and full detail. Validate sequence, correlation and answer-boundary semantics for pre-final activity, linked post-final activity, failure, and reconnect. A missing count, result or time is visibly unavailable. Record each exact missing field and affected acceptance check before proposing any extension. Preserve the closed `vict.agent-stream@1` contract and use a supported projection or versioned companion if needed. [Pinned event vocabulary](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/contracts/src/agent-stream.ts) · [Trace contracts §7](../specs/CONTRACTS.md#7-safe-event-and-trace-projection)

Public reasoning is shown as unavailable under R-VIS-01. VICT #3 is the requested parallel upstream priority for a public companion contract. Give groups an additive slot for any later authorized public reasoning blocks. V1c acceptance uses observed execution activity and receipts. Do not request, persist or display private chain-of-thought. [R-VIS-01](../evidence/v1a/R-VIS-01.md) · [VICT #3](https://github.com/radz2291/vict-02/issues/3)

### Synchronous child-to-parent question

Support Mode 3 in its synchronous form. Through the existing pinned delegation path, a child yields a typed question under its current invocation. The parent receives it as a delegation result, answers in its next step, and the child continues the same logical delegation with that answer through a supported VICT/Mastra continuation. Preserve both Run identities and correlate the exchange to the original invocation. Record the question, the authorized answer and the disposition through safe Run evidence and a stable receipt. The timeline shows **asked parent** and **answered** together. Record unanswered or cancelled questions as such. Keep the parent turn active while this exchange is pending and preserve the original pinned scope and deadline.

Set a hard cap of **one question-answer round per child invocation**. A second question is refused with a receipted exchange-limit reason and remains visible in Quiet. Count the accepted exchange under the original invocation so retries or continuation cannot reset the cap. The answer is information under the existing trust hierarchy. It grants no tool, scope or budget change. Derive identity and permissions from the pinned activation and trusted runtime scope. Duplicate or stale answers cannot be applied twice. Parent cancellation cancels the child and pending exchange. Child cancellation propagates to the parent waiting continuation, which settles with the cancellation reason and preserves the receipts.

Before dependent implementation, prove that the pinned public delegation and execution mechanism can return a question to the parent's next step and continue the same logical child work. Record exact pins, cancellation behavior and any unsupported continuation. Reuse installed Mastra/VICT mechanisms for the exchange. An unsupported continuation holds this criterion and is documented as a public API gap.

### Aggregate budgets

Keep the parent and child pins and enforce the aggregate parent envelope across both. Reserve work before dispatch using the available parent allowance and the child's own limits. Count parent work and child work once each, including steps consumed by the question and answer. Track model steps, admitted tool calls and retries according to the installed counters. Keep deadlines and any available token or cost limits tied to their actual governing policy. Show limits, consumed and remaining amounts, and the applicable stop reason for the parent total and the child contribution. Render missing provider usage as unknown. Reopening or continuing the exchange keeps its prior budget accounting. This covers the applicable remainder of CAP-11. [Budget contracts](../specs/CONTRACTS.md#9-budgets-automation-and-evaluations)

**Scope boundary.** This slice covers existing linked parent/child Runs and synchronous questions. Mode 2 and async Mode 3 belong to later work after Background Foundation is accepted. Wiring-level agent networks and handoffs are outside this slice. The existing governed runtime owns execution.

## Acceptance

D is deterministic verification, S is real Studio browser evidence, and L is a permitted live-model walkthrough. Label fixtures and preserve exact candidate, package, Run and receipt identities. Record pinned event and synchronous continuation findings before the corresponding implementation commits.

| Criterion | Evidence | Pass condition |
| --- | --- | --- |
| Detail level parity | D/S | Change Quiet, Summary and Full trace on the same saved Run, then reload. Verify local preference persistence and identical underlying evidence and receipts. Quiet exposes denied-tool, failure and limit badges. |
| Working phases | D/S | Group evidenced pre-final activity and separate post-final activity. Expand and collapse with public controls. Inject each recovery state, duplicates, late events and gaps. Assert stable identities and truthful states. |
| Stream and receipt boundary | D | Verify installed event kinds, ordering, tool and Run correlation, answer boundaries, and recorded result/step evidence. Show unsupported data and reasoning as unavailable. Identify exact missing fields against their tests. |
| Synchronous exchange | D/S/L | A child question reaches the parent's next step. The linked answer continues the same logical child invocation and the report includes the actual result. Full trace shows both messages and the receipt. A second round is refused and recorded. |
| Authority and cancellation | D/S | A question or answer that claims new authority grants zero additional access. Duplicate and stale answers leave one exchange. Cancel parent and child separately and verify propagation, no extra work and truthful dispositions. |
| Aggregate budgets | D/S | Exercise parent plus child counters across a question/answer, cancellation and a limit hit. Verify limits, consumed, remaining, stop reason and one count per operation, including after reconnect. |
| Companion owner walkthrough | L/S | Run a specialist delegation with a question. Switch all three levels on the same Run and collapse/expand the phases. Observe a real scoped denial badge in Quiet and verify the exchange and receipt in Full trace. |

Run the existing build and relevant regressions. Have a fresh independent verifier challenge the exact candidate before Radzi's review. Keep D, S and L evidence distinct.

**Stop conditions.** An unsupported installed event or continuation boundary holds its affected claim. Record the exact gap and continue unaffected work. Authority widening, incorrect cancellation propagation or unreconciled aggregate accounting blocks the affected path. A required dependency change is a separate decision with regression evidence.

## Proposed decision-register entry and Work handoff

Record Run visibility and synchronous specialist questions as the next V1c slice after background and recovery. Record the display-only preference, four-state grouping, one-round cap, and aggregate budget accounting. Carry VICT #3 as the requested upstream priority for public reasoning. On owner acceptance, open a separate Rolladice Work ticket and pin the immutable spec commit and applicable Work standard. Record the accepted predecessor product and exact package pins in the handoff. [Decision register](../governance/DECISIONS.md) · [Work protocol](../governance/ROLLADICE-WORK.md)
