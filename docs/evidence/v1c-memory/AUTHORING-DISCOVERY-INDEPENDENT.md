# TORI-006 independent Authoring discovery verification

**PASS for the Authoring discovery repair at `d49bedf362d3521bcbf714bc6be7a04b34289bb7`.** Codex TORI-006 Authoring Discovery Verifier, 13 November 2026. Radzi owns the Review decision.

## Candidate and environment

- Repository `radz2291/VICT-Tori`, branch `codex/tori-v1c-memory-foundation`. The clean detached product tree was `ecb81c26521caa48f7435a6ecf43bc3426579c23` and the immediate parent was `e4fdcc8986633c9e141cb8f80cbb5c73c2a3e4ee`. The product diff contains the server projection and its regression test.
- Windows, Node 22.13.1, npm 11.19.1, Vite 6.4.3, Svelte 5.57.0, Mastra Core 1.64.0, Chromium 153.0.8010.12 and Playwright Core 1.63.0. The existing separate verifier checkout had been installed from lock blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310`. All 16 installed public VICT versions were 0.4.0-rc.1. Their lock integrities and the available archive SHA-256 values matched the [package pins](../authoring-foundation/dependencies.json).
- The stock Authoring browser driver was blob `a856950940dcd45441e47257d9dc67835efdca47` with provider fixture blob `43cf439daf6e97e08b8e210180986506f9e6f692`. The installed-boundary regression is blob `05ef23a97a6a4fcce41d1689acbddd29a7d6f26c`. The public workspace catalog blob `99906f2f4141d21cbd9cb2a44b31d79be9c9d5ee` and registered-tools blob `3836993256b0f0904e2a8c0fe8f716116e61097d` were identical on both revisions.

## Contract and authority challenge

The parent returned internal graph properties in its strict `workspace@1` inspection result. On a graph with Governed Memory wired, both `savedMemory` and `organizer` reached the validator. An empty, incomplete named graph still supplied `organizer: 'off'`. Each caused the result parser to return `Invalid workspace action data.` The verifier exercised the same resolver, host capability and public result parser on both revisions.

| Inspection | Immediate parent | Candidate |
| --- | --- | --- |
| Open draft only | Contract rejected | Observed with the exact draft ID, occurrence, graph revision, readiness and nullable saved revision |
| Open draft and a different named definition | Contract rejected | Observed with both independent identities and the latest named revision |
| Named definition, no open draft | Contract rejected | Observed with the named revision and the expected session-history setting |
| Incomplete named definition, no open draft | Contract rejected | Observed with the saved revision and the fields resolved from that graph |
| Unknown named definition, no open draft | Not found | Not found |
| No open draft and no requested definition | Observed | Observed with the resource and definition catalogs |
| Open draft with change permission | Contract rejected | Observed with the authorized action list |

The candidate matched every defined value among the 15 existing workspace fields, including zero-valued numeric fields, the two distinct Session-history bindings, and the latest saved revision when an earlier one was also present. The read capability retains `tori.workspace.inspect.invoke` and records its audit receipt. Each inspection left the stored workspace snapshot byte-equivalent. In Review only, the provider fixture confirmed that it received just the inspection tool. The VICT gate still checks the actor and turn and withholds write grants in Review only. The projection leaves the memory settings available to the host through the assembly resolver.

## Studio browser

The stock browser walkthrough passed on `127.0.0.1:48843` in a new disposable workspace with the deterministic Coding provider. It exercised desktop and 390 × 844 narrow layouts. Build Run `6653d8bc-fe86-4cea-adc9-08a3502662ba` recorded completed inspection, assembly and test tools. Review Run `d93b5f0a-a6c6-4512-8d32-9fde2cb8e33f` recorded one completed inspection citing test Run `26333411-2e3a-4f17-93d1-1cfbbdda070d`. The graph, saved revision and activation were equal before and after Review only.

The test pinned Quellight revision `e181bd29-a785-4f87-a0fa-13179c356c13`. The linked Research Run `3c7cba4f-7007-480c-a1d0-d5820b326deb` used revision `830fb195-f11c-4aea-846e-c40096f85af1` and invoked `tori.script.research-topics` once. Edit Run `1285b3db-4670-44de-9236-e2b2564678e8` applied the requested draft change. The second tool test Run `1dd8372d-8232-4fc5-aae2-de620bb21c66` used revision `4d79e60a-f304-4d32-ba8a-7a2ea82a9e13` and invoked `tori.script.reading-list` once. The same walkthrough passed the expected denied script and draft, stale edit, lost acknowledgement, Stop/continuation and budget controls.

The tested Authoring activation dialog and turn permission use public VICT Dialog and Select. The dock and narrow drawer use public Conversation, PromptInput and Feedback, with public Button for Run links. The Settings and projected node fields use the public Select, Input and Textarea as appropriate. The task navigator renders Workflows and Creative as disabled public Buttons. The captured walkthrough shows the centered activation dialog interaction, permission changes, draft and Run evidence, and narrow composer and node controls. The [Authoring control inventory](../authoring-foundation/UI-AUDIT.md) and [memory control inventory](UI-AUDIT.md) document the installed public roles for the full Studio.

## Reproduction and evidence

- `git diff --check HEAD^ HEAD` passed. `node --test tests/workspace-discovery.test.mjs tests/authoring-continuity.test.mjs` passed 2/2. `npm.cmd test` passed 195/195. `npm.cmd run build` passed with Vite's bundle-size advisory.
- `node tests/authoring-browser.mjs` exited 0 with `TORI_AUTHORING_PORT=48843` and the installed Playwright Core module. The verifier checkout retains the browser log, observations and captures under `.local/authoring-discovery-stock-d49bedf` and its sibling log. The observations SHA-256 is `868196aa95b631628e34f8024222a93114f81505db381b63e14030679f792ba3`. The dev server reported missing source files for several dependency sourcemaps.
- `node .local/authoring-discovery-boundary.mjs` on the candidate and the same command with `--baseline` on the parent both exited 0 with the expected outcomes above. Probe SHA-256 `f3c75f42cd91a8285f280a4e096a2faa850d6c6b5e00a4397a9f7624a24716de`. The first probe stopped because its cloned graph lost null prototypes. Its log is retained. The rerun compared serialized workspace state before and after each inspection, with the same product bytes.

The browser verdict covers the deterministic Authoring workflow and its existing UI. The named and no-open cases were verified at the host capability boundary. The stage owner has separate evidence for the real Coding provider.
