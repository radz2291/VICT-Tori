# V1a — Agent Assembly and real Session

[Issue #3](https://github.com/radz2291/VICT-Tori/issues/3) is the active owner handoff, coordinated as TORI-003. [Ownership and pins](../evidence/v1a/OWNERSHIP.md) document the independent base and public package boundaries. The Design Constitution is the single UI authority. U0 remains read-only evidence and does not gate this slice.

## First operator path

Add one Agent Definition, write instructions inline, optionally expose a Text source, connect a Model Reference, save the draft, activate that revision, and open a Session. Save permits missing required values. Activation resolves and validates every supported input and pins a VICT profile. The Session continues to use that version when the draft changes. Runs show actual lifecycle, execution settings and reported usage. Live connections are explicitly selected by the local host and never inferred from a model node.

## Binding and ownership

Unless specified otherwise, all properties below are exact-revision agent defaults, optional, and have no Session override in V1a. A draft saves even if readiness fails. Only the three supported graph roles are selectable in the editor. Other rows specify the future contract boundary, without promising an implemented control or resolver.

| Role | Underlying value and constraints | Binding and owner | V1a availability |
| --- | --- | --- | --- |
| Identity | Required nonempty Text; separate stable definition ID | Inline display label; immutable saved revision references VICT activation | Active |
| System instructions | Required nonblank Text; later ordered List of exact references | Inline or single shared Text source; resolve and pin instructions artifact | Active |
| Provider/model/fallbacks | Required typed Model Reference; ordered list for fallbacks | One bound model source; connection authority comes from server, never from graph; no fallback | Single Z.AI GLM-5.3 Flash route |
| Output limit | Integer 64–32,768 | Inline Model Reference setting; VICT generation default; adapter maps actual request | Active |
| Reasoning effort/budget | Enum or Integer within selected model capability | Model capability plus exact pinned setting when supported | No public VICT generation slot at current pin; provider default |
| Sampling | Temperature 0–2; top-p (0,1] | Model capability plus VICT generation defaults where mapped | Not exposed |
| Input context/compaction | Positive Integer token budget and Policy Reference; separate from physical model window | Agent default subject to runtime limits; explicit admission evidence | No context budget or compaction; Mastra history window is up to 100 recent messages; transcript retained separately |
| Execution budgets | Integer steps/retries/tokens/time; monetary budget with currency | Enforced runtime constraints; authority is server owned | No tools, no retries, one model step and local turn timeout; no price estimate |
| Tool/capability bindings | List of exact Tool References and requested scopes | VICT server authorization and allowlist; wires express availability only | No tools or protected effects |
| Memory | Memory Policy Reference with history and retention constraints | Pinned VICT artifact, Mastra store; no cross-session sharing | Conversation history only; 30-day Mastra storage retention configuration, local transcript retained independently |
| Delegation | List of Agent References with depth/scope policy | VICT authority caps delegated capability; Mastra runs only permitted children | Unavailable |
| Policies/approval | Policy Reference and requirement for explicit approval | VICT enforcement; instructions do not become policy | No protected operations exposed |
| Output schema | Typed schema Resource Reference | Pinned contract and model support, validate at delivery | Unavailable |
| Observability | Enum/list of public event projections; retention policy | VICT events and TORI public projection; private reasoning stripped | Lifecycle and reported usage; no private reasoning |

Type vocabulary extends to Boolean, Integer, Number, Object, List, Asset Reference and typed Resource Reference. Input role names are separate from these types. VICT Flow v3 commits typed data and model-reference relations. Control, tool availability, delegation, context/reference and provenance are semantically distinct; model references are a reference relation projected on a typed connection. No graph mutation invokes a model or grants access.

## Context Source and JIT

A resource records `id`, exact `version`, `role` (instructions, skill, protocol, constitution, knowledge, example or schema), `origin` (URI/digest), owner-defined `scope`, `trust` and a manifest of instructions, references, assets or scripts. A binding records exact source version and load rule (`always`, `on-demand`, `triggered`, `retrieved`, `session` or `invocation`), budget and bounded discovery scope. An observed admission receipt records when it was requested, admitted or denied, source/version, reason, applied scope and available usage. Unknown usage stays unknown. Scripts are metadata until their separately governed operation is authorized. Context text cannot grant tool access or bypass policy.

[Research brief](../../fixtures/v1a/research-brief.context.json) is a design/evaluation fixture. JIT admission is **not implemented** in this checkpoint and the fixture is not loaded or selectable in a live Session.
