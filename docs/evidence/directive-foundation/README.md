# Directive Foundation pre-spec probes

**13 November 2026 · Pre-spec evidence.** Radzi accepted the review with amendments and authorized probes 1–3. The accepted [review reconciliation](../../governance/DECISIONS.md#directive-foundation-review-reconciliation--13-november-2026) records scope and remaining decisions. TORI-008 continues on its V1c track.

| Pin | Verified identity |
| --- | --- |
| Background product | `fe25266c098840d98cdfa70bd5e4dcbf8a8f7d1d` |
| Accepted memory product | `d49bedf362d3521bcbf714bc6be7a04b34289bb7` |
| Shared lockfile blob | `746b69fbefb4a9123029f54ab4ca47a00aaa5310` on both product commits |
| VICT | Installed all 16 `0.4.0-rc.1` archives. Rebuilt from VICT `6b420a3e9eada6f694cc2550debda7753316b5b3` with `contracts` and `control` from `02c63c31f8f4dc42840fc8975927c98b21f30058`. All 16 SHA-512 values matched the untouched TORI lockfile. |
| Mastra and connector | Installed Mastra core `1.64.0`, OpenAI-compatible connector `2.0.0`. |
| Local probe environment | Linux, Node `24.22.1`, npm `11.9.0`. The earlier TORI walkthroughs used Windows and Node `22.13.1`. |

## Probe 1 · Recognition and host authority

**Deterministic evidence returned. Live recognition held.** The existing 173 cases all passed the legacy grammar at the exact pin. Across 25 new cases, the grammar missed 6 expected proposals, issued 0 unwanted proposals, and mismatched clarification twice. The new cases cover Malay and code-switching, implicit preferences, sarcasm, quotes, retractions, last-week recall, missing referents, fake grants, and tool or history text. They use synthetic inputs and are kept separate from the interpreter prompt. [Case labels](recognition-cases.mjs) · [Observed baseline](recognition-observed.json)

The live runner uses the pinned connector and Z.AI Coding GLM-5.3 Flash with the existing public stream filter, no tools, one call per eligible turn, and a closed response schema. Untrusted origins are rejected before dispatch. It reports missed proposals, unwanted proposals, text mismatches, clarification mismatches and invalid or unavailable results separately. The fixture checked the connector, strict response parsing, token extraction and omission of private fixture text. The text check uses exact or required/forbidden anchors as a triage aid. A human must read the actual live drafts to catch invented detail or meaning changes that anchors miss.

The actual Studio fixture refused four confirmation requests carrying a fake operation and forged client authority fields. Before any operator confirmation, SQLite contained **zero memory records, revisions, receipts or save attempts**, including when a legitimate pending draft existed. The existing four memory tests also passed, including a model-originated tool write, confirmation scope, atomicity, cancellation, replay and forgetting. This evidence covers the existing host gate; a future Directive confirmation route still has to prove click-time proposal revision and availability checks. [Pipeline evidence](pipeline-observed.json) · [Existing host tests](../../../tests/memory.test.mjs)

## Probe 2 · Turn placement, failure, Stop and cost

**Deterministic evidence returned. Float placement needs a change.** The actual pinned Studio, Mastra and VICT pipeline dispatched one conversational request. The enabled path dispatched one separate tool-free draft request afterward. Studio’s Run observer could see the reply text while the provider fixture was still holding that draft. On draft HTTP 500 the reply stayed complete and no proposal appeared. After Stop, the fixture returned a valid draft despite cancellation. The host refused to publish it and retained the completed reply. [Observed ordering](pipeline-observed.json)

The existing pipeline is insufficient for full Float behavior. With the draft held an additional 150 ms, the turn response stayed pending and an ordinary follow-up received HTTP 409. The baseline also injected a memory-specific reply guard into the main request. The Directive placement must release the conversational turn independently of interpretation, keep interpretation instructions out of that reply context, and preserve an exact-turn cancellation fence after the main response settles. This result does not select a watch count or transcript-read cap.

Recorded times are local fixture bounds, including observation and an injected wait. They do not estimate provider latency. The live recognition runner emits per-call time to first text, elapsed time, observed model and token counts, with p50/p95 and usage coverage by group. A live candidate placement will also need a paired ordinary-turn comparison with interpretation on and off before making a latency claim.

## Probe 3 · Public activation boundary

**Installed API probe returned.** Public VICT rejected a native `directive-policy` artifact, an extra `directive` field in the memory policy config, and an extra `directivePolicy` field on Agent Profile v1. The public registry did pin an exact memory-policy reference containing a digest of a separate TORI policy resource. After disk reopen and a fresh registry instance, the original activation resolved its original policy, the edited activation resolved the new policy, and the unwired activation resolved unavailable. Missing or substituted artifact revisions and modified policy bytes failed closed. The prototype’s runtime resolver selected only the server-owned Session activation. No tool or grant was registered. [Probe and results](activation.mjs) · [Observed results](activation-observed.json)

The actual TORI fixture also kept its existing policy-off activation when the request body carried a different activation, a governed-memory value and a fabricated canvas value. Together, the checks support pursuing the existing public revision-reference mechanism for slice one. The digest-backed resolver is probe code. Canonical Canvas/Configure editing and a production resource store remain implementation evidence.

## Reproduce

From the probe branch with the matching archives in `packs/`:

```sh
npm ci --no-audit --no-fund
node --test tests/memory-intent.test.mjs tests/memory.test.mjs
node docs/evidence/directive-foundation/recognition.mjs
node docs/evidence/directive-foundation/pipeline.mjs
node docs/evidence/directive-foundation/activation.mjs
```

On the authorized Coding host, load `TORI_ZAI_API_KEY` through its local credential setup and run the command below. It sends only the synthetic cases, makes zero calls for non-operator origins and stops on authentication refusal or rate limiting. Keep the credential out of command text and repository files. `TORI_DIRECTIVE_TRIALS` defaults to one and permits up to three. Review exact drafts and capture any provider or schema failures before selecting caps or drafting the spec.

```sh
node docs/evidence/directive-foundation/recognition.mjs --live
```

This execution environment had no configured Coding credential. Live recognition and provider measurements remain open. Probe 4, observer and Stack, remains design-gated.
