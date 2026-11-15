# TORI-015 — Packed VICT turn composition gate

The owner-approved VICT extension was built from the reviewed UI foundation `6b420a3e9eada6f694cc2550debda7753316b5b3`. VICT source and runnable fixture: [`cfa3cb9f009b55a551f0dce7c0e5c762a46e7106`](https://github.com/radz2291/vict-02/commit/cfa3cb9f009b55a551f0dce7c0e5c762a46e7106).

| Archive | Version | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `victframework-ui-ai-svelte-0.4.0-rc.1.tgz` | `0.4.0-rc.1` | 138854 | `74df4aac5bed13a556f684373e2d4d8ce021521db24edddfe22a414e46be2ac8` |

SHA-512: `1996b7dfec0239ee18cc3d6c93f410c5d122f5ec259064caec6bc0878943d3c6abb1d743ad01ad43784681d0d239ecd5db3b304efba26584dca69801d7525ef8`.

Windows Node 22.13.1, npm 11.19.1, Playwright Core 1.63.0, Chromium 153.0.8010.12. Built with `node packages/ui-ai-svelte/scripts/build-css.mjs` and `npm pack ./packages/ui-ai-svelte`. A fresh isolated consumer used the TORI-014 lock and 15 original archives plus this candidate archive. The consumer changed only its own UI archive integrity and ran `npm ci --offline --no-audit --no-fund`. No TORI source pin changed until the installed browser proof passed.

Copy VICT's `scripts/fixtures/tori-turn-composition/` into the installed consumer root, set `TORI_PLAYWRIGHT_MODULE` to the pinned Playwright location, then run `node browser.mjs`. The test imports from the packed, installed public facade. No source aliases. The public package subpaths are unchanged; `ConversationToolCall` and an activity density type are additive root exports. The proof runs the previous Conversation and tool display too.

**PASS.** One keyed turn hosted both Memory and Float cards; one keyboard disclosure contained input, result, ordered attempts and the authorized Run action. Tab focused the action. The same row and opened action retained focus through settlement. Summary hid the payload and raw attempt evidence. The ordinary legacy Conversation could still expand retained input. Tests used synthetic content and no provider, tool or receipt write.

Two initial harness attempts did not qualify. The first did not reliably observe the timed Running state. The next surfaced a Vite dependency discovery failure on inherited svelte.ts modules. The fixture now holds settlement explicitly and uses the existing Studio `optimizeDeps.noDiscovery` configuration. The tested package archive stayed unchanged.

The TORI integration changes only this archive integrity. Runtime, contracts, control, SQLite, exchange and the accepted Run report projection stay on the reviewed versions. The new presentation joins only already-projected rows to their validated public call correlation. A separate read-only join can connect a call to a child Run through its exact stored invocation, without writing or changing the capture, receipts or projection.
