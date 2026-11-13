# TORI-006 memory card polish

Product `3851a1e8ea04c5ed2ddde0bb40585c27f5829854` (tree `e76ad20e98a57350ff6bc3fa070a07a8b09b1eea`) on `codex/tori-v1c-memory-foundation`. The [owner repair review](REPAIR-REVIEW.md) records the preceding Memory Foundation candidate. This checkpoint addresses Radzi’s two card design comments on the existing preview.

The **Memory proposal** puts the exact draft below the heading, with shorter review guidance, a source-message count and clear Confirm, Correct and Dismiss actions. The confirmed card uses a compact **Memory** heading and a **Saved** badge. Correction and forgetting stay on that turn, and forgetting shows one outcome with the receipt location.

The [Studio preview](http://127.0.0.1:48836/) reopened the existing Session on Quellight r1 after restart. Workspace, activation, Session, Runs and the saved memory revision matched across the restart. The earlier unconfirmed proposal had expired. To see the pending state, send a fresh explicit request in the Session.

## Public control audit

| Surface | Installed public export | Observed states |
| --- | --- | --- |
| Pending and saved Session cards | `@victframework/ui-svelte` Button, StatusBadge and Feedback; `@victframework/ui-svelte/primitives` Label; `@victframework/ui-ai-svelte` Textarea. All at 0.4.0-rc.1. The bookmark is decorative. | Draft, correction, exact Saved text, Dismiss, validation error, Forgotten status and keyboard focus. The focused Memory heading exposes Saved or Forgotten as its accessible description. |
| Post-save actions | Public VICT Button, Dialog, Label, Feedback and AI Textarea. | Correct opens an editable revision, Forget requires the dialog action, and Escape restores focus to its invoking control. |
| Surrounding Studio | The installed MessageScroller, Patterns.Message, Patterns.PromptInput and VICT navigation and inspector controls from the [control inventory](UI-AUDIT.md#owner-repair-checkpoint). | The browser rechecked the shared shell, inactive Workflows/Creative, Configure and Canvas policy Selects, Session details and Run admission. |

The active card uses the Studio accent and the saved state uses the public success tone. Body copy, labels, actions, borders and focus use Studio and VICT tokens. This composition follows N8, F1–F6, V1/V2 and A1–A5. Owner visual approval remains in Review.

## Verification

Windows, Node 22.13.1, npm 11.19.1, Chromium 153.0.8010.12 and Playwright Core 1.63.0. Lock blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310`, browser driver `3e65bc7ad36997425f640d6bed0f56b5e5018614`, provider fixture `10f76d5666dbef5431dfe5f90d19969805a65e88`.

- `npm run build` passed with Vite’s existing chunk size advisory. The last two commits change only browser assertions and fixture cleanup. They use the same production inputs as the build.
- The affected Node suite passed 184 tests. The verifier’s full deterministic suite passed 194 tests against identical Node test inputs.
- `node tests/memory-browser.mjs` passed on the exact candidate with the deterministic provider and disposable store. It checked attachment, exact confirmation, over-interpretation correction, reopen, recall after restart, forgetting, Dismiss and Stop. The first iterations exposed a contrast measurement and fixture assertions that were corrected. The final run measured 7.21:1 guidance, 6.35:1 Saved badge and 13.78:1 editor contrast.
- The 835 × 667 comparison measured the saved card at 125 px and the pending card at 142 px with similar single-line text. At 390 × 844, actions were at least 44 px tall. The 1,026-byte rejection kept the full alert in view, returned focus to the editor and produced no receipt.
- The independent verifier recorded **PASS** on the exact candidate in report commit `cd62a4c4fcefe682180d799c021fc5bc1fd3f837`. The [signed report](CARD-POLISH-INDEPENDENT.md) includes desktop and touch Chromium observations, keyboard actions, accessibility tree checks and a zoom-equivalent viewport. Physical device and screen reader speech are outside the recorded proof.

[Pending at 835 × 667](card-polish/pending-835.png) · [Saved at 835 × 667](card-polish/saved-835.png) · [Desktop proposal](card-polish/memory-confirmation.png) · [Desktop saved](card-polish/memory-saved.png) · [Narrow proposal](card-polish/memory-narrow-confirmation.png) · [Narrow saved](card-polish/memory-narrow-saved.png) · [Error recovery](card-polish/memory-narrow-invalid-edit.png) · [Forgotten](card-polish/memory-narrow-forgotten.png) · [Fixture observations](card-polish/memory-observations.json)

The backing store, memory policy and provider code are identical to the preceding candidate. The [prior live verification](REPAIR-REVIEW.md#exact-evidence) remains attributed to that earlier product SHA.
