# Independent verification of 8223b5c

Verifier: /root/verifier in a fresh agent context, detached clean product checkout 8223b5c7df5c8f9ac80d27732965f7446146af20. Product files were read-only. Fresh npm ci installed 240 packages under Node 24.15.0/npm 11.19.1. All 11 installed VICT packages are 0.4.0-rc.1 and pack SHA-256 matched docs/evidence/g0/vict-artifacts.json. Production Vite 6.4.3 emitted index-IKHe2jRJ.js and index-f8pBN2Qa.css. Private loopback origin 41973 and separate fresh headless Chrome browser data per suite.

## Observed passes

- check-studio-integration. 1531×668 and 390×844 native selection, document actions, canvas bounds, linked simulation reload, malformed import recovery and sample reset isolation.
- check-studio-workflow-fixtures. Native branch graph insert, typed links, route previews, Inspector/canvas values, incomplete save, Undo/Redo.
- check-studio-creative. Native references and cycle, compare/branch, invalid reference, selection and Inspector, unsupported Run To/From, Run Node/reuse/staleness/new variation, explicit workflow conversion and reload.
- audit-studio-ui. Rendered five-page sweep, menu/dialog keyboard focus, public Select, measured contrast, reduced motion, phone overflow and 200% layout.
- Independent negative.mjs. Denied Quellight run, denial preserved on linked Session continuation even with Success selected, waiting/cancelled/interrupted event inspection, public rendered Select markers for Mode and outcome, no 390×844 horizontal Session overflow.

## Failures and scope gaps

- Product FAIL: initial agent or workflow native selection may never persist. Agent Add → name → Save → unsaved rename → reload preserves recovered data but leaves no selection or Inspector. Workflows Add → Save → Library Request → Inspector → reload leaves only the Library. Native selection and inspectedId storage snapshots are in selection-reload.log. The legacy R1/R2 browser, final repair and docks suites exit red at this regression.
- Product FAIL: continuing Creative Run Node through its linked Session manufactures a new apparent output artifact ID with the previous artifact payload. Exact UI repro in artifact-lineage.mjs/log, including two Creative versions after one generation.
- Regression FAIL: check-studio-responsive reaches a readable phone Workflow card after desktop pan/resize, but canvas is 606px at y=193 against retained 650px floor at 390×844. Agent phone had passed.
- Exact source gap: Agent binding choices use public Selects and can be shown/hidden, but no stable visible resource-node projection or typed tool-availability/delegation edge is presented for fixture A. Node & Edge/U0-03 cannot be inferred from parameter edits.
- Exact source gap: Workflow/Agent generic Run To and Run From options produce the same fixture response as Run Node without closure or a supported/unsupported check. Creative correctly disables those unsupported intents.
- No claim for V1a/live acceptance, physical-device behavior, all eight scenario details, or entire U0-01–14 based on these bounded passes.

## Public control audit

Studio source has no directly-authored button/select/input/textarea/dialog tags. Public installed VICT 0.4.0-rc.1 callsites use ui-svelte catalog Button, Menubar, DropdownMenu, Select, Dialog, AlertDialog, Popover and Slider, plus Feedback/ControlScope. ui-ai-svelte exposes Input/Textarea for editor/file/session/settings fields, Message and Trace for composition. ui-flow-svelte provides GraphWorkspaceV3, GraphViewport and GraphPortRow. ui-media-svelte provides MediaIcon/MediaVector. Source provenance and measured keyboard/phone audit do not replace exhaustive interaction testing.

Verdict: HELD on exact 8223b5c. This report is independent engineering evidence only.
