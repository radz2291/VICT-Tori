# Product acceptance and engineering gates

All tests below are **NOT DEMONSTRATED at bootstrap**. A source audit, component export, screenshot or deterministic fixture cannot pass a real execution scenario. Use [verification](../governance/VERIFICATION.md) for verdicts and evidence attribution.

## Common quality dimensions

Each applicable test must demonstrate functional behavior, Studio authoring, truthful observation, persistence and governance. Include permissions/invalid input, failure/cancellation/recovery as relevant. Studio tests additionally cover native VICT composition, history, Save/reopen, accessibility, phone behavior and preservation of manual work.

Evidence levels: **D** deterministic contracts/failure probes; **S** installed Studio browser interaction; **L** bounded real model/tool/media/consumer use; **O** owner experience judgment. Record each separately. A capability can pass D while S/L/O remain held.

## U0 — actual UI, simulated execution

| Criterion | Required demonstration |
| --- | --- |
| U0-01 | A fresh install/build launches independent TORI Studio with documented Windows-compatible and portable instructions; no reliance on VICT Studio source aliases |
| U0-02 | All six areas and three principal views operate with shared project/selection context and native VICT components |
| U0-03 | From blank, create/edit/clone/retire an agent definition; attach Skills/tools; configure model/mode/memory/policies; inline/inspector values agree; show/hide resource projections without changing bindings; distinguish invocation inputs from shared definitions |
| U0-04 | Create/move/connect/reconnect/delete typed graph nodes; reject incompatible/dangling/capacity-invalid connections with specific diagnostics; permit reference cycles while unsupported execution cycles receive readiness diagnostics |
| U0-05 | Undo/Redo authoring changes; preserve an intervening manual edit; reject stale revisions; save, fully reload and reopen definitions/layout including incomplete drafts; domain and projection identities remain consistent |
| U0-06 | Build three creative branches, compare versions, select/revisit alternatives; preserve reference/executable/provenance meanings, explicit context binding and grouping/subworkflow distinction; simulate selected-node run/reuse/staleness/new-variation intents with unsupported cases |
| U0-07 | Move among selected artifact/definition, simulated run/Trace and Session with stable IDs, selection and history |
| U0-08 | Simulated connections/responses/runs/evaluations are labelled in UI and records; no real secret input or external execution; no simulated live pass |
| U0-09 | Success/wait/failure/denial/cancel/interrupted/unknown-cost fixtures render correctly; typed errors are visible; no live-to-fixture fallback |
| U0-10 | Save failure/corrupt or unsupported import/stale writer leave prior work intact; fixtures can be reset separately from authored work |
| U0-11 | Desktop/narrow keyboard/focus/touch-alternative checks and shared-theme popup/node behavior pass; physical-device gaps recorded separately |
| U0-12 | Representative Quellight and coding workspaces use synthetic data and share the same navigation/inspection contracts |
| U0-13 | Public artifact consumer smoke proves required VICT packages/exports; stub/live ports, dependency identities and semantic graph mapping are documented, including draft/readiness checks, coordinating engine boundaries and branch behavior |
| U0-14 | Fresh independent engineering review at exact candidate; reproducible owner walkthrough and known issues; owner UX approval recorded separately |

U0 engineering completion does not pass T01–T09. U0 remains at the owner review boundary until O approval is recorded.

### Required Node & Edge fixture coverage

Run fixtures A–C in [Node & Edge Foundation](NODE-EDGE-FOUNDATION.md#8-three-required-u0-fixtures) with D/S evidence. They refine existing criteria and do not introduce a new stage:

| Fixture | U0 coverage | Required observations |
| --- | --- | --- |
| A — Quellight agent graph | U0-03, U0-04, U0-05, U0-12 | Browser-tool availability and specialist delegation start no run; shared inspector/inline values; expose/hide preserves configuration; edits/history/reopen retain identities |
| B — AI-to-business workflow | U0-04, U0-05, U0-08, U0-09, U0-13 | Explicit VICT coordinator/Mastra step mapping; typed branch/review/action boundaries; exclusive/multi-match/no-match cases; incomplete Save/reopen; protected-effect rerun refusal shown as simulation |
| C — Creative Weave | U0-04, U0-05, U0-06, U0-07, U0-08 | Three spatial alternatives and reference cycle; explicit workflow conversion; Run Node/To/From simulation plus unavailable states; exact reused inputs and stale versions; new variation retains old output |

Across these fixtures, demonstrate real structural/readiness diagnostics, save without configured provider, reference versus actual context inclusion, visual group versus executable subworkflow, and rejection of fabricated provenance claims. Runtime authorization, receipts, recovery and per-adapter partial execution remain live-slice proofs; simulation of those cases passes only the U0 representation requirement.

## T01 — Agent Studio

**Setup:** Fresh project, permitted provider connection, one versioned Skill, one governed read tool and one protected effect tool; no privileged preconfigured agent. Have a second model available or explicitly hold the model-switch criterion until it is available.

**Walkthrough:** Create an agent in Studio, configure tools/Skills/memory/modes/allowed models, validate and activate, open a Session, run real turns, inspect context/activity, switch to another allowed model at a turn boundary, reopen and continue.

**Pass:** T01-01 real provider/model use with pinned activation; T01-02 relevant JIT Skill/tool discovery and actual authorized call; T01-03 prohibited tool/model remains inaccessible; T01-04 effective mode/model selection changes while preserving conversation; T01-05 supported public activity/usage and real trace; T01-06 history/working-memory scope and reopen; T01-07 cancel/failure/disconnect leave truthful state; T01-08 baseline evaluation evidence.

**Negative probes:** forged actor/project, revoked tool cached in context, disabled mode, expired provider connection, skill attempting to grant authority, model switch during active turn, stale activation. Evidence D/S/L plus O for operation clarity. Basic slice at V1a; advanced memory/delegation/recovery coverage completed in V1c.

## T02 — Executable AI Workflow

**Setup:** Studio-built input → research agent → decision → specialist → human review → output, with typed schemas and two branch inputs. The base scenario uses explicitly exclusive routing. Separately exercise multiple-matching and no-match configurations where supported, with declared output/join behavior; do not assume identical branch behavior across engines.

**Pass:** T02-01 save/activate exact graph; T02-02 actual typed output reaches downstream steps; T02-03 each branch tested, unselected branch does not execute; T02-04 review suspends and resumes the intended run; T02-05 trace reflects actual selected steps/input/result; T02-06 reopen/restart behavior follows documented support; T02-07 invalid types, stale/duplicate answers, failure and cancellation cannot fabricate output or repeat effects.

Evidence D/S/L. Show a paused run before and after a real answer, not two independent canned runs. Use Mastra's workflow mechanism, with VICT authority for any protected actions. First complete at V2.

Verify the exact adapter's execution mapping, including nested engine boundaries where used. An unsupported composition must fail readiness with a useful diagnostic. No universal partial-execution claim follows from passing the full-workflow test.

## T03 — Governed VICT Business Workflow

**Setup:** AI recommendation leads to a VICT-governed action in a test domain with an observable action counter/receipt. Inject a crash after remote acceptance but before the local acknowledgement, and before execution in a separate case.

**Pass:** T03-01 action admitted only under actual VICT actor/project/activation policy; T03-02 approval binds exact action/input revision; T03-03 retry/restart never silently duplicates a protected action; T03-04 uncertain outcome remains explicit until reconciled; T03-05 invalid/denied input has no effect; T03-06 native VICT wait/branch/fork/join behavior used where required; T03-07 trace and domain record agree after reopen.

Evidence D/S and real controlled business service operation (L where AI is used). Do not promise exactly-once behavior for a non-idempotent remote system. Prove safe refusal/reconciliation where automatic recovery is impossible. First complete at V2.

For the AI-to-business fixture, VICT owns the business continuation and approvals; Mastra runs the governed AI step. Test cancellation/recovery across that boundary. A partial-rerun request must not automatically repeat the protected action; test receipt reuse/reconciliation, required approval and explicit refusal where safe continuation is unavailable.

## T04 — Generative Pipeline

**Setup:** Prompt and reference image → generation provider → at least two actual alternatives → selected image → transform/upscale → final artifact. Use a bounded agreed call budget and non-sensitive inputs.

**Pass:** T04-01 Studio configures real typed image inputs/operator settings; T04-02 provider truly generates and transform truly executes; T04-03 previews resolve actual bytes; T04-04 final output records prompt/reference/operator/model/run lineage; T04-05 edit upstream input and rerun affected downstream steps as a new version; T04-06 earlier outputs remain accessible; T04-07 denied/failed/unsupported-media operation produces no fake artifact or misleading success.

Evidence D/S/L/O, with actual generated artifacts and receipts. Partial reruns must identify any reused output. A static thumbnail or generic model text is not this test. First complete at V3.

Demonstrate explicit input-version selection and new variation creation without destroying prior results. Enable Run Node/To/From individually only where safe adapter support is proven; unavailable commands must explain why and cannot silently rerun the whole graph. T04-05 requires a supported revision/rerun path, not universal arbitrary subgraph execution. Changing transform settings must not silently regenerate its selected source image.

## T05 — Creative Canvas

**Setup:** One visual idea with three directions, references and at least two iterations on a chosen branch. The owner explores and compares alternatives.

**Pass:** T05-01 free spatial arrangement and branching without forced sequential execution; T05-02 compare/select/revisit variants using actual artifact versions; T05-03 meaningful contextual inspection and rich node content; T05-04 references and transforms have distinct meanings; T05-05 history and Save/reopen preserve alternatives/layout; T05-06 touch/keyboard alternatives and no manual work loss; T05-07 owner finds the experience usable for real creative exploration.

Evidence D/S/L/O. UI mechanics may be demonstrated during U0, but complete product acceptance waits for real creative artifacts/operators and owner use. An awkward graph with technically correct nodes does not pass O. First complete at V3.

## T06 — Unified TORI Experience

**Setup:** Begin in T05's canvas. Choose a branch, explicitly configure an executable workflow, run it, inspect Trace, discuss its artifact with an agent in Session, revise, run again, return to canvas.

**Pass:** T06-01 stable underlying definition/revision/activation/session/run/artifact identities; T06-02 no manual copy/paste into another subsystem to continue; T06-03 revision does not mutate earlier activations/runs; T06-04 selection/provenance survives navigation and reopen; T06-05 conversation uses the intended scoped artifact; T06-06 revised real output appears on the original branch with history; T06-07 owner understands the connected experience.

Evidence D/S/L/O. This is the decisive Option C test; passing T01, T04 and T05 separately is insufficient. First complete at V4; establish identity navigation during U0.

## T07 — TORI builds its authoring agent

**Setup:** Starting from ordinary Studio access, Codex drives the browser to create/configure/activate the authoring agent using the same controls available to the owner. No backend-only seeded profile or privileged database insertion.

**Pass:** T07-01 authored profile/activation persists and is actually executed; T07-02 agent uses public VICT discovery, canonical editing, observation and cancellation; T07-03 actual edits/observations have truthful receipts and source/occurrence references; T07-04 manual edit/revision conflict, Undo/Redo and Save/reopen remain correct; T07-05 unauthorized edits denied; T07-06 session/trace retained; T07-07 a separate consumer can use the same published capability boundary.

Evidence D/S/L with recorded ordinary browser construction. This proves TORI self-authoring, not automatic permission to replace the existing VICT Studio agent. That installation has its own integration gate. First complete at V1b.

## T08 — Quellight inside TORI

**Setup:** Inspect the actual Quellight version and capability catalog; prepare a parity matrix of supported operations and agreed missing development requirements. Use an isolated authorized test account/dataset. Run through TORI without opening Quellight UI.

**Pass:** T08-01 reads/writes hit the same authoritative app records under equivalent authorization; T08-02 real main/specialist agents, background work and scoped memory; T08-03 real specialized tools and applicable connectors; T08-04 Living Book/Compass/commitments/Daily Desk/habits have representative domain scenarios; T08-05 schedules/signals/notifications and goals tested where required; T08-06 session/artifact/trace provenance and reconnect; T08-07 no duplicate TORI business database or hidden dependency on Quellight shell.

Evidence D/S/L and reviewed feature parity matrix. A diagnostic turn inspector is insufficient. If the consumer lacks a required feature, mark the dependency and develop it in its owning capability under appropriate scope; do not call parity passed by shrinking the checklist. First complete at V5.

## T09 — Local coding-agent system

**Basic setup:** An isolated test repository/workspace with a small real defect and meaningful test. Configure the coding agent through Studio.

**Pass:** T09-01 read/search/edit real files, show diff, execute allowed test/shell/Git operations; T09-02 actual OS/workspace enforcement denies out-of-root paths and prohibited commands; T09-03 secrets/network scope and command outcomes are observable; T09-04 review/approval before protected actions as defined by the actual policy; T09-05 session/run/workspace survive supported restart/reconnect.

**Advanced setup:** Planner/implementer/tester/reviewer with isolated worktrees and bounded delegation.

**Pass:** T09-06 genuine specialist/child/background runs; T09-07 independent review, no self-approval hidden as a second role; T09-08 conflict/recovery/cancellation and artifact provenance; T09-09 honest visibility boundary for any external coding harness. Reverting files is a recorded action, not an assumed reversal of arbitrary shell effects.

Evidence D/S/L. A terminal UI component, fake diff or command label does not prove execution/containment. First complete at V5.

## Cross-cutting capability probes

These prevent essential requirements from disappearing between broad product scenarios.

| ID | Probe | Completion stage |
| --- | --- | --- |
| X01 | Provider connect/disconnect/revoke; permitted model discovery/switch; unsupported auth/modality and unknown cost | V1a; supported routes expanded later |
| X02 | Mode CRUD/enable/disable; inspect next-run instructions/tool set; in-flight selection boundary | V1a |
| X03 | Skill/tool search-load-version/TTL; irrelevant item not injected by default; denied/revoked item cannot execute | V1a |
| X04 | Trusted actor/project/app context; forged body/prompt/tool result cannot widen scope; tenant/session isolation | V1a and every relevant slice |
| X05 | Processor order/error and structured output; token/cost/time/child limits; no silent retained-content truncation | V1a–V1c |
| X06 | Ask/plan/clarification versus effect approval; stale, duplicate, expired and unauthorized answers; steering semantics | V1a–V2 |
| X07 | Versioned evaluation datasets/scorers; before/after experiment; deterministic versus live results; required regression fails gate | V1a |
| X08 | Browser disconnect, process crash, worker ownership and replay; uncertain effects, no duplicate invocation on reconnect | V1c and V2 |
| X09 | Memory/knowledge scope; relevance; working/semantic/observational differences; delete/export/retention and derived cleanup | V1c/V5 |
| X10 | MCP/search/browser capability negotiation, timeout, tool identity collisions, malicious results, revoked access and effect classification | V5 or earlier dependency slice |
| X11 | Image/document/audio/video support by adapter; integrity/size/type rejection, inaccessible bytes, artifact lineage and version retention | V3/V5 |
| X12 | Public reasoning availability, redaction, missing telemetry; duplicate/out-of-order/gapped events; no fabricated summaries or secret traces | V1a–V1c |
| X13 | Schedule timezone/misfire/overlap; duplicate ticks, permission revocation; signal/inbox delivery/ack and no duplicated effect | V5 |
| X14 | Durable agent goals/progress/cancel; relation to authoritative app tasks; independent run limits and truthful completion | V5 |
| X15 | Fresh installed consumer through public artifacts/service; same auth/errors/events; no Studio source aliases or UI dependency | V1a onward; V5 complete |

## Evidence and final result

For every criterion retain exact candidate/adapter/fixture versions, setup, steps, observed result, assertion/receipt, failure probes and limitations. Include browser routes/screenshots or compact recordings only when they prove interaction; avoid private data and raw credentials. A benchmark or performance claim needs measured environment and workload.

Do not use an aggregate test count to close untested criteria. The stage manager maps claims to evidence; a fresh verifier challenges that mapping. Owner UI/creative judgment remains separate from engineering verification. Final product acceptance requires cumulative T01–T09 and applicable X01–X15; deferred external extensions do not excuse gaps in these required scenarios.
