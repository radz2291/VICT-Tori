# Independent overall usability review

Reviewer `/root/usability_review` used the running app on 7 November 2026, with fresh Chrome contexts and synthetic drafts at desktop 1280 x 800 and touch/mobile 390 x 844. Exact repository candidate was `292e12b133c2408c8252126d72c2fb0e28690da9`, served as `index-PSAqT77K.js`. This was an exploratory hands-on review. The reviewer used the app before inspecting implementation and made no repository or Work changes.

Desktop feels calm and increasingly coherent. Bottom navigation, conventional menus and the shared panel language are easy to learn. Agent inline and Inspector editing stayed synchronized. Undo/Redo, save/reopen, Workflow recovery and Creative branching worked. Sessions and Runs accurately explain the U0 limits. Desktop ease is stronger than phone ease. Overall experience review is HELD for the findings below and Radzi's acceptance.

| Priority | Finding and reproduction | User impact and suggested repair |
| --- | --- | --- |
| P1 | Save an agent named Phone draft, change it to UNSAVED edit, and reload. Phone draft returns without a departure warning or recoverable unsaved version. | Accidental reload loses work. Provide a departure warning or recoverable draft persistence. |
| P2 | Author on desktop, then change to 390px. An Agent can become partly offscreen and Workflow can look empty. Fresh phone Creative fits three tiny cards near the bottom. Library selection does not reveal or enlarge the chosen card. | Canvas navigation is difficult on phone. Add consistent fit/zoom and explicit reveal-selection behavior while respecting deliberate camera choices. |
| P2 | Create, save and reload an agent. Select it. Edit offers only Undo/Redo. Right-click exposes no app menu. Focusing the graph node and pressing Delete removes it. | Removal is hard to discover and has no visible touch route. Expose Delete selected object through the shared command model. |
| P3 | Use Workflow pickers to connect Request Brief to Decision Proposal. The alert says Port types are incompatible above the workspace. | Recovery works, but diagnosis requires interpreting distant endpoints. Include the endpoint names and types near Connect. |
| P3 | Inspect Undo/Redo on a pristine graph. They appear available. | Empty-history command availability is misleading. This repeats the previously recorded finding. |

[Phone Creative](phone-creative.png) · [Delete discoverability](delete-discoverability.png) · [Workflow error](workflow-error.png)

Panel persistence and phone dialogs worked. The reviewer found width sliders discoverable and keyboard-operable, but their permanently prominent placement feels closer to settings than a conventional desktop dock boundary. This is a design observation for owner review.

Live sessions, run records and provider execution are U0 limitations. The findings above concern usability of the presented editing experience. No browser page errors occurred. This report records findings for repair and subsequent verification.
