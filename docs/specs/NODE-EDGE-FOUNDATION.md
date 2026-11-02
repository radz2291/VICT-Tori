# TORI Node & Edge Foundation v0.1

**Adopted by the owner, 2 November 2026.** This refines Option C within the existing G0 → U0 plan and later vertical slices. It defines authoring behavior; it neither adds a runtime nor starts implementation. Read with [Contracts](CONTRACTS.md), [UI](UI-FOUNDATION.md) and [Acceptance](ACCEPTANCE.md).

## 1. One foundation, several experiences

Use one VICT-native authoring foundation and shared domain definitions across Agent Builder, AI Workflow, Business Workflow, Generative Pipeline and Creative Canvas. Their palettes and projections can differ. Definition, Trace and Session remain the three primary Studio views. A visual connection never implies execution by itself.

The catalog uses four discovery families. These are organizational categories, not four runtime classes or a closed node inventory. Nodes may have multiple discovery tags, but each actual definition or invocation has explicit semantics.

| Family | Purpose | Illustrative entries |
| --- | --- | --- |
| Definition | Resources that exist and can be configured or referenced | Agent, Tool, Skill, Memory policy, Model reference, Capability, Reusable Workflow |
| Operation | A particular invocation of work | Run Agent, Call Tool, Generate Media, Transform Data, App Action, CLI Command |
| Control | Declared workflow inputs, outputs and progression | Input, Output, Decision, Parallel, Loop, Wait, Human Review |
| Creative / Material | Content and alternatives to explore | Prompt, Image, Video, Audio, Reference, Idea, Comparison, Selection |

Examples are not promises that every entry works in U0. A selection may be a saved manual choice or an executable selection operation; its descriptor distinguishes these. A model reference does not prove a connection supports image/video generation. Availability is determined by the registered capability and adapter.

Build a small starter palette sufficient for the three fixtures below. Extend through the capability catalog rather than a separate hardcoded node implementation per provider. The earlier Creative Flow “eight operations” remain an unresolved source reference; these four families do not claim to recover or replace their exact vocabulary.

## 2. Resources, invocations and views

An Agent definition configures an agent; Run Agent invokes a versioned agent under an authorized activation. A Tool definition describes/configures a tool; Call Tool invokes it. Workflow definitions and workflow invocations follow the same distinction. Invocation-specific inputs and settings do not silently edit a shared definition. Past activations and run snapshots remain immutable.

Meaningful reusable resources and operations become nodes. Ordinary settings can remain inline controls or inspector fields. Use rich native VICT components in node bodies as useful; the inspector and inline controls edit the same canonical value through the same transactions.

“Show as node” exposes an existing setting/resource relationship as a projection with stable identity. Hiding that projection does not detach the resource, delete configuration or change execution. Explicit detach/delete actions explain their scope and affected references. Creating a reusable resource, cloning one, and merely showing another view of one are distinct operations. Update shared references only through an explicit revision choice; a display change must not silently repin consumers.

## 3. Six relationship meanings

Keep the six [contract families](CONTRACTS.md#2-graph-and-port-semantics):

| Relationship | Meaning / invariant |
| --- | --- |
| Typed data | A typed value or exact artifact version feeds an input; validate direction, schema, cardinality, optionality and supported media |
| Control | Progression in a named execution model, including explicit branch/join/wait/loop semantics |
| Tool availability | Declares a requested tool binding; drawing the edge grants no authority |
| Delegation | Declares a pinned child relationship under policy; drawing it neither starts a child nor widens permissions |
| Context/reference | An informational association; it does not automatically execute or inject content into a model |
| Provenance | Evidence of actual derivation from exact inputs/operator/run/versions; ordinary drawing tools cannot fabricate it |

Use labels, accessible descriptions, port affordances and appropriate styling; color is supplemental. Invalid connections explain the specific endpoint or constraint. Converters are explicit capability-backed operations, not silent coercions. A string identifier match is not proof that arbitrary structured payloads are compatible.

If referenced material is to become agent context, configure an explicit binding with the target consumer, source/version or resolution policy, scope and inclusion/retrieval behavior. Preview the intended context in U0; live runs record the resolved admitted sources. Spatial proximity or an ordinary inspiration link does not supply context implicitly.

Informational cycles may be valid. Executable cycles require supported explicit loop semantics. Validate the relevant semantic subgraph, not a single interpretation of every visible edge. Provenance from imports may be labelled externally supplied/unverified; it cannot masquerade as TORI-observed production. Simulated provenance retains simulation origin.

Visual grouping only arranges or collapses content. An executable subworkflow has declared boundary ports, a versioned definition and a supported runtime binding. Grouping or ungrouping must not silently create execution, approvals or side effects.

## 4. Draft integrity versus execution readiness

| Action | Required behavior |
| --- | --- |
| Add an unfinished node | Allowed with an explicit unconfigured/incomplete state |
| Save an incomplete graph | Allowed if authoring integrity is valid; retain unresolved settings and diagnostics across reopen |
| Draw incompatible/dangling/capacity-invalid edges | Reject the edit with a specific reason; preserve the previous draft |
| Validate an incomplete graph | Report missing inputs/configuration and unsupported mappings without deleting the draft |
| Activate or execute | Require relevant readiness, compatibility and authorization checks |

Structural integrity protects IDs, actual references, representable values and accepted connections. An unconfigured binding is represented explicitly rather than as a forged valid resource reference. Required runtime inputs or an unconfigured video provider are readiness issues, not reasons to prevent saving a draft. Schema-corrupt imports remain rejected/recoverable under the existing storage contract.

U0 implements authoring checks and readiness diagnostics for its registered definitions, with runtime availability marked simulated or unverified. This is not live provider or execution conformance. Invalid connection edits leave the prior draft intact even when that draft itself is incomplete.

## 5. Execution ownership and supported compositions

Every executable workflow declares its coordinating engine and adapter binding. Default for fixture B's AI-to-business workflow: VICT coordinates the business process and invokes Mastra for its AI step through a governed capability. An AI workflow can instead be coordinated by Mastra with protected tool calls routed through VICT. Do not run two independent coordinators over the same continuation/effect.

At each engine boundary, map typed inputs/outputs, activation and revision references, run/step correlation, approval ownership, cancellation, errors/retries, effect receipts and recovery. Unsupported mixed graphs receive actionable diagnostics. General arbitrary graph compilation or a new universal scheduler is not required or authorized by this amendment.

Exclusive decisions and multiple-matching branches are distinct behaviors. Specify no-match handling, branch output shape and downstream join behavior; do not infer them from a “Decision” label. Loop/parallel/wait mappings use the actual selected engine's verified primitives. Current online documentation is a design reference; exact pinned API conformance is required in the corresponding live slice.

## 6. Creative iteration and partial execution

These are user intents whose availability is negotiated per engine/adapter, not universal execution guarantees:

| Intent | Behavior to expose |
| --- | --- |
| Run Node | Invoke the selected operation using explicit inputs/artifact versions; do not silently regenerate upstream sources |
| Run To Node | Include the supported upstream dependency closure; show which results will be reused and which operations would run |
| Run From Node | Continue through the supported downstream selection with explicit starting inputs; report unresolved upstream needs |
| Generate another variation | Deliberately create a new result/attempt even with unchanged authored inputs; record effective parameters/seed when available |
| Reuse / rerun after edits | Mark affected results stale, retain prior versions, and identify reused node/input/operator revisions in the new run |

U0 demonstrates these intents through labelled deterministic simulation, including unsupported and blocked cases. A preview identifies scope, selected inputs, reused/stale/missing outputs and effects; unknown cost stays unknown. No live provider call or model connection is necessary for this UI proof.

Live adapters enable each intent only after safe conformance is demonstrated. Unsupported intents remain unavailable with an explanation; there is no silent whole-graph execution or canned success fallback. Runtime requirements remain assigned to their existing slices. Full arbitrary partial execution is not a condition for finishing U0 or a claim made by this spec.

An external action is never automatically repeated just because a user reruns a graph region. Reconcile prior receipts/uncertain outcomes and revalidate policy and any required approval. Reusing media bytes is different from replaying a business effect. Preserve old output lineage; new runs cannot claim to have produced reused output. Undo changes authoring, not completed external effects.

## 7. G0 native mapping proof

The pinned VICT Flow v3 schema explicitly has no execution semantics. Its topology checker supports basic type-token compatibility and a graph-wide cycle setting. These are source findings, not a demonstrated integration failure or automatic permission to change VICT.

Before broad canvas implementation, record in `docs/evidence/g0/CONTRACT-MAPPING.md`:

1. Canonical domain owners and revisioned references; visual node/port/edge IDs mapped to semantic identities. Use supported extensions or a versioned TORI envelope/projection; never attach arbitrary fields to strict VICT schemas or establish a competing definition store.
2. Public APIs for rich node bodies, shared inspector binding, authoring transactions/history and persistence. Demonstrate domain and projection changes stay consistent through edit, hide/show, Undo/Redo, duplicate and Save/reopen; no orphan semantic edges after visual edits.
3. Structural/draft validation versus readiness validation. Prove incomplete Save/reopen, incompatible edge rejection, informational cycles and unsupported execution-cycle diagnostics. A permissive visual cycle setting cannot bypass semantic execution checks.
4. Each fixture's operation/edge binding, coordinating engine and unsupported cases. This is a mapping and simulation proof; full live runtime conformance stays in its planned slice.
5. Exact source/artifact versions and public extension points. If a required native interaction cannot be supported, document alternatives tried and the smallest proposed shared fix or custom-UI exception under [UI exceptions](../governance/UI-EXCEPTIONS.md). Obtain owner approval for a genuinely custom primitive before building it; continue unaffected work.

## 8. Three required U0 fixtures

These refine the existing review scenarios, rather than adding a stage or replacing the broader U0/T01–T09 coverage. All three require real editing, validation, history and Save/reopen; execution and its receipts remain labelled simulations in U0.

| Fixture | Composition | Required proof |
| --- | --- | --- |
| A — Quellight agent graph | Agent with Browser Tool availability and Research Specialist delegation; attached Skill/model settings | Connect without starting a run; edit through inline controls/inspector; expose/hide relationships without changing bindings; inspect exact resource identities |
| B — AI-to-business workflow | Request → Run Agent → Decision → Human Review → Quellight Action | Explicit typed mappings and VICT coordinator/Mastra step boundary; exclusive routing and supported/unsupported multi-match cases; incomplete draft saves; approval/effect/retry behavior shown honestly as fixtures |
| C — Creative Weave | Idea with three directions, references, variants, comparison/selection and optional executable transforms | Free arrangement and valid reference cycle; explicit workflow conversion; selected-node run intents, reuse/staleness/new variation and unsupported simulation; preserved artifact versions |

Additional assertions across the fixtures: reject incompatible connections without losing drafts; no automatic context injection from reference links; layout groups do not become subworkflows; no fabricated provenance edge; simulated rerun of a protected action is blocked pending the relevant policy/receipt handling. Record D/S evidence separately from future L/O acceptance.

## Source references and limits

- [VICT Flow v3 schema](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/ui-flow-svelte/src/editor/graph-v3-schemas.ts), [topology validator](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/ui-flow-svelte/src/editor/topology.ts), [business graph declarations](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/sdk/src/graph.ts).
- Product research: [Weave nodes](https://help.weavy.ai/en/articles/12292386-understanding-nodes), [Griptape node editing](https://docs.griptapenodes.com/en/stable/guides/editor/working_with_nodes/), [Griptape execution](https://docs.griptapenodes.com/en/stable/guides/editor/running_workflows/), [Mastra control flow](https://mastra.ai/docs/workflows/control-flow).

Reviewed 2 November 2026. These sources informed the adopted behavior; they do not establish that a TORI adapter, provider account or pinned dependency already supports it.
