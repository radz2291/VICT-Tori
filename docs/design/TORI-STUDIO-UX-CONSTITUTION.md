# TORI Studio — UI/UX Design Constitution v1.0

**Status:** Owner-directed design baseline; implementation alignment and acceptance remain subject to review.
**Recorded:** 2026-11-04
**Scope:** Every TORI Studio surface, including prototypes, U0 previews, stubs, real functional views, dialogs, embedded app-consumer views, and future pages.
**Companion documents:** [Shell & Page Experience Map](./TORI-STUDIO-SHELL-AND-PAGES.md) and [UI/UX Verification Matrix](./TORI-STUDIO-UX-VERIFICATION.md).

## 0. How to use this constitution

This is the normative UI/UX baseline agreed during TORI product-design discussions. It is deliberately independent of the current implementation and does **not** assert that any existing code, package, stage, or feature already passes. The implementing/reviewing agent must reconcile it with the repository's authoritative architecture, contracts, actual public VICT package exports, and active U0 handoff. Preserve current work; raise conflicts and document deviations rather than silently rewriting other specifications.

- **MUST / MUST NOT:** binding design and review rules.
- **SHOULD:** default that requires a documented user-experience reason to vary.
- **MAY:** acceptable optional capability, not an acceptance condition on its own.
- User's current explicit directions and existing security/runtime contracts outrank an older interpretation of this document. A material conflict requires owner resolution.
- This document governs **what the experience must mean**, not a mandate to invent new backend infrastructure or duplicate Mastra/VICT capabilities.
- Product approval of the conceptual foundation is not approval of a pixel-perfect implementation. Owner hands-on UI approval remains a separate gate.

## 1. Product intent and experience principles

TORI is an actual studio for authoring, operating, examining, and using agent systems, workflows, creative compositions and sessions. It should feel like durable industrial/creative desktop software, with DaVinci Resolve's task-oriented workspace discipline as a reference. ComfyUI, Figma Weave, Griptape, Langflow and Dify are behavior references where relevant, not skins to copy.

**UX-PR01 — Task-first architecture.** Organize around what a person is doing, not the runtime's internal taxonomy. A user should not need to understand VICT versus Mastra ownership merely to configure an agent or run a task.

**UX-PR02 — Quiet by default; inspectable on demand.** Prioritize a large working surface and a clear primary action. Keep secondary configuration discoverable via selection, inspector, context menu, relevant keyboard command or progressive disclosure. Complexity must be available, not permanently displayed. This is the owner's “car engine / open the hood” principle.

**UX-PR03 — Familiar professional software.** Use a conventional menu bar, task-oriented pages, stable tool placement, predictable selection and editing behavior, precise information hierarchy, and deliberate density. Avoid generic SaaS dashboards, decorative cards, oversized controls, inflated spacing, gratuitous gradients, and unnecessary explanatory text.

**UX-PR04 — One meaning, one interaction language.** Similar controls MUST look, behave, label themselves and communicate state consistently across all pages. Different meanings MUST not be disguised as the same action. Accessibility, discoverability and consistency are product requirements, not last-stage polish.

**UX-PR05 — One actual product.** The UI-first prototype must evolve into the working Studio. A stub MAY simulate unavailable runtime behavior, but MUST be visibly identifiable as a simulation, MUST NOT fabricate successful execution/provenance, and MUST use the same intended design system as the final UI.

**UX-PR06 — VICT-native, exception-driven.** Reuse VICT public packages, established visual/interaction components, structure-driven composition and node support. App-specific assembly is expected; duplicated framework primitives are not.

**UX-PR07 — Work stays under user control.** Selection, edits, saves, execution, authorization, errors, cancellations and results must have distinct, understandable states. External actions MUST NOT be silently repeated by interface navigation, recomputation or inspector changes.

**UX-PR08 — One shared foundation, multiple task arrangements.** Agents, Workflows, Creative, Sessions and Runs are five experiences using a common shell, panel behavior, component vocabulary, and underlying definitions. They MUST NOT become five independent design systems.

## 2. Non-negotiable VICT UI Foundation policy

**UX-VICT01 — Public-component-first, on every review surface.**
> TORI MUST use the **public VICT UI Foundation component whenever it covers the control's role**, on **every Studio surface presented for review**. This includes pickers, buttons, fields, menus, dialogs, feedback, and all other covered controls. A fixed-choice picker MUST use VICT Select when VICT publicly provides a Select for that role.

This rule applies equally to:

- Finished UI and deliberately stubbed U0 screens.
- Canvas and node interiors, inspectors, menus, preferences, run views, session views and onboarding.
- Dialogs, dropdowns, contextual controls, search/filter fields, status/notifications, loading, validation and error feedback.
- Keyboard, mobile and accessibility variants.
- Newly created components and later repairs or refactors.

**UX-VICT02 — Public means consumable.** Use the installed, documented **public package exports** appropriate to TORI; do not treat an internal VICT source file, undocumented deep import, locally copied component or editor demo as a public API. Where VICT's behavior primitives use Bits UI or styled controls use shadcn-svelte internally, TORI still consumes the VICT public surface when that role is covered.

**UX-VICT03 — No silent fallback.** Do NOT substitute browser-native select/button/field/dialog/menu, a local CSS imitation, a generic third-party control or an app-specific wrapper merely because it is faster, familiar, or a stub. The underlying semantic HTML that a VICT control renders is not itself a violation. The violation is bypassing a fitting public VICT control as the Studio's authored UI surface.

**UX-VICT04 — Narrow, evidenced exceptions.** If no usable public VICT component covers the role, first record:
1. Required role and interaction semantics.
2. Public VICT component/package/version/export searched and why it cannot fulfill the role.
3. Whether composition of existing public components can meet the need.
4. Proposed narrow custom UI, behavior and accessibility contract.
5. Reuse/upstream contribution possibility, owner review/decision, and a replacement trigger.

Until an exception is approved, mark the affected review criterion **BLOCKED** or **HELD**, never quietly call it compliant. Do not claim a package or component is absent without checking the installed public API.

**UX-VICT05 — Control inventory is review evidence.** Each presented surface MUST have an inventory mapping each meaningful control role to a public VICT export, or a documented exception. The exact imports, component props and installed package versions must be independently inspectable. A visual resemblance to a VICT component is insufficient proof.

**UX-VICT06 — Styling belongs to the shared system.** Theme tokens, focus, disabled states, text sizing, colors, outlines, menus, surfaces, hover and selected states SHOULD originate from the supported VICT theming/styling system. Avoid one-off local CSS overrides that fork the design language.

## 3. Information architecture and shared shell

**UX-SH01 — Five top-level task pages.** TORI's primary page navigation is **Agents · Workflows · Creative · Sessions · Runs**. These are workspaces, not the three underlying data models.

**UX-SH02 — Three distinct underlying concepts.**
- **Definition graph:** the saved, editable design and relationships.
- **Execution trace:** what actually happened for an identified run.
- **Session:** an ongoing interaction and its context/history.

A definition view MUST NOT pretend to be an execution record; a session MUST NOT silently mutate a saved definition; provenance MUST come from a real run/evidence source, not a user-drawn link. Multiple pages may expose different views of these same objects.

**UX-SH03 — Conventional desktop menu bar.** A stable menu bar supports the conventional families **File, Edit, View, Insert, Run, Window, Help** where contextually applicable. Menus follow actual command availability; do not create dead entries or promise unsupported functions. Common work MUST remain accessible without memorizing shortcuts.

**UX-SH04 — Spatial model.** The desktop shell has a main central working stage with optional left supporting/library region, right contextual inspector, and optional lower activity/console region. Page-specific layouts MAY omit or repurpose regions where that improves the task. Preserve canvas/viewer working area as the visual priority.

**UX-SH05 — Resolve-inspired dock-panel policy.**
- Docked workspace **visibility** is owned by a consistent set of labeled toolbar toggles and mirrored under **Window** (or Window > Panels). A toggle visibly indicates whether its region is shown and a repeated activation hides it.
- Library, Inspector and Activity MUST obey the same visibility convention. Do not put a left-collapse symbol, a dismiss X and an expand chevron on their headers to perform three versions of “hide this workspace panel.”
- A chevron is for **disclosing content inside** a visible panel. An X is for **dismissing a transient dialog/popover** or a genuinely closeable document, not the primary way to manage a persistent dock region.
- Panel labels identify their role. A panel's available visibility control remains discoverable when the panel is hidden.
- Toggles, the Window menu and keyboard commands (if offered) MUST share one state and work in both directions.

**UX-SH06 — Layout persistence.** On desktop, panel visibility and resize choices SHOULD persist when switching pages and reopening Studio, with an explicit reset-layout command. Store per-page arrangements where tasks need different defaults; avoid surprising layout jumps and shifting controls.

**UX-SH07 — Content-dependent context.** The inspector edits the selected object, not a second copy. No selection shows an intentional neutral/empty state, not an unrelated configuration. The panel system remains predictable across pages even when content differs.

**UX-SH08 — Page navigation does not equal run navigation.** Do not use the bottom five-page selector to replace contextual panel toggles, run breadcrumbs, or tabs within a particular task. Each navigation level has one purpose.

See [Shell & Page Experience Map](./TORI-STUDIO-SHELL-AND-PAGES.md) for page goals, suggested panel arrangements and task journeys.

## 4. Interaction and content rules

**UX-IN01 — Shared state across editors.** Inline node controls, inspector controls and any other editing surface MUST update the same underlying property. They must reflect edits immediately and remain correct after undo/redo, save/reopen and selection changes.

**UX-IN02 — Display is not ownership.** Showing an attached Skill, Tool, memory, model or resource as a visible node MUST preserve the identity of the existing resource. Hiding that visual representation MUST NOT delete the resource or disconnect it. Creating a reusable resource versus adding a visual reference must be an explicit distinction.

**UX-IN03 — Context actions.** Right-click/context menus, relevant inline controls and the inspector MAY expose the same supported operations; keep wording, availability and effects consistent. No unlabeled destructive actions or inaccessible icon-only critical commands.

**UX-IN04 — Drafts are valid work.** Incomplete definitions can be created, saved, reopened, revised and inspected. **Editing integrity** (identity/reference consistency) is distinct from **execution readiness** (required inputs, compatible nodes, provider capability, authorization). Save cannot be blocked merely because a provider is not configured.

**UX-IN05 — Edges are semantically meaningful.** Node category or wire shape must not imply execution by itself. The existing six relationship meanings, typed ports, cycle rules and creative-to-workflow conversion contracts remain authoritative. A visual group is not automatically an executable subworkflow. Invalid connections need understandable diagnostics.

**UX-IN06 — Run is an explicit contract.** Where supported, distinguish Run All, Run Node, Run To Node (necessary upstream dependencies), and Run From Node (selected/downstream with valid prior inputs). When a runtime cannot support a command, disable/explain it or label it as U0 simulation; never imply live execution.

**UX-IN07 — Staleness and reuse are visible.** Editing an input must mark affected results stale rather than silently rerunning expensive generation. Re-running an upscaler may reuse a selected existing source image. “Another variation” creates a separate result; do not overwrite provenance or ambiguity about which result version was consumed.

**UX-IN08 — External effects are deliberate.** Retries, cancellations, approvals, partial reruns and recovery for external/protected actions need explicit ownership and user-facing status. A history replay or a re-render MUST NOT silently repeat a protected Quellight action.

**UX-IN09 — Provenance is evidence.** The UI may reveal evidence/lineage, but drawing a line or typing text cannot fabricate execution evidence. Distinguish planned routing from observed execution.

**UX-IN10 — Sessions feel usable.** The user can interact with Quellight's actual agent capabilities from inside TORI (without opening the separate Quellight app shell) when the relevant integration stage is functional. Model/provider identity, attached Skills/Tools, memory context, background work and session state must be inspectable when available; do not claim enabled runtime capabilities from decorative UI.

**UX-IN11 — Honest simulation.** Any U0 fake response, run, image, workflow output or provider selection MUST be labeled as demo/simulated and be distinguished from real events in history and trace.

## 5. Visual and motion language

**UX-VIS01 — Calm industrial aesthetic.** Favor disciplined high-density work surfaces, aligned baselines, neutral/dark professional color treatment with accessible contrast, subtle separation of panel planes, clean typography, restrained radii and purpose-driven accents. DaVinci Resolve is a structural inspiration, not a requirement to duplicate its appearance.

**UX-VIS02 — Information first.** Titles, control names, status, selected objects, readiness/errors and primary actions must be easy to scan. Keep hierarchy consistent. Avoid decorative hierarchy based solely on large card blocks.

**UX-VIS03 — State carries meaning.** Selected, hover, active toggle, disabled, running, saved, unsaved, stale, error and simulated states must each have a coherent styling/token pattern, not color alone. Icon shape/color may reinforce state but cannot substitute for labels or accessible names.

**UX-VIS04 — Spatial stability.** Selection or opening details should not unexpectedly reflow the canvas. Panels resize intentionally; open/close should keep focus and viewport predictable. Avoid floating UI that obscures the central work or jumps during frequent actions.

**UX-VIS05 — Motion conveys change.** Keep animations brief and functional (panel visibility, state transitions, result updates). Respect reduced-motion preference. Avoid flourish that delays interaction.

## 6. Accessibility, responsiveness and ergonomics

**UX-A11Y01:** All actions must support visible keyboard focus and meaningful accessible names, roles and states. Dialogs trap/restore focus correctly; menus, pickers, list items and nodes support appropriate keyboard interaction per VICT's public contracts.
**UX-A11Y02:** Context-only actions must have a keyboard and/or discoverable non-context alternative. Tooltip-only explanations are insufficient for essential information.
**UX-A11Y03:** Text/control contrast and status meaning must not rely on color alone. Include discernible error messages and actionable repair instructions.
**UX-A11Y04:** Mobile/phone use is a supported consideration. Desktop multi-pane geometry may adapt to a single primary stage with deliberate panel sheets/drawers, but the same definitions, commands and component policy apply. Never simply shrink an unusable desktop layout to mobile width.
**UX-A11Y05:** Preserve user input and selection through breakpoint changes and panel toggling. Touch targets and gestures need accessible equivalents.

## 7. Delivery and change-control rules

1. Before showing a new Studio surface for review, check it against this constitution and record its public VICT control mapping.
2. A layout or styling shortcut that breaks a MUST is not an “acceptable temporary U0 stub.” Only runtime/data integrations may be simulated as explicitly permitted.
3. UI acceptance is demonstrated by owner hands-on walkthroughs plus reproducible verification, not a builder's own aesthetic claim or screenshots alone.
4. When a meaningful design rule changes, record the prior rule, reason, owner choice, affected surface(s), and test impact. Keep the previous evidence; do not retroactively call earlier builds compliant.
5. Do not declare an entire stage PASS merely because UI shells render. Evaluation scope and stage gate remain those of the accepted project handoff.
6. In a repository conflict, the reviewing agent should propose reconciliation, not silently remove U0 work or overwrite existing authoritative files.
7. Exact VICT component versions, imports and public availability MUST be verified against the installed/published packages during implementation. This document intentionally does not invent export names or assert that any specific release provides an unverified control.

## 8. Review gate and shorthand

For **each** surface, the agent must answer: (a) Is the task flow understandable and genuinely usable? (b) Is the shell/panel system consistent? (c) Is every covered control using VICT's public component? (d) Are state/selection/save/run semantics truthful? (e) Is it accessible and responsive? (f) Which failures and exceptions remain? See the companion verification matrix for executable criteria and evidence format.

**This constitution fixes the experience principles, not the final pixel layout or node inventory.** Page details and styling can be refined from real use without reopening the core design agreement.
