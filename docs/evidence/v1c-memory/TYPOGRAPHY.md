# TORI-006 Studio typography

Product `15806e7d7377283650715067163ecb75dce3a4ef` (tree `537997f315c3e2fdae52ce2405b343c048764be8`) on `codex/tori-v1c-memory-foundation`. The [card polish review](CARD-POLISH.md) records the preceding card layout.

Chromium measured the prior message text at 11.375 px, memory body at 13 px, and composer at 14 px. The AI surfaces used `system-ui, sans-serif`, while the shell and correction dialog used the Studio font stack.

Messages, assistant prose, composers, memory body text and correction fields now use the Studio font stack and the same 13 px size with 19.5 px line height. Card headings use the same family and a 650 weight. Source counts, guidance, status and controls retain a supporting type scale. Code and technical identifiers retain monospace typography.

The [Studio preview](http://127.0.0.1:48836/) served the stylesheet in the existing workspace. At 835 × 667, the user message, assistant message, saved memory, composer and correction field measured the same font family, size, weight and line height. The save record and activation stayed available.

## Public control audit

The inspected surfaces use the installed VICT UI 0.4.0-rc.1 Button, StatusBadge, Feedback, public Dialog and Label, and VICT AI 0.4.0-rc.1 MessageScroller, Patterns.Message, Patterns.PromptInput, Textarea and Conversation. The shared shell, Configure and Canvas policy Selects, Session sidebar and Runs retain the [control inventory](UI-AUDIT.md#owner-repair-checkpoint). The change uses Studio font tokens and host CSS with the same public controls. The check covers Constitution F1–F6, V1/V2 and A4.

## Verification

Windows, Node 22.13.1, npm 11.19.1, Chromium 153.0.8010.12 and Playwright Core 1.63.0. Lock blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310`, browser driver `a8c71ea4c88433304bac0d79bd5f8af2741d4b25`, provider fixture `10f76d5666dbef5431dfe5f90d19969805a65e88`.

- `npm run build` passed with the existing Vite chunk size advisory.
- `node tests/memory-browser.mjs` passed on the exact candidate. It checks computed type in pending, saved and edit states, Sessions, the memory list and Runs at 1531 × 850 and 390 × 844. It also exercises exact confirmation, correction, reopen, restart recall, Dismiss, Forget and rejection focus. [Computed observations](typography/observed.json)
- The [independent typography report](TYPOGRAPHY-INDEPENDENT.md) records a focused PASS on the exact candidate, signed by Codex TORI-006 Typography Verifier in `d1dfe63a9f20878cdf987405435656b8505a5e18`. The verifier measured rich prose, code and the shared reading scale in Sessions, Runs and Authoring at both viewports and confirmed the installed public controls.
- The supplemental `node tests/authoring-browser.mjs` run on this candidate and its `9fcaa7b2ad3e5549e5e5ec41ad45b87220881eaf` baseline both stopped at line 264: the first `workspace_inspect` returned `observed` before `tool.failed` and `VICT_AGENT_TURN_FAILED`. The baseline fixture reported an undefined `.find` access. The Authoring test, provider fixture, runtime and lockfile have no changes in the typography range. The baseline’s cold initial page timeout was also retained in local logs; its retry reached the matching tool failure. This check did not establish a complete Authoring walkthrough.

[Desktop proposal](typography/pending.png) · [Saved card](typography/saved.png) · [Narrow proposal](typography/narrow.png) · [Narrow editor](typography/narrow-editor.png)
