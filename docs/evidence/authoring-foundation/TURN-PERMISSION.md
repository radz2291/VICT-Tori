# TORI-005 Authoring Agent turn permission

Radzi asked Studio to keep the selected Turn permission until he changes it. Product `950d20a133bec3dc44577027bd3a1387a4306791` on `codex/tori-authoring-foundation` starts from `5c9b922cab366f7b11ad4f52481575e3d7dc3591`.

Open the Authoring Agent dock at [Studio](http://127.0.0.1:48797/) and select **Review only** or **Allow edits and tests**. The first visit defaults to Review only. The choice applies to later messages, activation changes, and reloads in this browser for this workspace. Each turn uses the selection at Send and goes through the existing Studio and VICT authorization checks.

`node tests/authoring-browser.mjs` passed with the deterministic fixture. The first build left Allow edits and tests selected. A subsequent Review only turn performed inspection. The later Reading List follow-up, Run `02b957f2-0b1f-465a-853f-068230203683`, used the restored edit permission after reload without setting the picker again and produced the expected action and tool receipts. The fixture also checked that choosing another activation preserves the selection. `npm run build` passed with the existing bundle size warning.

A read-only check of the running preview at 1532 × 668 confirmed that Allow edits and tests survives switching activations and reloading. A manual return to Review only survived a reload. The check sent no messages and created no Runs. The picker uses the installed public `@victframework/ui-svelte@0.4.0-rc.1` Select in the dock and narrow drawer. [Control inventory](UI-AUDIT.md)

The lockfile blob is `746b69fbefb4a9123029f54ab4ca47a00aaa5310`. The fixture provider blob is `69509df48a74063d995f281c9a463651633fe5ec`.

Independent verifier `/root/authoring_verifier` used detached product `950d20a133bec3dc44577027bd3a1387a4306791` with the same installed lockfile and a separate Chromium fixture. One selection enabled two successive applied draft edits, Runs `e249f101-ae0f-49f0-8a54-024b61a55fb2` and `df061caa-fc04-4e12-aafa-47561fa1a978`. A third edit, Run `b83096ec-e06d-4e6f-b68a-ba19c952e433`, succeeded after switching activation. At 390 × 844 the drawer restored the permission after reload. Selecting Review only produced Run `e7e5cd9f-6f13-4896-b96e-605dacad59fd` with five inspections and zero edit receipts. The first independent setup attempts timed out on Configure navigation and were corrected in the verifier's browser script. The focused permission check passed.
