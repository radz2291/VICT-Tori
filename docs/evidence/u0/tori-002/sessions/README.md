# TORI-002 Sessions panel checkpoint

[Open Sessions](http://127.0.0.1:48744/?preview=sessions) · [Before at 1280 × 800](before.jpg) · [After at 1280 × 800](after.jpg) · [After at 390 × 844](phone.jpg)

Exact product: `be8336dfbd59bfcdc18e16cb04a1bbbb5e356c19`, from `2d3b2493a7303e5233d28b1bf21aed000782c154`, on `codex/tori-002-studio-realignment`. Launch with the [interim walkthrough instructions](../README.md). The before screenshot intentionally shows the three manually opened, empty docks. The revised Sessions workspace cannot offer those docks while it has no usable panel content.

| Page | Proposed initial arrangement | Offer when useful |
| --- | --- | --- |
| Agents | Agent canvas; Inspector follows a selected agent until deliberately hidden. | Library for authored objects; Activity only with relevant evidence. |
| Workflows | Typed workflow canvas. | Node sources and selected-step details; Activity only for actual validation or run evidence that benefits from a dock. |
| Creative | Canvas and comparison. | Source/version Library and selected-object settings; Activity only with relevant work to report. |
| Sessions | Conversation fills the stage. No docks in this U0 state. | Session history, context, or background activity when there are meaningful records or controls. |
| Runs | Trace investigation fills the stage. | Run history and selected-event details when available; a separate Activity dock only if it adds information. |

This is a proposal under Constitution N3/N4/N7, not a second design authority. Availability and visibility are distinct: unavailable panels leave no space or toggle; available panels use the same compact labelled toolbar controls and Window checkboxes. Explicit visibility and supported sizes are remembered per page, Reset Layout restores contextual defaults, and automatic selection does not override deliberate hiding. The checkpoint implements the Sessions availability gate on the existing shared panel state; it does not roll out the other proposed defaults, new toolbar treatment, size persistence, or resize behavior.

Sessions shows an honest U0 state, with no transcript, composer, or runtime control implied. The control inventory for this checkpoint is public `@victframework/ui-svelte` `Feedback` for status and empty feedback, `catalog/menubar` `Menubar` for Window and its disabled item, and `catalog/button` `Button.Root` for bottom page navigation, all installed at `0.4.0-rc.1`. The Conversation headings and stage use semantic layout. No exception.

Production Vite build passed. Chrome with reduced motion checked direct Sessions entry, no panel buttons or Window checkboxes, the explicit unavailable Window item via keyboard, full-width Conversation touching the bottom navigator at both viewports with no horizontal overflow, and preservation of an open Agents Library after a Sessions round trip. No page errors. This is a visual checkpoint for Radzi before applying the policy elsewhere.

Independent verifier: fresh Codex verifier `/root/verify` tested the exact product above against production bundle `index-CC_9iowW.js`. Scoped PASS at 1280 x 800 and touch/mobile 390 x 844, including direct entry and bottom navigation, Window ArrowDown and Escape/focus restoration, no docks or overflow, rendered VICT Feedback and Button markers, and the Agents Library round trip at both sizes. No page errors. This verdict does not extend to the proposed rollout.
