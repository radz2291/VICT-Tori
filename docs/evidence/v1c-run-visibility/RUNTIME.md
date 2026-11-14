# TORI-011 runtime builder evidence

Builder: `tori-011-runtime-20261114`. This is a scoped builder handoff to TORI-010, not an independent or whole-slice PASS. Baseline `8f1b68ecde71f3bd9dc2f90f9fd2fb09462256ab`; branch `codex/tori-011-runtime`. Public dependency/continuation findings are in [PROBES](PROBES.md). Main owns host wiring and cumulative qualification; this branch changes only the reusable package, probes, tests and these reports.

## Candidate lineage and retained findings

| Candidate | Meaning |
| --- | --- |
| `3b0fb68` | Installed boundary probe and report before projection implementation. |
| `94b6fbb` | First reusable report package. |
| `9999a1e` | Seven projection checks; normal answer settlement no longer invents Continued working. |
| `bd14741` | Main's A4 rejected-output canary exposed text.delta payload leakage during integration. Operational capture now carries explicit TORI receipt schema and strips unaccepted delta text, retaining sequence/correlation. One test failed because the metadata structural validator used an empty delta, which strict VICT rejects. |
| `c59afad` | Metadata validation repair; eight checks passed, no false delta sequence gap. Installed consumer used these exact package bytes. |
| This report's commit | Studio found the denial fixture used a non-VICT error code; capture returned null and the old test had relied on Run.errorCode. Fixture helper now asserts every capture exists, uses VICT_SCOPE_DENIED and asserts an actual tool.failed row. Eight checks pass. No product bytes changed by that fixture repair. |

The failed integration evidence remains with TORI-010 at `.local/run-visibility/host-integration.tap`; the final integration report must retain its outcome. The red metadata test at `bd14741` remains reproducible from Git. No failed candidate is represented as final qualification.

## Rerun commands and results

Windows Node 22.13.1 / npm 11.19.1. `npm ci --no-audit --no-fund` installed 413 packages; existing posthog-node engine advisory and esbuild install-script advisory were recorded. No dependency changed; lock blob remains `746b69fbefb4a9123029f54ab4ca47a00aaa5310`.

| Command | Result / scope |
| --- | --- |
| `node scripts/probe-run-visibility.mjs` | PASS, strict vocabulary, unknown/private field rejection, repeated same-ID runTurn resets sequence and budget. Negative proof of continuation gap. |
| `node --test tests/run-visibility.test.mjs` | 8/8 PASS, strict capture, rejected output payload fence, purity, real answer groups, duplicate/gap/late/foreign event behavior, four-state truth, budget unknowns/deduplication and historical unavailable evidence. |
| `node scripts/probe-background-vict.mjs` | PASS rerun at inherited bytes. Detach/rejoin original Run, repeated replay stable, missing transient range explicit, original-turn cancellation reaches model, wrong turn refused, cold ledger reopen with no dispatch and no resume API. |
| `node --test tests/a4.test.mjs` | 2/2 PASS on builder branch before main host integration. Exact child activation/invocation, revoked child zero dispatch, and parent cancellation reaching child. Not question exchange proof. |
| `node scripts/probe-run-visibility-consumer.mjs` | PASS. Verified all 16 VICT archives against lock SHA-512 integrity, packed reusable artifact and installed it plus public contracts into a fresh temp consumer offline. Imported public package entry from consumer node_modules, no Studio/source alias and zero network dispatch. |

Artifact `tori-run-visibility-0.1.0.tgz` SHA-256: `476e7925560a31dcfd2f163b5d9222f394f321ba367dba2e691aeacb13fe55a5`. The consumer script prints the complete 16-archive SHA-256 manifest for integration evidence. Package bytes at `c59afad` are the artifact source. Pack/install is local only; no publication or license choice.

## Data and classification inventory

| Value / behavior | Classification and owner | Enforcement / evidence |
| --- | --- | --- |
| `tori.run-report@1`, `tori.public-event-receipt@1`, closed strict import and field shape | Governed schema mechanics; Run Visibility package | Real installed VICT validator; unknown/private rejection; explicit partial delta receipt is never emitted as VICT stream. |
| Quiet/Summary/Full | Presentation preference owned by Studio; does not authorize execution | Package accepts no preference and is pure; view switching operates over the same report. |
| Working / Continued working and content.completed boundaries | Governed report interpretation, Run Visibility | Actual source events; terminal/usage/memory settlement alone does not start new work. Stable IDs include Run, stream and first sequence. |
| Duplicate, gap, foreign, terminal and out-of-order rules | Governed report integrity mechanics | Stream/seq deduplication; visible gaps; bound Run context; authoritative saved status wins over late events. |
| Four outcome labels | Existing governed Background outcome mapping | Transport gaps/disconnect do not infer interruption; tests cover running sparse stream and uncertain historical snapshot. |
| Null usage, no team limit, nonnegative remainder arithmetic | Governed accounting interpretation | No unknown-to-zero fallback, no summed cap. Distinct Run rows dedupe by ID; retry use remains unknown unless independently receipted, never attempts-minus-steps. |
| Question exchange cap default 1 / ceiling 2 | Proposed authoring knob/bound owned by slice; no runtime grant implemented | Runtime mechanism unavailable. No endpoint or dispatch added. Proposed values remain for owner review, not previously accepted. |
| Public reasoning unavailable text | Governed missing-capability disclosure | No reasoning event or private field accepted; separate upstream R-VIS-01 remains outside scope. |
| Probe retention 60,000 ms, fixture maxSteps/toolCalls, temp stores | Test-only fixture settings, never product policy | Synthetic isolated conformance; exact fixtures are versioned. |

No new behavioral grant, runtime, scheduler, network integration, upstream change or memory-family knob is added. Directive owns recognition budgets/deadline and deployment retention. The memory node-family slice retains admission budget, record cap, legacy draft-context budget and proposal lifetime. These ownership boundaries are unchanged.

## Honest acceptance limits

RV-01 probe/report is demonstrated at the pinned installed boundary. The reusable projection supports deterministic portions of RV-02/03/04/08/09 and installed-consumer portion of RV-12. Studio and final host integration evidence remain TORI-010/012 responsibilities, followed by TORI-013 fresh verification.

RV-06 remains BLOCKED: a synchronous child callback can stay pending, but the public pinned parent runner has no answer-step injection preserving the existing budget scope; invoking it again resets scope. Question-specific activation/limit/revocation/cancellation/race tests in RV-05/07 cannot be claimed. No live exchange was run. The working display subset cannot receive whole-slice PASS or close the missing capability through fixtures. Owner acceptance remains with Radzi.

## Independent replay-order repair

The fresh verifier identified, and TORI-010 reproduced at integrated `024afe5`, an arrival-order defect: captures `[seq1 started, seq3 completed, seq2 started]` left gap 2 and discarded the replayed seq2. The earlier loop applied terminal fencing before replay had restored source order. This is an in-scope RV-03 defect, not a reason to reinterpret replay as new execution.

The repair first validates and deduplicates captures, then sequences each originating stream independently. Gap detection and terminal fencing apply to that stream's sequence; a later-arriving earlier event can now fill the gap without regressing the authoritative saved Run status. Streams remain separate blocks in first-observed order, with an explicit `eventOrder` statement that this is not a global timeline. Answer/group state resets per stream, so one stream's answer cannot manufacture Continued working in another stream.

`node --test tests/run-visibility.test.mjs`: **10/10 PASS** on the repaired package. The two added regressions prove gap fill, terminal truth, duplicate handling, stable group identity, source immutability and independent cross-stream boundaries. The same ten tests against prior package bytes at `2b08122` give **8 PASS / 2 FAIL**, retained locally in `.local/run-visibility-replay-red.tap`; both the false gap and cross-stream boundary failures remain reproducible. Existing installed dependencies were available; no fresh install was performed during the disk-space constraint. The earlier artifact hash applies only to the earlier package, and the integrated final candidate must repack/recheck the changed package before final RV-12 evidence. Work remains in Review under the documented manual repair discussion; no owner acceptance is inferred.
