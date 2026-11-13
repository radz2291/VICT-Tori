# TORI-006 independent Studio typography verification

**PASS for the focused typography change on `15806e7d7377283650715067163ecb75dce3a4ef`.** Codex TORI-006 Typography Verifier, 13 November 2026. Radzi owns the Review decision.

## Candidate and environment

- `radz2291/VICT-Tori`, `codex/tori-v1c-memory-foundation`. The clean detached candidate tree was `537997f315c3e2fdae52ce2405b343c048764be8`, with immediate parent `0ffe5bda38dfc119f46a2aedc48ee4f3263f92d8`. The diff from the card-polish evidence baseline `9fcaa7b2ad3e5549e5e5ec41ad45b87220881eaf` contains Studio CSS and memory browser assertions.
- Windows, Node 22.13.1, npm 11.19.1, Svelte 5.57.0, Vite 6.4.3, Chromium 153.0.8010.12 and Playwright Core 1.63.0. Fresh install used lock blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310`. All 16 installed public VICT package versions were 0.4.0-rc.1 and their lock integrities and available archive SHA-256 values matched the [dependency pins](../authoring-foundation/dependencies.json).
- The focused probe used `127.0.0.1:48839` and a disposable SQLite workspace with a synthetic provider. It reused memory fixture blob `10f76d5666dbef5431dfe5f90d19969805a65e88` and added a direct Markdown reply in an ignored verifier fixture. The candidate's stock memory browser driver is blob `a8c71ea4c88433304bac0d79bd5f8af2741d4b25`.

## Rendered styles

Computed styles matched at 1531 × 850 desktop and 390 × 844 emulated touch unless listed otherwise. The Studio stack was `Inter, "Segoe UI", system-ui, sans-serif`. Chromium reported Segoe UI glyphs for ordinary prose and Consolas for the inline code inside those same paragraphs.

| Surface | Observation |
| --- | --- |
| Sessions, Runs and Authoring conversation | User text, assistant paragraphs, lists, quotes, links and table cells all used the Studio stack at 13 px with 19.5 px line height. Table headers kept weight 700 and the sampled Markdown heading kept weight 600 at 16.25 px. Sessions and Authoring composers used 13 px with 19.5 px line height. The Sessions and Authoring feeds each reported 0 px horizontal overflow at both sizes. |
| Memory proposal, saved card and both editors | The exact pending and saved values, inline proposal editor and saved-revision dialog editor used the same 13 px and 19.5 px reading style. Card headings were 13 px with 16.25 px line height and weight 650, and body text used weight 400. The card source and guidance captions were 11 px with 15.4 px line height. The Saved badge was 11 px with 16.5 px line height. The public correction dialog used its own heading and description hierarchy. |
| Saved memory list and Run admission | The exact memory value in each inspector used 13 px with 19.5 px line height. Session revision metadata was smaller at 10.2 px desktop and 11.05 px narrow. Run audit identifiers stayed monospace at 11 px. The desktop and narrow saves produced r1 receipts on fixture Runs `adb46d57-1fdd-4e74-8a1d-e406ab950aa1` and `f06246d8-dbb0-4046-b360-bdeb50998b91`. |
| Code | Inline code stayed monospace at 11.7 px, and syntax-highlighted fenced code stayed monospace at 11.375 px, in Sessions, Runs and the Authoring dock and drawer. |

## Public controls in the walkthrough

The rendered Workflows and Creative stubs used disabled public Button controls. The Configure and projected Memory Policy node pickers both showed Governed Memory through public Select. Sessions used the public MessageScroller, Patterns.Message and Patterns.PromptInput. The pending and saved cards used public Button, StatusBadge and Label with the public AI Textarea. Pressing Enter on Correct focused the associated editor, confirming showed the Saved badge and exact text, and Escape from the public correction Dialog returned focus to Correct memory. The Authoring dock and drawer used the public Conversation and PromptInput, with public Select for activation and turn permission. Runs used the public Conversation with read-only memory evidence. See the [existing control inventory and state evidence](UI-AUDIT.md).

## Commands and retained evidence

- `npm ci --no-audit --no-fund` exited 0 in the clean verifier checkout. Installation reported the existing Node engine and npm install-script advisories. The lockfile and package inputs were identical between the immediate parent and the tested candidate.
- `git diff --check 9fcaa7b2ad3e5549e5e5ec41ad45b87220881eaf HEAD` exited 0. `npm.cmd run build` exited 0 on the exact candidate with Vite's bundle-size advisory.
- `node .local/typography-independent.mjs` exited 0 with the Playwright Core module above, `TORI_MEMORY_PORT=48839` and `TORI_MEMORY_EVIDENCE=.local/typography-15806e7-ui-selected`. The verifier checkout retains the measured styles and screenshots. SHA-256 values are `8e297718618fb0c0f58c691835af3d787f309b9a3daa17811730fdc6afb88b35` for the probe, `055e6d0f0fe1a8b9aefabdc4189726d7f2fc475e73930e44b454a229793534cb` for the synthetic Markdown fixture and `0f82cd06b63aef0769d3839199133b2c2ae04c815af906c531a1503f58aa3a22` for the observations.
- The first probe stopped during second-agent setup. The revised probe used the File menu's **New agent** action. The next probe stopped in Runs because **Inspect runs** opened the earlier proposal turn. The final probe selected the exact Markdown Run from the history list. Both earlier logs, observations and captures are retained in the verifier checkout. The product tree was the same for all three probes.

This verdict covers the synthetic Studio browser typography and production build. It uses an emulated touch viewport and direct Markdown responses in Authoring. Live model behavior, the Authoring tool workflow, native browser zoom and physical-device rendering have separate evidence requirements.
