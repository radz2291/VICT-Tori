# TORI-007 Background Foundation

[Early Studio preview](http://127.0.0.1:48876/) · [Current candidate preview](http://127.0.0.1:48888/) · [Pinned conformance](PROBES.md) · [Public controls](UI-AUDIT.md)

Open the [completed Quellight Run](http://127.0.0.1:48888/?run=83252d0d-ee6d-4af6-93e0-062c6aa5889e) or the [Run interrupted by Studio restart](http://127.0.0.1:48888/?run=18693be8-0b95-489a-8f91-03d0405cd047) from the final live walkthrough. Both URLs refer to the same isolated store. [Live observations and identifiers](live/observed.json).

In Sessions, open **New Session → Quellight → Start Session**, enable **Run in background**, and send: “Delegate habits research to the saved Research specialist. Report the actual finding code, assumptions, interpretation and follow-up ideas.” Open **Inspect Run** while it is Running. Close the browser tab and reopen its URL, or open Studio in a fresh tab and select the Run from its Session history. The link retains the Run ID. Inspect the result or use **Stop Run** while it is Running. A linked Research Run retains its own ID and can follow the parent while active.

The preview uses the approved Coding route and synthetic Quellight, Research and script resources. Keep the Studio host alive for detach. On an isolated copy, restart Studio during an active Run and reopen the same URL; the Run is Interrupted and the existing Session remains locked. There is no automatic retry. To check memory, use a fresh Quellight Session and ask it to remember a short synthetic preference; confirm the proposed value. The Run Details memory section identifies the original operation and receipt. **Check save outcome** reads the original operation when evidence is unresolved.

For a fresh Windows checkout install the [pinned VICT packs](../authoring-foundation/dependencies.json) with npm ci. Launch using [scripts/background-preview.ps1](../../../scripts/background-preview.ps1) with an unused port and seed once using [scripts/seed-background-preview.mjs](../../../scripts/seed-background-preview.mjs) with that loopback URL. The launcher uses a port-specific store and will only stop its own verified process when passed -Restart. It preserves the store on restart. Do not point test tooling at the owner’s existing Memory or VICT workspace.

## O-05 results

See the [16 recorded case identities](matrix-observed.json) and [deterministic driver](../../../tests/background-recovery.test.mjs). All faults begin after acceptance and before settlement; the recorded result is authoritative.

| Fault | In-flight turn | Background Run | Memory save | Pending read-only delegation |
| --- | --- | --- | --- | --- |
| Tab close | Same Run and live owner, then Finished | Same Run, stream and owner, then Finished | Same operation Running, then one committed receipt | Same parent, child and invocation Running, then Finished |
| Transport drop | Same Run/owner and cursor, then Finished | Same request and Run; original execution only | Same operation Running, then one committed receipt | Same parent and child ownership; no redispatch |
| Studio process exit | Interrupted, owner lost; no result or replay | Interrupted on the same Run; no replay | Interrupted with proven no commit at the reservation boundary | Interrupted; original VICT invocation fenced and linked child retained |
| Disk-only cold reopen | Interrupted on copied durable state | Interrupted on same Run and store data | Interrupted with original reservation and no effect | Interrupted; same original invocation and child records |

The last row is a cold process using copied disk data without shared-memory indexes. No physical machine was rebooted and no machine-restart continuation is claimed. A recorded completion stays Finished. Unresolved protected effects take precedence as Uncertain. The protected invocation test uses public VICT intent/fence records and proves the original operation remains visible and is not replayed; it does not introduce a new protected tool.

## Evidence boundaries

- Deterministic: start identity/payload and activation mismatch, future/wrong stream cursors, duplicate and reordered deliveries, gap detection and terminal preservation, the 16 cells, concurrent same-store host refusal, abandoned protected intent, before-commit cancellation and transaction rollback, missing receipt or proposal, exact receipt after restoring original evidence and no retry while Uncertain.
- Studio: public Toggle, composer, Run links, Stop, feedback and state badges were exercised by keyboard and pointer in desktop and 390 × 844 Chromium. Fixture tests induced faults in disposable storage; they are not live outcomes. See [public UI control audit](UI-AUDIT.md).
- Live: GLM-5.3 Flash on the approved Coding route. The first checkpoint's desktop-to-narrow closure is captured in [early/](early/); the first live completed parent was 2000489d-4b66-4aa3-a0fd-37c0dc67fd3b, linked child a29ca430-62e8-4df8-907d-2bf682c09c17 and script receipt 68e969dd-126b-43f9-8694-19ef76e49e5a. The exact 95b4624638d67f1da5d178c44dc6e567ae3c7c54 preview Stop recheck is [recorded separately](early/stop-observed.json).
- No new executor or durable signal service, machine resume, package update, provider change or write authority. Raw Mastra's deliberate checkpoint resume and signal wake are conformance results, not Studio capabilities. The only tested mutation is operator-confirmed saved memory; Research is read-only. No release, publishing, upstream change or owner acceptance is implied.

See [verification](VERIFICATION.md) for exact commits, final test attribution, retained findings and the independent verdict.
