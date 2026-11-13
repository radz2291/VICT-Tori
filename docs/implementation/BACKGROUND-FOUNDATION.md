# V1c background foundation

**Status** Accepted for implementation on 13 November 2026. Radzi confirmed TORI-006 acceptance and directed the Background Foundation handoff.

**Baseline** Accepted TORI-006 Memory Foundation product `d49bedf362d3521bcbf714bc6be7a04b34289bb7` and evidence branch commit `9873f93db1ceea87dfbead6283afd88f5b1b71a3`. Start from that evidence commit on `codex/tori-v1c-background-foundation`. The Memory Foundation contract is `8854562dda920f583e6cc1d80de51f6add6d7ba9`. Saved memory uses the accepted dedicated SQLite backing. The pinned `package-lock.json` blob is `746b69fbefb4a9123029f54ab4ca47a00aaa5310`. VICT packages, including `mastra`, `runtime`, `contracts`, `control`, `store-sqlite` and installed public UI packages, are `0.4.0-rc.1`. Mastra core is `1.64.0`, LibSQL `1.22.3` and memory `1.28.2`. The VICT artifact set uses `6b420a3e9eada6f694cc2550debda7753316b5b3` plus control/contracts from `02c63c31f8f4dc42840fc8975927c98b21f30058`. [Accepted product and evidence](../evidence/v1c-memory/AUTHORING-DISCOVERY.md) · [Lockfile](https://github.com/radz2291/VICT-Tori/blob/9873f93db1ceea87dfbead6283afd88f5b1b71a3/package-lock.json) · [Package provenance](../evidence/v1b/INTEGRATION.md) · [Memory Foundation](MEMORY-FOUNDATION.md)

## Outcome

Start an authorized companion Run, leave Studio and return to its result or current state. The Run owns its execution independently of the browser connection when the host stays alive and the pinned mechanism proves this behavior. In the same tab, a fresh tab or after a restart, Studio uses exactly four states for an accepted Run.

| State | Required evidence |
| --- | --- |
| **Finished** | Completion, result and applicable effect receipts are durably recorded. |
| **Running** | A current owner or verified recovered continuation is observable, with a cancellation path. |
| **Interrupted** | The Run stopped, its unfinished result remains explicit, and its effects are accounted for. The recovery path performs no silent retry. |
| **Uncertain** | An effect or step may have happened and its disposition cannot yet be established. Reconcile the original operation before retrying. |

Stop, deadline, refusal and failure are reasons on the applicable state. A connection warning or stream gap is a delivery diagnostic. Neither creates an additional Run state. Compose the states and actions from installed public VICT controls and use VICT tokens for composition CSS.

## Implementation decisions

### O-05 recovery matrix

The TORI-005 host repairs unconfirmed Runs to interrupted on startup, records no replay and locks ordinary interrupted Sessions. The Authoring dock restores its conversation and follows an active Run after refresh. Those proofs establish chat continuity and observation, and the current implementation baseline has no verified host-restart execution resume. Keep existing Session locks where safe continuation remains unsupported. [Host baseline](https://github.com/radz2291/VICT-Tori/blob/4c035cd75f63c68bd002dee5683ca3fa02e778cf/server/studio.mjs) · [Continuity evidence](../evidence/authoring-foundation/CHAT-CONTINUITY.md)

The matrix classifies work that was in progress when the fault occurred. A recorded completion with the required result and receipts resolves to Finished in every row. An unresolved effect takes precedence as Uncertain. Read the persisted Run, owner and operation evidence to make each decision. The memory column uses the backend selected and accepted in TORI-006.

| Fault | In-flight turn | Background Run | Memory save in progress | Pending child delegation |
| --- | --- | --- | --- | --- |
| Operator closes tab | Running if the original owner remains observable. Interrupted if transport teardown ended execution and dispositions are known. Inspect the original turn on return. | Running with the same Run ID and live owner when detach survives. Interrupted if owner stopped and dispositions are known. Inspect Run state and cancel on the original ID. | Running while the same operation is owned. Finished if the confirmed save and receipt committed, Interrupted on known abort or absent commit, Uncertain on unresolved commit. Query the operation record. | Running while the original parent or linked child owns the pending invocation. Interrupted if ownership ended and no unresolved effect exists. Check delegation intent and child Run/receipt before classifying. |
| Transport drops | Running if a live owner remains. Interrupted if it stopped with known dispositions. Reconnect by Run ID and cursor. | Running while the owner and cancellation remain reachable through the host. Interrupted if the owner stopped cleanly. Read the persisted Run and cursor after reconnect. | Reconcile by the original save operation ID. Finished on a committed record and receipt, Running with a live owner, Interrupted on proven no commit, Uncertain if unknown. | Reconcile the original invocation and linked child. Running if still owned, Interrupted if stopped with known dispositions, Uncertain if dispatch or an effect cannot be resolved. |
| Studio process exits | Running only after verified durable continuation has acquired ownership. Otherwise Interrupted with known dispositions or Uncertain if an effect is unresolved. Read the persisted recovery decision. | Apply the same rule to the exact Run and original owner identity. Resume only a supported persisted checkpoint. Record Interrupted when the pin cannot resume it. | Recover the durable operation record. Finished if reconciled committed, Interrupted if proven uncommitted, Uncertain if backing and ledger disagree or evidence is incomplete. Running requires a verified owner reconciling or continuing the same operation with known effect state. | Read the original delegation reservation, child Run and receipts. Running requires verified continuation of the original invocation. Interrupted on known stop or no dispatch, Uncertain on unresolved dispatch/effect. |
| Machine restarts | Apply the process-exit classification against the reopened persisted store. Observe the same Run ID and a real recovered owner before showing Running. | Finished from persisted completion or Running from a proven restart continuation. Otherwise Interrupted or Uncertain as supported by receipts. Prove machine-restart behavior separately. | Reopen the accepted backing and ledger, then reconcile the original operation. Finished on proven commit, Interrupted on proven no commit, Uncertain while the disposition is unresolved. | Reopen the parent/child records and invocation receipt. Running requires a verified recovered owner. Interrupted or Uncertain follows the original invocation evidence. |

### Execution ownership and reconnect

In the local single-process host, background means an accepted Run can continue with that process alive while its browser subscriber disconnects. Reuse the existing governed host execution path and installed Mastra mechanisms. Host or machine restart persistence is conditional on the probe for that fault. Keep existing interruption behavior wherever continuation is unproven. Use the same scope and pinned activation for cancellation and status access after reconnect. A new connection joins an existing Run. Resolve a lost start acknowledgement through its original identity without dispatching another Run.

Reconnect from the last acknowledged cursor with the installed VICT stream/replay boundary. Check authorization and Run/stream correlation, deduplicate by stream identity and sequence, and reconcile against the authoritative Run snapshot if a gap cannot be replayed. Show the gap and the known result. Do not synthesize missing text or milestones. A late or duplicate event cannot regress a settled terminal state. Uncertain can change only on a recorded reconciliation of the original operation. [Stream contracts §7](../specs/CONTRACTS.md#7-safe-event-and-trace-projection) · [Pinned VICT replay implementation](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/runtime/src/stream-hub.ts)

### Effect fencing

Current companion lookup/script operations are read-only. This slice fences the accepted governed memory write path and any already-authorized tool path that can mutate. Reuse stable operation and invocation identities with scope and payload validation. A proven commit returns its original receipt on replay. A proven non-commit can be retried only through the applicable explicit operation policy. Where action and receipt share an authority, commit them together. Across boundaries use the established durable operation record and prove reconciliation to committed or uncommitted before allowing retry. An ambiguous outcome stays Uncertain with its original identity and visible reason. Cancellation before the commit point prevents the effect. A settled receipt remains visible if the caller disconnects. [Accepted memory contract](MEMORY-FOUNDATION.md)

### Pinned Mastra conformance

Before product implementation commits, record exact installed versions, setup, fault injection, observed Run/operation IDs and separate results for:

1. Long-running agent execution surviving a lost subscriber while the host stays alive, then across a process restart with the same Run identity and verified ownership. Record machine restart separately if supported.
2. Supported suspend/resume semantics and cancellation at the pinned boundary, including what is persisted and whether resumption repeats a step or an effect.
3. Actual signal delivery and wake behavior under CAP-28, with observable identity and disposition.
4. Existing stream replay from a cursor, duplicate and gap handling, snapshot reconciliation and terminal state preservation.

A failed or inconclusive result limits the claim to proven behavior. Unsupported resume resolves to Interrupted when effects are accounted for. Adopt the installed mechanisms and record exact public API gaps. A durable executor or signal service implemented locally would be a separate architecture decision. [Roadmap](ROADMAP.md) · [Capability catalog](../specs/CAPABILITY-CATALOG.md)

## Acceptance

D is deterministic fault injection, S is Studio browser proof, and L is a permitted live-model walkthrough. Preserve exact pins, outcomes and receipts. Label fixtures and keep D, S and L distinct.

| Criterion | Evidence | Pass condition |
| --- | --- | --- |
| Conformance and O-05 | D | Record the probe results before dependent implementation commits. For all 16 matrix cells, fault-inject the claimed behavior with a persisted identity and authoritative evidence. Record any unsupported continuation explicitly. |
| Detach and reconnect | D/S/L | Close a tab and drop transport during a Run. Return via the same or a new tab. Prove the original Run is followed, can be cancelled while Running, and has one execution identity. |
| Restart truth | D/S/L | Interrupt Studio during execution and reopen. Assert the expected matrix state, preserve receipts and distinguish verified continuation from interruption. Fault-inject machine restart behavior for any claimed machine-restart support. |
| Effect reconciliation | D/S/L | Exercise faults before and after the memory commit and before acknowledgement. Repeat the completed operation identity. Prove one effect and receipt. An ambiguous outcome stays visible and refuses a retry until reconciled. |
| Replay and state | D/S | Check reconnect cursor, gaps, duplicates, reordered events, snapshot recovery and late terminal events. Exactly the four states are rendered, including interruption and uncertainty. |
| Companion owner walkthrough | L/S | Delegate a long task using the supported existing path. Close the tab mid-run and return. Restart Studio during a Run and inspect the observed outcome. Replay the original confirmed memory save and inspect its single effect and receipt. |

Run the existing build and affected regressions. A fresh independent verifier challenges the exact candidate before Radzi's review.

**Stop conditions.** An unsupported durable mechanism holds the affected resume claim. Continue with the proven matrix behavior. Unreconcilable effect uncertainty holds that effect path and its retry. A necessary dependency upgrade requires a separate decision with regression evidence.

## Proposed decision-register entry and Work handoff

Record O-05 against the accepted evidence matrix, including every verified durability boundary and unsupported resume case. V1c proceeds from explicit memory to background and recovery, then to specialist visibility and communication. Record the exact accepted product and evidence commits for this slice before preparing the next implementation handoff. The separate Background Foundation Work ticket pins the immutable commit containing this accepted contract and the applicable Work standard. Run the probes before implementation commits that depend on their results. [Decision register](../governance/DECISIONS.md) · [Work protocol](../governance/ROLLADICE-WORK.md)
