# Studio builder evidence — TORI-012

The Studio work is an engineering handoff to TORI-010. Owner acceptance remains open. This report covers the new presentation surface, not a whole-slice verdict. The required public parent-answer/child-continuation mechanism is unavailable; related editing/activation criteria remain held.

## Changes and source

`src/ActivityDetail.svelte` places public VICT Select in the existing Sessions/Runs Details. Quiet is the initial local browser/workspace preference. Changing it changes presentation only. `src/RunActivity.svelte` renders the source-backed `tori.run-report@1` from the shared runtime projection: stable Working/Continued working groups, visible problems, summaries and safe receipt identities. Disclosure state is local to workspace, Run and group. Same-code problem badges deduplicate in Quiet/Summary; Full keeps each retained problem row.

Sessions place activity outside the accepted message. Runs now retain an accepted transcript answer if later work becomes Interrupted. `src/SpecialistReport.svelte` shows exact task/result/revision/activation, parent/child links, explicit unavailable exchange evidence and per-Run versus combined accounting. Public VICT Detail presents budget dimensions. Missing usage is Unavailable; the absent team limit remains Not configured.

Both Configure and delegation Selection share the existing Fields component. It presents disabled public Select/Input for the unavailable parent-question mechanism; the initial 1 within 0–2 is labelled a proposal, not an active pin. No graph field, authority or fake continuation is introduced. Consequently shared policy editing, Save/reopen/pin isolation and live question acceptance are not claimed by this UI delivery.

## Builder checks

Windows Node 22.13.1, npm 11.19.1, Chromium 153.0.8010.12; unchanged lock and the 16 installed public VICT 0.4.0-rc.1 archives. `npm ci --ignore-scripts` completed. The inherited audit warnings and posthog engine advisory were retained; dependencies were not changed.

- `npm run build` passed after removal of an initial table tabindex warning. Existing large-chunk advisory remains.
- `node tests/run-visibility-browser.mjs` passed at 1531×850 and 390×844: three detail levels on one synthetic Run; visible quiet denial; keyboard disclosure; group and preference persistence after navigation/reload; exact child revision and two-way navigation; no team cap/unknown usage; Session answer with separate continued activity; no document overflow; zero execution/mutation requests; unchanged stored run bytes. Screenshots and JSON are in [studio](studio/).
- The presentation fixture imports the same `projectRunReport` and `capturePublicEvent` package as the host. It is explicitly synthetic and never live evidence. `fixtures/run-visibility/preview.mjs` exports `fixtureRuns` and `fixtureSession` for the isolated cumulative preview.

The main orchestrator owns final integrated SHA qualification, real receipt/browser parity, live evidence, full inherited regressions and fresh verification. This builder does not provide the independent verdict.

## Retained attempts

The first fixture pass exposed a visual issue: an accepted reply was hidden in Runs when its later terminal state was failed. The product repair removes that status-only filter; the retained Session message is the source. A following test attempt failed because its global text selector matched both the visible transcript and the Details result, not because the reply was missing. The driver now scopes that assertion to the main Run/Conversation region. Earlier captures and failure JSON remain in the isolated worktree; the failure is summarized here without machine-local logs.

Fixture creation also exposed invalid sample public event values (`SCOPE_DENIED` lacked the required `VICT_` prefix; a tool identifier contained a space). The public validator rejected them. Corrected fixtures use `VICT_SCOPE_DENIED` and `read-only-source`; the runtime builder was notified to strengthen its fixture capture checks. No invalid event was accepted or invented as a runtime kind.
