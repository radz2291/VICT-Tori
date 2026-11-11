# TORI-005 Agent execution budgets

Radzi asked to remove the four step lock and let the Agent node define its execution settings. This repair starts from `92752da96ec290049629bf9f61cb2fe60dcb5850` on `codex/tori-authoring-foundation`. Product candidate: `6910888f529d95a426c50a9196cb53381d1e605e`. [Open Studio](http://127.0.0.1:48797/)

In **Agents → Canvas**, expand **Execution** inside the Agent node. For example, enter **7** model steps and **5** tool calls, then **Save** and **Activate**. Select the new revision in the Authoring Agent dock. Configure → Advanced shows the same draft values. The dock shows the selected activation's budget before Send, so selecting the previous activation still shows its original limits. **Inspect authoring Run → Execution** shows the recorded limits, model steps and admitted tool calls.

## Fixed value audit

| Setting | Ownership and result |
| --- | --- |
| Model steps | The Agent node chooses any whole number from 1 to 64. The four step maximum and the separate authoring minimums were TORI restrictions and are gone. The installed VICT bounded profile supplies the 64 step ceiling. |
| Tool calls | The Agent node chooses 0 to 64. Leaving this blank preserves the previous default for the connected capability (workspace authoring: 3; instruction authoring: 2; tool or child: 1; no binding: 0). Zero suppresses the provider's tool catalog; VICT still refuses any attempted call at zero. |
| Model retries | The Agent node chooses 0 to 8 within the installed VICT generation contract. The retry budget applies to model requests; protected actions still use the existing receipts and reconciliation. |
| Output tokens, temperature and top-p | Already editable on the Model settings, including the Agent's inline Model projection. The output limit can also be bound to a separate Integer node. Provider and route validation still apply. |
| Timeout, grants, test and child fences | The host still owns the 90 second deadline and authorizes each turn and capability. The per-turn budget does not increase scope or permit more than the existing one test and one delegated child operation. A shorter node-requested timeout could be added under the host ceiling if needed. |
| Context and memory | The 512 byte on-demand context allowance is a candidate for a versioned Context Source policy under a host maximum. The Memory Policy node already selects 10 or 100 recent messages; a custom window belongs in a new versioned memory policy rather than silently changing an existing preset. |

The public authoring package and Studio share the bounded numeric ranges. The package preserves the existing accepted patch inputs and supports the additional numeric settings under the same scoped draft operation. Older graph catalogs open without rewriting their stored values, and the execution settings of saved activations continue to resolve to the same profile identity. [Stage requirements](../../implementation/AUTHORING-FOUNDATION.md#agent-execution-settings)

## Browser and runtime evidence

The deterministic authoring browser uses an isolated workspace, the public VICT/Mastra stack and the existing registered synthetic scripts. It creates r1, edits the canvas, checks Configure parity, saves, activates and reopens r2. It compares the same inspection sequence under both activations, then edits and activates r3 at the narrow breakpoint.

| Activation | Model steps / tool calls / retries | Observed | Fixture Run |
| --- | --- | --- | --- |
| r1 | 4 / 3 / 0 | Four model steps; three inspections admitted and the next call refused. Zero draft receipts. | `8bee3f42-a314-4eeb-b2de-657405694576` |
| r2 | 7 / 5 / 2 | Six model steps and five inspections, then a final reply. Zero draft receipts. | `dcc8d1cb-f21b-4274-8e99-3822b7251e4f` |
| r3 | 1 / 0 / 2 | One model step; the provider request included no tools or tool choice. Zero actions. | `b7ca9149-286a-4936-9491-8817c8d283d6` |

- [Desktop Canvas settings](execution-node-desktop.png) and [selected activation in the dock](execution-dock-desktop.png)
- [Narrow Canvas settings](execution-node-narrow.png) and [zero tool budget in the drawer](execution-dock-narrow.png)

The node and Configure use the installed public `@victframework/ui-ai-svelte@0.4.0-rc.1` number Input. Canvas continues to use `@victframework/ui-flow-svelte@0.4.0-rc.1` with the public VICT Button for the disclosure. The dock uses public `@victframework/ui-svelte@0.4.0-rc.1` Select, Button and Feedback, and the existing public Dialog on narrow screens. The budget line and observed counts are read-only text. [Existing Studio control inventory](UI-AUDIT.md)

`npm test` passed 13/13, including legacy graph upgrade, out of range activation refusal and two retries yielding three provider attempts. `node tests/authoring-browser.mjs`, `node tests/v1b-browser.mjs`, and `node tests/a1-browser.mjs` with A2–A4 enabled passed. `npm run build` passed with the existing chunk size warning. The standalone consumer installed a new packed `@tori-studio/authoring@0.1.0` tarball (SHA-256 `43892969d735662d9220f3c2c0968c872bf6876d5416e2d49fe1e671f234a952`) and demonstrated the execution settings patch, an invalid upper value refusal and the same permission and single-commit receipt.

Node 22.13.1, npm 11.19.1, Playwright 1.63.0, Chromium 153.0.8010.12, VICT 0.4.0-rc.1 and Mastra Core 1.64.0. Lockfile Git blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310`; fixture provider blob `69509df48a74063d995f281c9a463651633fe5ec`. An early upgrade test fixture omitted removal of the new catalog field and a second probe compared VICT's passive JSON object prototypes directly; both test fixtures were corrected and the full suite passed. The earlier live build, review, and registered script evidence remains attributed to its original product. [Historical walkthrough](README.md)

## Live check and review workspace

In an isolated workspace, the permitted Z.AI Coding route ran GLM-5.3 Flash with the 7 step and 5 call activation `v1_3dbbc81c06b433576ca092a7cb0c6c0040bdca68459a2abb2e51b31b34e2e543`. Run `74ed7a78-fbb3-461f-8a37-82a1f773c3bf` for revision `9ab089e6-e47a-48a6-9668-7439351266b9` used two model steps and one read-only inspection of synthetic context sources, received HTTP 200, and completed with zero edits. This is a live budget pin and completion check; the six step sequence above is deterministic. A first isolated browser host did not start while local storage was full. The later isolated runtime probe completed after reclaiming generated artifacts.

The existing review server picked up the candidate without replacing the saved workspace. A read-only Chromium check at 1531 × 668 opened the existing r1 in the dock and the three numeric controls on Canvas, and verified the same workspace, activations, three definitions, three Sessions and nine Runs afterward. The operator can save and activate a new revision when ready.

The budget and observed call display covers direct and authoring Runs. A delegated child executes under its own saved Agent node policy, but its Run Details still lacks the pinned budget row and admitted tool call count. This inherited telemetry gap belongs to the child execution follow-up.

## Independent challenge

Verifier `/root/authoring_verifier` challenged executable bytes at `6910888f529d95a426c50a9196cb53381d1e605e` against the pinned public packages. The initial clean install failed with `ENOSPC`; the verifier first used an independent prior installation with the identical lockfile and verified all 16 pinned archives. A fresh detached `npm ci` subsequently passed after reclaiming disposable generated files.

- An activation saved on the previous product restored and stopped at its original 4 steps and 3 admitted inspections after the higher budget activation was saved. Run `6f996cf2-1bf9-4b72-b679-dfbc524c5a2e`.
- The 7 step, 5 call, 2 retry activation completed six model steps and five inspections. Run `59df40cd-ad2d-4d9c-9849-b64cebd48d2c`. An explicitly activated one step budget returned `TORI_MODEL_STEP_LIMIT` after one request and one inspection. Run `4eab92f5-54f4-4e69-ac53-83638af3ef07`.
- A zero call budget exposed no tools and denied an unsolicited invocation before any action. Run `93785a0b-4fb9-4d41-a0e9-8bcd4758c7d9`. Two 429 responses during the final model reply produced four total provider attempts but only one script spawn and receipt. Run `9cf387d1-32b6-46b8-b482-8222305e8de6`.

The independent packed consumer also passed its governed budget edit and single receipt checks. Its tarball SHA-256 was `1096703fed92d7646a3d91bd2438c9bf38209f2e9bfd0c833f30a96d503e0684`. The two installed `index.mjs` files matched byte for byte; the package manifests differed only in checkout line endings.

The clean detached `npm ci --no-audit --no-fund` installed 413 packages. Chromium 153.0.8010.12 exercised Configure → Canvas → Configure at 1531 × 668 and 390 × 844. The public Inputs shared values in both directions. Save and Activate pinned 7/5/2 to revision `191f994d-2f4e-437a-98bd-f0ba94befde5` and 1/0/2 to revision `6b0f476c-61b3-4ba0-9753-1120857ed252`. Selecting each activation through the public dock Select displayed its own budget and created zero Runs.

**Independent verdict: PASS for the execution budget repair.** The delegated child telemetry gap is nonblocking. Runtime and browser checks used labelled fixtures. This evidence commit changes only documentation and synthetic captures relative to the tested product.
