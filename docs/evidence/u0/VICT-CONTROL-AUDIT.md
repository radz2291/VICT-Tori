# Public VICT control audit

Scope is the five-page N1 shell and amended R2 walkthrough. The installed VICT packages come from the [pinned G0 artifacts](../g0/DEPENDENCIES.md).

| Role | TORI source | Public implementation |
| --- | --- | --- |
| Fixed-choice node, agent reference, output and input pickers | `WorkflowPreview.svelte` | `@victframework/ui-svelte/catalog/select` |
| Find agent and selected item | `Studio.svelte` | `@victframework/ui-svelte/catalog/dropdown-menu`, radio group and radio items |
| Navigation and document, canvas, comparison, branch and recovery actions | `Studio.svelte`, `AddAgent.svelte`, `WorkflowPreview.svelte`, `CreativeCanvas.svelte`, `DraftActions.svelte` | `@victframework/ui-svelte/catalog/button`, with public `MediaIcon` from `@victframework/ui-media-svelte` for icon actions |
| Agent name, agent instructions and Creative direction notes | `Studio.svelte`, `CreativeCanvas.svelte` | Public `Input` and `Textarea` from `@victframework/ui-ai-svelte` |
| Document status, save/reopen errors, placeholder empty states | `Studio.svelte`, `WorkflowPreview.svelte`, `CreativeCanvas.svelte` | Public `Feedback` from `@victframework/ui-svelte` |
| Canvas, typed ports, native connection diagnostics | `AgentCanvas.svelte`, `Studio.svelte`, `WorkflowPreview.svelte`, `CreativeCanvas.svelte` | Public `GraphWorkspaceV3`, `GraphViewport` and `GraphPortRow` from `@victframework/ui-flow-svelte` |
| Dialogs | No dialog is exposed by these review routes | Check public VICT dialog and focus behavior when a dialog is introduced |

At each checkpoint repeat the source audit for the changed controls and attach running UI evidence for the relevant states. Record the exact public API limitation in the [exception register](../../governance/UI-EXCEPTIONS.md) before introducing a substitute. A placeholder does not verify the future interactive surface.

The installed Chrome check covers the R1 authoring and save-conflict walkthrough, the rendered catalog Button marker, Select expanded and selected states, disabled Connect and Reopen, the rendered VICT Textarea marker, native typed port drag, invalid-link refusal and diagnostic, Undo/Redo, Save/reopen, and the Runs empty state. Workflow saves the reference by agent ID. Creative keeps the source direction intact when branching. See [open Workflow Select](studio-control-workflow-select.png), [invalid connection feedback](studio-r2-workflow-validation.png), [saved workflow](studio-r2-workflow-reopened.png), [Creative comparison](studio-r2-creative-comparison.png), and [Agents save-conflict feedback](studio-control-save-conflict.png).

The installed Flow viewport refuses an incompatible pointer drop during gesture validation and does not emit a rejection diagnostic for that drop. The supported Output and Input Select path invokes the public graph operation and shows its reason. The toolbar points users to that path. No substitute control was added. Full touch, increased-zoom and assistive technology checks remain open.

Verification used Node 24.15.0, installed VICT artifacts from the G0 source commit, and Chrome at 1280 × 800, with the carried-forward Agents keyboard flow at 640 × 800 and reduced motion. Run the production build with `node node_modules/vite/bin/vite.js build` from the Studio directory. From the repository root run `node scripts/check-studio-browser.mjs <playwright-entry> <chrome-path> http://127.0.0.1:48748/ "" <absolute-studio-directory>`. The local browser check starts and stops its own Vite server. The earlier independent import proof remains linked from G0.
