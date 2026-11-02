# Inspected VICT baseline and reuse map

Inspected 2 November 2026. These are source and documentation findings, not fresh runtime/installed-consumer results. The exact baseline is [`radz2291/vict-02@6b420a3e9eada6f694cc2550debda7753316b5b3`](https://github.com/radz2291/vict-02/tree/6b420a3e9eada6f694cc2550debda7753316b5b3); remote `main` resolved to that SHA during bootstrap. Its Git tree was `5fc1046b3cb9f3c2f5baf0df53904186fb4bb6af` in the commit record.

## Evidence hierarchy

1. Owner's current instruction and agreed product decisions define desired work.
2. Pinned source/manifests/public exports establish what code is present.
3. Existing audit/evidence is attributed to its original candidate and scope.
4. Current upstream docs identify reuse opportunities; installed exact-version behavior still needs conformance.
5. TORI product completion requires its own acceptance, independent of all prior evidence.

The earlier **TORI — VICT–Mastra Capability Exposure Audit**, assessed 2 November 2026 against the same VICT SHA, was read during bootstrap. It reports bounded adapter and cross-package test results, plus missing child execution, general Session hosting, external connectors, coding execution and full Quellight parity. Those tests were not rerun here. The report predates the accepted additions for providers/reasoning, Skills/JIT tools, evaluations and related capabilities; the new [catalog](../specs/CAPABILITY-CATALOG.md) includes them without asserting delivery.

This repository summarizes the relevant audit conclusions and links public source; it does not publish the owner's complete private research files or unrelated operational history.

## Version inventory

| Dependency | Inspected source value | Consequence |
| --- | --- | --- |
| VICT packages listed below | `0.4.0-rc.1` | Verify actual artifact bytes/source; identical version text may not identify the latest foundation build |
| `@mastra/core` | `1.64.0` | Starting compatibility pin, not permission to upgrade |
| `@mastra/memory` | `1.28.2` | Memory scope and advanced features still need explicit binding |
| `@mastra/libsql` | `1.22.3` | Existing storage dependency, not a selected universal TORI database |
| `@mastra/observability` | `1.17.5` | Map safe trace projection; do not expose raw private payloads |
| Upstream Node engine | `>=22.13.0` | Select a concrete runtime compatible with the full resolved dependency set |
| Upstream Svelte dev dependency | `^5.57.0` | Svelte 5 is the natural UI host; lock a verified version |
| Upstream TypeScript dev dependency | `^6.0.3` | Verify host compatibility; do not assume globally installed tooling |

Sources: [root manifest](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/package.json), [Mastra manifest](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/mastra/package.json), [existing Studio manifest](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/apps/studio/package.json). No new TORI dependency installation is claimed.

## Native UI package map

| Public package | Source-confirmed surface | Intended TORI use and limit |
| --- | --- | --- |
| `@victframework/ui` | VICT semantic UI/document foundation referenced by editor packages | Canonical UI semantics, transactions/styles through actual public APIs |
| `@victframework/ui-svelte` | Controls/primitives/catalog, authoring, viewport, styles | Forms, contextual controls, overlays, theme and responsive compositions |
| `@victframework/ui-editor` | `EditorBridge`, `DocumentStorePort`, `Inspector`, `HistoryPanel`, `Composer`, commands, local-store exports | Authoring/history/store integration; no runtime authority |
| `@victframework/ui-structure-svelte` | `StructureExplorer`, `StructureSourceNode`, `StructureRelationEdge`; projection/semantics/behavior/connections/trace/selection exports | Shared source/relationship exploration; requires explicit domain projection |
| `@victframework/ui-flow-svelte` | `GraphWorkspaceV3`, `GraphSurface`, `GraphViewport`, `GraphPortRow`, `GraphEdgeSettings`, v3 model/schemas/commands; upstream Flow reexports | Rich typed graph authoring and native interactions; not an executable workflow engine |
| `@victframework/ui-ai-svelte` | `Conversation`, `Markdown`, `Patterns`, `Trace`, message/attachment controls, authoring/capture/styles | Session/trace/evaluation presentation; UI components do not create agent authority |
| `@victframework/ui-media-svelte` | Public authoring/assets/manifest/vectors exports | Reference/media/artifact previews; prove actual file support in consumer |
| `@victframework/ui-patterns-svelte` | Public composition and authoring exports | Shared navigation/panels/pattern compositions |

Manifest/index evidence:

- [Structure exports](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/ui-structure-svelte/src/index.ts) and [manifest](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/ui-structure-svelte/package.json).
- [Flow exports](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/ui-flow-svelte/src/index.ts) and [manifest](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/ui-flow-svelte/package.json).
- [Editor exports](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/ui-editor/src/index.ts).
- [AI exports](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/ui-ai-svelte/src/index.ts) and [manifest](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/ui-ai-svelte/package.json).
- [Native UI manifest](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/ui-svelte/package.json), [media manifest](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/ui-media-svelte/package.json), [patterns manifest](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/ui-patterns-svelte/package.json).

Some public Svelte exports intentionally point into a package's distributed `src/`. Importing a declared public entry is allowed; reaching into another repository's private source paths or using aliases to bypass packaging is not. Do not import `@xyflow/svelte` directly as a second graph editor merely because VICT internally uses it; use VICT's public composition/extension surface.

## Runtime contracts to map, not replace

The earlier audit identified `vict.agent-profile@1`, `vict.agent-activation@3`, `vict.agent-stream@1`, and `vict.flow-graph@3`. Inspect their exact public definitions in G0/V1 before binding TORI:

- [Agent SDK profile](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/sdk/src/agent.ts).
- [Activation types](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/runtime/src/agent-types.ts) and [registry](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/runtime/src/agent-registry.ts).
- [Mastra adapter](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/mastra/src/adapter.ts), [tool bridge](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/mastra/src/tool-bridge.ts).
- [Stream contract](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/contracts/src/agent-stream.ts), [VICT server commands](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/server/src/commands.ts).
- [VICT graph SDK](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/sdk/src/graph.ts), [orchestration driver](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/runtime/src/orchestration-driver.ts), [Flow model v3](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/packages/ui-flow-svelte/src/editor/model-v3.ts).

The audit found a single-agent Mastra construction path with real governed tools and memory. Child/workflow references existed without equivalent child/workflow execution wiring. Do not treat this as an instruction to recreate the adapter; extend compatible public mechanisms with conformance evidence.

## Required conformance probes

| When | Probe | Minimum recorded result |
| --- | --- | --- |
| G0 | VICT public artifacts and native host | Install/build/render/edit/save/reopen without Studio source dependency; exact artifact identities |
| G0 | Schema/projection compatibility | Map UI document and graph revisions to TORI domain settings without forking authority |
| V1a | Controller/session/thread | Exact available constructors/APIs; thread persistence vs live state; mode/model and auth boundaries |
| V1a | Skills and JIT tools | Exact exports/tool names/TTL; registry scope; pinned behavior; no dynamic grant escalation |
| V1a | Processor/evaluation packages | API/version/license compatibility, scorer behavior and safe config mapping |
| V1a | Provider authentication/reasoning | Supported official route and account eligibility; supported public events only |
| V1c | Child/durable/background | Child tool context and budget; cancellation; crash/lease/replay; protected-effect fencing |
| V2 | Workflow translation | Actual typed inputs/branches/human suspension and VICT effect boundary |
| V3 | Media operators | Exact provider capabilities and byte/provenance contract |
| V5 | Schedules/signals/goals/knowledge | API availability at pin, storage/restart/authorization semantics, required add-ons |
| V5 | MCP/ACP/workspace | Optional package versions/licenses, transport auth, actual isolation boundary |
| V5 | Quellight protocol | Exact consumer commit/version and supported operation matrix; previous read-only pilot is insufficient |

## Current primary documentation checked during bootstrap

- [SkillSearchProcessor introduction](https://mastra.ai/blog/introducing-skill-search-processor) and [ToolSearchProcessor introduction](https://mastra.ai/blog/introducing-tool-search-processor): on-demand instruction/tool loading are reuse candidates; exact tool names vary by mechanism/version and must be inspected at the pin.
- [Agent Controller](https://mastra.ai/docs/harness/agent-controller): the live Session and stored thread have different lifetimes; persisting conversation/settings does not automatically persist arbitrary live state, grants, pending approvals or active runs.
- [Durable agents](https://mastra.ai/docs/harness/durable-agents): a distinct recovery mechanism, marked beta at inspection, requiring explicit setup and effect-safety validation.

These documentation checks do not certify every feature against installed `1.64.0`. Keep future API claims as candidates until the relevant probe passes. No undocumented provider subscription route is assumed.

The connected Creative Flow universal-catalog read was also attempted to recover the eight-operation vocabulary, but the service was unavailable. A repository-name search did not resolve that source. O-02 therefore remains an explicit source-recovery task; neither the missing labels nor their TORI mappings are guessed here.

## Upstream status to preserve

The [mainline integration receipt](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/docs/studio/FOUNDATION-MAINLINE-INTEGRATION-20261102.md) attributes a scoped integration pass to tested candidate `f7ef931628454c40a47136aea2b2e54119f9b507` and independent verifier `9a83725839a116a0da488619970c298c6821c382`. This bootstrap did not rerun those checks. The [current status](https://github.com/radz2291/vict-02/blob/6b420a3e9eada6f694cc2550debda7753316b5b3/docs/studio/AUTHORING-FOUNDATION-CURRENT-STATUS.md) keeps Stage 9 open, Milestone 2 paused and existing Studio active pending a verified TORI replacement. Source integration is not runtime activation.
