# Capability catalog and exposure contract

The rows are target obligations. **None is delivered by TORI at bootstrap.** “VICT partial” and “upstream candidate” describe reuse evidence, not live availability. Package/API assertions must pass the exact-version probes in [Baseline](../reference/BASELINE.md).

Stage notation: G0 mapping; U0 real authoring and simulated execution; V1 agent runtime (a: basic, b: self-authoring, c: advanced); V2 workflow; V3 creative; V4 unified; V5 consumer readiness. Full stage definitions are in [Roadmap](../implementation/ROADMAP.md).

| ID | Capability | Reuse / present evidence | Exposure and minimum proof | First live stage | Acceptance |
| --- | --- | --- | --- | --- | --- |
| CAP-01 | Agent lifecycle | VICT profile/activation contracts; builder absent | Create/edit/clone/version/validate/activate/retire; old activation remains immutable | V1a | T01, T07 |
| CAP-02 | Agent execution | Bounded VICT Mastra single-agent bridge | Stream real output; authorized tools; cancel/error/terminal result; no fabricated success | V1a | T01 |
| CAP-03 | Persistent sessions | VICT turns/threads partial; Mastra Controller candidate | Stable session↔thread↔activation↔runs; reload and restart; no cross-actor leakage | V1a | T01, T06 |
| CAP-04 | Modes | Controller candidate; TORI exposure absent | CRUD/enable/disable; mode changes effective instructions/tools at next turn; trace policy version | V1a | T01, X02 |
| CAP-05 | Provider connections | Shared TORI service missing | Safe connect/list/status/disconnect; account scope; supported auth; revoked credential test | V1a | T01, X01 |
| CAP-06 | Model catalog and selection | Existing model binding; session switching missing | Discover permitted models/features; defaults/fallback policy; switching preserves conversation/authority | V1a | T01, X01 |
| CAP-07 | Skills and JIT context | Mastra SkillSearchProcessor documented; earlier pin inspection reported | Search/load only admitted skills; record revision/scope/TTL; denied skill; no tool grant | V1a | T01, X03 |
| CAP-08 | JIT tool discovery | Mastra ToolSearchProcessor documented; bridge integration missing | Search/load within authority; collision/version/TTL/revocation behavior; denied call stays denied | V1a | T01, X03 |
| CAP-09 | Trusted request context | VICT identity infrastructure partial | Server-derived actor/project/app context; dynamic instructions/tool visibility; forged context denied | V1a | X04 |
| CAP-10 | Processors and guardrails | VICT basic processing; advanced Mastra candidates | Configure order/policy; input/output/tool checks; fail safely; structured-output violations visible | V1a | X05 |
| CAP-11 | Budgets and usage | VICT turn policy; Mastra cost/token controls candidates | Explicit inherited/per-run limits; child accounting; unknown price; stop behavior without silent data loss | V1a–V1c | X05 |
| CAP-12 | Human interaction | VICT protected-tool approval; broader Mastra candidates | Ask/clarify/plan/steer; durable request correlation and resume; stale/duplicate response refusal | V1a–V2 | T02, X06 |
| CAP-13 | Test and evaluation | Mastra evaluation ecosystem candidate | Versioned cases/scorers, experiment comparison, deterministic authority probes, live result distinction | V1a | X07 |
| CAP-14 | Multi-agent delegation | VICT child identities declared; execution unwired in audit | Invoke pinned children; child constraints/budgets/cancel; nested trace and result | V1c | T01, T08, T09 |
| CAP-15 | Background and recovery | VICT durable business engine; Mastra durable agent candidate | Detach/reconnect, actual restart behavior, single run ownership, visible uncertain effects | V1c | X08, T08, T09 |
| CAP-16 | Memory policies | History present; advanced memory unexposed | Configure conversation/working/semantic/observational memory separately; inspect scope, deletion, retention | V1a–V1c | T01, X09 |
| CAP-17 | Knowledge and extraction | Mastra retrieval/extraction candidates | Optional ingest/retrieve/extract with provenance; domain records remain authoritative; scope/deletion proof | V5 | X09, T08 |
| CAP-18 | VICT capability tools | Governed bridge implemented upstream | Public descriptors and schemas; exact activation tool pins; real effect ledger/denial/uncertainty | V1a | T01, T03, T07 |
| CAP-19 | MCP, search and browser | Connector integration absent in audited bridge | Connect/discover/execute with credentials, scopes, timeout/revocation and tool classification | V5 (earlier if required) | X10, T08, T09 |
| CAP-20 | Executable AI workflows | Mastra workflows candidate; VICT refs declared only | Typed graph compilation, branches, review suspension, failure and replay behavior | V2 | T02 |
| CAP-21 | VICT business workflows | Durable VICT graph execution exists | Use native runtime/effects; bridge AI steps; interrupt/retry without duplicate protected action | V2 | T03 |
| CAP-22 | Generative pipelines | VICT graph/media UI; runtime operators absent | Real prompt/reference→variations→selection→transform→artifact; versioned inputs/results | V3 | T04 |
| CAP-23 | Creative canvas | Shared Structure/Flow primitives | Spatial alternatives, comparison, branching, selection; context edges do not execute | U0 editing; V3 complete | T05 |
| CAP-24 | Unified cross-view experience | No TORI yet | Same IDs/revisions across canvas/workflow/session/trace; no manual copying to continue | U0 navigation; V4 complete | T06 |
| CAP-25 | Artifacts and multimodal transport | VICT media controls; agent transport partial | Owned bytes/metadata, versions, supported modalities, failed/missing files, output lineage | U0 fixtures; V3/V5 live | T04, T06, X11 |
| CAP-26 | Safe trace and reasoning visibility | VICT safe stream exists; richer projections missing | Public summaries and genuine events; run/child/tool lineage; missing usage stays unknown | V1a–V1c | T01, X12 |
| CAP-27 | Schedules | Mastra documented opportunity, pin binding unverified | Create/edit/pause/resume/delete/trigger; timezone, missed runs, duplicate ticks, revoked permission | V5 | X13, T08 |
| CAP-28 | Signals and notifications | Mastra documented opportunity, pin binding unverified | Steer/wake/queue; durable inbox, delivery/seen/ack semantics; no duplicate side effects | V1c–V5 | X13, T08 |
| CAP-29 | Goals and task tracking | Mastra goal/task candidate | Persist agent objectives/progress/run limits; distinguish app commitments; inspect/stop | V5 | X14, T08, T09 |
| CAP-30 | Controlled coding workspaces | Workspace/createCodingAgent candidates; no live VICT coding agent | Real read/edit/diff/shell/Git/tests with enforced workspace authority and isolation | V5 | T09 |
| CAP-31 | External coding harness / ACP | Optional add-on; not installed in audited adapter | Capability negotiation, scope, process lifecycle, honest visibility, recovery/cancellation | V5 if selected | T09 |
| CAP-32 | Headless application integration | VICT app command boundary; Quellight pilot read-only | Discover/invoke same authorized domain functions/data; no dependency on app UI | V5 | T08, X15 |
| CAP-33 | Manual and AI-assisted authoring | VICT native authoring reusable foundation | Same discovery/edit/observe/cancel contract; stale revision refusal; manual/AI coexistence | U0 manual; V1b AI | T07 |
| CAP-34 | Reusable service and installed consumer | Product requirement; no TORI code | Install built public artifacts; invoke without Studio internals; shared auth/error/event semantics | V1a onward; V5 complete | X15 |

## Catalog descriptor requirements

Each exposed capability needs a stable ID/revision; kind; owning implementation; input/output schema references; configuration schema; required permissions; effects class; supported modalities; declared execution/stream/resume/cancel semantics; dependency/version constraints; UI authoring recipe; and real availability evidence. Include secret field classifications and redacted observability fields.

Use independent fields for **implementation status** (`planned`, `simulated`, `integrated`, `verified`) and **current operational state** (`available`, `unconfigured`, `unsupported`, `unavailable`, `denied`). A verified integration can be temporarily unavailable. A planned feature is never reported connected because a card exists.

Catalog availability must be evaluated against actor/project, activation, installed adapter, connection state and service health. A frontend list is not an authorization boundary. Unknown descriptors or incompatible schema revisions are rejected explicitly.

## Exposure workflow

For each row: identify the existing VICT/Mastra mechanism → verify exact pinned API → map authority and persistence → expose public operation and UI authoring → deterministic failure/denial checks → installed Studio proof → bounded live acceptance where needed. Record source, package version, test identity and limitations.

Do not build a new bespoke subsystem merely because a feature receives a catalog row. Catalog metadata should compose reusable schemas, forms, adapters and tests. Mastra Editor may be studied for reusable mechanics; it must not become a competing definition source. Additional dependencies/licenses require an evidence-based decision.

## Deferred extensions

External chat channels, A2A, hosted platform services and marketplace distribution are outside the initial required catalog. Their omission does not allow any CAP-01–CAP-34 requirement to be silently dropped. A blocked optional ACP route may use another proven coding integration; a blocked core behavior needs an explicit decision and remains unpassed.
