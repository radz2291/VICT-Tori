# Directive Foundation — authorized Windows probe handoff

**Status: live execution outstanding.** Radzi has authorized these probes on the existing Z.AI Coding host. The cloud session has Linux/Node 24.22.1, no Coding credential and no command runner for the authorized Windows machine. No live call was made in this closure pass. This is a probe handoff, not authorization to implement the product or open the implementation ticket.

## Pins and working boundary

Use an isolated checkout of `codex/tori-directive-probes`, including this handoff. Record its exact commit before running. Preserve existing Studio instances, workspaces and unrelated changes. Use synthetic inputs and disposable data directories.

| Required identity | Pin |
| --- | --- |
| Product under probe | `fe25266c098840d98cdfa70bd5e4dcbf8a8f7d1d` |
| Accepted memory product | `d49bedf362d3521bcbf714bc6be7a04b34289bb7` |
| Lock blob, unchanged | `746b69fbefb4a9123029f54ab4ca47a00aaa5310` |
| Windows runtime | Node `22.13.1`; record npm and Chromium versions |
| VICT | All 16 `0.4.0-rc.1` tarballs must match lockfile integrity |
| Model stack | Mastra `1.64.0`, OpenAI-compatible connector `2.0.0` |
| Live route | Z.AI Coding, `glm-5.3-flash` |

The accepted product's npm version was `11.19.1`. Use the unchanged lockfile and the baseline's matching public tarballs. Do not upgrade dependencies or substitute a different provider to obtain a passing result. Probe scripts and draft documentation sit above the product baseline; they are not product implementation.

## Run recognition first

Reuse the existing authorized local credential loader. The runner expects `TORI_ZAI_API_KEY` in its process environment. If Studio obtains its credential through another existing local loader, resolve it into this one process without printing it, embedding it in command text, writing a credential file, or committing it. Never ask Radzi to paste it into chat. Verify the selected route is Coding. If the credential or authorized host is unavailable, report that dependency and stop live work.

Record the environment and lock identity, install with the existing archives, and rerun the prepared deterministic probes on Windows:

```powershell
node --version
npm --version
git rev-parse HEAD
git rev-parse HEAD:package-lock.json
npm ci --no-audit --no-fund
node --test tests/memory-intent.test.mjs tests/memory.test.mjs
node docs/evidence/directive-foundation/recognition.mjs
node docs/evidence/directive-foundation/pipeline.mjs
node docs/evidence/directive-foundation/activation.mjs
```

Check each exit status before continuing. With the existing credential loaded privately, run:

```powershell
node docs/evidence/directive-foundation/recognition.mjs --live
```

Capture stdout to a uniquely named local evidence file. Capture sanitized errors separately. The default is one trial; do not run extra trials merely to select a favorable result. `TORI_DIRECTIVE_TRIALS` permits up to three when repeated-run measurement is justified and reported. Preserve every attempted trial. HTTP 401, 403 or 429 stops the run immediately; do not retry, switch credentials or change routes to bypass the refusal.

One complete trial has 173 baseline cases and 25 held-out cases. Of these, 167 and 23 respectively are operator-origin cases. The remaining eight must produce zero provider calls. Expected labels comprise 65 baseline save requests, 98 no-proposal cases and 10 clarifications; the held-out set has six save requests, 17 no-proposal cases and two clarifications. Do not silently relabel difficult cases. Hold the prompt and labels fixed for the first run. If the prompt is subsequently tuned against these results, disclose that the held-out set is now development data and add a fresh held-out set for the next quality claim.

The prepared harness uses a 30-second request timeout, a 768-token output cap and temperature zero. These are experimental settings, not the accepted product deadline or token budget. It does not call the memory save path and must not be cited as the proof of the host's authorization boundary. Rerun the separate host-gate probes for that evidence.

## Return separate rates and actual text

Join each output row to its case ID in `recognition-cases.mjs`. Present baseline and held-out groups separately, plus coverage and any repeated-trial variation. Do not count a transport failure or invalid schema as successful recognition.

| Measure | Required numerator and denominator |
| --- | --- |
| Missed requests | Expected save cases returning valid `none` or `clarify`, divided by expected save cases with valid results. Also show the number of expected saves lost to invalid/unavailable results and overall proposal delivery out of all expected saves. |
| Unwanted proposals | Valid proposals on expected no-proposal or clarification cases, divided by those eligible operator-origin cases with valid results. List non-operator gate results separately so they cannot inflate model accuracy. |
| Incorrect draft text | Proposals on genuine save requests containing invented, omitted or changed meaning, divided by all returned proposals on genuine save requests. Report anchor triage and the reviewed verdict separately. |
| Clarification mismatches | Valid results where actual versus expected clarification differs, divided by eligible cases with valid results. Split unnecessary clarification from missing clarification. |
| Invalid results | Responses that fail the closed schema, finish or output-bound checks, divided by attempted provider calls. |
| Provider unavailable | Failed/timed-out calls with no usable result, divided by attempted provider calls; separate from invalid responses. |

Use `N/A` when a denominator is zero. Report every denominator and raw count with the percentage. The runner now separates `invalid` from `unavailable`; its `wrongText` field remains an anchor-based triage signal only.

For the text review, prepare a table of the latest synthetic message, cited context, expected meaning, actual drafted text verbatim and the reviewer finding. Read every proposed draft for invented details, changed scope, lost qualifications and incorrect referents, including drafts whose anchors pass. Give Radzi that table for the requested human review. Never label an automated check or an agent's own assessment as human acceptance. Keep private provider reasoning, credentials and raw provider error bodies out of evidence.

## Placement, budget, latency and tokens

Report p50/p95 and the sample count for completion latency and time to first public text, token totals, per-call usage coverage and observed model identity. Missing usage is unknown, not zero. Report tokens before money; any monetary estimate must name its verified rate and date.

The initial corpus mostly has short contexts. It cannot alone justify a long transcript-read limit. In a probe-only extension, test bounded synthetic context sizes with the needed referent near the beginning, middle and end. Include a case whose required source would fall outside the limit. Keep the current operator message intact, preserve source-message identities and show context unavailable or clarify when interpretation cannot resolve the referent. Record input size in UTF-8 bytes as well as observed input tokens. Freeze and report each tested size; do not read real user transcripts for this experiment.

Compare ordinary reply timing with interpretation disabled versus enabled on equivalent synthetic turns, using the existing host route and pinned provider. Record the point at which a second Send is accepted. The baseline currently has the Float 409 defect and reply-context contamination; document those failures rather than claiming a fixed Float implementation. A probe-only placement experiment may measure a separate pass, failure tolerance and Stop fencing without changing the product. Distinguish its result from the unchanged Studio baseline. Record zero extra interpretation calls for non-operator sources, preservation of the reply on a failed pass, and rejection of a valid late proposal after Stop.

Return a decision table to Radzi with measured evidence, proposed threshold and the cost or usability tradeoff for each quality rate, transcript-read budget and interpretation deadline. These values require Radzi's selection. No values are adopted by this handoff. An acceptable threshold for missed requests does not relax the deterministic requirement of zero unauthorized writes, zero non-operator dispatches or confirmation-time scope checks.

## Windows acceptance and next gate

The [draft contract](../../implementation/DIRECTIVE-FOUNDATION.md) requires the full deterministic suite, applicable baseline browser suites and build on Windows/Node 22.13.1 for product acceptance, including the eventual new Directive tests. The initial Windows rerun can record the unchanged baseline now; the final candidate must run them again after implementation. Run `npm test` and `npm run build`, and account explicitly for the existing A1–A4, V1b, Authoring, Memory and Background browser coverage. Use their established isolated fixture setup and keep live flags off for deterministic suites. `background-browser.mjs` requires its seeded fixture host and full recovery mode; it is not a standalone live command against the owner's workspace. Record exact browser commands, host setup and restart actions. A skipped suite needs a recorded reason, not a passing checkmark.

Publish sanitized probe evidence and the proposed decision table. Return to Radzi for threshold/budget/deadline decisions and final draft review. Do not mark the revised spec accepted, pin it as the implementation contract, retire the grammar, or open the implementation Work ticket yet. After that owner gate, the ticket must pin the accepted spec commit and the three exact product/memory/lock identities above. Fresh independent verification and Radzi's walkthrough remain required. TORI-008 and the Sessions copy pass continue independently.
