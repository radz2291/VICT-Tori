# TORI-013 independent Windows qualification

Candidate 3c983fd24709575ade36f22d09c83478e7ddc888, tree dc92f12c10824e5dde28d550081fd5a0dd7fda82, detached from the TORI run-visibility line. Verifier codex-independent-windows-tori013-3c983fd. Windows x64 10.0.26300 with Node 22.13.1, npm 11.19.1, Playwright Core 1.63.0 and Chromium 153.0.8010.12.

## Pinned inputs

The lock Git blob is 746b69fbefb4a9123029f54ab4ca47a00aaa5310 and its SHA-256 is 81662465b62c7f2dca9f38557eab724f82a9e11a5b5d73ea9fda29a2077d7140. The 16 local archives came from the existing exact-pin cache. Each archive matched its accepted SHA-256, byte count, and lockfile SHA-512 integrity before install. The candidate manifest rechecked installed versions and hashed 39 tracked fixture, test and reusable package files. Mastra core 1.64.0, memory 1.28.2 and LibSQL 1.22.3 match the pins.

## Reproduction and attempts

Git fetched the requested SHA and created a fresh detached worktree. After staging the verified archives under packs/, npm.cmd ci installed 413 packages. The install reported the posthog-node engine warning, the esbuild install-script notice and audit counts of 8 low and 19 high. The lock stayed pinned. Two setup receipts record a missing packs/ directory before staging and the post-install manifest invoked before npm ci. Both succeeded after the prerequisites were in place.

The first invocation of node scripts/qualify-run-visibility.mjs passed the 233 unit checks, build, and installed consumer. All eight browser steps failed at startup because TORI_PLAYWRIGHT_MODULE was unset and fresh npm ci did not include Playwright. The original exit codes and full logs are retained under initial/. Playwright Core 1.63.0 resolved from the existing separate test-tool cache. The next attempt ran the same complete serial driver with TORI_PLAYWRIGHT_MODULE pointing to that module and TORI_RV_QUALIFICATION set to a fresh output directory.

The exact qualification command is node scripts/qualify-run-visibility.mjs. Reproduce after the fresh install with reproduce-qualification.ps1 and the two environment variables documented in that script. The driver results record every child command and its exit code. An independent companion probe, independent-replay.mjs, ran both completed-then-failed and failed-then-completed on the same sequence, serializing and reopening the capture across arrivals. Both orders produced the same report. It withheld the two disputed outcomes, retained Finished and the accepted result, emitted PUBLIC_EVENT_CONFLICT, and deduplicated semantically identical replays with reordered fields.

## Scope

The owner-approved visibility scope is evaluated against the exact pinned candidate. RV-01 exact pins, RV-02 display and RV-03 disputed replay have deterministic or browser evidence in this run. RV-09 strict projection/privacy and RV-12 installed reuse are exercised by deterministic and installed-consumer checks. RV-11 is the full fresh Windows qualification. RV-10 uses the visibility and inherited browser checks with the existing classification inventory. RV-04's authored expected-result metadata and distinct terminal reason remain tracked. RV-06 and the exchange-dependent portions of RV-04, RV-05, RV-07 and RV-08 remain upstream-blocked on this TORI candidate. No live provider calls were part of this rerun. Radzi owns RV-13's cumulative walkthrough and the separate TORI-007, TORI-009 and TORI-010 reviews.

## Verdict

The exact candidate did not pass the complete Windows qualification. The configured run passed 10 of 11 driver steps. The 233 unit checks passed, including all 16 recovery cells and both replay-conflict orders. Production build, A1–A4, V1b, Memory, Authoring, Directive, Assembly and Background browsers and the public installed consumer passed. The isolated consumer reported zero dispatch and artifact SHA-256 42bb9e6c87226caa385d39b45d005b1b1371d73caaa8912987afa42991ec8bf1.

The Run Visibility browser reached desktop Quiet, Summary and Full, checked the parent and child links and reload persistence, captured all three levels at 390 px, and passed its no-overflow assertion. The browser then timed out at tests/run-visibility-browser.mjs:88, in openDetails after setViewportSize returned from 390 to 1531 pixels. The Details button did not resolve within 25 seconds. Historical-diagnostic and final zero-write/unchanged-Run assertions below that point were not reached in this run. The media-query transition and sidebar toggle need diagnosis. The exact exit and screenshots are under configured/visibility. RV-10 and RV-11 remain incomplete on this candidate.

Signed 14 November 2026 by codex-independent-windows-tori013-3c983fd for Radzi review.
