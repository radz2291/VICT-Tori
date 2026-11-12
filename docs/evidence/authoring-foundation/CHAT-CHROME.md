# TORI-005 Authoring chat space and Select styling

On 12 November 2026, Radzi asked to remove the revision, draft and budget summaries from the chat and use the shared styling for the permission choices. Product `25980a86a200269cb8e725705a0c22b673439469` on `codex/tori-authoring-foundation` builds on `f88eb1667c2478f938471731d697b011836cacdc`.

Open the Authoring Agent dock in the [Studio preview](http://127.0.0.1:48797/). The transcript starts beneath the dock heading. **⋯** opens the activation dialog with the current revision selected and the current draft shown below the dialog title. **Turn permission** sits beside **Send**. **Inspect authoring Run** appears after a turn returns a Run. Agent Execution settings hold the configured budgets, and Run details show actual usage.

The dock uses public VICT Dialog and Select for activation, Select for Turn permission, Button for Run inspection, Feedback for status, and the Sessions Conversation and PromptInput for the chat. The common Studio scope styles public Select options through `--vict-color-text` and `--studio-field`. The option and field colors matched at `#e5e7eb` on `#191c22`, a 13.78:1 contrast ratio, in Turn permission, the activation dialog and the Configure model picker. [Control inventory](UI-AUDIT.md)

A read-only Chromium 153.0.8010.12 preview check measured a 406 px transcript at 1106 × 668 and 404 px at 390 × 844 with no current Run link. At both widths, selecting a revision closed the dialog, keyboard selection changed Turn permission, the composer fit, and there was no horizontal overflow. The check preserved the saved activations and Run list.

`node tests/authoring-browser.mjs`, `node tests/v1b-browser.mjs` and `npm run build` passed. The fixtures exercise retained permission, continued turns, Run inspection and both legacy and configured execution limits. VICT packages were installed from the pinned `0.4.0-rc.1` archives. Lockfile blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310`, provider fixture blob `69509df48a74063d995f281c9a463651633fe5ec` and browser fixture blob `db080e4d53dbce4b3153230e8cbeba1a27817542`. The build retained its existing bundle-size warning.

Independent verifier `/root/quiet_authoring_verifier` passed the full synthetic Authoring browser fixture from detached `25980a86a200269cb8e725705a0c22b673439469` on port 48815. The transcript measured 374 px on desktop and 384 px in the narrow drawer with Run inspection visible. The verifier opened Turn permission with Alt+Down and captured the expanded public Select in Windows Chromium. Unselected options use the Studio palette and the native selected option uses dark text on a light blue highlight. Native highlight styling can vary by platform. The legacy 4-step and 3-tool-call cutoff, configured 7-step and 5-tool-call budget with 2 retries, and 1-step and 0-tool-call case passed. No findings in the reviewed scope.

[Expanded permission picker in the synthetic fixture](authoring-permission-options.png)
