# TORI-006 early hands-on checkpoint

**Offered 12 November 2026.** [Open the early local Studio](http://127.0.0.1:48829/) at 5645b4b0f414b4ee7336e212d7260a2c6c385f31. It uses its own worktree, pinned install and data directory. Quellight r1 already has Governed Memory enabled. Use synthetic data.

1. Open Sessions → New Session → Quellight → r1. Send “Remember that I prefer project updates in three short bullets.”
2. Read the exact proposal. Edit it if needed, then choose **Confirm and save**. The **Saved** state repeats the stored text. You can also dismiss it.
3. From the preview checkout run **./scripts/memory-preview.ps1 -Port 48829 -Restart**. Reload the browser. This starts a new Studio process against the same store.
4. Open a fresh Quellight r1 Session and ask “Give me an Orchid project update.” Open the Session sidebar, expand **Details**, choose **Inspect runs**, and scroll to **Saved memory** in Run Details. Inspect the admitted revision and its message references.

The early builder live check, performed in a separate disposable workspace with the approved Coding connection, confirmed a save with revision 1 and then stopped and restarted Studio. Quellight answered the fresh Session with three bullets. Save Run 82c1efac-4414-415a-afaa-b92781b5e7c5 and recall Run efe6bd2f-8f39-4571-9613-00ecaf991964 had different Session IDs. The owner preview itself was verified to reopen the same Quellight activation and enabled policy in a new process. The final candidate's exact evidence is tracked separately.

The first installed browser attempt reached a live save but failed to render Studio after restart: the detached checkout used a junction to another checkout's dependencies, and Vite refused asset paths outside its root. A separate pinned install resolved that setup failure. The early confirmation field was also observed to have a light background against light text; the later candidate applies the Studio field tokens to the public VICT Textarea and measures the contrast. The early checkpoint is for feedback and does not imply an independent verdict or acceptance.
