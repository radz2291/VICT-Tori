# V1 consolidated owner review — findings, rulings, and repair disposition

Radzi completed the consolidated V1 walkthrough on candidate `f302de9` (preview 48959). Verdict per area:

- **Background arc (TORI-007): PASSED owner inspection — accepted.**
- **Standing Directive arc (TORI-009): PASSED owner inspection — accepted.**
- **Run Visibility (TORI-010): the verified capture/projection scope stands; the presentation is wrong in kind and requires a remake before consolidated V1 acceptance.**

Items below use Radzi's numbering (2–10). All rulings are recorded in the decision register and AGENTS.md as documentation changes immediately; implementation rides the two slices defined at the end. Every item was verified against the actual candidate before this review was written.

---

## Part 1 — Owner rulings (record now; documentation only, no behavior change)

### R-2 · Node-first paradigm (doctrine)

TORI's interaction model is **node-direct, ComfyUI/Langflow-style**: every authored value lives on its node's parameter surface on the canvas. The inspector/Configure is a **view of the node, never a second home for values.**

Today this is violated: Standing Directive settings render through `Fields.svelte:109` (the Configure/inspector form), while model, context, tools, and child wiring are canvas nodes. Add this doctrine to AGENTS.md beside "canvas is the code," and list the directive fields as the first known migration. Any future slice that adds authored values must place them on nodes — this is now a spec-level acceptance criterion, not a preference.

### R-4 · Package namespace unified to `@tori/*`

Three packages are `@tori-studio/*` (authoring, directive, memory) and one is `@tori/run-visibility`. Unify on **`@tori/*`** — the public capability brand that future apps install; "Studio" is the host application, not the library namespace. Rename now while only our own consumers depend on the names. Execution lands in the hygiene slice (H-4): rename, update every consumer proof, lockfile, and installed-consumer verification.

### R-5 · Exchange cap is a canvas knob

The previously deferred owner decision is now ruled: the per-task limit on agent-to-agent questions is **authored on the canvas** — bounded range, governed default, pinned by activation — on the delegation/exchange wiring. The TORI exchange-binding slice inherits this ruling. The VICT adapter's no-default rule stands: the cap is TORI-side authoring, never chosen inside VICT.

### R-7 · Host deadline is configurable, never hardcoded

The 90 s host ceiling (`server/studio.mjs:243`, `maxHostDeadlineMs`) is reclassified from governed ceiling to **authored knob with a governed maximum**: frontend-configurable, activation-pinned, and never silently clamping any authored value. The historical defect this rules out: a 120 s canvas setting silently clamped by the 90 s host ceiling. The Directive interpreter's independent 5–120 s pin (Option C, TORI-009) is unchanged and remains the behavioral model: no accepted value may be silently shortened by the host. Amend the register entry that classifies the 90 s literal.

---

## Part 2 — Defects and repairs (the V1 response slice)

### D-8 · Dead clicks on run navigation (defect)

**Owner report:** "Inspect run" and "Open Research Run" do nothing when clicked in the session.

Static analysis identified three concrete suspects. The builder reproduces live and fixes **all three paths**:

1. The session activity `inspect` callback (`Studio.svelte:2402`) runs `setRunScope('all'); openRun(id,true)` with **no page navigation** — compare `inspectSessionRuns()`, which calls `changePage('Runs')` first. The click loads data under the session while the user never leaves the session: it *looks* dead.
2. The session-details "Inspect runs" button defaults `runId=sessionRun?.id` and **silently no-ops** when `sessionRun` is unset in some session states.
3. The Runs-page `RunActivity` (`Studio.svelte:2498`) passes **no `inspect` prop at all**, so child-run buttons never render there — an inconsistent surface.

**Required proof:** browser coverage for every path — session → child run, session details → runs page, runs page → child run and back — each navigating visibly.

### D-9 · Styling drift on new components (repair)

The newly implemented components (run activity, activity detail, directive fields, memory controls) have visually drifted: hard to read, inconsistent with the rest of Studio. Root cause and remedy are in D-10 — the drift is largely *not composing the foundation*. After the D-10 swap, run one alignment pass over all remaining custom surfaces: typography, spacing, and tokens matching the installed VICT control inventory. Composition only; no new visual primitives; no UI exception required.

### D-10 · Quiet / Summary / Full remake (the main item)

All three views are wrong **in kind**, not in polish — and the root cause is the same as D-9: **TORI hand-built custom activity panels instead of composing the foundation.**

`@victframework/ui-ai-svelte` already ships the required pattern, verified in the installed package:

- **`Conversation`** renders messages with **inline per-turn activity**
- **`ConversationToolCall`** renders each step as **one collapsed line** (icon + human title) with **live states** (spinner while running → ✓ completed → ✕ failed → dashed pending), **expandable Input/Result payloads** with honest notes (redacted / truncated / unavailable / "Waiting for result."), and **attempt receipts** with stages

This is exactly the Claude/Codex tool-trace pattern: mechanical steps rendered conversationally — inline in the turn that caused them, one collapsible line per step, raw detail one click deep, auto-collapsed when settled.

**The remake:**

1. **Delete the custom activity panels** (`RunActivity` event timeline and friends) and **compose `Conversation` + `ConversationToolCall` + the `Trace.*` primitives** from the foundation. The builder's work is the **adapter only**: run events → `ConversationActivity` items — app-vocabulary titles per operation type, input/result payloads, live/settled states — plus the density rules below.
2. **The three modes are density levels of one pattern:**
   - **Quiet** = final outputs only — the conversation as chat
   - **Summary** = the collapsed step lines, inline under each turn
   - **Full trace** = the same structure, steps expandable to raw receipts
3. **Turn-grouped, never a side panel.** Activity attaches to the conversation turn that produced it; many steps roll up under the turn.
4. **App vocabulary on the line; system codes only inside expanded detail.** The line says "Ran Research Topics," not `tool.completed`. Events with no user meaning at all (sequence numbers, usage deltas, governance bookkeeping) remain on the Runs/Details technical surface, explicitly labeled technical.
5. **Capture and projection are unchanged.** The verified `projectRunReport`, receipts, and honest states stay exactly as accepted — this is a presentation-layer remake along the established split (capture = framework law, projection = shared substrate, presentation = consumer's choice).
6. **If any gap is found in the foundation components, document it and escalate to Radzi.** No silent hand-rolled substitutes, no new visual primitives without the documented owner-approved exception.

**Pre-implementation gate:** the builder produces the **presentation spec** — step-title vocabulary for every operation type, state mapping, density rules, rollup rules, and expansion contents — and **Radzi approves it before UI work.** This prevents a second system-context rebuild.

### R-2 repair (same slice) · Directive fields onto the node

Move Standing Directive fields from the inspector form to the node parameter surface per the doctrine. The inspector reads the node; it never owns the values. Execution-limits and any other inspector-only authored values migrate under the same rule — **enumerate them in the slice spec.**

### R-7 implementation (same slice, or a proposed alternative)

The host-deadline knob lands in this slice unless the builder proposes it belongs with the node-family slice; the ruling itself is not negotiable.

---

## Part 3 — Hygiene slice (no behavior change, no acceptance risk)

### H-3 · Split `Studio.svelte`

2,806 lines hold every page. Split into **one file per page** — Agents, Runs, Sessions — with shared shell/state extracted, **before Workflows and Creative pages arrive**. No visual or behavioral change; the full regression + browser suite proves equivalence.

### H-4 · Execute the package rename (R-4)

Rename the three `@tori-studio/*` packages to `@tori/*`; update consumers, lockfile, and the installed-consumer proof.

### H-6 · VICT pin document

One standing document answering **"which exact VICT version is installed, and why"**: each pinned archive and version, why that version, what each pin unlocks, and the upgrade policy. This becomes the first answer whenever TORI's pace depends on VICT's.

---

## Part 4 — Sequence and acceptance state

1. **Now:** record R-2, R-4, R-5, R-7 in the decision register and AGENTS.md (documentation only).
2. **Hygiene slice** (H-3, H-4, H-6) proceeds immediately, in parallel — it blocks nothing.
3. **V1 response slice** (D-8, D-9, D-10, R-2 repair, R-7): presentation spec first → **Radzi approves the spec** → implementation → independent verification on Windows.
4. **TORI-007 and TORI-009: accepted** on completed walkthroughs. **TORI-010:** the verified capture/projection scope stands accepted; the presentation remake is required before **consolidated V1 acceptance**.
5. **The TORI exchange-binding slice proceeds** on the VICT-005 gate as authorized, now carrying R-5 (canvas cap knob). Live specialist questions remain separate work under the existing scope amendment.

Radzi retains acceptance on every item. The exchange cap value, the host-deadline governed maximum, and the final presentation spec are owner approvals, not builder choices.
