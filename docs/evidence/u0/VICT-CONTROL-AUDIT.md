# Public VICT control audit

Scope is the current R1 Definition workspace, R2 Workflow preview and the Trace and Session placeholder states. The installed VICT packages come from the [pinned G0 artifacts](../g0/DEPENDENCIES.md).

| Role | TORI source | Public implementation |
| --- | --- | --- |
| Fixed-choice node, output and input pickers | `WorkflowPreview.svelte` | `@victframework/ui-svelte/catalog/select` |
| Find agent and selected item | `Studio.svelte` | `@victframework/ui-svelte/catalog/dropdown-menu`, radio group and radio items |
| Navigation and document, canvas, workflow and recovery actions | `Studio.svelte`, `AddAgent.svelte`, `WorkflowPreview.svelte` | `@victframework/ui-svelte/catalog/button` |
| Agent name and multiline instructions | `Studio.svelte` | Public `Input` and `Textarea` from `@victframework/ui-ai-svelte` |
| Document status, save/reopen errors, placeholder empty states | `Studio.svelte` | Public `Feedback` from `@victframework/ui-svelte` |
| Canvas, typed ports, native connection diagnostics | `AgentCanvas.svelte`, `Studio.svelte`, `WorkflowPreview.svelte` | Public `GraphWorkspaceV3`, `GraphViewport` and `GraphPortRow` from `@victframework/ui-flow-svelte` |
| Dialogs | No dialog is exposed by these review routes | Check public VICT dialog and focus behavior when a dialog is introduced |

At each checkpoint repeat the source audit for the changed controls and attach running UI evidence for the relevant states. Record the exact public API limitation in the [exception register](../../governance/UI-EXCEPTIONS.md) before introducing a substitute. A placeholder does not verify the future interactive surface.

Chrome passed the R1 authoring and save-conflict walkthrough plus R2 picker opening, selection, edge creation, invalid connection refusal and Undo/Redo. See [open Workflow Select](studio-control-workflow-select.png) and [R1 fields with persistent save feedback](studio-control-save-conflict.png).
