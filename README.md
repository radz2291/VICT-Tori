# TORI

**Current stage — [V1b Studio-created authoring agent](docs/implementation/V1B.md).** Start with the [handoff](HANDOFF.md) and the approved [V1a Studio closeout](docs/evidence/v1a/STUDIO-CLOSEOUT.md).


**VICT-native Studio and reusable AI orchestration capability, powered by Mastra.**

TORI brings agent configuration, executable workflows, creative exploration, persistent sessions, and execution evidence into one environment. Applications consume the same capabilities that Studio uses. VICT owns definitions and authority; Mastra supplies AI execution mechanisms.

The standalone V1a Studio supports real Agent editing, pinned activations, Sessions and Runs. See the [local launch and walkthrough](docs/evidence/v1a/README.md). Work tracks implementation and review by slice.

## Start here

| Reader | Read |
| --- | --- |
| Owner / product reviewer | [Foundation](docs/specs/FOUNDATION.md), [UI experience](docs/specs/UI-FOUNDATION.md), [acceptance scenarios](docs/specs/ACCEPTANCE.md) |
| Implementing Codex agent | [AGENTS.md](AGENTS.md), [STATE.md](STATE.md), [HANDOFF.md](HANDOFF.md), [V1b slice](docs/implementation/V1B.md) |
| Architecture / integration | [Architecture](docs/specs/ARCHITECTURE.md), [contracts](docs/specs/CONTRACTS.md), [capability catalog](docs/specs/CAPABILITY-CATALOG.md), [VICT baseline](docs/reference/BASELINE.md) |
| Delivery / verification | [Roadmap](docs/implementation/ROADMAP.md), [verification runbook](docs/governance/VERIFICATION.md), [decisions](docs/governance/DECISIONS.md) |
| Starting a new Codex session | [Copyable start instruction](CODEX_START.md) |

## Delivery order

1. **G0 — Compatibility and contract mapping:** verify the pinned VICT packages, their public exports, and the minimum authoring contracts.
2. **U0 — Production UI foundation:** build the independent TORI Studio, with real native editing, typed connections, Undo/Redo, validation, Save/reopen, and labelled simulation adapters.
3. **V1a owner UI review:** refine the working V1a Studio and establish the approved experience reference.
4. **V1–V5 — Functional vertical slices:** agent runtime and self-authoring; AI/business workflows; creative generation; unified experience; real consumer integration.

The complete product bar remains **T01–T09**, including creative canvas, workflow execution, Quellight, and local coding agents. UI review cannot pass a live runtime test.

## Dependency boundary

The inspected VICT foundation is [`radz2291/vict-02` at `6b420a3e9eada6f694cc2550debda7753316b5b3`](https://github.com/radz2291/vict-02/tree/6b420a3e9eada6f694cc2550debda7753316b5b3). Use its public packages. A version label alone does not prove that an npm artifact contains this source baseline; G0 must establish the installation route and artifact identity.

TORI is a separate application. Existing VICT Studio and its saved work remain in place. Replacing that Studio's agent is a later integration gate; VICT Stage 9 Milestone 2 remains paused.

## Repository checks

With Python 3.9 or newer, run `python3 scripts/check_docs.py` (or `py scripts/check_docs.py` on Windows). It checks local link destinations, catalog/test identifiers, the stage inventory, and required handoff files. Use the [V1a verification commands](docs/evidence/v1a/STUDIO-CLOSEOUT.md#verification) for application build and behavior.

No package publication, deployed service, provider connection, runtime acceptance, or license choice is implied by this bootstrap. Current status and authority are recorded once, in [STATE.md](STATE.md) and [HANDOFF.md](HANDOFF.md).
