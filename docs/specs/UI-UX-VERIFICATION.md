# TORI Studio — UI/UX Verification Matrix v1.0

**Status:** Agent-executable review contract; no current implementation verdict is implied.
**Recorded:** 2026-11-04
**Normative UI/UX source:** [Studio Design Constitution](STUDIO-DESIGN-CONSTITUTION.md), which retains historical V/W/A/R rule IDs and includes the five-page shell.
**Functional UI contract:** [UI Foundation](UI-FOUNDATION.md).
**Stage acceptance:** [Acceptance](ACCEPTANCE.md) and [Verification governance](../governance/VERIFICATION.md).
**Exceptions:** [UI exception register](../governance/UI-EXCEPTIONS.md).

## 1. What this document is for

Use this matrix to evaluate **every Studio surface presented for owner review**, to challenge a candidate UI, and to recheck it after changes. It is also a regression suite for later vertical slices. A screenshot-only design review cannot establish component provenance, keyboard behavior, state persistence or actual runtime truth.

This document **does not supersede** existing implementation stages, architecture, contracts or safety/authorization gates. It provides reproducible **probes**, not a second independent set of design requirements, for the existing Constitution and functional acceptance criteria. The next agent must map each relevant probe to the currently accepted U0 task and later stages. Do not assume U0 is responsible for live Mastra/provider integrations merely because they appear as future verification targets below.

### Required reviewer procedure

1. Identify repository, candidate commit SHA, working branch, VICT public package versions, active task/stage and every owner-facing route/view/modal being reviewed. Read the [Constitution](STUDIO-DESIGN-CONSTITUTION.md), [UI Foundation](UI-FOUNDATION.md), [Acceptance](ACCEPTANCE.md) and current stage handoff before evaluating.
2. Build a **surface inventory**: page, route/action to open, screenshot at a stated viewport, major controls, panel states, and runtime vs simulated capabilities. Include states reachable via menus, context menus, dialogs, warnings, validation and mobile view.
3. Build a **public VICT component-role inventory**, covering *every meaningful control* on every presented surface. Inspect installed public exports and actual imports/rendered behavior. Cite exact public package name/export/version and source callsite. Identify composition versus wrapper versus custom implementation. Never infer compliance from an icon or a similar visual theme.
4. Execute positive **and negative** behavior checks; use fresh data as well as edited/saved/reopened cases. Keep real runs and U0 simulated runs explicitly separate.
5. Record individual criterion verdicts: **PASS**, **FAIL**, **NOT DEMONSTRATED**, or **BLOCKED** (missing required capability/permission/dependency). Use **NOT IN CURRENT STAGE** only with the exact accepted stage reference; this is a scope classification, *not* a passing result.
6. Have a verifier who did not author the candidate independently challenge meaningful claims where practical, against an exact commit SHA. A repair creates a new candidate; rerun affected criteria and related regressions.
7. Report owner-facing design findings separately from automated claims. Owner hands-on acceptance of industrial feel, calmness and ergonomics cannot be fabricated by a test runner.

### Minimum evidence entry

For each ID, record: criterion, candidate SHA, tested surface + navigation path, viewport/browser/OS, version of relevant public VICT exports, steps/input, observed behavior, evidence path (screenshots/video/code import trace/tests), expected behavior, verdict, and exact finding/action if not passing. For a source-level component claim, include the **actual import and rendered usage**; for dynamic interactions, capture before/after.

## 2. Public VICT component provenance

**These are executable checks of Constitution F1–F6. They apply even to U0 mock/demo/stub surfaces.** “The VICT version exists but I used native HTML to move faster” is a failure if VICT publicly covers the role. The Constitution is the authority; this matrix holds test procedures and evidence expectations.

| ID | Required proof | Negative/contradictory case |
|---|---|---|
| VICT-01 | For each review surface, enumerate controls and map each covered role to its public VICT UI Foundation export and installed version | Missing controls, invented export names, deep internal source import, copied imitation |
| VICT-02 | Fixed-choice pickers use public VICT Select (where that published role exists), including workflow previews, inspector settings and node interiors | Browser-native select or app-local dropdown silently used instead |
| VICT-03 | Buttons, icon buttons and toggles with covered roles use corresponding public VICT controls and shared states | Raw button styled to resemble VICT or disparate button behaviors |
| VICT-04 | Text fields, text areas, checkboxes, radio, switches and other covered inputs use the public VICT role components | Local field implementation with inconsistent validation/focus |
| VICT-05 | Menus, context menus, dialogs, popovers and other covered overlays use public VICT controls or supported public composition | Native browser prompt/confirm, bespoke dropdown or unapproved overlay |
| VICT-06 | Feedback, progress, loading, status, alerts, notifications and validation with covered roles use VICT public primitives/patterns | Arbitrary toast/error card bypassing public coverage |
| VICT-07 | Canvas/node content also passes VICT-01 to 06; “custom rich node” does not exempt its internal controls | Node uses native picker because it is embedded |
| VICT-08 | No public component exists for uncovered roles **only if verified**; exception record names role, public version/exports examined, alternatives, owner decision and accessibility contract | “Could not find it” without checking; unapproved permanent custom control |
| VICT-09 | Review candidate can be built/consumed from actual supported public VICT packages | Reaching into VICT source or private internals to pass a screenshot review |
| VICT-10 | Public VICT styling/theme tokens are reflected consistently across surfaces and states | Per-page local CSS forks, mismatched focus/disabled/selected treatments |

**Mandatory blocking rule (Constitution F1–F5):** For a covered role, non-VICT implementation is **FAIL**, not a cosmetic finding. If the necessary public package is inaccessible or its coverage remains unverified, report **BLOCKED** or **NOT DEMONSTRATED** with exact evidence; do not replace it invisibly. A justified new custom role is not automatically approved by documenting it; obtain explicit owner review for the exception.

### Example control inventory row (fill with actual facts, not this placeholder)

| Surface | Control role | Public VICT export/version | Source use | Exception | Verdict |
|---|---|---|---|---|---|
| Workflows / step inspector | Fixed-choice execution mode | **To verify from installed package** | File/import to inspect | None presumed | NOT DEMONSTRATED |

## 3. Shared shell, visual system and navigation

| ID | Action / acceptance | Failure probe |
|---|---|---|
| SHELL-01 | On desktop, the persistent bottom navigator exposes the five main pages in order: Agents, Workflows, Creative, Sessions, Runs; selected page is clear | Primary navigation appears as top tabs or a left rail; navigation loses user position |
| SHELL-02 | The top menu bar offers relevant File/Edit/View/Insert/Run/Window/Help families with available commands | Dead menu items or unavailable actions appear executable |
| SHELL-03 | Central working stage remains dominant at ordinary desktop size; optional supporting regions do not consume it by default | Canvas cramped by decorative panels or huge blank chrome |
| SHELL-04 | Library, Inspector and Activity are controlled by consistent **toolbar visibility toggles** | Left collapse icon, right X and bottom chevron all perform hide behavior |
| SHELL-05 | Window menu commands and matching toolbar toggles share **one synchronized visibility state** | Menu says visible while hidden; repeated click fails to hide/reopen |
| SHELL-06 | Closing and reopening any panel restores a sensible usable workspace and preserves selection/content | Inspector toggle discards edits; hiding library loses object selection |
| SHELL-07 | Panel widths/heights resize smoothly; persisted layouts work when supported, with Reset Layout | Resizing breaks controls; return to page unexpectedly loses arrangement |
| SHELL-08 | Panel headers show role/title; chevrons only disclose subsections, X dismisses transient dialogs rather than persistent dock panels | Same icon has conflicting semantics between pages |
| SHELL-09 | Appropriate page-specific panels and commands appear; unhelpful Activity/Console is not permanently forced | Five pages are identical scaffolds with irrelevant placeholder panels |
| SHELL-10 | Breadcrumb/project/selected object and saved/dirty state are legible and truthful | A fake “Saved” label remains after unsaved edits |
| SHELL-11 | Viewport remains stable after selection, inspect, toggles and navigation | Canvas jumps/zoom resets without request; overlays obscure work |
| SHELL-12 | Menu, toolbar, shortcut and context variants of same command share effect and disabled/permission semantics | Undo from menu differs from toolbar Undo |

## 4. Agents and shared authoring interactions

| ID | Action / acceptance | Failure probe |
|---|---|---|
| AG-01 | Create/select an agent and edit its name/instructions using the consistent VICT control vocabulary | Selection changes edit the wrong agent or input value disappears |
| AG-02 | Inline node control and inspector edit **one underlying property**; update synchronously and survive undo/redo/save/reopen | Inspector and node display conflicting values |
| AG-03 | Attach existing Skill, Tool, memory or subagent by stable resource identity; visually reveal/hide linked resource without deleting or duplicating it | Hide visual node deletes resource/relationship; new identity accidentally created |
| AG-04 | Agent definition and Run Agent invocation have visibly distinct meanings | Definition node alone is presented as evidence of execution |
| AG-05 | Incomplete agent graph can be saved/reopened; activation/test readiness errors are shown separately | Save disabled merely because model/provider missing |
| AG-06 | Missing provider/auth/required field has precise diagnostics and relevant next action | “Run” appears successful although no provider exists |
| AG-07 | Quellight fixture is representable: primary, research specialist, memory agent, Tools/Skills and a potential background/subagent path | UI cannot express basic multi-agent structure |
| AG-08 | Hidden complexity remains discoverable through inspect, reveal, contextual controls, or explicit advanced settings | Critical settings exist only in an unlabeled hover target |

## 5. Workflows, canvas semantics and controls

| ID | Action / acceptance | Failure probe |
|---|---|---|
| FLOW-01 | Place, select, move, connect and inspect nodes without losing persistent identities | Rearrangement mutates execution content unexpectedly |
| FLOW-02 | Port type and edge meaning are communicated, and invalid incompatible connections produce clear diagnostics | Every wire behaves as untyped execution sequence |
| FLOW-03 | Reference/context/visual relationships do not implicitly execute; permitted reference cycles are distinguishable from executable cycles | A visual reference cycle triggers execution or is incorrectly rejected by simplistic global cycle rule |
| FLOW-04 | Editing integrity and execution readiness are separate; incomplete workflow draft saves | Draft discarded for an absent required input |
| FLOW-05 | Run All / Run Node / Run To / Run From show distinct eligible behavior where supported; unsupported options are clearly disabled or simulated | All buttons silently run whole graph or imply unsupported real execution |
| FLOW-06 | Branch/route behavior and coordinator ownership are explicit at supported VICT↔Mastra boundary | Multiple-match branch mapped accidentally to single-route decision |
| FLOW-07 | Protected action approval, retry, cancellation and failure states are understandable; no automatic side-effect replay | Retry of upstream step repeats a prior completed external action |
| FLOW-08 | Save/reopen plus undo/redo retain node positions, links, editor/inspector values and connection semantics | A valid draft only works until refresh |
| FLOW-09 | Grouping and reusable/executable subworkflow are differentiated | Visual group is labeled as executable subworkflow without conversion |
| FLOW-10 | Validation prevents unsupported arbitrary control-edge mixtures while preserving non-executable drafts | Graph allowed to run though no supported engine mapping exists |

## 6. Creative generation and material experience

| ID | Action / acceptance | Failure probe |
|---|---|---|
| CREA-01 | Source material, transformation, executable generation and exploratory relationships have distinguishable roles | All creative links automatically run |
| CREA-02 | Selected result/input **version** is visible to an operator such as Upscale | Upscale silently consumes newest version instead of chosen version |
| CREA-03 | Edit prompt/operator settings marks dependent outputs stale without automatically regenerating them | Input edit silently incurs provider call or overwrites a prior result |
| CREA-04 | New variation creates a distinct result with preserved source/provenance lineage | Replaces first variation without trace |
| CREA-05 | Selected operator may run using eligible existing inputs without unintended upstream regeneration | Tweaking upscale setting regenerates its source |
| CREA-06 | Provider unavailable: saveable graph, honest unavailable state and no fabricated output | “Generated” success displayed when only placeholder exists |
| CREA-07 | Converting exploratory canvas to executable workflow requires explicit action and diagnostics | Hidden conversion changes graph semantics |
| CREA-08 | Visual comparison, output selection and inspected settings support an actual iterate-and-compare task | Canvas renders but cannot meaningfully select/inspect results |

## 7. Sessions and Runs

| ID | Action / acceptance | Failure probe |
|---|---|---|
| SESS-01 | Start/resume a session associated with an agent from within TORI without opening the consumer app shell when integrated | Sessions page is merely an external-app launcher |
| SESS-02 | Current agent/version, active mode/model/provider and context are truthfully displayed and inspectable when available | UI switches mode label without changing runtime binding |
| SESS-03 | Thinking visibility, tool calls, Skills/context and background agent status are shown when actually available and allowed; limitations are stated | Invented “thinking” or fabricated internal trace |
| SESS-04 | Session input/history persist as promised and are distinct from saved definitions | Chat editing silently changes agent configuration |
| SESS-05 | Session interaction links to the identified actual run/trace, or honestly labeled simulated trace | Generic run log claims to come from current message |
| RUNS-01 | Runs page can identify each run, attempt, status, trace events and the originating definition/session when integrated | No stable run identity or history overwrites older attempts |
| RUNS-02 | Evidence and planned graph are visually/semantically differentiated; user-drawn edges cannot create trace evidence | A drawn link is reported as observed tool invocation |
| RUNS-03 | Inputs, outputs, timing, errors, authorization and retry state are inspectable when supplied | A failed step presented as completed success |
| RUNS-04 | Cancellation/retry controls are capability- and permission-aware, especially for protected external actions | Retrying repeats action without warning/approval |
| RUNS-05 | U0 simulated runs are conspicuously labeled; no claim of provider contact | Fake U0 event displayed in ordinary run history as real |

## 8. Visual, accessibility, responsive and quality checks

| ID | Action / acceptance | Failure probe |
|---|---|---|
| VIS-01 | Across all five pages, typography, spacing, surfaces, selected/disabled/error/active-state patterns form one coherent professional system | Generic card-heavy SaaS appearance or page-specific design forks |
| VIS-02 | Dense content remains legible; primary action and focus are obvious; panel boundaries are restrained | Excess whitespace, oversized decorative hero, low-contrast data |
| VIS-03 | Colors and icons convey truthful states and have text/accessible alternatives | Status only communicated by red/green |
| VIS-04 | Animation explains state change and respects reduced motion | Long transitions delay work or cause lost focus |
| A11Y-01 | Tab/Shift+Tab, focus ring and screen-reader labels work for menus, fields, dialogs, panel toggles and primary commands | Keyboard trap, missing accessible name, invisible focus |
| A11Y-02 | Right-click/contextual action has a keyboard or discoverable accessible alternative | Critical command only on pointer hover/right-click |
| A11Y-03 | Picker/dialog/menu supports keyboard interaction and correct opening, dismissal and focus restoration via public VICT behavior | Esc loses focus or modal leaves background interactive |
| A11Y-04 | Errors and validation announce/describe what happened and how to recover | Feedback disappears or is only a color icon |
| RESP-01 | Narrow/phone viewport preserves a usable primary task and access to supporting inspector/library | Three desktop columns squeezed into unusable phone width |
| RESP-02 | Switching viewport/page/panel retains input/selection and does not silently trigger a run | Lost draft or surprise execution |
| RESP-03 | Touch targets, scrolling, overlays and software keyboard remain usable | Inspector field hidden beneath keyboard; unreachable menu |

## 9. Required walkthrough fixtures

These are end-to-end product questions, not extra architecture inventions:

1. **Quellight agent definition:** Build/open primary agent, research specialist, memory agent, linked tool and Skill; edit settings in node + Inspector; hide/reveal a linked resource; save/reopen incomplete draft; verify public VICT pickers/buttons/fields throughout.
2. **Quellight in TORI:** Use the configured agent inside Sessions (or truthful U0 simulation); inspect provider/mode/tool visibility; follow one operation to a real or clearly simulated run.
3. **AI/business workflow boundary:** AI research → proposed result → protected platform action. Verify owner/coordinator, authorization, failures, and no unintended replay after partial rerun.
4. **Creative source → generation → upscale:** Pick image version, produce variation, alter prompt and upscale strength, observe staleness/reuse and lineage without accidental regeneration.
5. **Local coding agent system:** Represent basic agent/tools/memory; show pathway to subagent/background, local CLI/MCP and run inspection where integrations exist. Don't claim live CLI merely from UI shape.
6. **Panel toggle regression on every relevant page:** Library, Inspector, Activity toggles and Window menu all function consistently; close/reopen/resize without losing selection, draft or viewport.
7. **VICT-only control sweep:** On every route, open each picker, menu, dialog, feedback state and node editor; check rendered component provenance and interaction. Include the exact U0 Workflow preview picker case that previously risked using browser-native selects.

For each fixture, write down **which steps are truly runnable now**, **which are simulated**, **which belong to a later accepted stage**, and the observed evidence. A prototype can demonstrate layout and editing without pretending to pass future runtime tests.

## 10. Stage-aware use without moving the U0 goalposts

**UI-first / U0 candidate:** Evaluate all currently presented surfaces for public VICT controls, shell, five-page navigation, honest stubs, consistent panel toggles, visual language, accessible interaction, and those authoring behaviors the accepted U0 scope actually promises. Runtime-only checks can be marked **NOT IN CURRENT STAGE** with a reference, but they remain registered for later vertical slices.

**Functional vertical slices:** Turn appropriate simulated claims into observed tests. Exercise save/reopen, provider binding, execution ownership, retries, real run IDs, actual Skills/tool use, background work and real provenance as each capability arrives. Do not carry a simulated PASS into a real-runtime gate.

**Product approval:** The owner operates the actual app. Evaluate whether TORI has the familiarity, control density, workflow speed and predictability of the professional software references, not merely whether all listed components render.

A non-executable control that looks functional is not a passing stub. Either implement the agreed U0 interaction, visibly disable it with a useful explanation, or label a demonstrable simulation.

## 11. Verdict and handoff format

For each candidate, the reviewer produces:

- **Scope:** target branch/commit, exact active U0/later stage, product surfaces and excluded work.
- **Inventory:** routes/screens/states tested; public VICT role→export/import proof with versions; exception list.
- **Matrix:** IDs with PASS / FAIL / NOT DEMONSTRATED / BLOCKED / NOT IN CURRENT STAGE (with authority).
- **Findings:** severity, user impact, reproduction steps, screenshot/log/source evidence, proposed smallest repair, and whether owner input is needed.
- **Regression:** checks repeated after the changed candidate SHA; preserve failed evidence.
- **Owner experience review:** what feels clear or awkward during genuine workflows; open judgments labeled as such.
- **Gate:** PASS only when every criterion required by the **accepted stage** has credible evidence; PASS WITH NON-BLOCKING FINDINGS only when required criteria pass and residual issues are truly non-blocking. Otherwise HELD / FAIL / BLOCKED with a concrete reason.
- **Next agent action:** reconcile this documentation with current task and existing authoritative files; do not silently change accepted U0 scope or assume the documentation branch has been merged.

### Review rejection examples

- “All VICT controls compliant” without identifying the installed exports and usage: **NOT DEMONSTRATED**.
- U0 Workflow mode picker rendered as browser-native select when a public VICT Select covers it: **FAIL**.
- Public VICT package unavailable, so a local mimic used without approval: **BLOCKED** (availability) plus **FAIL** for the delivered substituted surface; do not present it as acceptable final UI.
- Three panel headers use unrelated X/chevron/collapse interactions while toolbar toggles are absent: **FAIL** against SHELL-04/08.
- Screenshot shows generated image but the system performed no provider call and did not label simulation: **FAIL**.
- Creative graph reference cycle saves as a draft but is incorrectly executed as control flow: **FAIL**.
- A required live background agent test attempted during UI-only U0 where no such runtime capability was promised: **NOT IN CURRENT STAGE**, never PASS or FAIL on the U0 UI gate.

The constitution, map and matrix together are intended to make future UI implementation inspectable **and falsifiable**, with the same expectations across every TORI page.
