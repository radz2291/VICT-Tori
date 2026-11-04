# U0 owner walkthroughs

## U0-R1 · offered

Run the Studio on localhost. In a fresh browser profile, select **Add agent**, then enter a name and instructions in the inspector. Edit the instructions in the canvas node and check that the inspector reflects the change. Select **Undo**, **Redo**, and **Save draft**, then reload the page. Visit Session and return to Definition.

The installed Chrome browser check passed at 1280 × 800 using the pinned VICT tarballs. It verified 19 public imports in the independent consumer and exercised native agent creation, shared editing, history, saved draft reload and navigation without browser page errors. The test uses visible browser controls.

This checkpoint uses one draft per browser origin. Agent configuration covers name and instructions. The Trace and Session views are placeholders and the screen labels execution as simulation. Typed links, the remaining agent configuration, and fixtures A–C are open. No owner feedback or acceptance has been recorded.

## U0-R1 design revision · reviewed — changes requested

The owner requested a canvas-first Definition and held expansion pending a hands-on review. The revised candidate has a compact project header, secondary history and draft controls, a shared VICT token palette, an in-canvas first action, and a collapsible inspector that opens on selection.

The Chrome walkthrough passed at 1280 × 800. It verified agent creation and immediate selection, edits in both surfaces, inspector collapse and restore, Undo/Redo, saving, reload, explicit reopen and navigation. The first two revision checks caught a selection regression. The add callback now checks the resulting graph because the native apply method returns no result.

- [First open](studio-r1-first-open.png)
- [Saved draft with one agent selected](studio-r1-selected.png)

The revised walkthrough is available at http://127.0.0.1:48743/ on a separate local origin for a blank start. Owner acceptance remains pending.

Follow-up browser check passed. After hiding the inspector, selecting a node on the canvas keeps it hidden. Show inspector restores it, and adding an agent opens it for editing.

The graphite visual pass is offered for style review. [First open](studio-r1-graphite-first-open.png) and [selected agent](studio-r1-graphite-selected.png) were captured at 1280 × 800. Chrome authoring regression passed. A fractional inspector width initially triggered the native Flow coordinate guard. The dock now uses an integer width at desktop sizes.

R1 accessibility walkthrough passed in Chrome. Pointer at 1280 × 800 and keyboard-only at 640 × 800 with reduced motion exercised add, edit, inspect, Undo/Redo and Save/reopen. A second tab updated the stored draft. The first tab announced the conflict, preserved its edits, downloaded a copy and reopened the other revision. Ports, edges, run feedback and menu/dialog focus checks are carried forward in the Studio accessibility guide.

## U0-R1 · reviewed — checkpoint accepted

On 4 November 2026 the owner approved the latest R1 tweaks and requested the move to R2. The final tweaks include the compact Find agent menu, its single selection checkmark, and permanent icon controls for reopening the draft and toggling the inspector. This accepts the R1 checkpoint. The Design Constitution remains a separate draft review.

## U0-R2 · implementation started

The early Workflow preview is available at http://127.0.0.1:48743/?preview=workflow. Add Request and Run agent, choose their Brief endpoints, then Connect. Chrome verified native edge rendering, Undo/Redo and rejection of an invalid connection with the existing edge retained. The preview is in-memory. Workflow persistence, semantic fixture checks and the creative canvas remain open before the formal R2 walkthrough.

## U0-R2 · offered

Open [Studio](http://127.0.0.1:48743/) on the feature branch. The five pages follow Constitution N1. The tested application candidate is `0032faa59ddabc78e68e87945285c090ed0aa977`, on top of PR #2 at `7393401e780f2565cc69838555e6ce4a365e7efb` and the N1 terminology correction at `e2c496f`.

1. **Agents.** Add an agent, name it, edit its instructions, and save. Visit Workflows and return to Agents. Your agent and inspector state should still be there. Reload and check the saved draft.
2. **Workflows.** Add Request, Run agent and Decision from the Node Select. Choose your agent in Run agent. Drag Request’s Brief output to Decision’s Proposal input and confirm that no edge is created. Drag Brief to Run agent’s Brief input to create an edge. The Output and Input Selects offer a keyboard connection path with a visible diagnostic for incompatible types. Undo and redo the link, save, then undo and use Reopen saved draft to restore the saved link. Fit view brings the graph into view.
3. **Creative.** Open Compare directions to see Metallic, Biological and Architectural together. Edit the notes on a canvas card. Branch that direction from the comparison panel, then undo and redo the branch. Save, edit again and reopen to recover the saved notes and variations. Reload and revisit Creative to check persistence.

[Saved workflow](studio-r2-workflow-reopened.png) · [Invalid connection feedback](studio-r2-workflow-validation.png) · [Creative comparison](studio-r2-creative-comparison.png) · [VICT control audit](VICT-CONTROL-AUDIT.md)

Creative uses synthetic text directions. Artifact comparison, preferred-result selection and workflow conversion remain open. Sessions and Runs show labelled simulation placeholders. The walkthrough covers the amended R2 interactions and leaves full fixture, cross-view execution identity and independent U0 verification open.
