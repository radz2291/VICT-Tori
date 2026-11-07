# TORI-002 responsive refinement

[Open the local candidate](http://127.0.0.1:48744/). The reviewed baseline was `c9b7f8812ad6ecdffb449bba460e4a7008697359`. This candidate is `7f8b4513142b1a630a197b7e523c188b2ea465f5` on `codex/tori-002-studio-realignment`, served as `index-2swkAPig.js` and `index-DyaAl6WJ.css`. The owner held final visual acceptance and requested this bounded refinement. The [Studio Design Constitution](../../../../specs/STUDIO-DESIGN-CONSTITUTION.md) and [UI/UX Verification](../../../../specs/UI-UX-VERIFICATION.md) govern the result. The [previous engineering candidate](../final/README.md) retains its original evidence and attribution.

| Same saved fixture after reload | 1280 × 800 desktop | 390 × 844 phone | Phone canvas |
| --- | --- | --- | --- |
| Agents · Research assistant | [Desktop](agents-desktop.jpg) | [Phone](agents-phone.jpg) | 754 px, starting at y=45 |
| Workflows · Request and Run agent | [Desktop](workflows-desktop.jpg) | [Phone](workflows-phone.jpg) | 701 px, starting at y=98 |
| Creative · authored Metallic notes and directions | [Desktop](creative-desktop.jpg) | [Phone](creative-phone.jpg) | 701 px, starting at y=98 |

The screenshot pairs use the same saved node IDs. The check saved and reopened each draft, captured the desktop view, deliberately panned it right by more than 350px, then narrowed that live viewport. Each phone screenshot was captured after automatic recovery brought a complete readable card into the canvas. Agents previously allocated 50dvh to its narrow canvas, or 422px at this viewport. The phone header and bottom navigator now bound the available workspace. The Workflow and Creative task rows take 53px above the canvas.

1. Open a saved authoring page on desktop. Pan away from the objects, then narrow the window to 390px. The page brings a readable object back when no readable card is visible. A readable camera position is retained. Tap **Fit** for the whole graph, or use **Menu → View → Reveal selected object** after selecting an object in Library.
2. On phone, tap **Menu** to reach File, Edit, View, Insert, Run, Window and Help. Save through File, and test keyboard access through the same menu. Panel buttons remain in the header where the panels have useful content. [Open command menu](phone-command-menu.jpg).
3. In Workflows, add nodes from the compact command row. Drag typed ports on the canvas or use **Connect ports** to choose endpoints with a touch or keyboard. **Done** returns focus to the trigger. [Phone connection dialog](workflow-connect-phone.jpg).
4. On desktop, use **Width** in the Library or Inspector header to show the slider. Adjust it with a pointer or arrows. Reopen the panel or reload to check that the width persists. The Window menu still offers Reset Layout.

| Changed control surface | Installed public VICT component at 0.4.0-rc.1 | Observed state |
| --- | --- | --- |
| Phone command families and Window checks | `@victframework/ui-svelte/catalog/dropdown-menu` `DropdownMenu` in `StudioMenu.svelte`, root, trigger, submenus, items and checkbox items | All seven families visible, touch submenu selection, keyboard View/Edit actions. Desktop retains public Menubar. |
| Header Fit and existing contextual actions | `@victframework/ui-svelte/catalog/button` `Button.Root` in `Studio.svelte` and authoring pages | Named Fit target, touch and keyboard commands, truthful disabled states. |
| Connect ports | `@victframework/ui-svelte/catalog/dialog` `Dialog`, public Select, Button and Feedback in `WorkflowPreview.svelte` | Labelled dialog, nested public Select pickers, invalid and valid connection paths, Done focus return. The endpoint lists render inside their dialog scope so they receive pointer events above the modal surface. |
| Dock Width | `@victframework/ui-svelte/catalog/popover` `Popover` and public `Slider` in `WorkspaceDock.svelte` | Slider appears on request, has named pixel value and keyboard operation, preserves per-page width through reload. |
| Canvas recovery | Public `GraphViewport` and existing presentation host in `WorkspaceCanvas.svelte` | Geometry uses the rendered authored cards. Recovery changes the camera on narrow entry when needed. Graph identity, content, history and layout settings are preserved. |

The [full control inventory](../final/CONTROL-AUDIT.md) still applies to the other surfaces. The responsive changes introduce no native replacement or exception.

The production build and the four existing suites passed on the candidate: authoring/conflict recovery, docks, prior usability repairs, and rendered UI audit. The new `scripts/check-studio-responsive.mjs` probe passed at 1280 × 800 and 390 × 844 in Chromium with touch emulation and reduced motion. It measured canvas height, checked saved identity and viewport recovery, and exercised the mobile menu and Workflow connection. The existing suites were updated to use the relocated public controls. The first connection regression found a pointer interception problem with a portaled Select inside the modal. Rendering those two public Select lists inside the dialog resolved it, and the suites were rerun.

The phone camera recovers one readable object when needed. Large graphs still require pan, Fit or Reveal to see other objects at useful scale. Device and screen-reader checks remain untested. U0 execution and provider boundaries are unchanged. Final UX acceptance remains with Radzi.

Independent verifier `/root/verify` reported PASS for the responsive, dock, prior repair and rendered audit suites on exact candidate `7f8b4513142b1a630a197b7e523c188b2ea465f5`. Additional keyboard checks passed at 390px for Menu → View → Fit, Connect ports with both Selects, and focus return. Desktop Width opened by keyboard, moved Library from 220 to 224px, and restored trigger focus on Escape. The verifier found no blocking issue in this bounded repair.

| Existing verification IDs | Result |
| --- | --- |
| N2, N8, SHELL-02/03/12, RESP-01/03 | PASS for the seven mobile menu families, canvas space and contextual commands at the tested sizes. |
| N4, SHELL-07/11, RESP-02 | PASS for saved identities, offscreen camera recovery on narrow entry, and persisted desktop sizing. |
| F1–F6, VICT-01/02/03/05/06, A11Y-01/03 | PASS for the changed public controls, typed picker paths, keyboard/touch interaction and focus restoration in Chrome. Hardware checks remain unverified. |
| Final visual acceptance | HELD for Radzi's hands-on review. |
