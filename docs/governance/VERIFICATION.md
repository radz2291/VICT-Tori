# Verification and stage operation

## Roles

One stage manager owns the accepted stage outcome, integration, candidate lineage and owner report. It may implement and may delegate bounded non-overlapping work. A **fresh verifier** independently inspects an exact candidate, challenges the claims, and does not repair the candidate in place. Product/creative judgement belongs to the owner where specified.

Independent work means a fresh session/context and candidate checkout where practical, not the builder changing its role label. If delegation is unavailable, arrange sequential independent sessions. Lack of independent evidence is HELD, not PASS. This bootstrap's static checks do not constitute a product-stage verdict.

## Stage loop

1. Reconstruct authority, product outcome, base SHA and current evidence.
2. Select a bounded slice and map acceptance IDs before coding.
3. Build and run appropriate deterministic/installed checks. Retain failures.
4. Commit a candidate with dependency/fixture identities.
5. Fresh verifier attempts to falsify the claims; records exact candidate, evidence and findings.
6. Manager triages findings, repairs in-scope defects, commits a new candidate and reruns affected checks/regressions. Independent recheck follows for affected claims.
7. Record final verdict, owner-review status and next authority in STATE/HANDOFF. Push only to the authorized branch/destination; verify remote SHA.

Do not stop after one builder/verifier exchange if an in-scope defect can be repaired. Do not advance past a failed/held required gate. Routine implementation choices and repairs do not require repeated owner confirmation; material UI exceptions, external rights and actual scope forks do.

## Verdicts

| Verdict | Meaning |
| --- | --- |
| PASS | Every required criterion independently demonstrated at the stated candidate |
| PASS WITH NON-BLOCKING FINDINGS | All required behavior passes; bounded minor findings have an owner and next check |
| HELD | Required evidence or owner judgement is missing |
| FAIL | Observed behavior contradicts a required criterion |
| BLOCKED | Required external dependency, artifact, right or authority is unavailable |

At criterion level use PASS, FAIL, NOT DEMONSTRATED, or NOT APPLICABLE with a specific reason. “Not applicable” cannot remove an agreed product expectation. Runtime support limits must map to a held/blocked final criterion where that behavior is required.

## Evidence standard

For each claim record repository, base/candidate full SHAs, verifier identity and report commit, environment, exact dependency/fixture revisions, commands and exit results, setup/inputs, browser dimensions/routes, observed outputs, negative probes, direct evidence paths and limits. Use the [report template](../evidence/TEMPLATE.md).

Separate D/S/L/O evidence from [Acceptance](../specs/ACCEPTANCE.md). Include actual IDs/revisions/receipts for persistence and authority. A screenshot cannot prove a backend effect. Source inspection cannot prove browser usability. A model-generated explanation is not a receipt. Historical test totals remain attributed to their original source and scope.

Keep operational evidence redacted and small enough to review, while preserving meaningful errors and original failed observations. Do not discard important content through arbitrary caps. Store safe detailed artifacts with an index if needed. This public repository uses synthetic examples; private captures/data belong in an approved separate location with a safe reference.

## Mutation after verification

If product/test/dependency/fixture bytes change, reverify affected claims at the new candidate. Documentation-only changes may retain prior runtime evidence only after confirming unchanged relevant bytes and explaining attribution. Never label a new product SHA verified simply because an older SHA passed.

## Owner reviews

Owner UI approval occurs on the actual U0 candidate, not a design description. Record what was tried, accepted, and requested for revision. Owner creative judgement is also required for T05/T06. Do not conflate approval to build with acceptance of the built result.

## Scope transitions

To activate a later stage, record the owner instruction and update HANDOFF/STATE. Keep accepted product requirements intact, including all nine tests. If the owner changes a requirement, append a decision with prior rule, new authority, changed criteria and migration; do not erase past evidence. Pause only the genuinely dependent work and finish unaffected authorized work.
