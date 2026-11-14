# Independent findings and retained rechecks

Verifier `tori013-independent-verifier-20261114`, fresh session `/root/verifier`. Product changes belong to the orchestrator/builders; this verifier changes only evidence and verification harnesses.

## F1 — Retained replay event reported missing

Affected candidate: `024afe5d7a9d72814d9aa12b7fe73fec71de6108`. RV-03/RV-09.

The original projection interpreted arrival order instead of each stream's source order. A retained earlier sequence arriving after a terminal sequence was omitted and left a false gap. [Attempt 1](ATTEMPT-01.md) records initial discovery and attribution.

After the fresh installation succeeded, the verifier independently reproduced this failure from the exact old package source with `node docs/evidence/v1c-run-visibility/independent/reproduce-prior.mjs`. The underlying challenge exited 1 with `Retained source sequences falsely missing`; its red output remains `.local/independent/prior-projection-red.log`.

Recheck at `78a410ffe5c26f0367b3dc51acf1dc359ec5b596`: the independent `projection-challenge.mjs` passed all 720 arrival permutations of a six-event stream, duplicate admission, exact source immutability, stable group identity and gap reconciliation. Separate scope/privacy/accounting assertions passed. The new package orders each originating stream independently and does not claim cross-stream wall-clock order. **F1 repaired.**

## F2 — Accepted parent answer absent from report

Affected candidate: `78a410ffe5c26f0367b3dc51acf1dc359ec5b596`. RV-04 and accepted-answer projection within RV-02.

The verifier used only a read-only GET of the orchestrator's synthetic live preview. Parent Run `4fa613bc-f0b5-4155-9dbe-0902a7eb9aea` is completed and its Session retains the exact accepted assistant message with ID `4fa613bc-f0b5-4155-9dbe-0902a7eb9aea-agent`. That message contains the `TOPIC-104` code and finding. Nevertheless, `report.finalAnswer` is null, so the parent Specialist report presents an available final result as Unavailable. The normal transcript remains visible.

`server/studio.mjs` stores accepted direct replies in the Session but only assigns `run.output` for nested executions. The new report reads `run.output` alone. The smallest repair is a read-only join to the exact accepted assistant message in the Run's own saved Session, with the existing durable child output as fallback. It must preserve rejected-output withholding and accepted replies followed by later interruption.

`review-live-evidence.mjs` independently exited 1 for the parent mismatch, while verifying the two completed linked Runs and all ten synthetic memory/Directive recall records. `.local/independent/live-78a410f.json` retains the safe observation. This was review of the manager's existing live evidence, with zero verifier provider/tool dispatch. The manager accepted the finding and owns repair.

Recheck at `cd415e07f2592d36d7ebb32317d7111fc01f7e76`: the independent accepted-reply harness passed exact assistant identity, same-Session restriction, missing/foreign/user/prefix rejection, input immutability, later-interruption preservation and durable child fallback. All 17 affected deterministic tests passed, including A4 rejected-output withholding and saved Research parent replay. The actual governed receipt browser passed its new parent Final result assertion with four fixture calls and unchanged view receipts. A separate read-only GET of the restarted exact candidate preserved the same original live Run IDs and confirmed the parent report now equals its accepted saved reply. All ten memory/Directive cases were rechecked without any verifier dispatch. **F2 repaired.**

Expected-result metadata remains unavailable in the newly created specialist record because the current runtime has no recorded expected-result field. It must remain explicitly unavailable rather than be invented from a model explanation. Completed status is available; the report's distinct terminal-reason field is absent in this candidate. The final report must distinguish these gaps from a demonstrated full RV-04 pass.

## F3 — Duplicate quiet problem message

Affected candidate: `78a410ffe5c26f0367b3dc51acf1dc359ec5b596`. The independent A1–A4 browser failed at `tests/a1-browser.mjs:419`: the exact step-limit sentence was present in both the Outcome `role=alert` and Run activity `role=status`. Both were visible. The verifier's desktop Quiet screenshot also showed duplicate denial wording. The orchestrator had independently found the same issue and owns the repair in `77604bb`: omit only an activity badge whose exact label is already the visible Runs Outcome message; preserve Sessions and retained Full trace rows. At `cd415e0`, the final fixture browser and visual review confirmed one Outcome sentence with retained trace codes, and A1–A4 passed the original line 419 before reaching a different locator failure below. **F3 repaired.**

## A4 link selector recheck

At `cd415e0`, A1–A4 continued through the step-limit repair and child Run assertion, then failed at line 494. Its broad `/^Open parent Run/` locator matched the existing Outcome link `Open parent Run · Quellight` and the new Specialist report's exact `Open parent Run` link. Both are legitimate public Buttons in their respective surfaces. The verifier preserved the red and reported it without changing the test. The orchestrator supplied test-only successor `058e685acd00a97dfdf7b23e40585390c14c21e3`, scoping parent/child navigation to Outcome. Product bytes are unchanged. The full independent corrected A1–A4 browser passed at that exact successor, including nine fixture requests, invalid draft boundaries, restart isolation, Session titles and active Agent picker. **Corrected test PASS.**

## Historical V1b browser assertion

The independent `78a410f` V1b browser reproduced the timeout at line 161 for `Draft edit · applied`. The edit, receipt, history and save preceded this obsolete always-open timeline assertion. The current public location is Run Details → Draft authoring. The orchestrator repaired only that test in `cd415e0`, including its second assertion after a late acknowledgement following Stop. The full independent corrected V1b browser passed at that exact candidate, retaining applied operation `62190ccc-e87a-40e3-9985-6257b08e43d0:authoring-fixture-1:tori.draft.instructions:1:857ca4420e42d0188cb47af996f1ca022ba9cbcaff8ef9a11732079bad11f10d`, draft revision 4 → 5. **Corrected test PASS.**

After these two original reds, the coordinator directed the verifier to move the remaining browser qualification to final bytes. The verifier stopped only its identified qualification process tree just as the old Memory browser began. That partial old Memory attempt is cancelled, not PASS or a product failure. The original full unit/build and both original browser failures remain attributed to `78a410f`.

## Verifier harness failure

The first supplemental control-role browser reached Configure and confirmed disabled public VICT question controls, then timed out looking for an invented `Agent sidebar` label. A second attempt incorrectly used the historical `Inspector` label. The rendered Agents toggle is `Assembly / Selection`. These are verifier selector errors, not product findings. Both JSON/logs remain under `.local/independent/control-audit` and `control-audit-02`; the corrected harness writes a separate third directory. No product file was changed.
