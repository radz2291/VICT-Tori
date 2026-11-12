# TORI-005 Authoring dock chat layout

Radzi asked for a quieter Authoring dock that follows Sessions and keeps the activation picker in the header options. Product `858b0ba09172a889db8a69d81d7f4a8766074f8b` on `codex/tori-authoring-foundation` starts from `c95f0537699a11551edd388a65b05e1c681ad8f7`.

In the [Studio preview](http://127.0.0.1:48797/), open the Authoring Agent dock and click **⋯** to open the centered **Choose authoring activation** dialog. The selected revision and current draft appear above the conversation. The composer keeps Turn permission next to Send, and puts the step and tool budgets next to the Run link when a Run is available.

The dock composes the same public `@victframework/ui-ai-svelte@0.4.0-rc.1` Conversation and PromptInput that Sessions uses. PromptInput supplies the input and Send and Stop actions. The header uses the same quiet overflow trigger styling as Sessions. Its fixed-choice picker and the permission picker use public `@victframework/ui-svelte@0.4.0-rc.1` Select. Run navigation uses the public Button primitive, while feedback uses public Feedback. The narrow drawer uses public Dialog. [Control inventory](UI-AUDIT.md)

The read-only check on the original preview measured **339 px** of transcript at 1106 × 668, up from **162 px** on the baseline. The 390 × 844 drawer provided **337 px**. At both sizes, the options opened and dismissed with Escape, choosing an activation closed the options, the composer fit inside the panel, and no horizontal overflow appeared. The check sent no messages and created no Runs. A long reopened transcript can land above the last message. The public Scroll to latest message control remains available.

- [Desktop chat fixture](quiet-authoring-desktop.png)
- [Narrow chat fixture](quiet-authoring-narrow.png)

`node tests/authoring-browser.mjs` passed at the reported desktop size and the narrow size, including compact layout checks, retained permission, Stop, and the actual fixture action and tool receipts. `node tests/v1b-browser.mjs` passed the instruction-only path. `npm run build` passed with the existing bundle size warning. An early parallel fixture launch timed out before the page finished loading. A serial rerun passed. Lockfile blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310`, fixture provider blob `69509df48a74063d995f281c9a463651633fe5ec`.

Independent verifier `/root/quiet_authoring_verifier` passed the scoped change at detached product `858b0ba09172a889db8a69d81d7f4a8766074f8b` with the identical installed lockfile. The isolated Chromium fixture at port 48815 confirmed the picker is hidden until options open, Escape returns focus to the options trigger, and Enter sends from the public composer. The transcript measured 328 px on desktop and 337 px in the narrow drawer with Run controls present. The fixture completed with exit 0 and confirmed retained permission, Stop and Run receipts.

## Centered activation dialog

Radzi asked for a popup in place of the first anchored options panel. Product `557288a90e74ea07de8e001f8545ca8bd00d6480` reuses the public VICT Dialog and Select. Selecting a revision applies it and closes the dialog. Cancel and Escape dismiss the dialog and return focus to **⋯**.

On the running preview, the dialog measured 352 × 180 px at 1106 × 668 and 351 × 184 px at 390 × 844. Both were centered in the viewport. Cancel, Escape and selection passed at both sizes. In the narrow layout the Authoring drawer stayed open after the activation dialog closed. The read-only check preserved the existing definitions and Run list.

The Authoring and V1b browser walkthroughs and production build passed again. Independent verifier `/root/quiet_authoring_verifier` passed a focused Chromium fixture at detached `557288a90e74ea07de8e001f8545ca8bd00d6480` with the identical installed lockfile. It confirmed exact centering, focus return after Cancel, Escape and selection, a retained permission, and zero new Runs.

- [Desktop activation dialog](activation-dialog-desktop.png)
- [Narrow activation dialog](activation-dialog-narrow.png)
