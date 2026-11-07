# V1a early checkpoint verification

Product candidate `caa6411b31d0d32bb8cf7a7e2425a3288598f7a6`, isolated base `a9eaf445b9025dcb65dbf8a97446871e746dae25`, branch `codex/tori-v1a`. Builder evidence: Windows, Node 24.15.0, npm 11.19.1, Chromium via Playwright 1.63.0, installed public VICT 0.4.0-rc.1 [artifact hashes](vict-artifacts.json). Independent findings and owner judgement are separate gates.

| Issue #3 acceptance step | Status and direct evidence |
| --- | --- |
| 1. Create and name a new agent | **PASS**: clean local database, visible Add Agent and editable Research Assistant identity. |
| 2. Share instructions and bind model | **PASS**: inline → Show as Node → source/Inspector edit → Library selects the same Flow object and root displays the shared value. |
| 3. Settings and negative wire | **PASS for supported setting**: public Select and numeric control; 4,096 output tokens observed in both requests. Drag Text to Model reported incompatible types and retained the valid edge. Reasoning override remains unavailable at the VICT activation pin. |
| 4. Save, reload, activate exact revision | **PASS**: draft r1 restored graph, selection and model; explicit VICT activation produced a content identity. Tests also saved an incomplete draft and rejected stale writes and premature activation. |
| 5. Real turn and follow-up | **PASS**: two Z.AI Coding API HTTP 200 turns through public `MastraProductAgent`; follow-up sent at 390px recalled “Tern Observatory”. |
| 6. Inspect actual Run evidence | **PASS for bounded no-tool slice**: Session, revision, activation, endpoint/model, chronological VICT milestones, sent limit, and usage. [Redacted run evidence](live-run-evidence.json) contains only synthetic IDs and safe metadata. |
| 7. Draft changes do not mutate past activations | **PASS via service test** for activation/session pin after save and restart. UI-side editing after the two live turns is not covered by the browser script. |
| 8. Unavailable setting or provider failure | **PASS for unavailable reasoning setting explanation**. Preliminary General API request returned real 429/1113; no Coding API failure is simulated. |
| 9. Narrow viewport | **PASS for exercised path**: 390×844 Agent/Inspector, Session send/reopen and Run inspection; 1531×668 and 1728×960 desktop shell. Physical phone, zoom and full assistive-tech review remain open. |

The installed consumer probe ran `npm ci --strict-peer-deps --prefer-offline --no-audit --no-fund` in a separate temporary directory with only the manifest, lock and tarballs. It installed 409 packages and loaded public `AgentProfileRegistry` and `MastraProductAgent`. This is VICT artifact consumption, not an independent installed TORI distribution or X15 completion.

`npm test` passed two meaningful tests for VICT typed history and persistent activation boundaries. `npm run build` passed with an initial client chunk size warning. `python scripts/check_docs.py` passed static integrity. The clean live browser recheck ran against the edge-repair product `8bcdfbd41fc34ad9a6b0e07e3ba7c0ecfa03c2a0` with the synchronized render assertions included in this candidate. The conversation styling repair at `f8ca128e702cbb3f9fc4e13a007c5a5374b2e4e8` was rechecked from a fresh browser using the retained real turns. Later product edits changed graph layout/keyboard history, dirty state and dock controls only; the VICT activation, model adapter and Session service bytes are unchanged. Computed user bubble contrast was 10.33:1. No extra provider response was synthesized for that check.

Retained findings: first Vite dev prebundling attempts failed on the installed Svelte/ELK entry; disabling dependency discovery fixed local launch. The first phone check found the public Dialog catalog transform displaced the sheet; fixed in scoped layout. At `4b8d328b26618c82c6f63e9d6dee01bdf72a2066`, an incompatible pointer wire was refused in the canonical graph but Flow drew an extra `xy-edge__instructionsvalue-agentmodel` edge. The public `onbeforeconnect` hook now sends the operation to the typed transaction and stops Flow from appending its own edge. Recheck observed the rejection, valid wire, Undo and Redo. The initial conversation user bubble color also failed visually; the final candidate styles the public bubble content and was contrast-checked as above.

Screens: [Assembly 1531×668](assembly-1531.png), [Assembly 1728×960](assembly-1728.png), [Assembly 390×844](assembly-390.png), [phone Inspector](inspector-390.png), [desktop Session](session-1531.png), [phone Session](session-390.png), [desktop Run](run-1531.png), [phone Run](run-390.png). Assembly and Inspector captures were refreshed during the final no-provider browser recheck. The live Session and Run captures predate the final dock and keyboard changes; the model and activation evidence is unchanged.

Held for final review: owner visual/interaction acceptance, direct panel resizing, full keyboard/focus/touch and accessibility matrix, independent TORI artifact reuse, and all broader stage capabilities outside the bounded ticket. JIT Context Source is documented and a design fixture only; no tool, delegation, background or private reasoning claims.

At the final candidate, the non-provider browser rerun passed at 1531×668, 1728×960 and 390×844, including Undo back to the saved draft and phone sheet close. The final build and both deterministic tests passed.

The [independent UX challenge](INDEPENDENT.md) rechecked the keyboard, dirty state, dock and focus repairs at the final product candidate. The early owner walkthrough is open.

**Amended criterion R-VIS-01: BLOCKED** for end-to-end public reasoning. The [separate installed boundary report](R-VIS-01.md) verifies the live provider and Mastra observations, VICT filtering and strict schema, current public-only fallback, and a proposed upstream extension. The real Session still passes. The historical UI/provider observation is not counted as public VICT evidence.
