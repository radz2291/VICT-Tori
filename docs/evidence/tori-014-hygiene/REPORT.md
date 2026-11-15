# TORI-014 hygiene verification

Builder qualification of TORI `ab5771cad9795be9287b90994341506afd1df9e0`, based on the reviewed `f302de96b96ede5eb158f4ce779801e955a8f69f`. The fresh independent Windows verdict will cover the integrated candidate after the approved response implementation.

`StudioShell.svelte` owns the app frame and task navigation controls. `Studio.svelte` keeps cross-page state, runtime operations, responsive dialogs and navigation handlers. The three page files own their page bodies. A single execution frame stays mounted across Sessions and Runs, with the original shared toolbar/sidebar lifetime. The extraction uses the existing authored knobs and governed constants.

`@tori/authoring`, `@tori/memory` and `@tori/directive` retain version `0.1.0` and their existing APIs. The root lock Git blob remains `746b69fbefb4a9123029f54ab4ca47a00aaa5310`. The isolated consumers generate separate lockfiles from the reviewed third-party resolutions and the new tarball identities. [VICT dependency and upgrade policy](../../reference/VICT-PINS.md)

## Windows checks

The fresh worktree installed 413 packages with `npm ci --prefer-offline --no-audit --no-fund`. The 16 archive byte counts, SHA-256 digests and SHA-512 lock integrities matched the reviewed candidate. Node `22.13.1`, npm `11.19.1`, Playwright Core `1.63.0` and Chromium `153.0.8010.12` ran on Windows x64. [Verified inputs](qualification/inputs.json)

`node scripts/qualify-run-visibility.mjs` ran the existing 11-step suite serially with `TORI_PLAYWRIGHT_MODULE` pointing at the installed Playwright Core and `TORI_RV_QUALIFICATION` pointing at an isolated evidence directory. All steps exited zero in 18 minutes and 1 second. [Commands and results](qualification/results.json) · [Driver transcript](qualification/driver.log)

| Check | Observed result |
| --- | --- |
| Regression | 233/233, including 16/16 recovery cells and both replay-conflict arrival orders. [TAP](qualification/unit.log) |
| Production build | Existing chunk-size warning. Generated CSS asset `index-DQ7F8t9_.css` matches the reviewed candidate. [Build](qualification/build.log) |
| Inherited browsers | [A1–A4](qualification/a1a4.log), [V1b](qualification/v1b.log), [Memory](qualification/memory.log), [Authoring](qualification/authoring.log), [Directive](qualification/directive.log), [Assembly](qualification/assembly.log), and [Background](qualification/background.log). |
| Run Visibility browser | Desktop to 390 px and back, including the final historical diagnostic, identical serialized Run records, zero execution or mutation requests, and zero page errors. [Browser assertions](qualification/visibility/browser.json) |
| Run Visibility consumer | The packed `@tori/run-visibility` public import returned `tori.run-report@1` and dispatched zero work. [Proof](qualification/consumer.log) |
| Runtime receipts browser | `node tests/run-visibility-receipt-browser.mjs` exercised the governed runtime with deterministic provider fixtures. The report matched the accepted receipt, and inspection preserved four fixture provider calls, nine event rows and all stored receipts. [Assertions](qualification/receipt-browser/browser.json) · [Command log](qualification/receipt-browser.log) |

The pinned install emitted the inherited `posthog-node` engine and npm `esbuild` allow-scripts notices. The build also emitted Node’s experimental SQLite notice. Published transcripts substitute the builder profile path. Original logs are retained in the isolated local evidence directory.

## Packed public consumers

`node scripts/probe-foundation-consumers.mjs` packed the three public exports, seeded separate lockfiles from the reviewed lock, then ran offline `npm ci`, `npm ls --all` and the existing proof for each isolated consumer. The two successful builder runs agreed on the archive and consumer lock hashes. The second run used clean commit `e83396ce608a8a8becf81a1c2ff7d931ef9cc60b`. Only Studio component files changed between it and the fully tested product commit, so the package and proof input bytes are identical. [Hash manifest and observed receipts](consumers/results.json)

| Installed package | SHA-256 | Observed result |
| --- | --- | --- |
| `@tori/authoring` | `c800c40c72ccdc6b619d246948b9496ea65c2692cd72b4c8af5767f0abe73551` | Four workspace references, one journal commit and the original receipt. [Proof](consumers/authoring/proof.log) · [Consumer lock](consumers/authoring/package-lock.json) |
| `@tori/memory` | `8f7d1f683512683018b90ce89f0e0d4e294a300176777c67c25b16cac98deee3` | Saved and replayed the original receipt. Cross-agent admissions were zero. Forget succeeded. [Proof](consumers/memory/proof.log) · [Consumer lock](consumers/memory/package-lock.json) |
| `@tori/directive` | `133c98614563e27cac4aea0a5d32ddb8392dbf37411b1bc86bbe7d2c3f18cb3f` | Restored the pinned activation, checked the policy and recorded one proposal-revision receipt with exact replay. [Proof](consumers/directive/proof.log) · [Consumer lock](consumers/directive/package-lock.json) |

The first scratch consumer install ran without a seed lock and hit `ENOTCACHED` looking up the `zod` registry document. Seeding from the reviewed product lock made the package closure reproducible offline. The first product candidate was superseded when source inspection found that the extracted execution frame would remount on Sessions-to-Runs navigation. The builder stopped its partial unit run, retained the log, preserved the frame lifetime and ran all checks on the replacement. [First install attempt](retained/unseeded-consumer-install.log) · [First product run, stopped during regression](retained/early-candidate-partial-unit.log)
