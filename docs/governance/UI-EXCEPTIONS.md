# UI exception register

No custom UI exception is approved at bootstrap.

The owner requires **public VICT UI Foundation components wherever they cover each control's role, on every Studio surface presented for review**, including stubs, rich nodes, pickers, fields, buttons, menus, dialogs and feedback. Normal product composition, data binding, adapters and routes are expected implementation work. A browser-native/custom replacement for a covered public role, a replacement graph editor, interaction system, or custom styling/control mechanism is **not** a convenience fallback: it requires a specific documented owner-approved exception when published VICT capabilities genuinely cannot deliver the requirement. Public package access trouble is BLOCKED/unverified, not implied permission to substitute.

Before asking the owner, finish the investigation and prepare a concrete reviewable proposal. Complete unaffected authorized work. Do not ask for permission merely because application composition code is necessary.

## Required record

| Field | Required information |
| --- | --- |
| ID / affected criterion | Which U0/T/X capability needs the exception |
| Native limitation | Exact package/source version, public API and reproduced limitation |
| Alternatives tested | Existing VICT compositions/extensions and why insufficient |
| Proposed change | Smallest new/shared primitive or upstream capability; visual/interaction example |
| Ownership | Correct reusable package and host boundary; no permanent app-local fork by convenience |
| Impact | Theme, accessibility, phone, history/persistence, manual/AI authoring, tests and migration |
| Owner decision | Actual dated approval/rejection/request; never agent self-approval |
| Verification | Candidate, installed consumer/browser evidence and limitations |

Approval of one exception does not approve unrelated custom UI. If the native shared package should be extended, prepare that scoped upstream handoff; TORI implementation authority alone does not authorize editing/publishing upstream.

## V1a pending capability gap

**V1A-D1 / N4 - direct dock boundary resizing.** Installed ui-svelte 0.4.0-rc.1 public primitives and catalog exports expose Slider and Separator but no resizable split pane with a draggable boundary and keyboard resizing. ui-structure-svelte 0.4.0-rc.1 exports Structure views and selection/geometry helpers, not a workspace splitter. Slider sets a value on its own track; it does not capture and move a panel boundary. The early candidate uses public Window menu actions for Standard, Wide and Reset with remembered visibility/size. Direct manipulation is unverified and no custom splitter is used.

If direct resizing is required before acceptance, the smallest shared extension is a focusable vertical separator with pointer capture, arrow keys and Home/End, clamped panel widths, visible focus, remembered values, and no camera change. Compose it as a reusable VICT layout primitive and verify with both pointer and keyboard at 1531 x 668. No exception has been approved; V1a does not modify upstream or claim this criterion met.
