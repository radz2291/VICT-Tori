# TORI Foundation Specification v1.0

Status: agreed product direction consolidated on 2 November 2026; implementation and product acceptance pending. Detailed layouts, API bindings, and package extraction choices below are implementation proposals where explicitly marked.

## 1. Product outcome

TORI is VICT's reusable AI orchestration capability with its own Studio for building, operating, and observing AI-powered systems. A non-technical user can assemble agents, workflows, and creative processes visually, run them, understand their activity, and continue working across persistent sessions. A technical user can inspect the underlying definition, activation, execution, tools, and provenance.

The product has two deliverables:

1. **TORI Studio:** an independent, VICT-native application for manual and AI-assisted authoring, operation, and observation.
2. **Reusable TORI capability:** governed contracts and service/adapters that other applications can consume without embedding Studio or recreating provider connections, sessions, reasoning displays, memory mechanics, or agent infrastructure.

Reusable functionality must be available through a documented programmatic boundary. Standalone service deployment and in-process embedding are packaging modes to validate; they must not create two incompatible runtimes. Quellight and eventual VICT Studio integration are real consumers, not demo-only shells.

## 2. Architectural commitments

| Owner | Responsibility |
| --- | --- |
| VICT | Canonical definitions/revisions; immutable activation; actor/project authority; governed effects, approvals, idempotency and uncertain outcomes; durable business orchestration; reusable UI foundation |
| Mastra | Reused agent/model execution, AI workflows, memory mechanics, controller/session mechanisms, Skills/processors, and other supported AI primitives |
| TORI | Versioned exposure catalog, mappings, application/service composition, Studio operations, safe projections and consumer contracts |
| Consumer application | Its business records, domain rules, specialized operations and their authorization |
| External integration | Actual provider/media/browser/search/workspace operations within the granted boundary |

No second general agent runtime, replacement VICT definition registry, new general workflow engine, or new graph editor. Reuse existing mechanisms and expose missing product capabilities. A custom bridge is justified by a concrete gap, not by convenience in bypassing an existing public contract.

## 3. Three underlying concepts; five user-facing Studio pages

The following remain **three distinct types of product state**, not the top-level navigation:

**Definition graph — design.** Author and inspect agent, workflow, connection, memory, model and capability configuration. Agent, Workflow and Creative use the same authoring foundation; they are not separate applications.

**Execution trace — observe.** Inspect actual run evidence: steps, tools, delegation, human requests, errors, artifacts, usage and provenance. No graph animation can substitute for execution events.

**Session — operate.** An ongoing workspace with conversation, mode, chosen model, participants, background tasks, memory context, artifacts and several runs. Navigation does not erase the session.

**Primary Studio navigation is Agents · Workflows · Creative · Sessions · Runs.** These are task-oriented pages that expose the relevant definitions, sessions and run evidence. They do not introduce new runtime/state stores. The [Studio Design Constitution](STUDIO-DESIGN-CONSTITUTION.md) governs shell, menu, panel behavior, component policy and user-facing navigation; the [UI Foundation](UI-FOUNDATION.md) owns the six functional areas.

Activation remains a first-class internal object, visible in definition inspection and run provenance, rather than an extra primary page. It is an immutable authorized snapshot, not a mutable “current settings” object.

## 4. One authoring foundation, explicit relationship meanings

Option C is retained: a common VICT-native authoring foundation supports different flow experiences. Node appearance is not execution semantics.

| Surface | User intent | Meaning of connections | Execution owner |
| --- | --- | --- | --- |
| Agent | Configure collaborators and capabilities | Tool availability, delegation, knowledge/context references | Mastra mechanism within VICT authority |
| AI workflow | Describe a data/control process | Typed data transfer, branch, sequence, human suspension | Mastra workflow adapter |
| Business workflow | Perform controlled application operations | VICT control flow and protected effects | Existing VICT runtime |
| Generative pipeline | Transform prompts/assets into outputs | Typed executable operator inputs/outputs | Appropriate engine via governed tools/adapters |
| Creative canvas | Explore, branch, compare, select | Context, reference, lineage, or explicit executable transform | No execution implied by a spatial/reference edge |

The earlier Creative Flow “eight operations” idea is a vocabulary source to recover and assess. The supplied discussion does not contain those exact eight labels. Do not invent them, or force all tool, delegation, and data relations into eight guessed runtime types. Resolve [O-02](../governance/DECISIONS.md) with the actual source and VICT contracts.

## 5. Expected capabilities

The normative inventory and implementation proof requirements are in [Capability Catalog](CAPABILITY-CATALOG.md). It includes:

- Agent CRUD, versioning, validation, activation and retirement; real streaming, cancellation and errors.
- Multi-agent delegation, background work, recovery, persistent sessions, modes and controlled model switching.
- Shared provider connections, account selection and model availability; supported OAuth/subscription routes only where verified for the intended integration.
- Skills and JIT context; JIT tool discovery; trusted request context; processors, guardrails and explicit budgets.
- Conversation, working, semantic and observational memory; optional domain retrieval and structured extraction.
- Human questions, plan review, steering and suspend/resume, distinguished from approval of protected effects.
- Evaluation datasets, experiments, scorers and regression review.
- Schedules, event signals, notifications, ongoing agent goals and task tracking.
- VICT tools, MCP and external services; controlled workspaces, coding tools, Git/tests and optional external coding harness integration.
- Multimodal artifacts, versioned lineage, creative branching and real generation/transform operators.
- Equivalent manual/programmatic access to shared capabilities; consumer applications do not require their UI to perform their published domain operations.

These are requirements, not a statement that every capability is currently exposed or available at the chosen dependency version.

## 6. Product experience

The default interface is quiet and understandable. Show the current task, result, and meaningful next action. Provide optional inspection of the machinery: activation, model, loaded Skills, authorized tools, relevant context, pending effects, and run tree. Avoid forcing users to understand implementation packages or protocols to perform ordinary tasks.

Nodes can contain the appropriate VICT controls and media. A fixed generic node card must not prevent rich agent, tool, image, or transformation configuration. Styling is centralized through VICT tokens and component contracts. Contextual menus and shared inspection must retain coherent behavior across surfaces.

Desktop supports spatial composition and detailed inspection. Phone supports essential operation, navigation, review, configuration, and touch-accessible graph actions. Do not claim phone support from viewport shrink alone; verify keyboard, focus, touch alternatives and persistent state. Exact layout is reviewed in U0.

## 7. Provider and model rules

Agent configuration controls allowed models and policies. The provider connection supplies credential references and real account/model availability. A Session selects a permitted model; the next run records its resolved selection. Switching a model does not change permissions, replace the conversation, or silently restart an in-flight run.

Provider-supported public reasoning summaries can be displayed. Hidden private chain of thought is neither requested nor stored as a product feature. Unsupported reasoning, pricing, modality, or usage must be represented as unavailable/unknown, not fabricated.

ChatGPT subscription authentication is a conditional target, not a guaranteed TORI login method. Verify the official supported flow, account eligibility, licensing and hosting context before implementing it. Do not reuse browser cookies, scrape credentials, or silently substitute a paid API path.

## 8. Implementation strategy

Build the actual production interface first, using replaceable runtime stubs. Real from the start: native authoring, node/edge edits, inspection, typed validation, history, navigation and definition persistence. Simulatable initially: model responses, execution traces, provider connectivity, background progress, media generation, and external consumer operations.

After owner review, replace stubs in small vertical slices. Retain the approved interface and contract boundaries; if real integration exposes a material UX flaw, bring back that concrete choice rather than hiding it behind a fake backend.

The UI-first stage should cover the complete core experience, not perfect every optional settings screen. A first live slice follows promptly once the primary experience is approved.

## 9. Final acceptance and non-goals

All T01–T09 are cumulative obligations. T06 proves the unified experience. T04–T05 are required creative outcomes; completing agent execution does not make them optional. Quellight and local coding tests prove reuse and authority, not just screen presentation.

Out of the initial foundation: live deployment, a marketplace, hosted external chat channels, A2A interoperability, multi-tenant commercial billing, and a new general-purpose database/agent framework. These are possible future extensions, not prerequisites for the first usable Studio.

Existing VICT Stage 9 remains open, with its Milestone 2 paused. TORI's V2 label refers to a TORI workflow slice and does not resume that unrelated VICT milestone.
