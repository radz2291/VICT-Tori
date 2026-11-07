# Independent UX challenge

Verifier: fresh Codex session `/root/v1a_verifier`, read-only. Chromium 153.0.8010.12 / Playwright 1.63.0 on Windows. Checked the actual owner preview in a fresh browser with POST blocked. No drafts, activations, Sessions or provider calls were created by the verifier. Initial challenge at `f8ca128e702cbb3f9fc4e13a007c5a5374b2e4e8`; targeted fixes rechecked at `4ea498b8fc3885fade63a7183062832356c13f62` and final `caa6411b31d0d32bb8cf7a7e2425a3288598f7a6`.

**Verdict:** ready for early owner walkthrough. Owner acceptance is held.

| Area | Independent result |
| --- | --- |
| Desktop workspace | **Met:** 1531×668 and 1728×960 canvas and bottom navigator fit without outer scrolling. Inspector hiding expands the canvas, keeps camera and stays hidden when selection changes. Visible toggle state and Window checkbox reflect the same dock state. |
| Canonical selection and editing | **Met:** Library, native Flow selection and Inspector agree. Blank canvas clears. Editing shared instructions reflects inline. Invalid wire displays specific feedback. The initial Undo dirty-state finding was reproduced, repaired and rechecked: undo back to saved values shows Saved r1, and Save is no longer enabled. |
| Keyboard | **Met for targeted path:** native keyboard node movement now enters the same Undo/Redo history. ArrowRight moved x=55→60 and showed Unsaved; Undo restored x=55 and Saved r1, Redo restored the move. Window→Inspector→Escape returns focus to the Window trigger. Full keyboard matrix unverified. |
| Phone 390×844 | **Met for targeted touch-emulated path:** Library reveal, Inspector sheet, Session composer, and Runs inspection. Send target measured 44×44 CSS pixels; Session user and assistant bubbles readable. **Gap:** Fit can reduce port labels to about 5 CSS pixels; Library reveal gives a readable selected-node route. |
| Sessions and Runs | **Met for inspection:** real populated transcript and Run records show exact activation, model, reported usage and public lifecycle events. **Gap:** timeline events are read-only and do not have a selected-event detail pane. |
| Remaining polish | **Gap:** direct dock boundary resize absent; old preview draft keeps a slight overlap of source nodes; new assembly coordinates increase separation. Window item accessible name includes a checkmark in the checked state. |
| Outside read-only proof | **Unverified:** new saves and reloads, live sends, physical phone, browser zoom and full assistive-tech pass. Separate [builder evidence](VERIFICATION.md) covers real sends and saved/reopened state. |

The checks specifically challenged the U0 findings about divergent selection, command readiness, clipped bottom navigation, fake Sessions, and phone column squeezing. None of those failures reproduced in the exercised final paths. The retained findings above are still open for the owner walkthrough.
