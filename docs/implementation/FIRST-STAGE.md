# First Codex implementation task: G0 → U0

Outcome: a locally runnable TORI Studio for owner review, using actual VICT UI components and real authoring persistence. This task is activated when the owner supplies [CODEX_START](../../CODEX_START.md) or equivalent implementation instructions. The bootstrap session prepares this task; it does not execute it.

## Work package A — inventory and dependency proof

1. Read repository state/handoff; record branch/base/full SHA, working-tree status and remote. Use an isolated feature branch/worktree. Do not overwrite another agent's work.
2. Inspect `vict-02` at `6b420a3e9eada6f694cc2550debda7753316b5b3`. Read its canonical VICT system reference and relevant UI contracts. Upstream historical instructions govern upstream work, not permission to restart it.
3. Establish a reproducible source-identical public-package route. Prefer existing verified artifacts. Otherwise build/pack the selected public packages and required dependency closure in an isolated upstream checkout; record hashes and install them into a fresh consumer. Avoid private source aliases and workspace symlinks that hide missing package files.
4. Verify Structure, GraphWorkspaceV3, editor/history/store, native forms/overlays, AI and media exports under the chosen host. Source manifests say `0.4.0-rc.1`; this does not establish published artifact freshness.
5. Record exact Node/npm/Svelte/TypeScript and package identities; lock dependencies. The upstream Node floor is `>=22.13.0`, but choose a concrete supported version matching the actual dependency engine requirements.

**Evidence:** `docs/evidence/g0/DEPENDENCIES.md`, lockfile/artifact manifest, consumer command results and native component proof. If network/artifact access is missing, preserve a precise offline plan and mark that prerequisite blocked rather than claim installation.

## Work package B — minimum contracts and projection

Apply the adopted [Node & Edge Foundation](../specs/NODE-EDGE-FOUNDATION.md) within this work package. This is a bounded mapping proof, not another architecture stage. Use its three fixture graphs to resolve native authoring contracts before broad canvas construction; live engine conformance remains in the later slices.

1. Map [Contracts](../specs/CONTRACTS.md) objects to existing VICT/Mastra types. Record adopted schemas, public exports and true extension points.
2. Resolve canonical UI source versus TORI domain definitions: graph presentation, typed semantic links, revision/save transactions and validation diagnostics. Structure's source explorer is not automatically a domain schema editor.
3. Define service ports for definitions, session projections, run/trace, connections/catalog and artifacts. Separate UI state from canonical source and execution state.
4. Implement an actual durable local authoring store and revision guard through public VICT boundaries. Choose and document storage lifetime, migration/error behavior and export/import.
5. Establish simulation origin in stored runs/events and the screen. Define adapter substitution at the host composition root, without feature-by-feature UI forks.
6. Recover the exact eight-operation source if available; otherwise record the unresolved vocabulary and proceed with neutral semantic families. Do not invent final primitives or make guessed labels irreversible.
7. Prove canonical domain-to-native-node/port/edge identity and revision mapping, shared inline/inspector values, show/hide without binding changes and consistent transaction/history persistence. Separate draft integrity from execution readiness: save incomplete nodes, reject incompatible connections, admit reference cycles and diagnose unsupported execution cycles. Record coordinating engine/branch/group/context/provenance semantics for fixtures A–C. Do not append arbitrary fields to strict Flow schemas or add a new runtime.

**Evidence:** `docs/evidence/g0/CONTRACT-MAPPING.md`; a minimal real edit/save/reopen/history proof and source/API references. Runtime conformance for future capabilities stays in the backlog until its slice; do not turn this into a second broad architecture research project.

## Work package C — build the integrated shell and native authoring

1. Create minimal compatible app tooling, build/typecheck scripts, local launch commands and documented independent data directory/port.
2. Implement the five primary Studio pages — Agents, Workflows, Creative, Sessions, Runs — with shared project context and consistent menu/panel controls under the [Studio Design Constitution](../specs/STUDIO-DESIGN-CONSTITUTION.md). Preserve Definition graph / Execution trace / Session as distinct underlying state concepts; establish theme, selection, inspection and owned overlay scope once. This is a UI navigation refinement, not a new runtime.
3. Implement blank-project and agent CRUD; rich native forms for instructions/model/modes/Skills/tools/memory/policy/subagent references.
4. Implement Workflow and Creative surfaces through native graph controls, including typed edges, invalid-state diagnostics, rich node content and history.
5. Add real save/reopen and status feedback. Preserve manual edits across all surfaces. Link artifacts and simulated run/session references by stable ID.
6. Build the small catalog-backed starter palette in the four discovery families. Keep resource definitions separate from invocations; allow explicit unconfigured bindings and incomplete draft Save/reopen. Implement shared inline/inspector editing and visual exposure of existing relationships without duplication or implicit detach.

Do not import application-private designer/agent code from VICT Studio. **Every Studio surface presented for review must use the actual public VICT component for each covered control role**, including Select pickers, buttons, fields, menus, dialogs and feedback (even in U0 stubs); record import/export/version proof via [UI/UX Verification](../specs/UI-UX-VERIFICATION.md). If a public capability is insufficient, document its exact gap and propose an upstream shared change or owner-approved [UI exception](../governance/UI-EXCEPTIONS.md); do not silently create a browser-native substitute or local fork.

## Work package D — complete the review experience

1. Compose Session and Trace from VICT AI controls, safe view models and deterministic fixtures.
2. Add provider/capability management, mode CRUD/enable/disable, skill/tool inspection, evaluation case configuration and sample results. Store authored configuration genuinely; label all absent execution integrations.
3. Add the eight representative scenarios in [UI](../specs/UI-FOUNDATION.md), using synthetic data and repo-safe assets. Provide empty, loading, denied, unavailable, waiting, failed and cancelled cases.
4. Exercise three creative alternatives and the unified navigation path. User-created work remains separate from resettable samples.
5. Refine desktop/narrow layouts, keyboard/focus and touch alternatives. Provide a phone review route when the environment permits; no public deployment is required by this stage.
6. Complete Node & Edge fixtures A–C and their acceptance mapping. Demonstrate labelled Run Node/To/From simulations, reuse/staleness/new variations, unavailable operations and protected-action rerun refusal. UI simulation is not evidence of universal live partial execution; live commands are enabled only after per-adapter proof in their assigned slices.

## Intermediate U0 owner walkthroughs

Arrange these walkthroughs as the working areas become usable, rather than waiting for all six areas to be complete:

| Checkpoint | Timing | Working experience to show |
| --- | --- | --- |
| U0-R1 | During work package C, once shell and agent editing work | Navigation, blank-project agent creation/configuration, native inspection, Undo/Redo and Save/reopen |
| U0-R2 | During work package C, once workflow and creative editing work | Typed connections and invalid states; three spatial creative alternatives; compare/branch/revisit; saved manual work |
| U0-R3 | During work package D, once operational views are composed | Session, Trace and provider/capability configuration; explicit simulations; cross-view identity; narrow-screen essentials |

For each checkpoint, provide the runnable candidate SHA, launch/review route, short hands-on steps, simulated or unfinished areas, and focused experience decisions. Record owner feedback and resulting changes in `docs/evidence/u0/OWNER-REVIEWS.md`. Use status `offered`, `reviewed — changes requested`, or `reviewed — checkpoint accepted`; no response is not acceptance.

Continue independent authorized work while feedback is pending. Avoid hardening dependent interaction choices when the owner's answer is necessary; pause only that work. Routine in-scope fixes need no new permission. These are iterative product walkthroughs, not three additional mandatory stage approval gates. Final U0 engineering verification and explicit owner UI acceptance still apply to the final candidate; checkpoint acceptance cannot substitute for either or start V1.

## Work package E — verify, repair, hand over

Run build/type checks and meaningful tests of graph validity, transaction/history, persistence/conflicts, simulation separation and projection parity. Use installed browser interactions for U0-01–U0-14. Do not replace browser interaction with direct state injection when proving authoring.

Commit a candidate and ask a fresh independent verifier to challenge that exact SHA in a separate checkout/session. It records findings without silently fixing them. Repair in-scope failures, commit the repair and reverify affected claims. Continue until the engineering gate is satisfied or an actual stop condition remains. If no independent session is available, say which proof is missing; do not self-certify independence.

Final evidence belongs in `docs/evidence/u0/` and includes:

- Candidate/base/verifier SHAs, exact dependency/artifact/fixture versions and environment.
- Criterion matrix, commands/results, actual browser routes/steps/dimensions and relevant screenshots.
- Source/activation/run/fixture distinction and all unsupported behaviors.
- Retained failures and repair-to-recheck lineage.
- Fresh-clone install/build/run instructions, fixture reset instructions and data backup/recovery limits.
- Owner walkthrough with the smallest sequence that exercises the real product, plus decisions requiring owner judgement.

Update STATE/HANDOFF and push the feature branch under the activated implementation task. Stop at owner UI review. The desired report is a working review candidate with specific remaining choices, not a promise that a future agent will finish the same stage.

## Minimum command surface to deliver with U0

Choose actual tooling during work package A and document real commands for dependency installation, type checking, build, unit/contract tests, browser checks, dev/preview launch, fixture reset and artifact consumer check. Do not add placeholder commands that exit successfully without doing the named work. CI should keep offline checks deterministic; bounded live provider calls are separate and never automatic on every push.
