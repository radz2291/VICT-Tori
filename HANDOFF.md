# TORI handoff

## Prepared implementation — TORI-005

Radzi requested the ticket and implementation specification for the [Studio authoring foundation](docs/implementation/AUTHORING-FOUNDATION.md), ahead of V1c. The assignment is **TORI-005** in Work project `TORI`. Use `codex/tori-authoring-foundation` and the exact specification commit pinned in Work. The preparation started from `652d6f6a0f79e95a3c5925df67a870b4070c835b`, which includes the reviewed V1b product and evidence.

The owner should be able to describe Quellight and its Research specialist in ordinary conversation, have the Authoring Agent build and test them, ask for review of their actual Run, and apply an undoable improvement. Register a second read-only script-backed tool and prove it can be discovered, connected and tested through the same action catalog. Keep the approved quiet Studio and left Authoring Agent dock as the experience reference.

The handoff requires a permitted live-model browser walkthrough and actual script results, together with deterministic boundary probes, relevant regressions and independent verification. The stage owner resolves routine implementation choices and repairs through Review. The first task maps canonical Studio actions and installed public VICT APIs. [Full slice spec](docs/implementation/AUTHORING-FOUNDATION.md) · [Local start instruction](CODEX_START.md) · [Work protocol](docs/governance/ROLLADICE-WORK.md)

The delivered V1b source is the technical baseline for TORI-005. TORI-004 continues in its own owner review. Creation of this assignment prepares a fresh local Codex handoff.

## TORI-004 owner review

The owner selected the public VICT authoring interface. Install the VICT `control` and `contracts` tarballs from `02c63c31f8f4dc42840fc8975927c98b21f30058` together with the existing public package set and recorded lockfile. Product `59e568426183d2199be90ca96dd0d31bdd53fbd5` has the live browser walkthrough and recorded Run. The exact evidence baseline is `aabc80737905671911942c0435b85c5dee285aed` on `codex/tori-v1b`. [Integration report](docs/evidence/v1b/INTEGRATION.md) · [V1b scope](docs/implementation/V1B.md)

## V1a delivery history

**V1a Studio closeout.** Candidate `f73d114` consolidates the owner’s Agents, Sessions and Runs refinements. See the [closeout evidence and walkthrough](docs/evidence/v1a/STUDIO-CLOSEOUT.md). Work records TORI-003 as Done after owner approval.

**Saved Research composition ready for V1a review.** Candidate `496d90b` supports direct and delegated execution of the same saved Research Agent with a fixed Quellight revision pin. The [running previews and evidence](docs/evidence/v1a/INTEGRATED-PREVIEW.md#saved-research-review) cover admitted Project Knowledge, governed MCP and a zero-call denial. TORI-003 remains in Review.

**Agents alignment for owner review.** Candidate `c279e73` adds an inspectable governed child binding. The [two-example walkthrough](docs/evidence/v1a/INTEGRATED-PREVIEW.md#agents-alignment) records the saved-definition boundary. TORI-003 remains in Review.

**Integrated V1a owner preview.** Radzi accepted A4 at `e94e2b7`. Candidate `ff130a6e657c3fac8f784c636538c7bf39b550b1` fixes the child revision display and supports the [integrated preview and walkthrough](docs/evidence/v1a/INTEGRATED-PREVIEW.md). Two live Coding turns passed alongside labeled fixture history. Integrated owner walkthrough remains open.

**A4 builder candidate available.** The supplemental [A3 approval and refusal proof](docs/evidence/v1a/A3-APPROVAL.md) passed independently on unchanged `d5232a3` runtime and package bytes, satisfying the owner's conditional A3 acceptance and A4 authorization. [A4 evidence and fixture preview](docs/evidence/v1a/A4.md) cover pinned structured-output validation and one governed child at `e94e2b7`. The [independent A4 verdict](docs/evidence/v1a/A4-INDEPENDENT.md) is PASS with one minor presentation finding. Radzi subsequently accepted A4.

**A3 historical review evidence.** Radzi accepted bounded A2 at `02b6c21` and authorized A3. The independent fresh-install verdict for `d5232a3c31e457a4d0b3a55eeecd3e6351d5bb6b` is PASS for bounded A3. See [A3 evidence and running fixture Studio](docs/evidence/v1a/A3.md) for on-demand context, scoped memory, governed MCP and both EAC-05 step outcomes. The owner subsequently accepted A3 after the supplemental approval proof passed.

**A2 historical review evidence.** Radzi accepted A1 at `c28b28c0d1d52818461eefbe456d7b026a4a046d` and authorized A2. See [A2 evidence and fixture preview](docs/evidence/v1a/A2.md) for candidate `02b6c21e537d6a2b8fbadb8a2608af4d437d2879`, the separate live Coding receipt and remaining step-boundary proof. The [fresh independent rerun](docs/evidence/v1a/A2-INDEPENDENT.md) passed bounded A2. Radzi subsequently accepted bounded A2.

**A1 historical review evidence.** Radzi accepted the Essential Agent Capability Baseline v0.1.0 and authorized A1. Candidate `c28b28c0d1d52818461eefbe456d7b026a4a046d` passed deterministic browser and fresh installed-consumer checks. See [A1 evidence and isolated fixture preview](docs/evidence/v1a/A1.md) and [baseline with accepted A3 criteria](docs/implementation/ESSENTIAL-AGENT-CAPABILITY-BASELINE.md). The [fresh independent rerun](docs/evidence/v1a/A1-INDEPENDENT.md) passed A1, EAC-02 and EAC-03. Radzi subsequently accepted A1.

**V1a entry and first candidate.** [GitHub issue #3](https://github.com/radz2291/VICT-Tori/issues/3) and Work TORI-003 coordinated the [V1a contract](docs/implementation/V1A.md). The [ownership and pins](docs/evidence/v1a/OWNERSHIP.md), [builder evidence](docs/evidence/v1a/VERIFICATION.md) and [independent findings](docs/evidence/v1a/INDEPENDENT.md) document the early candidate `caa6411b31d0d32bb8cf7a7e2425a3288598f7a6`.

**R-VIS-01 review repair:** Product `8329b64f5c3297736758945e7e50299b34ccea20` verifies the installed reasoning boundary. [Public reasoning visibility is BLOCKED](docs/evidence/v1a/R-VIS-01.md) by VICT's adapter/stream contract; the same preview keeps the live Session and shows an honest unavailable state. The earlier provider-only projection is historical and does not pass this criterion.

## Historical bootstrap handoff (not active)

## Current bootstrap authority

The owner supplied `https://github.com/radz2291/VICT-Tori` and asked: **“This is your repo.. pls prepare in detail.”** The surrounding instruction is to prepare the repository before handing implementation to Codex. This authorizes the specification/bootstrap commit, not a claim that the application has been implemented or accepted.

- Destination: `radz2291/VICT-Tori`, default branch `main`, empty at initial inspection.
- Scope: this specification pack, agent entry/state/handoff, documentation validation, and its evidence.
- Upstream reference: `radz2291/vict-02`, immutable SHA `6b420a3e9eada6f694cc2550debda7753316b5b3`; read-only in this task.
- Preserve: current VICT Studio, saved applications/assets/conversations, existing agent, paused Milestone 2, and other repositories.

## Prepared next task: G0 → U0

**Adopted Node & Edge amendment (2 November 2026):** The owner requested repository incorporation of the agreed proposal and final clarifications. [Node & Edge Foundation](docs/specs/NODE-EDGE-FOUNDATION.md) is required reading: four catalog families, six relationships, real shared editing and incomplete-draft persistence, explicit execution ownership, G0 native mapping and three U0 fixtures. Run Node/To/From are simulated in U0 and enabled live only per safe adapter support; protected actions are never automatically replayed. This refines the same ticket/stages and does not launch implementation or authorize custom UI/upstream changes.

**Work coordination:** The owner requested TORI setup in Rolladice Work. Project/code `TORI`, standard `TORI — Codex Execution and Review` and prepared ticket `TORI-001` now coordinate this task. Follow the [Work protocol](docs/governance/ROLLADICE-WORK.md), resolve live UUIDs/pins, and test local read/comment access before claiming execution. This setup does not start G0/U0; the local launch instruction below still applies. Use ticket discussion for the intermediate walkthroughs and final Review handoff.

**Owner-approved preparation refinement (2 November 2026):** Add the [cross-repository capability ownership matrix](docs/implementation/CAPABILITY-OWNERSHIP.md) and intermediate working UI walkthroughs. This is documentation-only scope; it does not activate application implementation or upstream changes. The matrix must be resolved against public APIs before each runtime slice, beginning with V1a.

This section is the implementation contract to use when the owner starts the next Codex task. It is not an assertion that merely reading this file authorizes a running application or every later stage.

**Outcome:** A locally runnable, independent TORI Studio that the owner can use to review all six UI areas, with real VICT-native editing and durable local Save/reopen. Execution services are clearly simulated behind the contracts that real integrations will later implement.

**Baseline:** Start from the completed bootstrap on `origin/main`; record its full SHA and the clean/dirty state before editing. The immutable VICT baseline above stays pinned until a compatibility finding justifies a documented change. Fetching a newer upstream main does not silently change the chosen dependency.

**Working branch:** Create a bounded feature branch such as `codex/tori-ui-foundation`. Inspect branch rules. Commit/push the candidate and evidence to that branch when the owner invokes this implementation handoff. Do not force push. Main integration, release, or deployment is a separate action unless included in the owner's new instruction.

**Allowed work:** `apps/studio`, reusable `packages/*`, synthetic `fixtures/*`, local tooling and lockfiles, tests/CI, and updates to this pack. These paths are planned logical boundaries; create only the packages needed by the slice. Use public VICT artifacts. Read/build a separate upstream checkout if necessary; do not modify upstream or the live Studio installation.

**Stage ownership:** One agent owns G0 → U0 through implementation, fresh independent verification, bounded repairs, repeated affected checks, and an honest final report. It may delegate non-overlapping work. Owner interaction is for product review and actual exceptions, not routine repair relay.

**Required reading:** [First-stage tasks](docs/implementation/FIRST-STAGE.md), [UI](docs/specs/UI-FOUNDATION.md), [contracts](docs/specs/CONTRACTS.md), [U0 criteria and full acceptance](docs/specs/ACCEPTANCE.md), [baseline](docs/reference/BASELINE.md).

**Demo:** Start with an empty project; create and edit an agent; connect allowed Skills/tools; build a typed workflow; explore three creative branches; save, fully reload, and reopen; inspect a labelled simulated run; move among Definition, Trace, and Session without losing selection, revisions, or artifact identity. Repeat essential operations in a narrow viewport.

**During U0:** Offer the working shell/agent, workflow/canvas and Session/Trace/configuration checkpoints in [First-stage tasks](docs/implementation/FIRST-STAGE.md#intermediate-u0-owner-walkthroughs). Record feedback and revisions while development continues; final UI acceptance remains separate and silence never counts as acceptance.

**Exit:** All U0 engineering criteria demonstrated at an exact candidate, fresh verifier verdict, reproducible local launch instructions, review route and fixture guide, known issues, state update, and owner report. Final UI acceptance remains **HELD** until the owner actually reviews the application.

**Stop conditions:** An essential VICT public API/artifact cannot support the required interaction; a new UI primitive needs owner approval; canonical graph semantics would require replacing VICT authority; a required credential/license/external right is unavailable; or an independent required criterion remains unresolved. Work on unaffected items first. Report the evidence and smallest concrete choice.

**Outside G0 → U0:** Live model/media calls, real provider authentication or credential storage, Quellight database changes, shell-agent execution, unattended scheduling, deployment, npm publication, upstream VICT changes, replacing the existing Studio agent, and resuming VICT Milestone 2. Add these only through a later accepted runtime/integration slice.
