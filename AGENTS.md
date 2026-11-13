# TORI agent entry

Read [STATE.md](STATE.md), [HANDOFF.md](HANDOFF.md), and the referenced stage before acting. Current owner instructions take precedence over historical repository guidance. Reconstruct repository, branch, working tree, remote, and exact baseline; preserve concurrent work.

## Product rules

### Canvas is the code

Canvas is the code. Traditional agent building fixes behavior in source: triggers in grammars, thresholds in constants, limits as literals. In TORI, that power belongs on the authoring surface. Wiring and editing on canvas is how agent behavior is programmed; source code implements the machinery but must not own decisions that belong to composition. Every hardcoded value is a decision made without the owner — a literal in a source file is a defect against this doctrine unless it is deliberately classified.

Every value, trigger, limit and behavior must belong to one of three layers:

1. **Knobs** — canvas-authorable, per-agent policy answering how much, how long or which, bounded by governed ranges. Examples: interpretation transcript budget and deadline, memory admission budget, record cap, proposal lifetime, sensitivity and memory window.
2. **Governed constants** — mechanics, enforcement and safety bounds that must not bend per agent, changed only by an owner-accepted contract amendment. Examples: once-only writes, schema guards, knob bound ranges and deadline-shorter-than-proposal-lifetime.
3. **Composition** — authority and capability existence. A capability fires because it is wired and activated, never because code says so. Wiring is consent; activation is the grant; nothing creates authority by itself. The host still enforces current authorization, and protected memory writes still require exact human confirmation.

The standing test for any new constant, setting or behavior is: **which layer is this?** “None — it is a literal in source” is not an answer. Every slice ships a constants-classification pass covering new values, their source, owner, surface and enforcement evidence before merge. Existing unclassified literals stay tracked to their owning slices; recording the doctrine does not authorize an unlimited retrofit.

**Explicit deployment ownership:** store retention is a deployment-level how-long setting, not agent behavior. Its knobs live in server deployment configuration rather than canvas; the installed store's accepted ranges and validation are governed. This is the owner-specified configuration-scope exception, not a fourth authority layer.

The [13 November doctrine decision](docs/governance/DECISIONS.md#canvas-as-code-doctrine--13-november-2026) and [constants inventory](docs/governance/DECISIONS.md#memory-node-family-constants-inventory--13-november-2026) assign legacy findings. [Directive Foundation](docs/implementation/DIRECTIVE-FOUNDATION.md#binding-node-configuration) owns its deadline/budget knobs, host-deadline reconciliation and deployment retention path. The memory node-family slice owns admission budget, record cap, legacy draft context and proposal lifetime. That slice must restate Directive-recognition versus Memory-Policy ownership together when exposing them.

- Apply the adopted [Node & Edge Foundation](docs/specs/NODE-EDGE-FOUNDATION.md). Preserve resource/invocation identities and shared form/node values; allow incomplete drafts to save, and require readiness for activation/execution. Six edge meanings are explicit. U0 partial-execution interactions are labelled simulations; live Run Node/To/From require safe engine/adapter support and never automatically replay protected actions. Prove native mapping in G0 and fixtures A–C in U0 before claiming those criteria.

- Build the actual independent TORI Studio and reusable TORI capabilities. Follow [Foundation](docs/specs/FOUNDATION.md), [Architecture](docs/specs/ARCHITECTURE.md), and [Contracts](docs/specs/CONTRACTS.md).
- Reuse VICT public UI/Structure/Flow/editor contracts and Mastra mechanisms. Do not build another general agent runtime, workflow engine, graph editor, or component system.
- VICT owns canonical definitions, immutable activation, authorization, revisions, and protected effects. A node, skill, connector, model, or Mastra feature never creates authority by itself.
- Compose ordinary product screens from VICT controls. A genuinely new visual or interaction primitive requires the documented owner-approved exception in [UI exceptions](docs/governance/UI-EXCEPTIONS.md). Routine composition and adapter code do not require new approval.
- UI-first means real editing, validation, history, and persistence with replaceable execution adapters. Label simulation in the screen and persisted records. Never count fixtures as live acceptance.
- Keep reusable behavior outside the Studio host. Prove reuse through installed public artifacts and an independent consumer, not source aliases into the app.
- Keep public reasoning summaries and actual tool/run evidence distinct from private chain of thought. Do not invent traces or silently discard retained content to satisfy arbitrary implementation limits.
- Preserve the paused VICT workstream and current Studio agent until its separately authorized replacement is verified. This repository does not authorize changes to another repository or live installation.

## Execution discipline

Use [Rolladice Work protocol](docs/governance/ROLLADICE-WORK.md) for persistent coordination. Resolve project/code `TORI` and the current ticket (initial assignment `TORI-001`) from live tools; read its handoff, discussion, dependencies and pinned standard before execution. Check the first local read/comment round trip, claim actual work with `run_start`, heartbeat with `run_update` every few minutes, and verify closure updates by reading them back. Submit completed delivery to Review; only Radzi accepts it. A ticket does not launch Codex or expand scope. If tools are unavailable, report that limitation and use the documented manual handoff within owner-authorized work. GitHub retains specifications/code/evidence; Work retains assignment/status/review.

Use the [first-stage plan](docs/implementation/FIRST-STAGE.md), [roadmap](docs/implementation/ROADMAP.md), and [verification runbook](docs/governance/VERIFICATION.md). One stage manager owns an accepted stage through implementation, independent challenge, repair, re-verification, and final report. Independent builder/verifier delegation is allowed within that accepted scope; use separate fresh sessions when delegation is unavailable. A builder cannot provide its own independent verdict.

Resolve routine in-scope defects without asking the owner to relay each iteration. Stop only for the stage boundary, a concrete product/authority fork, or an unavailable required dependency. Complete unaffected work before presenting a narrow blocker. Do not convert an agent proposal into owner acceptance.

Record exact tested candidate, verifier identity/commit, dependency and fixture revisions, commands/results, and remaining findings. Preserve failed evidence. Update STATE and HANDOFF together when authority changes. Never infer a whole-product pass from a narrow test suite or source audit.

Keep credentials, private user data, raw auth files, and secret-bearing logs out of this public repository. Use synthetic fixtures. Follow the actual authorized push destination; avoid force pushes and unrelated changes. Do not choose a license or publish packages as an incidental setup step.
