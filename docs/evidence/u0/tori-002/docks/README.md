# TORI-002 shared dock rollout

[Preview](http://127.0.0.1:48744/) · [Creative with both desktop docks](creative-desktop.jpg) · [Agent Inspector on phone](agents-phone.jpg)

The Sessions checkpoint was committed and pushed at `e1989010544d51940274d24c7fc752b4fd31e18f` before the rollout. Product candidate `f213392e61d806f931ccc486fffa903d1bb4af40` extends the same availability rules to the five workspaces. See the [Sessions checkpoint](../sessions/README.md) for the policy and the [interim walkthrough](../README.md) for launch instructions.

Agents defaults to a selected agent's Inspector. Workflows and Creative start with the canvas and offer the Library once there are objects, and Inspector once there are details to inspect. Sessions and Runs have no docks while conversation and trace records are unavailable. Activity is withheld in this U0 candidate because there is no meaningful activity to show.

Toolbar icons carry accessible labels, and Window mirrors the same pressed/checked state. On desktop, each dock exposes a width slider. On narrow screens, the chosen panel opens in a dialog, with a separate remembered choice for that viewport mode. The layout is stored in browser storage for this origin. A remembered inspector can restore its last inspected object if that identity still exists after reload. Reset Layout affects the current workspace. Narrow width is governed by the viewport.

| Role | Installed public VICT export and source |
| --- | --- |
| Compact toolbar toggles and Library object actions | `@victframework/ui-svelte/catalog/button` `Button.Root` in `Studio.svelte` with `aria-pressed`. Glyphs use `@victframework/ui-media-svelte` `MediaIcon`. |
| Window check states and Reset Layout | `@victframework/ui-svelte/catalog/menubar` `Menubar` in `StudioMenu.svelte`. Sessions and Runs render the disabled no-panels item. |
| Desktop width adjustment | `@victframework/ui-svelte/catalog/slider` `Slider` in `WorkspaceDock.svelte`. The browser exposes a named slider and value in pixels. |
| Narrow dock and dismissal | `@victframework/ui-svelte/catalog/dialog` `Dialog` in `WorkspaceDock.svelte`. Chrome exercised open, reload, Escape and focus return. |
| Agent editing and page status | Public AI `Input` / `Textarea` and UI `Feedback` in `Studio.svelte`. The existing inline editor still edits the same graph property. |

All listed VICT packages are installed at `0.4.0-rc.1`. No custom primitive or exception was introduced. The rest of the control inventory remains in the [interim walkthrough](../README.md).

Vite production build and documentation integrity passed. Chrome ran `scripts/check-studio-docks.mjs` with the installed Playwright entry, Chrome executable and preview URL. It checked all five pages, both Window and toolbar control paths, remembered desktop widths and visibility, restore of a saved Workflow step, isolation between page sizes, Reset Layout, and phone dialog restoration and focus. The existing Studio browser suite covers authoring and draft regressions.

Independent verifier `/root/verify` reviewed exact product `f213392e61d806f931ccc486fffa903d1bb4af40` through the production preview. The dock suite and full Studio browser regression both passed. The full regression suppressed screenshot writes in memory. The verifier confirmed installed public Slider/Dialog export paths at version `0.4.0-rc.1` and retained public control roles, with no new blocking finding in this rollout. The previously recorded enabled empty-history Undo/Redo caveat remains open in TORI-002. Owner visual review of the rollout remains pending.
