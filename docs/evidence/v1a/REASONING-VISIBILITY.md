# V1a reasoning visibility repair

Product `728cbc7283c5d3f7451b123461ef1b208c131cf8` on `codex/tori-v1a`; prior review candidate `caa6411b31d0d32bb8cf7a7e2425a3288598f7a6`. Owner review feedback: thinking/reasoning was not visible in Session.

The same installed public VICT `0.4.0-rc.1` StatusBadge changes from Waiting for Z.AI to Thinking only after Z.AI streams a reasoning signal. It changes to Preparing answer when visible answer text starts arriving. Session displays observed activity after completion; Runs stores only the first activity timestamps as timeline milestones. Older records have no reasoning telemetry. The provider route does not supply a separate public summary, and the supported SSE path strips raw reasoning before Mastra; Studio saves and displays only activity timestamps. Session and Run captions are read-only text; no new control role or exception.

Builder verification: Playwright 1.63.0, 390×844, isolated local database and real Z.AI Coding API `glm-5.3-flash` via unchanged VICT Mastra path. A synthetic number puzzle showed Thinking during the turn. Z.AI activity observed 13:24:18.162 UTC, public answer observed 13:24:26.600 UTC, completed with 60 input and 667 output tokens. The Run timeline survived reload. [Live phone](reasoning-live-phone.png) · [Persisted Run](reasoning-run-phone.png).

`npm test`: 3 passed, including a chunk-split SSE test for safe activity and preserved public text/usage. `npm run build`: passed with the existing client chunk warning. The owner's 48761 preview was checked to serve the new activity route and retains its existing project.

Independent recheck: fresh Codex verifier `/root/v1a_verifier` at the exact product confirmed the phone Session caption and one real persisted Run event after reload, without sending or modifying any data. Fragmented SSE probes retained public text and usage and stripped all three supported reasoning fields from message and delta. The builder separately verified the transient live badge.
