# Directive Foundation

**Status** Draft for owner review. Radzi accepted the architecture and the slice-one walkthrough on 13 November 2026. Live recognition, latency and token evidence remain open. Close those probes and review their findings before pinning this draft as an implementation contract or opening a Work ticket. [Owner decisions](../governance/DECISIONS.md#directive-foundation-review-reconciliation--13-november-2026) · [Pre-spec probes](../evidence/directive-foundation/README.md)

## Outcome

In Quellight, say “Going forward, give me Orchid updates in three short bullets. Keep that as my preference.” The reply arrives in the agent’s normal voice. A **Memory proposal** card appears on that turn when the interpretation is ready. You can continue chatting while it is pending. Edit the proposal to two short bullets and confirm the exact text. The card shows **Saved** after Studio has the receipt. After restarting Studio, open a fresh Session with the same authorized agent and ask for an Orchid update. The Run identifies the saved revision supplied to Quellight, and the answer uses two short bullets.

“Do you remember what we discussed last week?” is a recall question and creates no save proposal. Disconnect the binding, save and activate the change, then open a Session on that activation. The directive can no longer offer a confirmable card. If you explicitly ask to use that unavailable capability, Studio can explain its availability in the interface. Ordinary chat stays quiet.

## Baseline and evidence

| Pin | Identity |
| --- | --- |
| TORI product used for the probes | `fe25266c098840d98cdfa70bd5e4dcbf8a8f7d1d` |
| Accepted Memory Foundation product | `d49bedf362d3521bcbf714bc6be7a04b34289bb7` |
| Shared lockfile blob | `746b69fbefb4a9123029f54ab4ca47a00aaa5310` |
| VICT packages | `0.4.0-rc.1` from `6b420a3e9eada6f694cc2550debda7753316b5b3`, with `contracts` and `control` from `02c63c31f8f4dc42840fc8975927c98b21f30058`. All 16 archives matched the lockfile. |
| Model stack | Mastra core `1.64.0`, OpenAI-compatible connector `2.0.0`, Z.AI Coding GLM-5.3 Flash for the live probe. |

The current grammar matched all 173 legacy labels and missed all six expected proposals in 25 new cases. The existing save gate refused forged confirmations. The turn fixture exposed answer text before drafting finished, preserved the answer on draft failure and discarded valid output arriving after Stop. A follow-up Send still returned HTTP 409 while the draft was pending. The installed VICT registry restored an exact revision reference to a separate TORI policy after disk reopen. It rejected new artifact and profile fields. These observations cover the pinned baseline and probe harness. Live model accuracy and Studio integration of the new binding remain to be demonstrated. [Observed results](../evidence/directive-foundation/README.md)

## Slice one

Deliver one optional canvas binding, one Keep operation for saving a preference or fact for later recall, and a Float card. Provide a manual way to draft the same operation on an eligible turn when the interpreter misses an explicit request. Keep Studio’s existing controls for correcting and forgetting saved records. Use the existing quiet Sessions interface and installed public VICT controls and tokens. The memory inspector, list/search/bulk management, conversational Modify, Hold, Stack, observer, organizer, reminders, watchers, thresholds, automatic firing and standing grants belong to later decisions or slices. The V1c Sessions copy pass and TORI-008 Run Visibility proceed independently. [Memory Foundation](MEMORY-FOUNDATION.md) · [Studio design constitution](../specs/STUDIO-DESIGN-CONSTITUTION.md)

### Binding, record and receipt

| Identity | Owns |
| --- | --- |
| Canvas binding and policy revision | What to recognize, where interpretation runs, the typed applicability event and operation, and the trusted scope kind. The authored recognition description is natural language. |
| Saved memory record and revision | The confirmed wording and its applicability to future turns. Slice one uses the existing turn-start recall path. A condition such as “for Orchid updates” is part of the confirmed text. Custom event evaluation and relevance search require separate proof. |
| Run admission receipt | Which memory record and revision were actually admitted, with the existing source and context references. Preserve the historical receipt when the binding or record changes. |

Configure and Canvas edit the same canonical draft through existing graph transactions. The server resolves actor, project and stable agent definition from trusted Session context. On activation, pin the exact policy revision. A draft edit alone changes no running Session. An edit followed by activation creates a distinct pin. Runtime checks may deny a pinned capability after revocation, loss of access, or missing policy data. A saved record retains its normal memory lifecycle when its authoring binding is removed. Recall remains governed by the separately pinned Memory Policy, including its existing scope and admission budget. [TORI contracts](../specs/CONTRACTS.md) · [Pinned activation probe](../evidence/directive-foundation/activation-observed.json)

Use the existing public VICT revision-reference boundary with a server-owned TORI policy resource whose exact contents are bound to the revision. Verify resolution from the restored Session activation and refuse missing or altered policy data. The probe used a digest carried by a supported reference. The builder must prove the canonical authoring and persistence path against the installed packages. An upstream extension would need a concrete missing public capability and a reproduction. Keep 10/100-message history settings and the existing memory gates independent of the directive.

**Compatibility default for review.** Existing activations keep their historical behavior. Within the new authoring flow, an activation with the Directive binding uses the semantic proposal path. Activating a later revision with the binding disconnected disables new proposals for that revision, including through the manual entry. It must not fall back to the legacy grammar there. Prove that an older pinned Session, a new unwired activation and a revoked capability resolve distinctly. Keep stored memory IDs, revisions, receipts and tombstones intact. Confirm this transition rule before the contract is pinned.

### Interpretation and turn ownership

- Start an interpretation only for the latest authenticated operator input on an eligible direct turn. Use a separate, tool-free pass. Earlier authorized exchanges can resolve a reference in that input. Tool results, retrieved content, old turns and model output cannot initiate the operation or select authority, scope, applicability event or action.
- Keep recognition instructions, candidate text and proposal status outside the conversational reply context. Treat the interpreter output as data and validate it against a closed proposal/clarification/no-proposal schema. Require valid text and source references to the authorized inputs. An explicit, persistent preference or fact can produce a proposal. A recall question, temporary instruction, quotation, negation, unprompted preference, grant request or out-of-scope edit cannot produce a save proposal. Ambiguity can ask for clarification without promising an unavailable action.
- Release the normal turn and its next-Send slot independently of interpretation. A bounded failure or timeout leaves the ordinary reply usable. Correlate every proposal with the exact originating Session, turn, activation and binding revision. Fence a pending interpretation by that identity so Stop before publication discards even a late valid result. Stopping an older interpretation cannot cancel the next conversational turn. A committed save retains its receipt. Browser reattachment observes existing state. Host restart supplies no automatic interpreter replay or resume claim.
- Slice one has one binding and one semantic. Select the governed transcript-read budget and interpretation deadline using live evidence before pinning the contract. Later watch caps are governed and measured. Future overflow stays visibly inactive until a separate observer is explicitly wired. An opted-in sensitivity setting can affect suggestions only.

### Operator confirmation and recovery

The card shows the current draft verbatim and supports **Confirm**, **Correct** and **Dismiss**. The manual path uses the same proposal state and card with the same availability checks. A correction before save changes the proposal revision. Confirm submits the exact reviewed revision and text. The host resolves the trusted actor and scope again, checks the originating binding and current availability, checks cancellation and expiry, then authorizes the exact operation at the write boundary. The draft and interpreter hold zero write grants.

Persist through the existing governed SQLite save and atomic receipt path. Scope the operation identity to the trusted Session and proposal. An exact replay can return the original receipt and cannot create a second save. A conflicting payload, stale revision, revoked access, or unavailable policy produces a refusal and zero memory mutations. Stop or dismissal before commit prevents the save. If commit outcome cannot be established, show **Uncertain** and reconcile the original operation. Use the existing receipt and deletion semantics, including content-free historical evidence after Forget. Reuse the existing short proposal lifetime for Float unless review changes it. Stack’s durable review queue has its own future retention policy. [Governed save and Run evidence](MEMORY-FOUNDATION.md#run-evidence) · [Background recovery](BACKGROUND-FOUNDATION.md)

## Acceptance and delivery

D is deterministic evidence, S is Studio browser evidence, and L is a permitted live-model walkthrough. Keep fixture timing and provider measurements distinct.

| Check | Evidence | Pass condition |
| --- | --- | --- |
| Recognition and grounding | D/L | Run the 173 legacy cases and the 25 held-out cases on the pinned route. Report missed requests, unwanted proposals, incorrect wording, clarification mismatches and invalid results separately. Review actual proposed text for invented details. Include a recall question, mixed-language wording and prompt-like text from an untrusted origin. Validate agreed thresholds against recorded live results. |
| Float and Stop | D/S/L | Hold a draft response, observe the completed ordinary answer and send the next turn while the proposal remains pending. On failure preserve the reply and omit the card. Stop the exact pending proposal before publication and release a valid late result. Verify zero proposals from the stopped job and no effect on a newer turn. Record paired on/off timing, added calls and tokens. |
| Binding and restore | D/S | Save and activate through Studio, edit and reactivate, then reopen. The old Session resolves its original pin and the new one resolves the edit. Unwire and activate, then prove zero confirmable proposals on the new activation. A forged canvas/request value, missing or altered policy, or revoked capability cannot widen the pin. |
| Confirmation and isolation | D/S | Before confirmation, prove zero saved records and receipts. Challenge wrong actor, project, agent, stale proposal revision, altered payload, cancellation and duplicate confirmation. Inspect one exact save and receipt after a valid confirm. Resolve an uncertain outcome against the original operation. |
| Owner walkthrough | S/L | Propose three short bullets, edit the card to two, confirm, restart and verify exact revision admission on a fresh Session and a two-bullet answer. Verify the last-week question and unwired negative cases. Exercise manual proposal entry and confirm existing Studio correction and Forget still work. Use desktop and narrow layouts. |

Close the live recognition and placement measurements before choosing quality thresholds, the transcript budget and the interpretation deadline. Use the authorized Studio host and existing Z.AI Coding credential. Review actual latency and token usage together with missed, unwanted and wrong-text rates. If the pin cannot meet the proposed experience, record the measured gap and return the affected choice to Radzi. Zero unauthorized writes, a working next Send during a pending draft, and refusal of stale or revoked confirmation are required. Any dependency change needs its own evidence and decision. [Live probe instructions](../evidence/directive-foundation/README.md#reproduce)

After owner review and closure of those decisions, open a separate Work ticket pinning the accepted spec commit, exact product baseline and package lock. The implementation proof starts with the optional binding and Float path against the installed packages. Run the build and affected regressions. A fresh independent verifier challenges the exact candidate and returns a report with the recorded evidence before Radzi’s walkthrough and acceptance. [Work protocol](../governance/ROLLADICE-WORK.md)

## Later slices

Conversational Modify follows the first slice. The interpreter may suggest a target. The host resolves and verifies an exact record ID and revision. If the identity is ambiguous, require explicit selection. The card shows the target identity, current text and exact correction or deletion before confirmation. Reserve room for a typed action and target revision in the interpreter and card contracts. Revocation-class operations remain enforceable with the interpreter unavailable. Whether standing grants enter scope is an open owner decision.

Keep, Modify, Authority and Communication can share a canvas presentation. Their lifecycles and permission checks are distinct. A future reminder turns “next Friday” into an exact date, time and timezone for review. Reminders, watchers, thresholds and autonomous firing require their own scheduling or event and effect proofs. Semantic recall and model-writable memory retain their separate decisions.

Design the observer and Stack before their walkthrough probe. An explicitly wired read-only observer may propose from settled, scoped turns. Stack survives reload within age and count bounds, deduplicates, shows source and age, and bounds discarded draft text retention. Human confirmation remains required. The organizer only reorganizes approved records. Its reserved policy setting and lineage fields stay dormant. Memory node-family work owns broader inspection and management. [Owner decisions](../governance/DECISIONS.md#directive-foundation-review-reconciliation--13-november-2026)
