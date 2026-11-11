# TORI-004 — Agents dock checkpoint

This is the 11 November dock checkpoint. The current live authoring candidate and owner walkthrough are in [the integration report](INTEGRATION.md).

**Scope: partial delivery.** V1b starts from approved V1a `633e34d0a89a8d89a5d4477f6642be2a27f08501` plus the docs-only handoff `ef1cc19cc0a49ff569f2833092a90ac4eea5b597`. Review the Agents dock changes on `codex/tori-v1b`. Live authoring and T07 are blocked by the [installed public boundary](PUBLIC-BOUNDARY.md). The Authoring Agent dock shows the current draft and reports the unavailable state. It has no composer or activation picker until a real authoring turn can run.

## Walkthrough

Use [isolated local Studio](http://127.0.0.1:48782/) if the preview is running. To recreate it in a clean checkout, prepare the pinned public artifacts using the [V1a install instructions](../v1a/README.md), install the lockfile, and run:

```powershell
$env:TORI_DATA_DIR = Join-Path $env:TEMP ('tori-v1b-preview-' + [guid]::NewGuid())
$env:TORI_ENABLE_PI_ZAI = '0'
Remove-Item Env:TORI_ZAI_API_KEY -ErrorAction SilentlyContinue
node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 48782 --strictPort
```

1. Open **Agents**. The left Authoring Agent dock starts closed. Toggle it from the toolbar or Window menu; note the unavailable state and close it.
2. Open **Assembly / Selection** on the right. Under Assembly, expand **Agents** and **Nodes**. Add an agent if the project is empty. Open **Canvas** to expose **Components**. Select an item in Nodes, then use **Selection** to inspect it. Edit instructions and switch between Configure and Canvas to see the same draft. Undo from Edit. Toggle the right dock and return to the prior tab.
3. The deterministic browser fixture below adds a child and exercises the delegation wire, including the pinned revision, scope, task and expected result. On desktop, double-click the wire or focus it and press Enter. Escape from Selection returns focus. On a narrow screen, close the supplementary drawer to return to its opener.
4. At 390 × 844, open each dock in turn. Check Sessions and Runs from the bottom navigator; their history sidebars remain on the right on desktop and use the existing drawer at narrow widths.

For fixture regression evidence, use Chromium and an installed Playwright module. Set `TORI_PLAYWRIGHT_MODULE` to its absolute module directory if it is installed outside this worktree:

```powershell
npm test
npm run build
$env:TORI_BROWSER_A2='1'
$env:TORI_BROWSER_A3='1'
$env:TORI_BROWSER_A4='1'
node tests/a1-browser.mjs
```

The browser test starts an isolated server with the tracked synthetic provider intercept and a temporary data directory. It does not launch a live authoring profile. The [public package map](PUBLIC-BOUNDARY.md) covers the runtime dependency decision.

## Installed control roles

All named VICT UI exports below are from `0.4.0-rc.1`. The installed runtime and package pins are unchanged from V1a.

| Presented surface | Actual controls / installed public exports |
| --- | --- |
| Shell, including Workflows and Creative navigation stubs | `@victframework/ui-svelte/primitives` Menubar and Button; `@victframework/ui-svelte` Feedback. Workflows and Creative are disabled task buttons, with no additional presented controls. |
| Agents docks | Same Button roles for toggles, agent list and actions; `/catalog/tabs` Tabs for Assembly / Selection; `/catalog/accordion` Accordion for Agents, Components and Nodes; `@victframework/ui-ai-svelte` Input for search; Tooltip for node visibility; Dialog for one supplementary mobile drawer; Feedback and StatusBadge for current availability and delegation state. |
| Agents Configure, Canvas and node interiors | `@victframework/ui-svelte` Button, Select, Feedback and StatusBadge; AI Input and Textarea; public Accordion and DropdownMenu; `@victframework/ui-flow-svelte` SvelteFlow, Handle, NodeResizeControl and EdgeReconnectAnchor. Selection reuses Configure fields and the same edit journal. |
| Sessions | AI Conversation and Patterns.PromptInput, Input, Badge; VICT Toggle, Button, Accordion, DropdownMenu, Dialog, StatusBadge and Feedback for history, controls and status. |
| Runs | VICT Button, Accordion, DropdownMenu, Dialog, Input, StatusBadge and Feedback; outcome, recorded turn and timeline are read-only projections. |

The existing [splitter exception record](../../governance/UI-EXCEPTIONS.md#v1a-pending-capability-gap) still applies; this candidate retains the Standard/Wide controls as specified for V1b. The installed `@victframework/ui-editor` also exports `PanelResizer`; its fit for the shared shell, responsive sidebars and persisted widths remains to be verified. No new primitive is proposed. The walkthrough and fixture captures are scoped checks. Device touch, increased browser zoom and all visual/accessibility criteria remain unverified here.

## Builder evidence

Product candidate: `e73290100da9fd89728f134617c05b4dce79400c` on `codex/tori-v1b`. Windows, Node 22.13.1, npm 11.19.1, installed pinned packages in [the map](PUBLIC-BOUNDARY.md). Fixture files, server, manifest and lockfile are unchanged from approved V1a. The fixture install and a fresh temporary database were used for each browser run.

- `npm ci --no-audit --no-fund`: passed; existing Node engine advisory for the transitive PostHog package and npm install-script advisory.
- `npm test`: 12/12 at `b303153b340581af99ed23683865a17015477b73`, including saved Research direct/delegated execution and zero-call denial. The independent 12/12 rerun was on `61a9122`. Subsequent changes are camera initialization and empty-state presentation; the unit-test inputs are unchanged.
- `npm run build`: passed at candidate, with the Vite chunk-size advisory.
- `TORI_BROWSER_A2=1 TORI_BROWSER_A3=1 TORI_BROWSER_A4=1` with `node tests/a1-browser.mjs`: passed at test-only commit `1e92abb9242231ab0e0c0fad4bc95d0e381573af` over candidate `e732901`. Product bytes are identical. The last run verifies that all four VICT empty states render. Playwright 1.63.0 / Chromium at 1531 × 668 and 390 × 844. Fixture requests: `4096, 2048, 4096, 2048, 4096, 4096, 4096, 4096, 4096`; three invalid activations refused. Also checks the shared Selection/Configure/Canvas draft and Undo, keyboard delegation focus return, narrow Authoring and Selection drawers, the same unsaved name in Assembly and Canvas, camera continuity on Configure → Canvas, and narrow Window check state for Sessions and Runs.
- Retained failures: the first browser run exposed a Nodes disclosure accessible name polluted by a visual chevron; a stable accessible name fixed it. The second reached A3 and found two agent names in the consolidated dock; the test now scopes node actions to the Nodes section. The independent source challenge found a checked Window item for a closed narrow Sessions/Runs drawer; the menu now shares the toolbar's drawer predicate and the affected states have a browser assertion. The first Assembly capture also exposed the saved name beside the renamed draft; the current definition row now uses the draft name and remains marked unsaved.

Captured during that browser run: [Assembly desktop](v1b-assembly-desktop.png), [Selection desktop](v1b-selection-desktop.png), [Selection narrow](v1b-selection-phone.png), [Authoring unavailable narrow](v1b-authoring-phone.png). All captures use synthetic fixtures.

See the [independent findings and exact rechecks](INDEPENDENT.md). The independent full fixture run is attributed to its named SHA; affected claims were rechecked after repairs.

## Ticket criteria

| Ticket check | Result |
| --- | --- |
| Browser-built and reopened live Authoring Agent | Not demonstrated. No activation capability for open draft authoring. |
| Governed edit, observation and correlated live receipt | Blocked on the installed public proposal/acknowledgement boundary. |
| Undo/Redo and persistence plus AI conflict, cancellation and retry | Manual paths pass the fixture scope; the AI paths are not demonstrated. |
| Clean independent consumer | Not demonstrated. The draft authoring boundary must exist first. |
| Dock layout and A1–A4 regressions | Desktop and narrow dock checks are covered by the deterministic browser fixture. V1a runtime evidence remains attributed to its original candidates. |
| Final T07 verdict and runnable authoring walkthrough | Blocked. This is a partial Studio walkthrough. |

