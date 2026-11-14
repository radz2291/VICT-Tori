# Mastra 1.64.0 exchange mechanism survey

Phase 0 for the 14 November owner decision. Exact installed Linux Node 24.22.1 inventory: Mastra core 1.64.0, memory 1.28.2, LibSQL 1.22.3, VICT adapter/runtime 0.4.0-rc.1. Lock blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310`. Core source tag peels to [c19a93b0956f957581931786645d0597efec41eb](https://github.com/mastra-ai/mastra/tree/c19a93b0956f957581931786645d0597efec41eb). Installed `dist/agent/agent.d.ts` SHA-256 `e97f9c0711d55e60e7a9cab8481b1e3c8115d3d03c7318f573d25fb4668a691d`. Product/evidence reviewed at `058e685` / `95b298a`. Linux runs are mechanism evidence. Windows acceptance is separate.

The exchange is one question and one response between pinned **asker** and **answerer** occurrences. The first composition wires a live delegated agent to its waiting caller. The seven columns below score native support against this governed composition. Partial means the underlying mechanism exists and still needs the stated governance or fails this particular wait ordering.

| Installed mechanism | Same invocation | Reserve shared budget before dispatch | Both deadlines | Once-only duplicates | Stop either way | Authorized context | Correlated receipt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Signal wake | New raw run for idle target | Fresh wake settings | No pair | No governed operation fence | Single-run abort only | Signal payload scope only | Routing acknowledgement only |
| Signal steer (active deliver by run ID) | Targets same raw run, delivery drains at next model boundary | Cannot unlock the waiting tool boundary | No pair | No governed reservation | Single-run abort only | Injects supplied payload, potentially into history unless transient | Routing acknowledgement, no answer receipt |
| Signal queue | Next-turn delivery | New turn | No pair | No governed operation fence | No linked cancellation | Thread input scope only | Queue acknowledgement only |
| Agent network / supervisor | Public `Agent.network()` routes primitives, not an answer inside a waiting governed turn | Router has its own execution | No paired governance | No governed exchange identity | No paired governance | Network composition is not VICT authorization | Native execution evidence only |
| Agent as tool | `AgentConfig.agents` / `SubAgent` supports nested execution. An ordinary awaited tool can retain its live caller | Tool admission and nested limits do not debit an answer from the waiting caller | Can carry an AbortSignal, needs pair binding | Tool occurrence alone insufficient | Cooperative abort, needs links | Subagent can inherit memory, so use explicit limited input | Tool result and raw run IDs are reusable |
| Suspend/resume with data | Same raw Run ID at a deliberate checkpoint, tool re-enters | No shared VICT reservation | No proof of original paired deadlines | Re-entry needs fencing | Durable engine offers raw controls | Resume data is input, not a permission check | Checkpoint/snapshot, no governed exchange receipt |
| Shared thread/resource memory | Stores or retrieves context, no request/response execution | None | None | None | None | Thread/resource/readOnly policies exist, no per-exchange disclosure grant | Storage evidence, no exchange completion |
| Held tool + public single-step Agent stream | Original asker stays in the original tool call and stream; answerer uses a tool-free model substep | Requires one shared VICT gate for ordinary and answer dispatch | Both lifetimes bound by wrapper | Requires operation key and receipt | Can compose AbortSignals and fence publication | Explicit approved projection in/out; no inherited memory | Mastra result supports typed wrapper receipt |

Installed surfaces: `dist/agent/agent.d.ts` (`network`, `sendSignal`, `queueMessage`, `resumeStream`, `stream`), `dist/agent/types.d.ts` (run-targeted active delivery and idle wake), `dist/agent/subagent.d.ts` (agent-as-tool and memory inheritance), `dist/memory/types.d.ts` (thread/resource scope and read-only). No distinct swarm exchange primitive was identified in the installed public agent declarations. The existing [Background probes](../v1c-background/PROBES.md) proved raw wake delivering input to a model once on a newly started raw run, deliberate cross-process suspend/resume with data and tool re-entry, and unsafe recovery across an active effect boundary. These results establish native mechanism availability only.

## Executed boundary and selection

`node scripts/probe-exchange-phase-0.mjs` against the installed pin used a plain Agent, a deterministic model and a held tool. A transient active signal targeted the exact run and returned `deliver`. The model dispatch count remained one while the tool was held. After release the second model prompt received the signal. The delivery acknowledgement does not establish progress through a waiting tool, so active steer cannot answer a question whose reply is required to release that tool. Idle wake and queue have different turn lifetimes. No dependency upgrade or provider call was used.

**Selection:** wrap Mastra's already-open tool result and public, tool-free one-step model streaming. Keep the original asker's stream running and return the validated answer as its pending tool result. Use the answerer's pinned model/settings and explicitly approved context in a bounded answer substep; keep that substep within VICT's original live answerer execution scope. This does not require a second runtime, network router, signal queue, shared mailbox or durable resume.

| Requirement | Expose or extend |
| --- | --- |
| Invocation and stream continuity | Expose Mastra's awaited tool result and existing stream. Bind trusted asker/answerer occurrences, activation pins and wiring in an opaque VICT exchange handle. Preserve the original VICT stream and sequence allocator. |
| Shared budget | Expose a Mastra tool-free step. Extend VICT with a common atomic model-step reservation and applicable attempt/retry accounting used by both ordinary loop and answer substep. Admit the ask under the original asker's tool gate once. |
| Deadlines | Reuse Mastra abort inputs. VICT binds both original absolute deadlines and refuses admission/delivery after either expires. |
| Duplicates | Extend VICT's exchange operation binding and receipt lookup. Same operation and body joins the pending result or returns its disposition; conflicting reuse fails closed. |
| Stop and loss | Reuse existing cancellation/recovery and cooperative signals. VICT links the two live cancellation scopes and fences late results. On process loss, existing Interrupted/Uncertain reconciliation applies to the original occurrences. |
| Context | Reuse Mastra's explicit prompt input. VICT admits and projects only the context permitted for both directions and validates the answer as data. Disable memory, tools and transcript writes for the answer substep. |
| Evidence | Reuse existing stream and Run evidence. Add typed exchange receipt correlation outside `vict.agent-stream@1` with safe content/status and exact reservation and disposition. |

The candidate path still requires conformance. A raw Mastra pass cannot establish that the installed VICT adapter shares a ledger, issues the authority handle or persists the receipt. Any adapter change remains a separate owner decision.

[Selected-path conformance and proposed adapter change](EXCHANGE-CONFORMANCE.md).
