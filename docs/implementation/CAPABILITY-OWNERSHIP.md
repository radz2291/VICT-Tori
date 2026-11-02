# Cross-repository capability upgrade matrix

This is the provisional implementation ownership map for the [capability catalog](../specs/CAPABILITY-CATALOG.md). It makes VICT–Mastra exposure work and TORI application work part of the same functional slices. It does not claim that an upstream change is required for every row or that any listed Mastra API has passed conformance.

## Ownership rules

- `radz2291/vict-02` owns general VICT contracts, authority, protected effects and reusable VICT–Mastra bridge improvements. Extend its public packages when evidence shows a shared gap; do not copy private implementations into TORI.
- `radz2291/VICT-Tori` reusable packages own TORI-specific catalog, adapter and service composition, using existing VICT/Mastra mechanisms. Studio and other apps consume the same public operations.
- TORI Studio owns screen composition, configuration and inspection through those public operations. It must not be the sole implementation of runtime behavior.
- Mastra supplies supported AI mechanisms. Reuse the pinned version where sufficient; a dependency upgrade requires an explicit compatibility decision and regression evidence. Do not rebuild its mechanisms to avoid mapping an API.

## Provisional matrix

The VICT column lists potential shared work to investigate, not preapproved edits. Existing sufficient public APIs must be reused unchanged. Capability IDs and their full proof obligations remain authoritative in the catalog.

| Slice / catalog coverage | Potential work in `vict-02` | Reusable TORI work | Studio consumes / presents |
| --- | --- | --- | --- |
| G0 / U0 — authoring foundation | Verify public UI, graph, history and store APIs; record gaps only under current scope | Minimum definition/service ports, durable authoring bindings and explicit simulation adapters | Six UI areas, native editing, Save/reopen, labelled fixtures and review checkpoints |
| V1a — CAP-01–CAP-13, CAP-16, CAP-18, CAP-26, CAP-34 | Verify/extend governed agent bridge, model binding, trusted context, Skills/JIT tools, processors, budget and interaction contracts; safe activity/public-summary event exposure | Provider connection service, model/mode selection, catalog resolution, session/thread associations, evaluation services and supported Mastra bindings | Agent configuration, real chat, Skills/tools, models/modes, human requests, evaluations and truthful activity/usage |
| V1b — CAP-33 | Verify/extend public discovery/edit/observe/cancel integration and revision/history protection | Bind the Studio-created authoring agent to those governed operations | Build the agent through ordinary UI; inspect and revise its real edits |
| V1c — CAP-11, CAP-14–CAP-16, CAP-26, early CAP-28 | Verify/extend child execution and authority, budget propagation, cancellation, memory scopes, durable execution/effect safety and safe child/background events | Delegation/background/session recovery mappings, memory policies and supported signal bindings | Child runs, background status, reconnect, memory inspection and recovery limits |
| V2 — CAP-12, CAP-20–CAP-21 | Verify/extend public AI workflow bindings, typed data/branch/wait contracts and VICT protected-effect integration | Compile/map authored workflows to the appropriate existing runners and correlate evidence | Workflow authoring, human review, real step results and failure/recovery inspection |
| V3 — CAP-22–CAP-23, CAP-25 | Verify/extend shared media/capability contracts only where public APIs are insufficient | Generation/transform provider adapters, artifact versions/storage/provenance and multimodal bindings | Generate, compare, select and transform real media on the creative canvas |
| V4 — CAP-24 | Verify shared identity/revision and provenance contracts across projections; extend only proven gaps | Explicit creative-to-workflow conversion and shared Definition/Session/Trace/artifact associations | Complete the real cross-view journey without manual copying |
| V5 — CAP-17, CAP-19, CAP-25, CAP-27–CAP-32, remaining CAP-34 | Verify/extend shared connector authority, scheduling/effect boundaries and workspace enforcement where they belong in VICT | Supported schedules/signals/inbox/goals, retrieval/extraction, MCP/search/browser and coding adapters; reusable consumer service | Operate Quellight and coding consumers, schedules, notifications, knowledge and controlled workspaces |

Cross-stage entries retain their catalog timing: basic memory and trace begin in V1a; advanced operation follows in V1c; signals extend through V5. Connectors may arrive earlier if a slice requires them. Optional ACP remains optional. Quellight domain records and business functions stay in their owning application; TORI does not absorb them.

## Required mapping before each runtime slice

Before implementing V1a, and again for every later functional slice, record a concrete ownership decision in that slice's evidence directory. G0 records initial gaps and dependencies without delaying U0 for exhaustive future runtime probes.

For each capability being implemented, record:

1. Catalog/test IDs, exact VICT and Mastra source/package versions, public export/API and a small conformance result.
2. Existing behavior, missing behavior and a disposition: reuse unchanged, extend VICT, implement TORI composition, or blocked. Give the reason and actual target package/path; proposed folder names are not evidence.
3. Authority, persistence, effects and event-schema ownership. Preserve strict existing schemas through supported extensions or versioned companion projections.
4. Required repository scope and dependency order. If VICT must change, implement and verify that scoped upstream change, identify its commit/artifacts, then pin and test the TORI consumer. No implicit upgrade to upstream main.
5. Deterministic denial/failure/recovery checks, installed public-package consumer proof, Studio integration and bounded live acceptance as applicable. Record both upstream and TORI candidate identities when both change.

Deliver the capability across all necessary layers within the slice, progressively replacing its simulation. A completed VICT change alone does not pass the TORI experience; a Studio control alone does not prove capability exposure. If no upstream change is needed, explicitly record reuse and its evidence.

This matrix does not authorize cross-repository writes, live calls, publication or later stages. Those follow the accepted slice scope and the target repository's instructions. Under the current G0 → U0 handoff, upstream remains read-only and runtime work remains deferred. Record a concrete upstream dependency fix when needed and continue unaffected authorized work.
