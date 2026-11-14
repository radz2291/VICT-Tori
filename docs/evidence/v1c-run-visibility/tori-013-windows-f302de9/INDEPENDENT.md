# TORI-013 independent Windows qualification

Candidate f302de96b96ede5eb158f4ce779801e955a8f69f on codex/tori-v1c-run-visibility. Candidate tree 204a58f0b57d4cbed6ac659ffc0bb1b24fc4ecd7. Candidate parent 50e52d1be21dd3686c2a830f526d4ded8ad9adaf. Independent verifier codex-independent-windows-tori013-f302de9, Rolladice Work attempt 4, run a3e30b20-4b2a-4471-be0d-eca95604596f. This verifier did not build the repair.

## Inputs and method

The Windows x64 worktree was freshly detached at the integrated candidate with a pristine index and no node_modules. The candidate lock Git blob was 746b69fbefb4a9123029f54ab4ca47a00aaa5310. The verifier read the pinned [builder manifest](https://github.com/radz2291/VICT-Tori/blob/9cbe6ba7ef2c3dd23cd21379f8abb3ba7c6babf4/docs/evidence/v1c-run-visibility/tori-012-details-repair/manifest.json), copied the 16 local VICT 0.4.0-rc.1 archives and computed each archive's byte count, SHA-256 and SHA-512. Both hashes and byte counts matched the manifest, and every SHA-512 and version matched the committed lock. The actual checkout matched all 39 tracked fixture, test and package SHA-256 pins. Exact checks are in [pins.json](pins.json).

The install ran npm ci --no-audit --no-fund using Node 22.13.1 and npm 11.19.1. The same npm was adjacent to the explicit Node executable for the driver's installed-consumer and build commands. Playwright Core 1.63.0 came from a separate test-tool cache and resolved installed Chromium 153.0.8010.12. The normal command was node scripts/qualify-run-visibility.mjs with TORI_PLAYWRIGHT_MODULE and a fresh TORI_RV_QUALIFICATION. The driver ran serially. [Reproduction](reproduce-qualification.ps1).

The historical failed qualification at candidate 3c983fd timed out while finding Details after resizing from narrow to desktop. The original red result remains in the [prior independent report](https://github.com/radz2291/VICT-Tori/blob/2248eeb7e244f48be2df7256837b08dff7cd9ce7/docs/evidence/v1c-run-visibility/tori-013-windows-3c983fd/REPORT.md). TORI-012 diagnosed the media-query and rendered-layout race and supplied a controlled reproduction and targeted fixed-candidate run. [Builder report](https://github.com/radz2291/VICT-Tori/blob/9cbe6ba7ef2c3dd23cd21379f8abb3ba7c6babf4/docs/evidence/v1c-run-visibility/tori-012-details-repair/REPORT.md).

## Results

**PASS — full fresh Windows qualification of the delivered Run Visibility scope.** All 11 driver steps exited 0 in 21.3 minutes. The unit suite passed 233/233, including all 16 recovery cells. The production build and all seven inherited browser steps passed (A1–A4, V1b, Memory, Authoring, Directive, Assembly and Background). The Run Visibility browser and installed consumer also passed. [Driver results](results.json) · [TAP](unit.log) · [Recovery cases](recovery-cases.log)

- Both replay arrival orders passed the built-in regression and the independently rerun snapshot-round-trip challenge. The reports matched exactly. Each showed PUBLIC_EVENT_CONFLICT, withheld both disputed outcomes, preserved the accepted result and Finished state, and reported zero gaps. [Replay log](independent-replay.log)
- The repaired desktop → 390px → desktop flow completed all 13 browser assertions, including keyboard disclosure and persisted local preference. The historical Run exposed its missing sequence and correlation evidence in Working while keeping the problem region and danger styling absent. Serialized Run records matched before and after the views, no execution or mutation requests were recorded, and no page errors occurred. [Browser assertions](visibility/browser.json) · [Historical diagnostic](visibility/historical-diagnostic.png)
- The supplemental actual-receipt browser passed against deterministic provider fixtures using the governed runtime. The parent report matched its accepted Session answer. The specialist revision and Run links resolved, and the four fixture provider calls and nine specialist events were unchanged by inspection. [Receipt browser assertions](receipt-browser/browser.json)
- A fresh offline consumer installed the packed tori-run-visibility-0.1.0.tgz with the pinned public contracts and imported node_modules/@tori/run-visibility/index.mjs. It returned tori.run-report@1 with zero dispatches. Artifact SHA-256 42bb9e6c87226caa385d39b45d005b1b1371d73caaa8912987afa42991ec8bf1. [Consumer proof](consumer.log)
- The fresh install added 413 packages. It logged the inherited posthog-node engine warning under the required Node version and npm's esbuild allowScripts notice. The requested install, build and tested browser flows completed. The checkout remained clean and the lock stayed pinned. [Install log](npm-ci.log) · [Installed versions](installed-versions.json)

## Acceptance coverage

| Criterion | Exact-candidate finding |
| --- | --- |
| RV-01 | Package, lock, replay and fixture pins matched. The existing public-runtime probes document the exchange boundary. |
| RV-02 | Quiet, Summary and Full display, local preference and read-only saved Run behavior passed. |
| RV-03 | Replay conflict, duplicate and gap handling, authoritative state and separate continued work passed the deterministic and browser checks. |
| RV-04 | Specialist report, exact saved revision, task/result, links and historical diagnostic passed for the delivered subset. Authored expected-result metadata, distinct terminal reason and exchange clauses remain open. |
| RV-05 | Inherited authoring, activation and policy checks passed. Exchange policy authoring and enforcement remain upstream-blocked for this candidate. |
| RV-06 | Upstream-blocked for this candidate. Same-occurrence live child question/parent answer continuation was outside this qualification. |
| RV-07 | Inherited parent/child cancellation and recovery checks passed. Exchange-specific cancellation, races and zero-effect checks remain upstream-blocked for this candidate. |
| RV-08 | Supported receipt-based budgets and display of unavailable usage versus an unconfigured team cap passed. Exchange consumption remains upstream-blocked for this candidate. |
| RV-09 | Strict capture, privacy, pure replay and unchanged Run receipts/zero-dispatch checks passed. |
| RV-10 | Installed VICT controls, quiet desktop and narrow views, keyboard disclosure and the existing classification inventory cover the delivered display scope. |
| RV-11 | All 11 Windows qualification steps passed on the exact candidate. |
| RV-12 | Fresh offline installed consumer and independent exact-candidate verification passed. |
| RV-13 | Engineering evidence is available for consolidated review. Radzi's walkthrough and acceptance are pending. |

Authoring expected-result metadata and a distinct terminal reason remain tracked under RV-04. RV-06 and the exchange-dependent portions of RV-04, RV-05, RV-07 and RV-08 remain upstream-blocked for this TORI candidate. Phase 0 and VICT qualification are separate evidence. This run used deterministic providers and synthetic fixtures in isolated stores. RV-13's cumulative owner walkthrough and acceptance remain with Radzi. [Pinned Run Visibility scope](https://github.com/radz2291/VICT-Tori/blob/f302de96b96ede5eb158f4ce779801e955a8f69f/docs/implementation/RUN-VISIBILITY.md).

Signed 15 November 2026 by codex-independent-windows-tori013-f302de9.

