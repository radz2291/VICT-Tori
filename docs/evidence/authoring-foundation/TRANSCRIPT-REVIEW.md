# TORI-005 transcript styling review

Radzi requested a repair after finding light code labels and excessive list indentation in the Authoring Agent transcript. The change starts from branch tip `82656454f9919ee31ebd4c49f833e0b28df008aa` and product `4308bbff84e0d46b77126ea7fd946a9661e982f9`. The styling candidate is `f3894fba7b9d813e1dcd729b8898da104c30a692` on `codex/tori-authoring-foundation`. [Open the running Studio](http://127.0.0.1:48797/)

The reported list combined a 13 px utility margin with 40 px of browser padding. Inline code inherited `#e5e7eb` text on VICT's light `#f1f3f7` fallback. The host now supplies the graphite highlight through the public VICT theme alias, gives ordered and nested lists hanging markers with a compact indent, and themes links, quotations, tables and fenced code. The Authoring feed flexes to the available height, and the public Scroll to latest message control sits below the transcript.

## Rendered verification

The synthetic browser test uses a normal persisted review reply containing a numbered list, nested bullets, inline code, a long identifier, a quotation, a link, a table and highlighted JavaScript. It opens the same reply through the Authoring dock, narrow drawer, Runs and Sessions. Chromium calculates contrast from rendered text and backgrounds, checks the long identifier fits the message, and measures composer and scroll button bounds.

| Surface | Viewport | Top-level indent | Inline code contrast | Lowest tested contrast |
| --- | --- | --- | --- | --- |
| Authoring dock | 1531 × 668 | 17.55 px | 10.99:1 | 5.50:1 |
| Authoring drawer | 390 × 844 | 17.55 px | 10.99:1 | 5.50:1 |
| Sessions | 1531 × 668 | 15.34 px | 10.99:1 | 5.50:1 |
| Run turn | 1531 × 668 | 15.34 px | 10.99:1 | 5.50:1 |

The baseline inline contrast was approximately 1.11:1. The first repair passed inline code but measured a highlighted comment at 4.39:1. Separating the fenced body from its header with a darker background raised the measured minimum to 5.50:1. The final fixture verifies that Send and Inspect authoring Run remain inside the Authoring dock and drawer, and that the scroll button has room below the text. The updated live preview also rendered the reported reply at 835 × 668 with a 17.55 px indent and both controls inside the dock. The preview loaded the CSS through hot reload. [Measurements](transcript-metrics.json)

- [Authoring dock](transcript-authoring-desktop.png)
- [Narrow Authoring drawer](transcript-authoring-narrow.png)
- [Session transcript](transcript-session.png)
- [Run turn](transcript-run.png)

## Public controls and package evidence

`@victframework/ui-ai-svelte@0.4.0-rc.1` supplies the Conversation, Markdown rendering, scrolling and copy controls in all four captures, along with the Authoring textarea. `@victframework/ui-svelte@0.4.0-rc.1` supplies the activation and permission Select, buttons and Feedback. The narrow Authoring drawer uses the public Dialog. The public `@victframework/ui` theme maps highlight and text roles to the CSS aliases used here. The product diff is Studio CSS applied around these public components. [Control inventory](UI-AUDIT.md) · [Pinned archives](dependencies.json)

Fixture provider Git blob `fc8582e542b8d05f31c6a1832a948d5ee4b7252a`, lockfile Git blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310`. Node 22.13.1, npm 11.19.1, Playwright 1.63.0 and Chromium 153.0.8010.12. Run `node tests/authoring-browser.mjs` with the installed Playwright module and fixture provider to reproduce the measurements. The original live authoring, tool and child-run evidence retains its product attribution. [Original walkthrough](README.md)

## Regression results

At `f3894fba`, the full deterministic Authoring browser passed with the Markdown checks, scope denial, stale edits, Stop and lost acknowledgement. The production build passed with Vite's existing chunk-size advisory. `npm test` passed 12/12, `node tests/v1b-browser.mjs` passed, and the A1–A4 Chromium regression passed with the three A2–A4 flags enabled. The report covers the styling repair and its affected routes.

## Independent recheck

Codex `authoring_verifier` installed the pinned archives in a fresh detached checkout at `f3894fba7b9d813e1dcd729b8898da104c30a692` and passed the unmodified Authoring Chromium fixture on isolated port 48803. The verifier inspected all four screenshots, reproduced the 10.99:1 inline and 5.50:1 minimum syntax ratios, confirmed list and long-code wrapping, and checked composer and scroll-control placement. Fixture Review Run `f1b7dd28-d9f9-414f-88dd-a7507ce16d0f` identifies the independent walkthrough. The first cold Chromium launch reached the existing 20-second page-load timeout. The warmed rerun passed. The independent verdict covers the visual repair and its deterministic regressions.
