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
