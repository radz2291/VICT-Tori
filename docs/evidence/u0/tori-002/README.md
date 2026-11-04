# TORI-002 Studio realignment — interim walkthrough

Base: `bbbfd83792e59735829067d93f532567a3c03fd6` on `codex/tori-ui-foundation`. Product candidate: `5f714e492deba75f36a5e8c2c6f301e9f6cd8086` on `codex/tori-002-studio-realignment`. The following commit `889c77c75cae3bdf182574213c507f6140030e42` updates only the Runs locator in the test harness. TORI-001 confirmed the ownership boundary and retains its R2 walkthrough and broader U0 functional verification.

[Before, 1280 × 800](before-desktop.jpg) · [After, 1280 × 800](after-desktop.jpg) · [Window menu](window-desktop.jpg) · [Phone, 390 × 844](after-phone.jpg). Before and after use the same synthetic agent and text in fresh Chrome storage. The screenshot origin for the candidate is separate from the R2 preview.

From `apps/studio`, use the [pinned artifact setup](../../../../apps/studio/README.md), then run `node node_modules/vite/bin/vite.js build` and `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 48744 --strictPort`. Open [the candidate](http://127.0.0.1:48744/). Browser storage is origin-specific: the preview uses its own local drafts.

1. Use Insert → Add agent. Name it in Inspector, change the same instructions in the node and Inspector, and use Edit or the authoring toolbar for Undo/Redo.
2. Toggle Library, Inspector and Activity in the toolbar, then inspect their check states under Window. Hide Inspector and select the agent again. Use Window → Reset layout to return to the page defaults.
3. Save a draft, edit again, and reopen through File. Try Keep editing first, then confirm reopen. Move between the five bottom pages.
4. In Workflows, add Request, Run agent and Decision. Connect the two Brief ports and try the incompatible Brief-to-Proposal pair; the valid connection should remain. In Creative, compare the three directions, edit notes and branch one. Sessions and Runs are labelled U0 empty states.

| Surface / role | Installed public export and callsite | Rendered proof and limits |
| --- | --- | --- |
| Shared shell, bottom page controls, dock controls, Library rows, actions | `@victframework/ui-svelte/catalog/button` `Button.Root`, `Studio.svelte`, `DraftActions.svelte`, `AddAgent.svelte` | Browser exposes buttons, active page via aria-current and dock state via aria-pressed. |
| Top menu and Window checkboxes | `@victframework/ui-svelte/catalog/menubar` `Menubar`, `StudioMenu.svelte` | Menu bar, triggers, menu items and aria-checked; ArrowRight/ArrowDown and unavailable Run checked. |
| Reopen warning and Agent find menu | `@victframework/ui-svelte/catalog/alert-dialog` `AlertDialog` and `@victframework/ui-svelte/catalog/dropdown-menu` `DropdownMenu`, `Studio.svelte` | Alertdialog cancel, Escape focus return, confirm and dismissal; Find agent radio item checked and Escape return exercised. |
| Feedback, errors and unavailable Sessions/Runs | `@victframework/ui-svelte` `Feedback`, `Studio.svelte`, `WorkflowPreview.svelte`, `CreativeCanvas.svelte` | Saved state, empty state and conflicting-tab error tested. Incompatible port alert comes from the installed public Flow workspace. |
| Agent inline and Inspector editing, Creative notes | `@victframework/ui-ai-svelte` `Input` and `Textarea`, `Studio.svelte`, `CreativeCanvas.svelte` | Shared named fields edited in Chrome. Creative textarea slot verified. |
| Workflow toolbar, fixed choices and in-node Agent reference | `@victframework/ui-svelte/catalog/button` `Button.Root` and `@victframework/ui-svelte/catalog/select` `Select`, `WorkflowPreview.svelte` | Actual options opened and selected by keyboard and pointer, including the embedded reference; disabled Connect tested before endpoints exist. |
| Graph canvases and Workflow ports | `@victframework/ui-flow-svelte` `GraphWorkspaceV3`, `GraphViewport` and `GraphPortRow`, `Studio.svelte`, `AgentCanvas.svelte`, `WorkflowPreview.svelte`, `CreativeCanvas.svelte` | Graph nodes/ports, selection, drag and typed rejection exercised. |
| Icon glyphs | `@victframework/ui-media-svelte` `MediaIcon`, `Studio.svelte` and `DraftActions.svelte` | Inside named public buttons/menu items; glyphs are not separate actions. |

All VICT packages listed above are installed at `0.4.0-rc.1` from the [G0 artifacts](../../g0/DEPENDENCIES.md). Source sweep found no app-authored native interactive controls in Svelte templates. This inventory records exercised states and source roles; it does not establish every focus, overlay and device combination. No exception has been approved.

| Rule / probe | Interim verdict |
| --- | --- |
| N1/N2, SHELL-01/02 | PASS for top menu and bottom navigation at 1280 × 800 and 390 × 844, all five pages. |
| N3, SHELL-04/05 | PASS for toolbar and Window synchronization on all three dock roles in the tested workspace. |
| SHELL-07, RESP-01/03 | NOT DEMONSTRATED in full. Reset exists; dock resizing is absent. Phone navigation fits but supplementary panels stack inline. Touch keyboard and narrow dock ergonomics need further work. |
| W0, SHELL-12 | FAIL for truthful empty-history readiness: Undo and Redo remain enabled when the native workspace has no history. The underlying operations safely do nothing. |
| AG-01/02, FLOW-08/10, CREA-08 | PASS for the exercised U0 Agent/Workflow/Creative regression paths, including saved Agent reference and restored variations. |
| VICT-01–10, A11Y-01–04 | Scoped evidence above. Full rendered coverage, shortcut/readiness parity and overlay/disabled contrast are NOT DEMONSTRATED. Sampled graphite tokens exceeded 6:1 against tested surfaces; this is not a complete accessibility verdict. |
| SESS/RUN live criteria | NOT IN CURRENT STAGE. The presented empty states do not generate records or provider evidence. |
| Visual acceptance and final U0 | HELD for Radzi. |

Independent verifier: fresh Codex verifier `/root/verify`, read-only, product commit above. First Chrome pass on `540ce8a5435294a52cc9159735982c30b303f7c6` found the confirmation action left the modal overlay open after restoring data. The initial assertion also sampled a transient missing edge immediately after validation; subsequent checks waited for the same edge and verified it remained. Chrome on the repaired product passed Agents pointer/keyboard and cross-tab conflict recovery, Workflows native typed links/rejection/history/reopen, Creative comparison/branch/reopen and final Runs navigation. Verifier used the existing production preview, suppressed screenshot writes, and adjusted the stale Runs heading locator in memory; that locator correction was committed separately. Earlier Vite build hit ENOSPC at bundle write; after reclaiming space from disposable duplicate dependency source maps the build passed. Vite reported the existing large-chunk advisory. Documentation integrity and diff whitespace checks passed.

This is an interim walkthrough. It has not been submitted as a completed engineering delivery or accepted visually.
