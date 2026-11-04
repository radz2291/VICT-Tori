# TORI Studio — Shell & Five-Page Experience Map v1.0

**Status:** Owner-directed conceptual mapping for implementation alignment; not a claim that these screens exist.
**Recorded:** 2026-11-04
**Authority:** [UI/UX Constitution](./TORI-STUDIO-UX-CONSTITUTION.md).
**Verification:** [UI/UX Verification Matrix](./TORI-STUDIO-UX-VERIFICATION.md).

This document maps the agreed professional desktop shell to meaningful tasks. It deliberately specifies **regions, hierarchy, navigation and behavior**, rather than freezing a long list of tiny component placements. Arrange and refine against real use, with the central task always prioritized. Use VICT public controls for all covered roles, including on U0 stubs.

## 1. Shared workspace frame

From top to bottom on desktop:

| Layer | Purpose | Contract |
|---|---|---|
| Application menu bar | Conventional commands, help, window/panel management | File, Edit, View, Insert, Run, Window, Help as context allows; disabled commands must be honest |
| Context/project bar | Current project, object/location, breadcrumb, saved/dirty state | Keeps orientation across page changes; no decorative duplicate toolbars |
| Contextual workspace toolbar | Task-relevant actions and visible panel toggles | Library/Inspector/Activity toggles when those panels are used; active state mirrors visibility |
| Main workspace | Actual authoring, creative iteration, conversation or trace investigation | Visually dominant and appropriately focused for the selected page |
| Docked supporting regions | Left source/library; right context inspector; lower activity/log when useful | Resizable and hideable by the **same panel toggle rule**, no mixed X/collapse/chevron control language |
| Five-page navigator | Switch major activity: Agents, Workflows, Creative, Sessions, Runs | Stable, clearly selected task page; not a replacement for a tab inside the active page |

**Design intent:** The bottom page navigator expresses what the user is doing; it is not a direct list of VICT/Mastra subsystems, nor the definition/trace/session data taxonomy. Avoid a permanent left navigation rail. Distinguish the page navigator from the left Library panel. A page may hide some supporting regions by default.

### Shared page rules

- The main stage grows when supporting regions are hidden. Tool location, viewport and selection should remain sensible.
- Toolbars show context-specific commands, not all conceivable system capabilities at once.
- The Inspector is the contextual editor for the current selection. A node body may expose frequent controls; both manipulate one underlying value.
- Panel toggles are stable and bidirectional; Window menu commands reflect the same state. Closed panels must always be discoverable again.
- A lower Activity region is optional. It is not an always-on placeholder just because the shell can render it; activate it when background progress, logs, issues or run feedback materially help the task.
- Allow reasonable desktop resizing and remembered per-page arrangements. Reset Layout restores safe defaults.
- Do not require the user to understand or choose an execution coordinator merely to look at the authored graph. Where execution ownership matters, expose intelligible validation/status.

## 2. Agents page — Assemble and tune an agent system

**Primary question:** “What can my agent do, and how is it configured?”

| Region | Intended content | Default priority |
|---|---|---|
| Central stage | Agent/system structure with relationships between main agent, subagents, tools, Skills, memory, provider/model and related resources | Highest |
| Left Library | Existing agents and resources, organized to find/reuse them; search/add actions | High; optional |
| Right Inspector | Selected agent/resource identity, instructions, configuration, model/provider, tools, Skills, memory/modes and execution permissions as supported | Contextual |
| Lower Activity | Setup feedback, validation, diagnostics or background work only when relevant | Usually hidden |
| Context toolbar | Add, select, inspect, reveal relationships, fit/zoom, validate, run/test where supported | Contextual |

**Core interactions:** Create/select agent; edit instructions; choose model via covered public VICT picker; attach an existing Skill or Tool; reveal attached resource on the graph without duplicating its identity; inspect a subagent; save an incomplete configuration; open a test Session without replacing the definition.

**Important distinction:** A reusable “Agent” definition is not the same as a “Run Agent” invocation. The graph must not imply that every reference relationship is an execution edge.

**Quellight acceptance fixture:** A primary agent references a research specialist and memory agent, has a browser-search/external tool and a Skill, and can later be tested in Sessions. U0 may demonstrate these as truthful stubs, not as a claim that background agents/provider auth already operate.

## 3. Workflows page — Author and inspect coordinated work

**Primary question:** “What happens, in what order, with which inputs and outcomes?”

| Region | Intended content | Default priority |
|---|---|---|
| Central stage | Connected workflow definition with explicit operation/control nodes, ports, edge meanings and validation | Highest |
| Left Library | Workflows, reusable steps, agent invocations, tool operations, input/output types | High; optional |
| Right Inspector | Selected workflow/step/connection properties; constraints and readiness | Contextual |
| Lower Activity | Validation, selected-run status, errors, output previews and console, when needed | Appears when actionable |
| Context toolbar | Add/connect, undo/redo, validate, Run All / Run Node / Run To / Run From when supported, fit view | Contextual |

**Core interactions:** Add an operation; connect compatible typed ports; reject a genuinely incompatible edge; save with missing required inputs; distinguish a decision's route semantics from an arbitrary Mastra branch; inspect who coordinates execution; run a supported scope; inspect the resulting trace in Runs.

**Boundary principle:** VICT may own a protected business workflow and invoke Mastra as an AI step; Mastra may own an AI research workflow while protected tools still cross VICT governance. The UI must not imply that an arbitrary mix is executable if the installed integration has no supported mapping. The actual architecture/contracts remain authoritative.

**Acceptance fixture:** AI research produces a proposal, followed by a protected Quellight action that requires explicit authorization. Partial rerun must not silently repeat an already completed external action.

## 4. Creative page — Explore, compare and refine generative material

**Primary question:** “What can I make, compare, keep, or transform here?”

| Region | Intended content | Default priority |
|---|---|---|
| Central stage | Spacious creative canvas with material references, executable generation/transform operators, previewable outputs, comparison and composition | Highest |
| Left Library | Assets, source materials, operations, reusable creative definitions | High; optional |
| Right Inspector | Prompt, settings, input version, selected result, operator configuration | Contextual |
| Lower Activity | Generation jobs, progress, provider errors; hidden when distracting | Only when useful |
| Context toolbar | Add, connect, preview, generate, new variation, run selected operator/to/from where supported, compare | Contextual |

**Core interactions:** Start with an image/material, connect a generator/transform/upscaler, adjust a property inline or in inspector, run only the relevant operation, compare result versions, mark downstream outputs stale after input edits, and deliberately choose whether to reuse a previous source output.

**Important distinctions:** Exploring material is not automatically a deterministic workflow. An explicit creative-to-executable workflow conversion must preserve meaning and surface unsupported constructs. A decorative grouping is not executable composition. If image/video provider access is unavailable, the draft remains editable and honest placeholders are labeled; never hide unavailable provider state by fabricating a successful image.

**Acceptance fixture:** Generate two variations from one prompt; select the second image version for an upscaler; change upscale strength; rerun upscale without re-generating the source; inspect which input version each result used.

## 5. Sessions page — Use an agent, not merely configure it

**Primary question:** “Can I work with the system I built, here and now?”

| Region | Intended content | Default priority |
|---|---|---|
| Central stage | Conversation/interaction area with tools, attachments, outputs and continuous session history | Highest |
| Left Library | Sessions or relevant agents/projects; session selection/new-session affordance | Contextual |
| Right Inspector | Active agent/mode/model/provider, attached context and controls, details of selected message/tool result | On demand |
| Lower Activity | Live tool calls, background tasks or execution progress only when helpful | On demand |
| Context toolbar | Session selection, new session, switch agent or supported mode, inspect work and open related run | Contextual |

**Core interactions:** Open Quellight inside TORI without launching the separate Quellight app cover; start/resume a session; send and receive messages; see honest provider/model and thinking/tool visibility when technically available and authorized; inspect or follow background work; navigate to the actual execution trace. Switching mode/model must affect the execution binding as specified; changing a UI label alone is not success.

**Important distinction:** Session history is not an editable agent definition or an execution trace. A session MAY reference an agent version and many run IDs; preserve those identities.

**Acceptance fixture:** Quellight primary agent calls research and a specialized platform tool, may delegate/background work as supported, and returns evidence visible in Sessions with a link to an actual run record. U0 stubs must advertise their simulation status.

## 6. Runs page — Explain what really happened

**Primary question:** “What executed, which step failed, and why?”

| Region | Intended content | Default priority |
|---|---|---|
| Central stage | Identified run trace, state progression, attempts, timing and output/evidence relationships | Highest |
| Left Library | Run history/search/filter and saved run identifiers | High; optional |
| Right Inspector | Selected run/step input, output, provenance, authorization and error details | Contextual |
| Lower Activity | Console/log stream/technical detail when useful | Optional |
| Context toolbar | Filter, follow live progress, inspect step, compare, retry/cancel only with supported semantics and permissions | Contextual |

**Core interactions:** Select a run from history, inspect node/step state, distinguish planned graph edge from observed event, identify stale/used inputs, view tool/provider errors, find the originating session/definition version, and handle retry with clear side-effect/approval semantics.

**Important distinction:** A trace is immutable evidence of an attempt, even if additional logs arrive during live execution. User-drawn lines cannot manufacture evidence. Do not overwrite history when a new variation or retry creates a new attempt.

**Acceptance fixture:** A workflow with a successful AI step followed by a protected action that fails/awaits approval; user can identify the completed action and see whether retrying would repeat it. A simulated U0 trace must be visibly labeled.

## 7. Cross-page journeys and transitions

| From → To | User action | Preserve |
|---|---|---|
| Agents → Sessions | “Test/use this agent” | Selected agent ID and definition version; no implicit edit |
| Sessions → Runs | “Inspect this tool call/run” | Session ID, run ID, chosen event |
| Runs → Agents | “View the agent used” | Historical definition version, not silently current |
| Workflows → Runs | “Run and inspect” | Workflow definition revision, input snapshot, run ID |
| Creative → Runs | “Inspect generation” | Operator, input asset version, output/result ID, run evidence |
| Creative → Workflows | “Convert to executable workflow” | Explicit conversion with diagnostics, not a hidden cast |
| Any page → any page | Change workspace | Unsaved edits warning or safe preservation; no accidental execution |

The same object may be inspected from more than one page; avoid copying its state into page-local imitations.

## 8. Menus and command mapping

The exact menu inventory can be refined during real use. Recommended **families**:

- **File:** project/open/save/recent and other genuine project operations.
- **Edit:** undo, redo, duplicate, delete, select and supported edit actions.
- **View:** zoom, fit, display modes and context-appropriate visibility.
- **Insert:** available nodes, operations or resources relevant to the current page.
- **Run:** validate, run scope, stop/cancel, inspect result when supported.
- **Window:** panels (Library, Inspector, Activity as appropriate), reset layout and workspace management.
- **Help:** shortcuts, relevant usage guidance and diagnostics.

Menu item, keyboard shortcut, context menu and toolbar button for the same action MUST call the same command semantics, including disabled-state explanations. Preserve discoverability for novice users; do not over-populate menus just to mimic Adobe or Resolve.

## 9. Small-screen and responsive approach

Desktop page navigation and menu behavior are the canonical starting point. On phone, favor **one primary task surface at a time**, with VICT-backed drawers/sheets or equivalent public primitives for the library and inspector where available. A compact page switcher can replace the desktop five-page bar if necessary, but the five conceptual pages and their semantics remain. Avoid miniature multi-column graphs unless a usable pan/zoom mode is provided. Test selection persistence, context access, form focus/keyboard obstruction, saved edits, and touch + keyboard equivalents.

## 10. Recommended implementation order (advisory, not a U0 authority change)

1. Shared shell, menu and five-page navigator; consistent panel visibility.
2. Common VICT component-role mapping, inspector/edit binding, keyboard and accessibility.
3. Agents + its simple end-to-end Quellight configuration fixture.
4. Workflows/Creative interactive graph vocabulary and staleness with honest stubs.
5. Sessions/Runs meaningful navigation and true/simulated evidence labeling.
6. Runtime vertical slices in the project's existing accepted stage sequence.

Do not treat this advisory ordering as permission to override the existing active U0 scope or acceptance gate. The next agent must reconcile this map with current tickets before changing implementation.

## 11. Implementation questions that remain intentionally open

- Exact node catalog, spacing and density at production scale.
- Per-page default width/height and which secondary panel first appears.
- Supported provider/model details and actual installed Mastra/VICT runtime behavior.
- Keyboard shortcut choices, subject to conflicts with browser/native OS.
- Specific compact/mobile navigation presentation.
- Which complex rich-node controls require approved VICT composition or a documented exception.

Resolve these empirically through functioning UI, with the constitution and verification matrix as hard constraints, instead of inventing separate visual systems.
