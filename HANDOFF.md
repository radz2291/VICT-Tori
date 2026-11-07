# TORI handoff

**Current authority — V1a:** [GitHub issue #3](https://github.com/radz2291/VICT-Tori/issues/3) and Rolladice Work TORI-003. Use the [V1a contract](docs/implementation/V1A.md), [ownership and pins](docs/evidence/v1a/OWNERSHIP.md), and root [launch instructions](README.md). Use the adopted [Design Constitution](docs/specs/STUDIO-DESIGN-CONSTITUTION.md) for all presented surfaces. U0 code and tests are read-only and do not gate or form the implementation base. The owner reviews the actual candidate; engineering evidence is not owner acceptance.

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
