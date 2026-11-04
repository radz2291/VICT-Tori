# TORI Studio Design Constitution

**Draft for owner review.** Applies to Definition, Trace and Session, including canvases, nodes, inspectors, menus and dialogs. It brings together the owner's VICT design preferences, R1 direction and Studio accessibility guidance.

**Requirement** means a rule that a candidate must meet once this constitution is adopted. Existing product and accessibility requirements retain their current authority. **Default** is the normal design choice and may be adapted with a recorded rationale. **Open decision** needs explicit owner resolution before it becomes binding.

## Visual language

- **V1 · Requirement.** Give the work the most space and visual weight. In Definition, the canvas is primary. In Trace and Session, the active run or conversation takes that role. Panels support the work, and controls and status stay visually quiet. Use shared VICT components and tokens across the shell, content and overlays.
- **V2 · Default.** Use neutral graphite surfaces with subtle tonal steps and dividers between functional regions. Use a compact type scale, mostly regular weights and consistent spacing. Leave enough room to scan, read and hit controls. Use fewer nested boxes and rounded corners. Reserve the accent for active and selected states and visible focus. Give focus a distinct shape or offset when selection already uses the accent.
- **V3 · Default.** Borrow Weave's canvas-led workspace and contextual placement of tools. Borrow Langflow's readable node headers and grouping of editable fields. Make the agent name the clearest text, align any glyph with it, and place supporting context below. Use the same identity and naming across views. Show how related objects connect or depend on each other where that helps the user decide. [Weave editor](https://help.weavy.ai/en/collections/15341378-weave-s-editor) · [Langflow visual editor](https://docs.langflow.org/concepts-overview)
- **V4 · Open decision.** The owner directed a canvas-first R1, neutral graphite, quiet typography, a single accent and prominent agent names. The specific palette, lavender accent, type scale, spacing and dock proportions are candidate choices awaiting visual acceptance. R1 acceptance remains a separate owner decision.

## Workspace and interaction

- **W1 · Requirement.** Give each capability a predictable home. Put document history, Save and reopen in the document toolbar. Put Add, pan, zoom and fit with the canvas. Put object-specific actions on the node or in its contextual controls. Use the inspector for deeper configuration. Give commands one primary entry point and provide an equivalent keyboard or touch route where needed.
- **W2 · Requirement.** Selection identifies the current object. Focus identifies where keyboard input goes. Editing changes an authored value. Related or containing objects have a separate visual treatment. Keep inline and inspector edits on the same value and history path. Make deselection and dismissal predictable.
- **W3 · Requirement.** Preserve drafts, selection where appropriate, and the camera when panels open or close or the user changes views. A deliberate Fit command may move the camera. Warn before replacing unsaved work and provide a way to retain it. Keep panels in predictable locations and bound scrolling to the relevant region.
- **W4 · Default.** Place the first creation action directly on an empty canvas. Select and reveal a newly created node and take focus to its first useful field. Respect deliberate inspector dismissal during subsequent navigation. Use clear text for unfamiliar or easily confused actions and labelled icons for familiar compact commands.

## Feedback and accessibility

- **A1 · Requirement.** Put feedback beside the field, document or run it concerns. Keep document status in one stable shell location and execution status with the relevant run. Use a toast for background events that need attention. Keep actionable errors visible until resolved, with a concrete next step. Routine feedback should leave the layout steady.
- **A2 · Requirement.** Give icon buttons accessible names and communicate selected, focused, disabled, busy and error states through suitable text, icons or outlines. Tooltips can supplement a control. Essential instructions must also be discoverable by keyboard and touch.
- **A3 · Requirement.** Provide keyboard and pointer paths for selecting, moving, connecting and inspecting nodes as those actions become available. Provide a list or form route where precise canvas gestures are difficult. Keep focus visible and predictable, and return it to the invoking control when menus and dialogs close.
- **A4 · Requirement.** Check actual theme contrast for text, muted labels, ports, edges and focus indicators. Check target sizes and readability at normal working zoom, in narrow windows, at increased browser zoom and with touch. Respect reduced motion.
- **A5 · Requirement.** Announce meaningful outcomes, including a failed save or completed run, without moving focus unless the next step calls for it. Group repeated progress announcements. Clearly label simulated execution in the affected view and record.

## Review and exceptions

- **R1 · Requirement.** For each checkpoint, identify the candidate, show the relevant screen states and give a short runnable walkthrough. Mark each applicable rule **met**, **gap**, **unverified** or **not yet applicable**. Tie gaps to observable behavior and evidence. Keep engineering results and owner acceptance separate.
- **R2 · Requirement.** Exercise the applicable flow by keyboard and pointer, including a recoverable failure. Inspect the result, focus order, layout stability, contrast and announcement behavior. Include narrow, zoom and touch checks where applicable and record any unverified path.
- **R3 · Requirement.** Record each proposed exception with the rule, affected surface, reason, VICT limitation, alternatives tried, smallest proposed change, accessibility impact and approval status. Keep the evidence in the [UI exception register](../governance/UI-EXCEPTIONS.md). Only the owner can approve a required exception.

See the [owner checklist](UI-FOUNDATION.md#8-owner-review-checklist), [R1 assessment](../evidence/u0/R1-CONSTITUTION-ASSESSMENT.md) and [walkthroughs and screenshots](../evidence/u0/OWNER-REVIEWS.md). Use the [UI Foundation](UI-FOUNDATION.md), [Contracts](CONTRACTS.md), [Node & Edge Foundation](NODE-EDGE-FOUNDATION.md) and [Acceptance](ACCEPTANCE.md) for technical behavior and stage criteria.
