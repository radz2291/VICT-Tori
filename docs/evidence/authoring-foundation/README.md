# TORI-005 Authoring Foundation review

The current preview includes the [transcript styling repair](TRANSCRIPT-REVIEW.md) at `f3894fba7b9d813e1dcd729b8898da104c30a692`.

Original authoring review candidate `4308bbff84e0d46b77126ea7fd946a9661e982f9` on `codex/tori-authoring-foundation`. The isolated [local Studio preview](http://127.0.0.1:48797/) is bound to loopback. Review acceptance belongs to Radzi.

## Walkthrough

1. Open **Agents**, then open the left **Authoring Agent** dock. Select the saved **Authoring Agent · r1** activation. The dock shows the conversation that built the synthetic Quellight and Research composition. In **Assembly**, open **Quellight**, then **Canvas**, to see the typed wire to the pinned Research revision.
2. Keep **Review only** selected. Ask “What did the Quellight test return, and what should Research improve?” The response uses the actual test Run. The Run details link to the parent and child, and the child shows the exact script result and grant.
3. Open **Research** and choose **Allow edits and tests** for one message. Ask for a specific improvement to its instructions. Review the edit in Configure and Canvas. Use **Edit → Undo**, **Redo**, then **Save**. Reopen Research to check the saved revision.
4. The review workspace includes the second **Reading List** binding. Ask the same dock to test the saved Research revision using the planning key. Open **Inspect authoring Run → Details → Open linked Run**. The actual script evidence shows the selected tool ID, revision, grant, permitted entry and result. At 390 × 844 the same permission, input and Send controls appear in the Authoring Agent drawer.

For a fresh assembly walkthrough, use an empty local data directory. Create an agent in ordinary Configure, enter instructions to use Studio's action catalog, select GLM-5.3 Flash, and set four model steps. Add **Draft Authoring**, choose **Workspace authoring · r1**, Save and Activate. Reopen the persisted activation. Leave Quellight and Research absent and ask for a composition with a specialist, **Studio Research Knowledge**, **Research Topics** and a habits test. The browser walkthrough records the exact request and uses the normal controls. [Browser reproduction](../../../tests/authoring-browser.mjs)

## Reproduce the preview

Install the archives described in [V1b integration](../v1b/INTEGRATION.md) into `packs/`, then run `npm ci --no-audit --no-fund`. Use the pinned checkout, Node 22.13.1 and the available Playwright 1.63.0 Chromium build. The [dependency manifest](dependencies.json) records the exact VICT archives, lockfile and synthetic fixture digests.

For a live preview using the previously approved local Coding connection, launch from the repository with a new local directory and a free port.

```powershell
$env:TORI_DATA_DIR = Join-Path $env:TEMP ('tori-005-review-' + [Guid]::NewGuid().ToString('N'))
$env:TORI_ZAI_ROUTE = 'coding'
$env:TORI_ENABLE_PI_ZAI = '1'
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 48797 --strictPort
```

The preview resolves the existing approved Coding credential on the server. Authoring and test Runs are created when the operator sends a message. For a repeatable fixture, run `node tests/authoring-browser.mjs` with `TORI_PLAYWRIGHT_MODULE` set to the installed Playwright module if it is outside this checkout. The fixture uses the real script processes and a deterministic provider. For the live browser walkthrough set `TORI_AUTHORING_LIVE=1` and use an isolated empty workspace with the configured route.

To verify the separate consumer, copy [its manifest and source](consumer/) into a new empty directory. Copy the five indicated VICT archives into its `packs/`, pack `packages/authoring` with `npm pack ./packages/authoring --pack-destination <consumer-packs>` from this checkout, and run `npm install --no-audit --no-fund` and `node consumer.mjs` from the consumer directory. It imports the installed TORI and VICT packages and supplies its own VICT journal.

[Action and ownership map](ACTIONS.md) · [Public control inventory](UI-AUDIT.md) · [Retained failures](FAILURES.md)

## Verification

The live walkthrough used GLM-5.3 Flash on the approved Z.AI Coding route at product `0971471b3a2803c8e47493fa82b6f2974a50b7d9`. The final review commit changes the empty legacy fixture picker label in two Svelte components. The live route uses the same label and execution behavior. The final preview was restarted on the final candidate. Chromium reopened Research r3 with its saved instruction and Reading List binding and showed the same authoring conversation. The Studio projection returned the same completed live Run identities. [Live observations](live-observations.json) · [Independent verification](INDEPENDENT.md)

| Required proof | Observed result |
| --- | --- |
| Ordinary conversation builds and tests the composition | Authoring Run `4153da11-4e5f-43f9-8877-81f90062619e` discovered resources, created two definitions, saved the exact revisions and tested Quellight in Run `0ca3abe6-40d2-4d0a-a0b8-f2486ef774ad`. Research child Run `5cf16e1e-ea82-4969-bef2-92bf0f641d7b` admitted Studio Research Knowledge and ran Research Topics once. Receipt `2174723a-ba17-4a64-822d-451d039fb0f0` returned `TOPIC-104`. |
| Review, apply and history | Review Run `c5b672b5-7a37-4ee8-a6ee-1b1275499104` stayed in the same Authoring Session, cited the test Run and issued inspection only. The browser compared the unchanged Research graph, revision and activation. Edit Run `0726cc52-d3f3-41eb-a29e-a633dfd686cc` applied graph revision 1 → 2. Undo restored the original instructions. Redo, Save and reopen retained the improvement. |
| Second registration | Authoring Run `c9b82121-141f-48b4-88cc-a3207e5e5f97` discovered, bound, saved and tested Reading List through the same catalog. Research Run `d432324e-99f4-4036-9a37-f32a947567db` used saved revision `4d361a17-915e-47bf-ad71-1a1b028f51a4`. Receipt `8d96ead9-1d5f-4176-a336-97ebf47c969d` recorded one process invocation and returned `READING-29`. |
| Scope, Stop and lost acknowledgement | The independent browser refused an out-of-scope draft and a wrong script key, kept a newer manual edit, and stopped before commit. A lost response replayed one creation and one test. A lost post-commit Save acknowledgement advanced Research's saved revision once. The independent parallel read probe recorded one real spawn and one zero-spawn refusal with the pinned limit. |
| Varied request and installed boundary | The independent fixture created an unsaved Weekly Reviewer, then saved the unchanged graph to the exact revision referenced in its receipt. A fresh installed consumer passed public imports, grant denial, replay, changed-operation conflict, stale edit and Stop. |
| Studio and regressions | Build and A1–A4 browser passed at `4308bbf`. The live walkthrough, 12 unit and contract tests, and V1b browser passed at `0971471b`. The independent review exercised 1531 × 850 and 390 × 844, checked the Send bounds after a long conversation and rechecked the public picker at the final commit. |

The live Authoring Agent used activation `v1_9aacfc6556fb4339fe7ea74114d5628d8adf94b829028c8a09e7185febb1bd83` at saved revision `82cfd74a-511d-4ac2-aaf7-a03c78515536`. The pinned authoring, parent, child and second-tool records, public text and result receipts are preserved in the live capture.

### Running UI captures

- [Live authoring conversation](live-desktop-conversation.png)
- [Live Reading List Run](live-desktop-script-run.png)
- [Live narrow Authoring Agent drawer](live-narrow-conversation.png)
- [Independent fixture graph and child wire](fixture-canvas.png)
- [Independent fixture scope denial](fixture-denied.png)

### Commands and scope

| Command | Candidate and result |
| --- | --- |
| `npm ci --no-audit --no-fund` | Passed in fresh independent checkouts at `0971471b` and `4308bbf`. The transitive PostHog package reports an engine advisory under the baseline Node version. |
| `npm run build` | Passed at `4308bbf` with Vite's existing bundle-size advisory. |
| `npm test` and `node tests/v1b-browser.mjs` | 12/12 unit and contract checks and the V1b browser suite passed at `0971471b`. |
| `TORI_BROWSER_A2=1 TORI_BROWSER_A3=1 TORI_BROWSER_A4=1 node tests/a1-browser.mjs` | Passed at `4308bbf`. Nine configured token-limit requests, three refused invalid values, restart isolation and the accepted desktop and narrow Studio interactions. |
| `node tests/authoring-browser.mjs` | Passed in an independent Chromium checkout at `0971471b`. The independent final label recheck passed at `4308bbf`. |
| `TORI_AUTHORING_LIVE=1 node tests/authoring-browser.mjs` | Passed at `0971471b` with the authorized Coding route and synthetic data. Reopening the same saved data at `4308bbf` confirmed the live revision and Run IDs. |
| `node consumer.mjs` | Passed using the fresh packed TORI artifact and the five pinned VICT archives outside the Studio checkout. |
| `python scripts/check_docs.py` | Passed local Markdown, link and identifier checks. |
