# Production Studio UI foundation

U0 delivers the actual product UI with replaceable execution adapters. It is not a disposable prototype. The behaviors in this document are required; the exact layout is a candidate for owner review. Use the [native package map](../reference/BASELINE.md), then verify public component behavior before composition.

Apply [Node & Edge Foundation v0.1](NODE-EDGE-FOUNDATION.md) across all surfaces. Definition, Operation, Control and Creative/Material are catalog discovery families; node role and edge meaning are explicit. Agent definitions and Run Agent invocations are different usages of the same reusable capability. Use a small starter palette for the required fixtures, extending it through catalog registrations.

## 1. Studio shell and navigation

Primary views: **Definition, Trace, Session**. Within Definition, users work with Agent, Workflow, and Creative surfaces. Connections and the capability catalog are supporting management areas, not separate products. Use a shared project context, selection model, inspection behavior, styling and artifact identity.

Proposed desktop layout: project/navigation rail; central selected surface; contextual inspector; optional Session/Trace detail panel. The owner should be able to focus the canvas by closing secondary panels. Do not copy the old VICT Studio's fixed toolbar/clipboard/inspector arrangement by default. Prefer contextual actions and shared inspection, with navigation stable across views.

Proposed narrow layout: one principal surface at a time, clear back/navigation controls and a VICT-native sheet/panel for inspection. Offer list/outline and form alternatives to precision graph dragging. Preserve selection and unsaved changes when opening/closing panels or changing views. No hover-only essential controls.

Always show project, selected definition/revision, saved/unsaved state, and whether the current execution source is simulated. Keep implementation package names out of ordinary product flows; expose technical provenance in inspection.

## 2. Six required areas

### Agent Builder

- Create from blank or an explicit editable template, name, clone, edit and retire.
- Configure instructions, allowed models/default, enabled modes, Skills, tools, memory, processors, budgets, permissions and child-agent references.
- Use rich VICT-native nodes/forms; render relationship types distinctly with readable labels and accessible alternatives.
- Inline controls and inspector edit the same values. Expose existing resource bindings as nodes when useful; hiding a projection preserves configuration. Clearly separate hide, detach, delete, clone and invocation-specific settings.
- Inspect an effective configuration preview and validation diagnostics. Surface unsupported runtime features honestly.
- Separate Save, Validate and Activate intent. In U0, Save and Validate work; activation is explicitly a simulation or unavailable, never a real authorization grant.
- Provide Test & Evaluation as an attached workspace: cases, expected behavior, version/model comparison and labelled sample results during U0.

### Workflow Builder

- Add/configure/move/duplicate/delete nodes; connect, reconnect and remove typed edges using native Flow mechanics.
- Provide typed ports, input forms, branch configuration, human-review/wait and output nodes. Prevent invalid connections with specific reasons.
- Distinguish AI workflow and VICT business control semantics. Do not pretend a new shared runner executes both.
- Support selection, contextual menu, shared inspector, zoom/pan/fit, and undoable graph edits.
- Validate drafts and Save/reopen actual graph definitions/layout. Show graph revision and result staleness after upstream edits.
- Allow incomplete drafts to save; validation reports missing inputs/configuration and unsupported execution mappings. Reject incompatible edge edits without losing the prior draft. Activation/execution require relevant readiness and authority; U0 activation remains simulated or unavailable.
- Inspect the workflow's coordinating engine and step boundary, exclusive versus multi-match routing, no-match behavior and joins. Layout grouping never implicitly creates an executable subworkflow.
- A simulated run follows a fixture scenario and opens the corresponding Trace; animation alone is not the result.

### Creative Canvas

- Place ideas, prompts, references and media spatially. Branch into at least three alternatives; rearrange without rewriting content.
- Compare selected versions with a native composition, choose a preferred direction, and revisit earlier versions without destructive replacement.
- Configure generation and transformation operators with appropriate controls and media inputs. Context/reference edges remain non-executable.
- Preserve relationships among source idea, branch, versions, selection and final artifact.
- Make “create executable workflow from selection” an explicit authored operation with validation and retained identity. In U0 execution remains simulated.
- Test flexible rich node content using VICT components. Do not constrain all nodes to the same fixed text card.
- Demonstrate Run Node / Run To Node / Run From Node, reuse and new-variation intents using labelled simulations, with scope/input-version/staleness previews and explicit unsupported cases. Live availability later follows adapter proof; a partial rerun never silently repeats protected actions or regenerates upstream media.
- Ordinary context links are associations; explicit context bindings control what reaches an agent. Render provenance from recorded evidence with origin labels; user-drawn links cannot claim observed generation.

### Session

- Open/list/reopen sessions with persistent identity; preserve conversation and authored data across navigation.
- Show selected activation, current model/mode and participants, with optional deeper context inspection.
- Use VICT Conversation/AI components for messages, tool activity, public reasoning summaries, sources, attachments, questions, plans and tasks.
- Configure modes through the same management area; enable/disable and select permitted modes/models with visible pending/effective states.
- Represent background, waiting, failed, cancelled and unavailable operations. “Thinking” is a supported status, not fabricated internal reasoning.
- In U0, conversation responses and background progress are synthetic and visibly labelled; local UI edits/settings still persist genuinely.

### Execution Trace

- Show nested run/step/tool/child activity tied to a session and exact definition/activation reference.
- Select a trace event to inspect safe inputs/outputs, timestamps, status, error, artifact and provenance. Unknown usage/cost remains unknown.
- Link to the relevant definition node, artifact and session message without losing context.
- Support success, denial, cancellation, human wait, failure and interrupted/uncertain examples. Clearly distinguish attempted from completed effects.
- Display simulation badges at run and event details; no sample evidence enters live analytics.

### Provider & Capability Management

- Connection list, account-safe labels, status and supported connection types; model features, allowed choices/default/fallback policy.
- Skills list/search/inspect/attach, version and scope; tool catalog search/attach, schemas, permissions and effects class.
- Memory/knowledge policies, processors/budgets, workspace settings, MCP/connector descriptors, schedules/notifications/goals, evaluations.
- Show capability support state and concrete reason when unavailable. U0 can save proposed settings but cannot claim connectivity.
- In U0, do not accept real secrets into a fake form. Use synthetic connection records and an explicit “Simulated connection” flow. Real auth awaits its runtime slice.

## 3. Real versus simulated boundary

| Must be real in U0 | May be simulated in U0 |
| --- | --- |
| Shared VICT component rendering/behavior and centralized styling | Model text and public-summary examples |
| Definition CRUD and real graph interactions | Agent and workflow execution |
| Schema/port validation and node-specific diagnostics | Provider connection and model availability |
| Revision guards, Undo/Redo, Save/reopen | Delegation/background/recovery events |
| Navigation, selection and inspection | Quellight domain operations and coding commands |
| Local authored definitions, settings and fixture artifact references | Media generation and transforms |
| Local persisted simulation record identity | Live evaluation scoring and scheduled execution |

Every simulated result must carry machine-readable origin metadata and a visible label. “Run sample” or equivalent is preferable to an unqualified “Run” in the initial mode. No network side effects occur from simulated operations. A failed live adapter must never use this mechanism as an invisible fallback.

## 4. Required review scenarios

The three [Node & Edge fixtures](NODE-EDGE-FOUNDATION.md#8-three-required-u0-fixtures) refine the authoring-agent/Quellight, governed-action/research-workflow and creative scenarios below. Demonstrate all three through real editing, Undo/Redo and Save/reopen, with simulated execution only. Include incomplete drafts, shared form/node values, non-executable reference cycles, supported/unsupported run intents and protected-action rerun refusal. These fixtures supplement the eight scenario rows rather than replacing them.

| Fixture | Contents | What it exercises |
| --- | --- | --- |
| Blank project | Empty definitions/session/artifact list | First-use clarity and real creation without pre-seeded success |
| Authoring agent | Agent, model, Skill, governed edit tool, optional child reference | Agent configuration, typed relations, validation, inspect, history |
| Research workflow | Input → researcher → decision → specialist/review → output | Typed routing, branch configuration and wait/failure trace |
| Governed action | AI recommendation → review → application action | Distinguish advisory output, approval and effect receipt |
| Creative three directions | Metallic, biological and architectural concept branches with synthetic/redistributable media | Rearrangement, comparison, history, transform relation and preferred selection |
| Unified continuation | Creative selection → workflow → simulated run → Session revision | Shared definition/run/session/artifact IDs across surfaces |
| Quellight workspace | Synthetic Living Book, Compass, commitments and Daily Desk references | App boundary, schedules/memory/goals and headless context |
| Coding workspace | Synthetic repository files/diff/tests and specialist roles | Workspace scope, command denial, review, child trace |

Fixtures are resettable without deleting authored user work. Use versioned deterministic data and small repo-safe assets. Do not import the owner's private conversations, accounts or Quellight records into the public repository.

## 5. Interaction and state requirements

- Pointer and keyboard selection; visible focus; context-menu and non-context-menu equivalents; Escape/focus restoration for owned overlays.
- Editing inside a node must not accidentally drag it or trigger canvas shortcuts. Graph shortcuts must not override text editing.
- Connect/reconnect/delete operations enter history consistently. Invalid connection/structural edits leave the prior draft intact; that draft may be incomplete and not execution-ready.
- Unsaved work indicator; reload/reopen from committed storage; quota/write failure and stale revision shown with recoverable drafts.
- Browser back/forward and surface changes preserve the intended project/selection context. Modal/panel state does not lock hidden frames or the whole Studio.
- Light/dark or chosen VICT themes use shared semantic tokens, including popups, node controls, media and portals. Do not patch colors separately in each feature.
- Empty/loading/disabled/unsupported/denied/error states are designed, not left as console errors.
- Retained content is navigable through pagination/virtualization where justified; no arbitrary hidden cap discards user content.

## 6. Phone and accessibility review

Use at least a desktop 1440×900 viewport and a narrow 390×844 viewport, recording actual dimensions. These are review fixtures, not product breakpoints. Verify touch-accessible actions and alternatives to dragging, page scroll without unintended body overflow, readable labels, focus order and open-overlay bounds. A physical phone check should cover touch, on-screen keyboard and safe areas when available. Mark device proof unavailable explicitly; emulation is not physical-device proof.

The owner does not need to perform complex desktop-style graph edits on a phone to inspect a run, answer a question, choose a model, change node properties or save. Define the essential mobile action set and verify it; do not hide an entire broken feature behind “desktop recommended.”

## 7. UI reuse and exceptions

Use `StructureExplorer` and the established source/relationship contracts where appropriate, `GraphWorkspaceV3`/public Flow primitives for graphs, `EditorBridge`/editor contracts for changes and history, and shared VICT forms, AI and media components. These are evidence-backed candidates, not assumed drop-in domain implementations.

G0 must document the projection between canonical UI source and TORI domain configuration. StructureExplorer alone is not a generic runtime definition builder. Compose through public extension points; do not copy `apps/studio` internals.

If a required behavior is genuinely missing, record native alternatives tested, exact missing contract, proposed shared addition, owner impact and evidence in [UI exceptions](../governance/UI-EXCEPTIONS.md). Only the owner can approve that exception. Continue unaffected UI work while preparing the concrete decision.

## 8. Owner review checklist

The owner reviews whether agents/tools/Skills are understandable; the node experience feels natural; creative alternatives are easy to compare and revisit; Definition/Trace/Session feel connected; native controls are coherent; phone operations are usable; and simulation is unmistakable. Record requested changes against the actual candidate, not a separate mockup. Engineering PASS and owner UI approval are separate records.

Apply the [Studio accessibility and feedback guide](STUDIO-ACCESSIBILITY.md) across all views and review checkpoints.
