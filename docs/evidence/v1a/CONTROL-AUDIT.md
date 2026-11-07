# V1a control audit

All VICT package versions below are installed `0.4.0-rc.1` artifacts from the [pinned VICT revision](OWNERSHIP.md). Source call sites and actual rendered roles were inspected on the early candidate. The authoring surface and local review data are real. No Session or Run fixture is presented as execution.

| Surface and states | Installed public export | Evidence and limit |
| --- | --- | --- |
| Top File–Help menus, disabled items, Window commands | `@victframework/ui-svelte/primitives` Menubar and CheckboxItem | Conventional menu with scoped VICT catalog styles; controls share document/canvas callbacks. Full keyboard/focus pass open. |
| Document Save/Activate and history, canvas tool buttons, document and execution status, feedback | `@victframework/ui-svelte` Button, StatusBadge, Feedback | Disabled readiness, active and dirty state, native alert for rejected edit. |
| Library search and object selection; bottom tasks | AI Input; VICT Button.Root from primitives | Library drives the same native Flow selection consumed by Inspector. Pressed state shown; Workflows and Creative disabled. |
| Inline node and Inspector fields | `@victframework/ui-ai-svelte` Input, Textarea; `@victframework/ui-svelte` Select, Button | Shared instruction value, fixed model picker, generation limit and explicit connection commands. Reasoning override explained as unavailable. |
| Graph selection, panning, fitting, typed ports and links | `@victframework/ui-flow-svelte` SvelteFlow, SvelteFlowProvider, Handle, Background, useSvelteFlow; Flow `/model` GraphSessionV3 | Native canvas primitives, typed domain commits and history. Phone has a Library/Inspector alternative to precise gestures. |
| Phone Library and Inspector | `@victframework/ui-svelte/primitives` Dialog | Public modal focus, Escape, close and overlay behavior; catalog styling composed as bottom sheet. |
| Session history, message copy, composer, send and pending/error | `@victframework/ui-ai-svelte` Conversation; VICT Select, Button and StatusBadge for host controls | Real send path. No fake placeholder messages; open existing Session or start a pinned one. |
| Run selector, status, failure and Session link | VICT Select, StatusBadge, Feedback, Button | Chronological safe event text and reported usage. The timeline is read-only semantic HTML, not an interactive tree or custom control. |
| Desktop panel width | Menubar items for standard/wide/reset | Direct separator resizing remains a gap. See [UI exception register](../../governance/UI-EXCEPTIONS.md#v1a-pending-capability-gap). |

The first browser capture found unreadable default theme colors and the mobile Dialog placed partially outside its viewport by the catalog's center transform. Both were repaired using VICT theme tokens and composition CSS. These are product layout fixes; no substitute controls or custom graph implementation. The [independent UX challenge](INDEPENDENT.md) verified the targeted keyboard, focus and dock states. Full accessibility checks, physical phone, direct panel boundary resizing and owner acceptance remain open.
