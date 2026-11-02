# Decision and open-question register

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

## Amendment format

Append: decision ID/date; concrete question; owner instruction or implementation evidence; prior rule; selected option and reason; affected contracts/tests/stages; migration; next proof. Preserve old evidence. Only the owner can accept a product-scope reduction or custom-UI exception; an agent may resolve routine implementation choices inside existing scope.
