# V1b — Studio-created authoring agent

## Outcome and baseline

Build TORI's first Authoring Agent through the ordinary Studio frontend. Use it to make a real, scoped edit to an open Agent Definition draft. The owner can see the result in Configure and Canvas, undo or save it, and follow the exact turn and edit receipt in Runs. This is the complete [T07](../specs/ACCEPTANCE.md#t07--tori-builds-its-authoring-agent) slice and the TORI implementation of [CAP-33](CAPABILITY-OWNERSHIP.md).

| Item | Reference |
| --- | --- |
| Starting point | `radz2291/VICT-Tori` at `633e34d0a89a8d89a5d4477f6642be2a27f08501`, the accepted V1a closeout on `codex/tori-v1a-a4` |
| Working branch | `codex/tori-v1b`, in a separate checkout or worktree |
| Studio experience | Radzi's approved V1a UI/UX, plus the sidebar amendment below. The approved build is the visual and interaction reference for later TORI slices. |
| Dependency starting pin | Installed VICT `0.4.0-rc.1` packs from `radz2291/vict-02@6b420a3e9eada6f694cc2550debda7753316b5b3`, Mastra core `1.64.0` and the V1a lockfile. Confirm the actual package identities at start. |
| Coordination | Rolladice Work project `TORI`, V1b assignment, dependent on accepted `TORI-003`. One local Codex stage manager owns implementation through Review. Radzi reviews the working Studio. |

[Approved V1a Studio closeout](../evidence/v1a/STUDIO-CLOSEOUT.md) · [V1a ownership and package pins](../evidence/v1a/OWNERSHIP.md)

## Studio experience

The approved V1a build establishes the quiet, effective Studio. Keep its visual hierarchy, navigation, density and command placement. The owner approved the following dock changes for V1b. Use the [Studio Design Constitution](../specs/STUDIO-DESIGN-CONSTITUTION.md) for the shared interaction rules.

| Page | Left | Center | Right |
| --- | --- | --- | --- |
| Agents | Authoring Agent, collapsed initially | Configure or Canvas, editing the same draft | Assembly / Selection |
| Sessions | | Conversation | Session history and activated revision picker |
| Runs | | Outcome, recorded turn and timeline | Run history and details |

**Authoring Agent.** Give the left dock a single labeled toggle consistent with the existing toolbar and Window menu. Use the normal Session execution and Run records. Show the selected authoring activation and target definition, a composer, the turn's current status, cancellation while running and a link to its Run. Keep the current draft in the center during the turn. If an authoring activation is needed, guide the operator to create or select it through the ordinary Agents controls. Closing the dock preserves the turn and draft. The left dock is reserved for authoring across Studio, with the first working entry on Agents.

**Assembly / Selection.** Use VICT Designer's two-context header and collapsible sections as the interaction reference. Move the left Library content into **Assembly** on the right, grouped as **Agents**, **Components** and **Nodes**. Keep agent switching and component insertion in their existing valid contexts. **Selection** shows the selected node or wire and its relevant controls. Double-clicking a delegation wire, or using its keyboard equivalent, opens the pinned revision, permitted scope, task and expected result in Selection. Keep the node tree, Canvas and Configure tied to the same selection and draft. Reveal and hide a binding through the existing projection behavior. Preserve reconnect, disconnect and Undo.

Use public installed VICT controls for covered roles. Preserve focus, scroll, selection, canvas viewport and unsaved changes when changing tabs or toggling docks. Use the existing narrow layout approach with one supplementary drawer open at a time. Keep the V1a panel width controls while [the shared dock splitter gap](../governance/UI-EXCEPTIONS.md#v1a-pending-capability-gap) is open. Record any proposed departure from the approved experience and bring that design decision to Radzi.

[VICT Designer context tabs](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/apps/studio/src/lib/designer/WorkspaceDetails.svelte) · [VICT Designer collapsible sections](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/apps/studio/src/lib/designer/DocumentPanels.svelte)

## Authoring contract

**Build and select.** Codex creates, configures, saves and activates the Authoring Agent in a running browser using the same controls Radzi can use. Wire its authoring capabilities through the supported public path. Reopen the persisted definition, select its activated revision in the Authoring Agent dock and run a real turn from that activation. The walkthrough starts without a prebuilt authoring profile. A synthetic Research Agent may be prepared as the edit target.

**Discover and inspect.** The run discovers supported authoring capabilities and the authorized draft target through the public VICT boundary. Resolve the actor, project, definition and current draft revision through trusted application context. Resolve an exact node or source occurrence where the operation needs it. Pin the authoring activation to the turn and tie the operation to its resolved target. A prompt, model response, selection change or submitted ID cannot expand that scope.

**Apply.** Use one shared validated draft transaction path for human and agent edits. Map the requested change to the existing graph and history operations, with the exact expected revision at application time. Protect unsaved manual changes as well as saved revision changes. Reject a stale, invalid or unauthorized operation before it can edit the draft. Apply a successful edit once, make it visible in Configure and Canvas, and include it in ordinary Undo/Redo. Keep Save and Activate as explicit Studio actions. Existing Sessions continue to run their pinned activations. Deduplicate retries using a stable operation identity and reconcile a lost acknowledgement against the recorded outcome.

**Observe and cancel.** Confirm the actual edit against the authoritative draft and give it an inspectable receipt. Correlate the authoring activation, Session, turn, Run, operation, target/source occurrence, before/after revisions and outcome. Display confirmed edits, refusals, conflicts and cancellation through the same Run timeline. Cancellation before commit prevents a later write. If an edit already committed, report the applied change and let ordinary Undo revert it. Preserve the real outcome after reopen.

**Reuse.** TORI Studio and a small independent consumer use the same documented authoring boundary and authority checks. Prove it from a clean consumer outside the Studio host using the installed artifact or supported service interface. The consumer can discover, invoke and observe a scoped edit and receive the same refusal or cancellation semantics. Keep reusable capability logic behind that interface. Use the existing VICT control and runtime contracts and Mastra execution path wherever they cover the operation.

### Implementation boundary

Start with a short installed-package mapping for discovery, draft mutation, observation, cancellation, authority and receipts. The current manual editor uses a VICT Flow journal and the server checks the saved revision for Save. Show where the AI operation enters that same draft/history path and where the expected revision is enforced. Choose the smallest supported adapter and share it with the Studio path. Report any missing operation with the exact package/export, version, attempted mapping and effect on T07. An upstream VICT change requires its own dependency scope. [Capability ownership](CAPABILITY-OWNERSHIP.md) · [Architecture and public interfaces](../specs/ARCHITECTURE.md)

The supported end-to-end edit for V1b is an instruction change on an authorized Agent Definition draft. Future authoring operations can extend the same contract. V1c owns background durability, and later stages cover Workflows, Creative and VICT Studio adoption. [VICT #3](https://github.com/radz2291/vict-02/issues/3) remains the separate reasoning visibility and effort track. Keep its unavailable state truthful in V1b.

## Walkthrough for the first runnable candidate

1. Start an isolated Studio with synthetic Research data and an owner-permitted configured provider. Use Agents and the right-hand Assembly panel to create, configure, save and activate the Authoring Agent. Reopen it and confirm its revision and capability binding.
2. Open Research Agent in Configure, expand the left dock and send “Update Research Agent's instructions so every finding includes a source link.” The activated agent discovers the authorized target, edits the instructions through the public path and confirms the change.
3. Check the same change in Configure and Canvas, undo it, redo it, save and reopen Research. Confirm that an existing Research Session keeps its earlier activation.
4. Follow the edit to Runs and return to the exact turn. Compare the target, previous revision, resulting revision and acknowledged outcome with the editor. Use the right-hand Selection view to inspect a delegation wire and show its unchanged pin semantics.
5. Repeat a staged edit with an intervening manual change, a cancellation before commit and a denied target. Observe the conflict, cancelled and denied outcomes, with the correct draft and history intact.

Bring the first working walkthrough to Radzi early enough to refine the dock interaction while the implementation is in progress. Use deterministic fixtures for repeatable failure probes and a permitted live turn for the successful authoring proof. Keep fixture records labeled.

## Whole-slice acceptance

| Criterion | Evidence the verifier must observe |
| --- | --- |
| T07-01 · Browser-created agent | Codex creates, configures, saves and activates it through ordinary UI. Reopen it and correlate the real authoring turn with the exact saved activation. |
| T07-02 · Governed operations | Installed public discovery, canonical edit, observation and cancellation execute through the mapped VICT boundary. Cancel an in-flight operation before commit and verify no later write. |
| T07-03 · Confirmed evidence | The resulting edit and its receipt agree with the target definition/source occurrence, operation, activation, turn and revisions. Retry or repeat delivery of the same operation yields one committed edit. |
| T07-04 · Manual work and history | An intervening manual edit survives a stale agent operation. Human and agent changes share Undo/Redo and Save/reopen. The existing saved revision and active Sessions change only through their normal commands. |
| T07-05 · Scope denial | Exercise a target or operation outside the granted scope. It yields a denial, with zero edits, no forged success receipt and no broadened capability. |
| T07-06 · Session and Run continuity | Reopen the authoring Session and its exact Run, confirm the recorded edit and terminal outcome, and navigate both ways using the existing views. |
| T07-07 · Independent consumer | From a clean consumer, invoke the same documented capability boundary and verify scope enforcement and correlated outcome through the supported public interface. |
| Studio and V1a regression | On desktop and at the existing narrow breakpoint, exercise both docks, the Assembly sections, Selection, delegation inspection, keyboard access and focus return. Compare against the approved Studio. Re-run the A1–A4 and saved Research scenarios. Radzi reviews the runnable interaction. |

Use the existing build and test entry points and the Chromium fixture walkthrough from the [V1a closeout](../evidence/v1a/STUDIO-CLOSEOUT.md). Add focused verification for the new authoring path and its failure cases. Record exact commands, tool and package versions, browser sizes and launch steps. Keep deterministic, Studio, live and owner evidence distinct. [Acceptance evidence definitions](../specs/ACCEPTANCE.md#common-quality-dimensions) · [Verification runbook](../governance/VERIFICATION.md)

## Delivery and review

The local Codex stage manager owns the whole slice, including capability mapping, an early runnable preview, integration, independent verification and any in-scope repairs. Start from this branch in a clean worktree. Follow the [Rolladice Work protocol](../governance/ROLLADICE-WORK.md) and the pinned ticket standard, and claim the run when local implementation actually starts.

Publish one reviewable candidate on the V1b branch, with walkthrough, package map, safe receipts, repro commands, relevant screenshots and a criterion-by-criterion verdict under `docs/evidence/v1b/`. Include base, candidate and verifier identities. Have a fresh verifier challenge that exact candidate. Fix in-scope findings and reverify affected behavior. Bring a real public contract gap, a material UI departure or an unavailable live test permission to Radzi with the narrow decision needed.

Submit the V1b assignment to **Review** with the running candidate and evidence. Radzi's hands-on review is the acceptance step. V1c has its own handoff.
