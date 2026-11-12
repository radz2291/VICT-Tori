# TORI-006 independent recheck of 53228b5

**Verdict FAIL for the 100-message history criterion.** Signed off by **Codex TORI-006 Independent Verifier** on 12 November 2026. The shorter deterministic and Studio walkthroughs passed. Stage manager holds the separate live-model evidence.

## Candidate and pins

- `radz2291/VICT-Tori`, detached candidate `53228b5a9a11668bba544a2958954182fab5babc`, accepted contract `8854562dda920f583e6cc1d80de51f6add6d7ba9`. Original independent challenge `89cf463fc252df26e498cff052e0ca820ee27a34`.
- Independently installed public VICT archives `0.4.0-rc.1`, Mastra core `1.64.0`, memory `1.28.2`, LibSQL `1.22.3`. Node `22.13.1`, npm `11.19.1`, Vite `6.4.3`, Svelte `5.57.0`, Playwright Core `1.63.0`, Chromium `153.0.8010.12`. Lock blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310` is unchanged from the fresh, integrity-checked install. Provider fixture blob `b2d37c6ae8a9e2b45fbb7099e31a1fa41b325f26`, browser driver `27e10cb499d7d9517ad8b12c47baa40490dfe439`. Synthetic data, ports `48843`/`48844`, desktop 1531 × 850 and narrow 390 × 844.

## Failed history boundary

In the independent history probe, the 10-message activation supplied five previous user messages during ordinary chat and the contextual draft received all 19 authorized messages, including the earlier source. With the 100-message activation the Session completed 20 exchanges. The next ordinary turn failed with `VICT_AGENT_TURN_PERSISTENCE_UNCONFIRMED` despite a captured deterministic HTTP 200. Run `a327732b-9f3f-432f-8561-73b9e597c88a`, Session `37b48821-b1cc-40b9-873e-a8f16971c919`.

The installed public memory store returned 40 messages out of 42 total when called with no page size. `perPage:false` returned all 42 and `perPage:7,page:1` returned seven. The VICT adapter's quiescence, baseline and durability checks use the returned array length with no page size (`@victframework/mastra/dist/adapter.js` lines 421, 453 and 482). LibSQL's default is 40 (`@mastra/libsql/dist/index.js`, `listMessages`). At 40 the adapter cannot observe the required increase. The accepted TORI-005 baseline used this same public adapter and store composition with the same lockfile.

## Other verified results

- The exact standard suite passed 18/18 with serialized Vite usage. The production build succeeded. The independently packed and installed `@tori-studio/memory@0.1.0` consumer saved, replayed the original receipt, isolated another agent and forgot. Consumer tarball SHA-1 `be06742bcc46d3179143a9451e29ec1796ec67bd`, with the five required public VICT archives pinned in its separate install.
- All nine original and follow-up non-request utterances produced zero proposals and records. The contended confirmation returned 503 with zero operations, then returned 403 after the trusted fixture actor was disabled. Stop closed the exact pending proposal, including with its completed turn response held in the real narrow browser. Browser Run `e85f6e14-afc6-4008-8dbc-4fc0b07029d0`.
- Source Session deletion preserved the saved record and references. With active r2 removed, the Run and list reported `storage-unavailable` and admitted zero. Forget erased the remaining revision bytes and retained content-free tombstones in the old admission and original save Run. Memory `a9679c9e-c2a0-4c93-b2fc-ffcd3113fba7`.
- Browser saved `901ff5bb-2984-4099-a490-a99fbe974693` r1, recalled three bullets after restart, then two after correction, and zero admissions after Forget and restart. Both the panel and the Run showed two budget omissions. The contextual confirmation matched the edited value and retained source references. The public Saved Memory Select restored its canonical value and focus on choosing the empty row. View → Fit showed the same policy node on narrow. Narrow touch confirmation recovered from 1,025-byte validation and Escape returned focus after the correction dialog. The initial report records the installed control inventory.

## Commands

`node --test --test-concurrency=1 --test-timeout=120000 tests/*.test.mjs`, `npm run build`, `node .local/adversarial-53228b5.mjs` and the two deterministic browser commands (`tests/memory-browser.mjs` on `48843` and `.local/independent-ui-53228b5.mjs` on `48844`) exited 0. `node .local/history-53228b5.mjs` exited 1 at the recorded Run. `node .local/history-page-probe.mjs <disposable history directory>` exited 0 with the 40/42/7 measurements. The worktree retained the exact command logs, browser observations, inventory and screenshots in `.local`.

Verifier report commit dc9ef6294ecb4f4f93e4f5f92d3b162c254cd8f4.
