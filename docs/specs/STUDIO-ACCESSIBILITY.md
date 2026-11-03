# Studio accessibility and feedback

Apply this guide to Definition, Trace and Session. Use shared VICT controls, theme tokens, overlay ownership and focus behavior across the canvas, nodes, inspectors, menus and dialogs.

- Place validation beside the field, document status in a stable shell location and execution status beside the associated run. Use a toast for a background event that needs attention. Keep actionable errors visible with a recovery path. Routine feedback should leave the workspace steady.
- Name icon controls for assistive technology. Communicate selection, focus, disabled, busy and error states through text, glyphs or outlines. Make essential instructions available to keyboard and touch users.
- Provide keyboard and pointer paths for selecting, moving, connecting and inspecting nodes. Keep focus visible and return it to the invoking control after closing menus and dialogs. Distinguish focus, selection and related objects.
- Check the actual theme for contrast on text, ports, edges and focus indicators. Check target sizes, narrow windows, browser zoom, touch and reduced motion. Provide list or form alternatives to precise canvas gestures.
- Announce meaningful outcomes without moving focus unnecessarily. Group repeated execution updates and keep execution feedback tied to the relevant run.

R1 checks agent creation, editing, inspection, Undo/Redo, Save/reopen and recovery from a save failure. R2 adds keyboard and pointer verification for typed ports, connections and graph movement. R3 checks run-local status, progress announcements and menu/dialog focus return as those controls become available.
