# TORI current state

**2 November 2026 — Repository preparation complete; Node & Edge Foundation v0.1 adopted; application implementation not started.** The historical bootstrap has independent documentation-only PASS at remote candidate `e4ae1cfe86385420724565f67d77c28ec50e26ea`, verified equal to its reviewed local file tree; its GitHub documentation CI passed. [Bootstrap validation](docs/evidence/bootstrap/VALIDATION.md) records those identities, corrections and limits. Subsequent ownership, Work coordination and Node & Edge amendments are documentation changes with their own commit/review attribution. There is no runtime, UI acceptance, independent product verdict, or deployed TORI service.

## Authority and readiness

| Item | Current status |
| --- | --- |
| Owner request | Prepare `radz2291/VICT-Tori` in detail before passing it to Codex |
| Authorized bootstrap | Inspect dependencies, prepare specifications/governance/handoff, check and commit the pack to this repository |
| Product direction | Agreed in the supplied conversation; recorded in [decisions](docs/governance/DECISIONS.md) |
| G0 / U0 implementation | Prepared next task; begins when the owner gives the implementation handoff to Codex |
| UI approval | Not requested yet; no UI exists |
| V1–V5 runtime slices | Planned; not started or accepted |
| T01–T09 | All NOT DEMONSTRATED |
| VICT dependency | Remote `main` inspected at `6b420a3e9eada6f694cc2550debda7753316b5b3` |
| Installed VICT packages usable by TORI | Not demonstrated; source manifest/export inspection only |
| VICT Studio replacement / Milestone 2 | Replacement deferred; Milestone 2 remains paused |

## Open decisions

The [decision register](docs/governance/DECISIONS.md) owns the open questions. Immediate work is G0 package installation and source-to-domain mapping. The prior “eight operations” vocabulary must be recovered from its actual source before any exact names are frozen; this pack does not invent it. Provider eligibility, full durable-session recovery, and real consumer parity remain evidence tasks for their slices.

## Next action

The owner adopted [Node & Edge Foundation v0.1](docs/specs/NODE-EDGE-FOUNDATION.md) on 2 November 2026. G0 now explicitly proves native semantic mapping and draft/readiness separation; U0 adds concrete fixture coverage for shared node/inspector editing, three graph experiences and simulated partial-execution intents. Live partial execution remains adapter-specific, with protected-effect replay governed separately. TORI-001 carries this amended scope; application implementation remains unstarted.

Rolladice Work setup is now part of the owner's preparation request: project/code `TORI`, pinned execution standard and prepared `TORI-001`. See the [coordination protocol](docs/governance/ROLLADICE-WORK.md). Cloud setup is verified; Windows/local Codex connectivity remains untested. Ticket creation does not start application implementation; current ticket status must be read from Work.

The owner authorized two documentation refinements on 2 November 2026: a [provisional cross-repository capability matrix](docs/implementation/CAPABILITY-OWNERSHIP.md), resolved before each runtime slice, and [intermediate U0 walkthroughs](docs/implementation/FIRST-STAGE.md#intermediate-u0-owner-walkthroughs). These do not start G0/U0, authorize upstream edits, or change the final UI acceptance gate. The historical bootstrap review above applies to its named candidate, not automatically to these additions.

Use [CODEX_START.md](CODEX_START.md) to begin G0 → U0. The implementation agent should finish the usable UI candidate and its independent engineering review, then stop for the owner's UI review. It must not drift into live runtime or external application integration before that gate.

## Maintaining this record

After each accepted stage, replace the opening paragraph with the actual outcome and date. Record the exact product candidate and verifier SHAs, evidence links, verdict, open findings, and next authority. A documentation-only checkpoint may refer to its introducing commit to avoid a self-referential SHA; never use that convention for a tested product candidate.
