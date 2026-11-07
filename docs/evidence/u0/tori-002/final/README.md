# TORI-002 final engineering handoff

The Studio candidate is available at [the local review app](http://127.0.0.1:48744/). The branch is `codex/tori-002-studio-realignment`, from initial R2 baseline `bbbfd83792e59735829067d93f532567a3c03fd6`. The last pre-repair reviewed tree was `db5dbc892e9d31eb9d173f1205966b241b88755a`. Final product is `94a2a8243d25bbc457753323914395baca7ad492`, served as `index-Dzj8jEs0.js` with `index-CxYyKhhB.css`. The independent verification attribution is recorded below.

## Hands-on route

1. In Agents, create an agent and change its name and instructions in both node and Inspector. Save it. Edit again and reload while the field is focused. The changed text returns with Unsaved edits recovered.
2. Use Edit to delete the selected object, then Undo and Redo. Check empty-history disabled states after a clean reopen. Try Library selection, Inspector hiding and Window checkboxes.
3. Adjust dock widths, switch pages, reload and return. Reset Layout restores that page's defaults. On phone, open the Inspector and use Done or Escape to return to its toggle.
4. In Workflows, add Request, Run agent and Decision. Connect the matching Brief ports, then try Brief to Proposal. Feedback beside Connect names the endpoints and types. Repeat a valid connection to see duplicate-specific guidance.
5. In Creative, compare and branch a direction, change notes, save and reopen. Use Library to select a direction, then Reveal selected object. Try Fit and Zoom at desktop and phone widths.
6. Visit Sessions and Runs. Their main workspaces explain the unavailable U0 execution and records. Return to authoring without losing drafts.

For a stopped preview, build from `apps/studio` with `node node_modules/vite/bin/vite.js build`, then run `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 48744 --strictPort`. Existing drafts remain specific to the browser profile and origin. The installed public artifacts and reproducible dependency setup are in the [G0 evidence](../../../g0/DEPENDENCIES.md) and [Studio instructions](../../../../../apps/studio/README.md).

## Results and evidence

The [source and rendered control audit](CONTROL-AUDIT.md) identifies public exports, installed versions, actual callsites and tested states. [Computed audit data](audit.json) records actual menu inventory, sampled contrast, focus, graph colors and browser errors.

[Agents desktop](agents-desktop.jpg) · [Workflow desktop](workflows-desktop.jpg) · [Workflow Select](workflow-select.jpg) · [Creative desktop](creative-desktop.jpg) · [Creative phone](creative-phone.jpg) · [Phone Inspector](inspector-phone.jpg) · [Reopen warning](reopen-dialog.jpg) · [Sessions desktop](sessions-desktop.jpg) · [Runs desktop](runs-desktop.jpg) · [Sessions at 200%](sessions-200-percent.jpg)

The earlier [matched shell before/after](../README.md), [Sessions before/after](../sessions/README.md) and [shared dock walkthrough](../docks/README.md) remain attributed to their original candidates.

| Constitution / verification IDs | Final engineering result |
| --- | --- |
| N1/N2/N5/N7, V1/V2/V3, SHELL-01/02/03/09/10, VIS-01/02/03 | PASS for the presented five-page U0 experience, top menu, anchored bottom navigation, quiet status and contextual composition. Exact aesthetic acceptance remains with Radzi. |
| N3/N4, W1/W2/W3, SHELL-04/05/06/07/08/11 | PASS for useful dock availability, Window and toolbar state parity, per-page sizes/visibility/reset, intentional hiding, history and shared editing. Ordinary dock/page changes preserve camera. Explicit Fit/Reveal/Zoom changes it. |
| W0, SHELL-12 | PASS for shared menu/toolbar/shortcut operations, disabled empty-history commands and visible Delete. Native field editing keeps its own keyboard editing semantics. |
| F1-F6, VICT-01–10 | PASS for currently presented roles, backed by installed public exports, source inventory and exercised rendered states. No approved exception is required. |
| AG-01/02/05, FLOW-01/08/10, CREA-04/08 | PASS for retained R1/R2 Agent editing, incomplete draft saving, typed linking/rejection, Creative compare/branch, history and saved identity/reopen regression. |
| A1-A5, A11Y-01–04, RESP-01/02/03, VIS-04 | PASS for executed pointer/keyboard, public overlays, touch emulation, meaningful failure/recovery, reduced motion, focus and sampled contrast/200% layout probes. Hardware screen reader, real-device software keyboard and every browser remain untested. |
| N6, SESS-05, RUNS-02/05 | PASS for distinct local definition drafts and clearly unavailable Sessions/Runs. No execution receipt is fabricated. |
| Live provider, runtime, durable session and protected-effect criteria | NOT IN CURRENT STAGE under TORI-002 boundaries and the G0/U0 stage. They remain TORI-001/later integration responsibilities. |
| V4, R0-R3 and final owner visual acceptance | Engineering candidate and evidence ready for hands-on review. Owner acceptance HELD. |

No new blocking finding remains in the independently audited TORI-002 surfaces. The phone command rows are relatively dense and desktop dock-width sliders remain visibly prominent. The independent usability reviewer identified these as owner-review refinements. Viewport resizing preserves the camera, so an object can move offscreen until Fit or Reveal is invoked. Camera recovery and fresh-phone readability were exercised. SessionStorage recovery retains unsaved content through same-tab reload and does not promise recovery after closing the tab. Saved drafts remain in localStorage. Storage failures are surfaced with recovery/download guidance.

## Verification record

Executed with Node `v22.13.1`, installed Svelte `5.57.0`, Vite `6.4.3`, public VICT packages `0.4.0-rc.1`, Windows Chrome and fresh synthetic browser contexts. The pinned G0 release artifact proof used its own recorded Node 24 toolchain.

From the repository root, each browser command takes the installed Playwright ESM entry, Chrome executable and preview URL. The final repair and UI audit scripts also accept an evidence directory.

- `scripts/check-studio-browser.mjs` passed Agent pointer/keyboard/conflict recovery, Workflow native ports/history/reopen and Creative compare/branch/reopen.
- `scripts/check-studio-docks.mjs` passed Window parity, independent page preferences, size/visibility/selection reload, Reset Layout and phone modal focus.
- `scripts/check-studio-final.mjs` passed dirty reload recovery on all authored pages, never-saved draft recovery, command readiness, Delete/Undo, endpoint guidance and mobile Reveal.
- `scripts/audit-studio-ui.mjs` passed all five pages, public control states, menu/Select/dialog keyboard/focus behavior, measured normal-text contrast of 7.04–15.44, a 3px focus indicator, phone overflow and bottom anchoring, reduced motion and 200% CSS layout enlargement.
- Production build passed with Vite's large-chunk advisory. Documentation integrity and Git whitespace checks passed.

Failed evidence is retained in the earlier [usability review](../usability/README.md) and [interim walkthrough](../README.md). First repair candidate `24dfc7a` passed behavior suites but independent keyboard inspection found no graph-node focus ring. Subsequent candidates added explicit focus styling and corrected compatible duplicate-connection wording. The audit then exercised keyboard modality explicitly. Public VICT selected-option styling includes a checkmark in its accessible name, so the selected-option probe uses selected state. Portal layout and fixed-choice popup sizing were also reviewed during final capture.

## Independent final attribution

Verifier `/root/verify` supplied an independent engineering PASS at exact candidate `94a2a8243d25bbc457753323914395baca7ad492`. All four checked-in suites were rerun sequentially against production `http://127.0.0.1:48744/`, serving `index-Dzj8jEs0.js` and `index-CxYyKhhB.css`, and exited successfully. The verifier suppressed artifact writes in memory in the legacy browser and UI audit runs and made no repository changes.

Additional checks confirmed 288px public Select popups with single-line labels and no item overflow at desktop and phone widths, compact menus, the repaired 3px graph focus outline with 4px offset, duplicate-link guidance retaining the original edge, long-label Fit/Reveal and camera preservation, keyboard Enter/arrow/Delete, and touch-dialog focus return. No blocking implementation finding remains in the audited TORI-002 scope.

Fresh independent usability reviewer `/root/usability_review` re-used first repair candidate `24dfc7a` through desktop and phone flows. All five original usability findings passed their bounded re-review, including never-saved and still-focused input recovery. Their duplicate-error wording observation was repaired in the final candidate. Phone toolbar density and preferred selected-card placement remain visual refinements for Radzi's hands-on review. Final UI acceptance remains HELD until Radzi reviews this delivery.
