# Decision and open-question register

**V1a acceptance and V1b layout — 11 November 2026, owner adopted.** Radzi reviewed, refined and approved the V1a Studio at `633e34d0a89a8d89a5d4477f6642be2a27f08501` and directed later stages to use that experience as their UI/UX reference. For V1b the owner reserved the left dock for the Authoring Agent and directed the Agents Library and Nodes to share the right dock using VICT Designer's pattern. The [Design Constitution amendment](../specs/STUDIO-DESIGN-CONSTITUTION.md) and [V1b spec](../implementation/V1B.md) define the updated arrangement and browser proof. This supersedes the earlier Agents Library placement and V1a Review status.

**D-V1A — 7 November 2026, owner adopted.** [Issue #3](https://github.com/radz2291/VICT-Tori/issues/3) supersedes P-01 where U0 completion or acceptance was a dependency for V1a. U0 implementations, reports and acceptance status remain historical. V1a independently composes installed VICT artifacts from a clean repository baseline. The Design Constitution remains the UI authority, and V1a requires its own hands-on owner review. No upstream or live installation change is authorized.


Source: owner/assistant discussion supplied with the repository-preparation request, consolidated 2 November 2026. Distinguish an owner-agreed product direction from this pack's proposed implementation details. Current stage authority remains in HANDOFF, not this historical register.

## Agreed direction

| ID | Decision | Authority / implication |
| --- | --- | --- |
| D-01 | TORI is both its own Studio and a reusable VICT capability | Owner requested a dedicated Studio and consumption by applications/VICT Studio |
| D-02 | Compose VICT authority/UI and Mastra mechanisms; no duplicate general runtime/editor | Repeated agreed reuse-first architecture |
| D-03 | Definition, Trace and Session are primary; Activation is internal and inspectable | Agreed consolidated foundation |
| D-04 | Option C common authoring foundation with explicit semantic connection kinds | Owner selected Option C; visual similarity is not execution equivalence |
| D-05 | Native VICT UI; custom primitives require documented owner approval | Agreed strict UI rule, including behavior and appearance |
| D-06 | Providers/model switching and public reasoning visibility are first-class | Owner accepted the audit additions; authorization changes remain governed configuration |
| D-07 | Skills/JIT tools, evaluations, trusted context, processors/budgets and human interaction are core | Owner: “I agree on all your proposal” after the additions |
| D-08 | Schedules/signals/notifications/goals/knowledge and multimodal work remain target capabilities | Same agreement; staged according to consumer readiness |
| D-09 | Product acceptance includes workflow, generation, creative exploration and unified use | Owner asked to expand beyond runtime tests and responded “Okay, now very good” to T01–T09 before implementation discussion |
| D-10 | Production UI first, real editing/persistence, explicit runtime stubs; then vertical slices | Owner proposed UI-first and accepted preparation of the implementation handoff |
| D-11 | Protect existing VICT Studio and saved work; later agent replacement after proof | Agreed independent TORI application and current upstream owner record |
| D-12 | Prepare this repository in detail before Codex implementation | Current explicit repository request |

D-09 records the accepted coverage direction. Scenario thresholds, precise layout and technical bindings remain implementation detail to verify; no product test is marked passed by that conversation.

## Proposed implementation choices

| ID | Proposal | Resolution point |
| --- | --- | --- |
| P-01 | G0 → U0 then V1a/V1b/V1c → V2 → V3 → V4 → V5 | Handoff activation and stage evidence; preserves earlier UI-first/V1–V5 scope |
| P-02 | Svelte 5 / TypeScript host aligned with inspected public VICT packages | G0 compatibility; choose host/build tools and lock actual versions |
| P-03 | Logical shared contracts/core/adapters and independent Studio host | G0/U0; create only necessary modules, no premature publication |
| P-04 | Local durable authoring store for U0 with portable export/recovery | G0 store proof; no implied cross-device sync or production DB choice |
| P-05 | Three primary views with shared inspection and Agent/Workflow/Creative authoring surfaces | U0 owner review of actual layout and interactions |

Routine choices consistent with these boundaries can be resolved by the implementation agent and recorded with evidence. They do not require a new confirmation at every step.

## Open questions

| ID | Question | Owner of next evidence | Timing / fallback |
| --- | --- | --- | --- |
| O-01 | Which distributable public VICT artifacts exactly match the baseline? | G0 implementer | Prove install/hash/source correspondence; isolated build/pack if appropriate; do not use stale registry labels blindly |
| O-02 | What are the exact Creative Flow eight operations and how do they map to TORI? | G0 implementer / owner source if unavailable | Recover actual source; use neutral semantic families meanwhile; no guessed locked taxonomy |
| O-03 | How should canonical UI source, domain definition and Flow graph coexist? | G0 implementer | Minimal contract/projection proof before broad UI implementation; no rival definition registry |
| O-04 | Which provider auth/subscription routes are supported for this product and account? | V1a integrator | Verify official eligibility and host support; available approved API route may be separately configured; no silent substitution |
| O-05 | Which live session state and background operations are durable at the pin? | V1a/V1c integrator | Explicit recovery matrix and fault injection; unsupported resume is visible |
| O-06 | Actor/project sharing, memory deletion/retention and credential allocation policies | Runtime integrator | Establish policy before shared/live data; use isolated synthetic owner-local U0 fixtures |
| O-07 | Local coding OS/workspace containment and optional harness choice | V5 integrator | Actual enforcement tests; UI path scopes alone insufficient |
| O-08 | First real generation/transform providers and operator settings | V3 integrator with owner budget/preferences | Select a minimal real pair; retain creative acceptance scope |
| O-09 | Actual Quellight protocol/version, operation completeness and parity gaps | V5 consumer integrator | Read source/current service; do not assume the old diagnostic pilot provides full parity |
| O-10 | Reusable package/service distribution, license and eventual hosting | Before distribution/deployment | Private/local packages sufficient initially; do not infer a license from upstream |
| O-11 | Exact mobile layout, first-use behavior and spatial interaction preference | U0 owner review | Build a coherent native candidate, then review; no implementation freeze on pixel details |

## Supersession

The nine tests replace the earlier three-test-only acceptance framing: old A → T07, old B → T08, old C → T09, with T01–T06 added. Earlier G0–G6 and M1–M4 proposals are historical planning schemes. The current [roadmap](../implementation/ROADMAP.md) organizes the agreed UI-first approach; it does not remove their underlying behaviors or resume VICT's paused Milestone 2.

## Adopted amendments

### D-13 — Node & Edge Foundation adopted, 2 November 2026

**Authority:** After the Node & Edge proposal, repository/source review and the final clarification on partial execution and incomplete saving, the owner asked to “update the repository accordingly.” This adopts the behavior in [Node & Edge Foundation v0.1](../specs/NODE-EDGE-FOUNDATION.md), without starting implementation.

**Prior rule:** Six semantic relationship families, typed validation and creative conversion were required, while detailed palette/projection mapping was left to G0. The prior blanket rejection wording for missing required inputs could prevent incomplete authoring.

**Decision:** Use four catalog discovery families with explicit resource/invocation roles; rich VICT node controls and inspector share canonical values. Save structurally sound incomplete drafts; diagnose readiness and require it for activation/execution. Keep six relationship meanings, explicit context admission and evidence-derived provenance. Distinguish layout groups from executable subworkflows, exclusive routing from multi-match branching, and declare execution ownership. Default AI-to-business fixture uses a VICT coordinator with a governed Mastra AI step.

**Partial execution:** U0 demonstrates selected-node/to-node/from-node, reuse/staleness and new-variation intents with labelled simulations and unsupported cases. Live operations require safe per-engine/adapter proof; no promise of universal arbitrary partial execution and no automatic replay of protected actions. This is a qualification of execution support, not removal of creative iteration or T04's supported rerun requirement.

**Affected work:** Contracts, UI, U0-03–U0-06/U0-13, fixtures A–C, relevant T02–T04 checks, FIRST-STAGE, agent entry/start/handoff and TORI-001. Stage order and T01–T09 coverage are unchanged. Exact first-release palette and the historical eight-operation vocabulary remain open. Custom UI still requires the documented exception before implementation.

**Migration / next proof:** No implemented TORI schema or saved application exists to migrate. G0 records public API/domain/projection mappings and support gaps; U0 proves real editing/history/persistence with simulated execution, followed by owner review. Live conformance remains in the assigned runtime slices.

### Studio authoring foundation before V1c — 12 November 2026, owner adopted

**Authority.** Radzi agreed the direction in the TORI-004 discussion. Use its reviewed V1b implementation as the baseline for the follow-on. Keep the approved Studio experience and existing Authoring Agent dock.

**Prior sequence.** The roadmap moved from V1b's governed Research instruction edit directly to V1c's advanced operation.

**Decision.** Insert the broader authoring slice before V1c. Begin with discoverable Studio actions for agent creation, typed editing, review and testing. Prove the plain-language Quellight and Research assembly, a review that leaves the draft untouched, an undoable follow-up edit, and discovery and use of a second registered script-backed tool without chat integration changes. Carry the scoped CLI and tool creation forward on the same foundation.

**Scope and next proof.** The existing T01–T09 scenarios and V1c obligations remain. Use the reviewed V1b candidate and installed public VICT artifacts as the starting point. The follow-on implementation uses its own assignment and handoff. [Next implementation spec](../implementation/AUTHORING-FOUNDATION.md) · [V1b review evidence](../evidence/v1b/INTEGRATION.md)

### V1c memory foundation and architecture contingency — 12 November 2026, owner adopted

**Authority.** Radzi accepted the slice contract at `0900305` with retention independence and missing-memory reconciliation clarified in the [accepted specification](../implementation/MEMORY-FOUNDATION.md) at `8854562dda920f583e6cc1d80de51f6add6d7ba9`. The accepted TORI-005 baseline is `4c035cd75f63c68bd002dee5683ca3fa02e778cf`, with tested product `b349e547f4e144db47d63f89e0ef3c7c49db8c75`.

**Prior sequence.** The roadmap groups memory, background recovery and specialist Run work in V1c. The draft memory slice documented dedicated SQLite tables before governed Mastra working memory was evaluated as the primary path.

**Decision.** Deliver V1c in slices, starting with explicit saved memory, then background execution and recovery, then specialist Run visibility and controls. Select governed Mastra working memory only when all three pinned-version probes pass, including retention independence for saved records in the LibSQL-backed store. A failed or inconclusive probe selects dedicated SQLite memory tables under the same governed contract and acceptance criteria. If a live ledger record has missing Mastra-side memory, omit it from recall and show the missing storage state in Run evidence.

**Scope and next proof.** This slice contributes to CAP-16, X04, X09 and T01-06 under the accepted spec. Record the exact probe results and selected architecture before implementation commits. Preserve the existing history policy and approved Studio controls. Give observational memory its own opt-in proof and retain the planned exact-version conformance check for semantic retrieval. Keep the T01–T09 scenarios cumulative. [Roadmap](../implementation/ROADMAP.md) · [Memory contracts](../specs/CONTRACTS.md#8-skills-context-memory-and-authorization)

### TORI-006 owner review and memory follow-ons — 12 November 2026

**Authority and current scope.** Radzi reviewed the `2e95a06` Memory Foundation preview and made final acceptance conditional on the [bounded repair](../evidence/v1c-memory/OWNER-REVIEW.md) at `129c6dca734b328d85cff5108ed47bdcef396998`. Move proposals onto their originating turns, extend deterministic phrasing with tested negation twins, and reserve record lineage, organizer off and an explicit store schema version. Keep the prior evidence attributed to its candidate. The repaired product needs a fresh exact-candidate review and Radzi's walkthrough.

**Upstream VICT extension request.** [Probe 1](../evidence/v1c-memory/PROBES.md) produced `VICT_AGENT_UNKNOWN_ARTIFACT_FIELD` for resource-scoped, schema-based working memory. The pinned public adapter binds the resource to actor alone. Request an upstream `vict-02` extension in a future scoped change so VICT can carry a trusted actor/project/agent resource identity and schema through the public artifact and adapter. After an upstream candidate proves the required behavior at exact installed pins, evaluate a governed migration from the SQLite backing to the primary Mastra architecture.

**Future organizer.** Reserve `tori.memory.organize` for an opt-in governed operation through the reserved policy slot. Its explicit thresholds trigger compaction. It reorganizes existing content without originating facts or authority. Every compaction records input and output lineage and a reversible receipt. Evaluate the Observational Memory mechanism as a candidate engine when that work is scoped.

**Memory node family.** Its future spec must support a user-settable admission budget, per-record mute or pause, management in the node or inspector, visible actor/project/agent scope, and first-class versioned named Memory Policy resources. Controls select how much and which saved memory can be used. Trusted scope composition, ordering and grant mechanics stay in the governed runtime. The current two-dropdown configuration is the reference for that follow-up.

**Nudges, forgetting and language packs.** A later near-miss classifier may ask whether the operator meant to save a memory when phrasing, abbreviations, another language or an implicit preference make intent unclear. Its authority is limited to asking. Explicit human confirmation governs any save. Forgetting uses the Studio action for this slice. Revisit voice-triggered forgetting with the nudge slice and apply the same confirmation principle if it is approved. Defer language packs until needed. Each pack will specify prefixes, verbs and negation twins, including affirmative inversions such as Malay `jangan lupa`.

### V1c Background Foundation — 13 November 2026, owner authorized

**Authority.** Radzi accepted TORI-006 in Work and directed the next ticket. Its accepted product is `d49bedf362d3521bcbf714bc6be7a04b34289bb7`, with evidence at `9873f93db1ceea87dfbead6283afd88f5b1b71a3`. Proceed with the [Background Foundation contract](../implementation/BACKGROUND-FOUNDATION.md) at `025be4d05455d6d9a3606f7202a73cc65a34dcf8` as a separate V1c slice.

**Decision.** Run the pinned Mastra and VICT probes before dependent product changes. Use the four-state Run model and recovery matrix to prove detach, reconnect, cancellation and effect reconciliation. The host can claim restart continuation only for verified mechanisms. Keep O-05 open until the resulting recovery matrix has evidence. Retain the accepted Memory Foundation and Authoring behavior as regression baselines. Run Visibility and Specialist Communication follows this slice.

## Amendment format

Append: decision ID/date; concrete question; owner instruction or implementation evidence; prior rule; selected option and reason; affected contracts/tests/stages; migration; next proof. Preserve old evidence. Only the owner can accept a product-scope reduction or custom-UI exception; an agent may resolve routine implementation choices inside existing scope.
