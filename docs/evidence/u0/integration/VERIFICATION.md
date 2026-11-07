# Integrated U0 engineering evidence

| Item | Identity |
| --- | --- |
| Repository and branch | `radz2291/VICT-Tori`, `codex/tori-ui-foundation` |
| Clean local and remote TORI-001 baseline | `bbbfd83792e59735829067d93f532567a3c03fd6` |
| Preserved TORI-002 integration tip | `1b39881be6568ea7067f7b252f5e84abe7e399ea` |
| Product candidate and independently tested commit | `990bd3453fb6f416492e1b52b32d437e704edba6` |
| Independent verifier | `/root/verifier`, fresh context and detached product checkout |
| Production bundle | `index-w7YxO1al.js`, `index--tXaSLtm.css` |
| Toolchain | Windows, Node 24.15.0, npm 11.19.1, Vite 6.4.3, Svelte 5.57.0, installed Chrome via Playwright |
| Dependencies and fixtures | Eleven installed VICT `0.4.0-rc.1` artifacts from pinned source `6b420a3e9eada6f694cc2550debda7753316b5b3`. Fixture revision equals the tested product SHA. |
| Local owner review | [Studio preview](http://127.0.0.1:48746/) and [walkthrough](README.md) |

The verifier matched the [G0 artifact manifest](../../g0/vict-artifacts.json), performed a clean install against the unchanged lock, built the exact Vite production bundle, and used fresh Chrome profiles. The launch and suite commands are in the [Studio README](../../../../apps/studio/README.md). The eight tracked suites passed on the candidate. The initial parallel integration run timed out on the menu immediately after sample reset. The independent isolated rerun and stage-manager rerun against the owner preview both passed. See the [independent exact-candidate report](990bd34-verdict.md).

| Suite | Observed result |
| --- | --- |
| `check-studio-integration` | PASS. Native selection and clear, shared commands, 1531×668 and 390×844 bounds, linked run/session reload, corrupt import, sample isolation and Agent fixtures. |
| `check-studio-workflow-fixtures` | PASS. Typed business and research graphs, editable routes, incomplete Save, shared values, Undo/Redo, and exclusive, multiple, no-match and unavailable paths. |
| `check-studio-creative` | PASS. Reference cycle, comparison, branch history, Run Node, unsupported closure, reuse/staleness/variation, conversion and artifact ID through Workflow → Run → Session. |
| `check-studio-browser`, `check-studio-final` | PASS. R1/R2 native authoring, pointer/keyboard, invalid port rejection, stale save conflict, recoverable unsaved drafts, reopen, selection and mobile Delete/Reveal. |
| `check-studio-docks`, `check-studio-responsive` | PASS. Window parity, resize, reset, selected ID restore, focus, phone recovery, label width and canvas geometry. Phone canvases measured 707px for Agents and 654px for Workflows and Creative. |
| `audit-studio-ui` and additional rendered probes | PASS. Five-page sweep, installed public controls, keyboard and dialog focus, measured contrast, reduced motion, 200% layout, protected denial and continued denial, wait/cancel/interruption, operational fields and nested trace. |

## Acceptance mapping

| Criteria | Verdict and scope |
| --- | --- |
| U0-01, U0-02 | PASS for the independent install and integrated authoring/operational surfaces. Library and Inspector use one native selection and shared Window/menu controls. See the [control audit](CONTROL-AUDIT.md). |
| U0-03 and fixture A | PASS for the observed Agent configuration, public native resource projection and shared editing. Four projected edges retain the underlying model, Skill, tool and specialist IDs when hidden. |
| U0-04 and fixture B | PASS for typed create/connect/delete, invalid connection refusal, editable routing, incomplete drafts, approval mapping and protected denial. A dedicated native reconnect, dangling-port and unsupported cycle sweep remains NOT DEMONSTRATED. |
| U0-05 | PASS for actual edit history, stale writer recovery, incomplete Save, layout, reopen and full reload in the exercised cases. |
| U0-06 and fixture C | PASS for three directions, references and explicit context, conversion, simulated artifact history and safe unavailable closure. A visual grouping and executable subworkflow comparison remains NOT DEMONSTRATED. |
| U0-07, U0-08, U0-09 | PASS for linked definition/run/session/artifact identity, machine-readable and visible simulation origin, explicit refusal, failure, wait, cancel/interruption, and unknown cost. |
| U0-10 | PASS for corrupt import retention, stale-writer recovery and isolated fixture reset. A storage quota or failed-write browser injection was NOT DEMONSTRATED. |
| U0-11 | PASS for measured browser desktop/narrow, keyboard, focus, touch emulation and reduced motion. A physical phone and its software keyboard were NOT DEMONSTRATED. |
| U0-12 | PASS for synthetic Quellight and coding workspace authoring and inspection through the shared shell. |
| U0-13 | PASS for installed public artifacts and [G0 consumer/mapping evidence](../../g0/CONTRACT-MAPPING.md) with the integrated boundary and fixture checks above. |
| U0-14 | Fresh engineering review and repairs recorded. Owner UI acceptance remains open. |

The independent coverage report also leaves dedicated duplicate-node authoring, arbitrary transform/operator settings, explicit choice among equally matching prior artifacts and the full provider fallback/version matrix open. The conversion pins the latest matching artifact when one exists.

Blank project and Authoring agent use the integration and R1 browser suites. Research and Governed action use the Workflow fixture suite and the independent denial probe. Creative three directions and Unified continuation use the Creative suite. Quellight and Coding use the integration fixture path.

For the TORI-002 addendum, SHELL-01/02/05/06/07/10/12 and RESP-01/02 were exercised with desktop menus, document and layout state, shared selection, command targets and 1531×668 plus 390×844 viewport boundaries. AG-01/02/03, FLOW-02/04/05/06/07/08, CREA-03/04/07/08, SESS-04/05 and RUNS-01/02/03/05 were exercised by the suites above. FLOW-09 and physical-device RESP-03 remain NOT DEMONSTRATED. Previous V/W/A/R reports retain their original scope and identities.

## Repair lineage and rendered evidence

- [8223b5c independent report](8223b5c-verdict.md). Selection persistence, phone canvas height, artifact duplication and unsupported partial intents were found.
- [fb52560 independent report](fb52560-verdict.md). The rerun found overlapping phone labels and incomplete Creative-to-Workflow artifact linkage.
- The tested product repairs both remaining findings. [Agent relationship projection](agent-resource-relationships.jpg), [waiting run](run-waiting.jpg), [linked Session at 390×844](session-phone.jpg) and [persisted settings](studio-settings.jpg) were captured using the production preview and synthetic data. The independent captures show [Workflow desktop](workflows-desktop.jpg), [Workflow phone](workflows-phone.jpg), and the same pinned artifact in the [simulated run](worked-run.jpg) and [linked Session](worked-session.jpg).

The review covers the local U0 build and its recorded scope. Full acceptance is held for the remaining proof gaps and the owner's hands-on decision. T01–T09 live tests and V1a are outside this stage.
