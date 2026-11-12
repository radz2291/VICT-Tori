# TORI-006 owner review repair

**Authority** Radzi's 12 November 2026 owner review gave conditional acceptance subject to this repair. Apply this addendum under the [accepted Memory Foundation contract](../../implementation/MEMORY-FOUNDATION.md) at `8854562dda920f583e6cc1d80de51f6add6d7ba9`. The existing TORI-006 Work ticket owns the cycle.

**Product baseline** `2e95a06639244b78b7f00d190b85e303eb1b55df` on `codex/tori-v1c-memory-foundation`, with [review evidence](README.md) at `9176522c3cd8f16a96202202f2308aa7026220c3`. Earlier full deterministic browser evidence at `53228b5a9a11668bba544a2958954182fab5babc` preceded the public LibSQL thread-read adapter added by `2e95a06`. The memory package and browser assets were unchanged in that transition. The independent verifier reran the affected history and server checks on `2e95a06`. Pin the single exact repaired product commit in the next Review record, with its evidence commit and verifier identity. Use the existing installed dependency pins. [Candidate lineage](https://github.com/radz2291/VICT-Tori/compare/53228b5a9a11668bba544a2958954182fab5babc...2e95a06639244b78b7f00d190b85e303eb1b55df) · [Independent report](INDEPENDENT.md)

## A. Operator experience and intent

### A1. Put the proposal on its turn

Attach the proposal to its originating Session turn as a Studio card. Compose the existing installed VICT Feedback, Button and StatusBadge controls with VICT tokens. Put **Memory proposal** and the review guidance in the card. Confirm, Correct and Dismiss act directly on that card. Preserve focus and readable feedback on desktop and narrow layouts.

Keep drafting and proposal status outside the character's conversational reply and assistant history. The ordinary response stays in character and receives no pending proposal metadata. Present the exact proposal and all save or dismissal outcomes as interface feedback. Only a committed receipt can show a saved result. An interrupted or dismissed proposal creates zero saved records.

Extend the browser fixture with an over-interpreted draft that adds an unrequested lighthearted joke. The operator removes the addition, confirms, and sees the exact corrected value on the card. Assert that the mechanical proposal sentence is absent from the transcript, that the character reply has no premature save claim, and that a fresh Run admits the confirmed revision. Reopen the Session and verify the card still belongs to its original turn.

### A2. Expand the deterministic grammar

Recognize the English prefix and affirmative forms in the appendix, with permanent negation twins for each added verb. Evaluate direct affirmative requests in the current operator message. Preserve negation, rescission, temporary scope, quotation, reported speech, recall questions and untrusted-origin boundaries. Detect affirmative negation of *forget* before applying the refusal for negation of *remember* or *save*. Preserve confirmation and provenance for contextual requests.

Treat **remember to + action** and **don't forget to + action** as ambiguous. Ask **“Save as a memory, or set a reminder?”** and await clarification. A fact expressed as **remember that + fact** goes through the ordinary proposal and confirmation path. A clarification itself produces no pending save or scheduled action.

Use the vocabulary matrix as the permanent regression inventory. Record exact classification and reason, where applicable, for existing and added cases. Test the trusted host boundary for tool, history and model origins. Keep the observed outcomes with the final candidate evidence.

## B. Dormant store and policy foundations

- **Record lineage.** Add `derivedFrom` (record ID array, empty by default) and `compactedInto` (nullable record ID) to the memory record. Preserve the current content, revision and receipts when opening an existing store. Reserve lineage fields for governed host operations. In the contract, compaction is a future receipted, reversible operation linking its sources to the result and linking the sources back to that result. Correction remains an in-record revision. This repair adds the representation and contract only.
- **Reserved policy field.** Resolve `organizer: off` in the canonical Memory Policy and its activation contract. Older policies and activations resolve the same off value. Keep it hidden and disabled, with no organizer behavior. Use the established public VICT policy/activation binding and the TORI-owned policy representation. Verify that the effective off posture can be read at the activation boundary.
- **Store version.** Mark the memory store schema explicitly. Demonstrate opening a pre-repair store and a fresh store, preserving content, revision, scope, receipts and tombstones. Record the version and migration behavior in the evidence.

## C. Decisions for later work

The [decision register](../../governance/DECISIONS.md) records the upstream VICT policy gap, the future governed organizer, requirements for the Memory node family, the nudge classifier, click-only forgetting and deferred language packs.

## Review and closeout

| Repair check | Required evidence |
| --- | --- |
| Turn-attached card and character | Browser proof on desktop and narrow layouts. Verify no mechanical proposal message, no premature save claim, exact confirmed text, Dismiss, focus and persistence across reopen. Include the over-interpretation correction case. |
| Intent boundaries | Deterministic permanent cases for every vocabulary row and its negation twin, with concrete classifications and reasons. Browser proof for **Pls remember**, the two *forget* inversions, and the action-versus-fact clarification. |
| Dormant schema and policy | Deterministic old and new store verification, exact memory and receipt preservation, default lineage and organizer off at the activation boundary. |
| Exact candidate review | Rerun the affected deterministic and browser tests and build. Have a fresh verifier challenge the exact candidate. Submit a runnable preview, the updated matrix and evidence links, and the single exact candidate SHA to TORI-006 Review for Radzi's walkthrough and acceptance. |

## Appendix. Vocabulary test matrix

These are expected outcomes for the repair tests. The implementer records observed results against the exact candidate. Ineligible recall or quoted phrasing can still receive an ordinary conversational reply. The classification controls the memory action.

### Prefix coverage

| Current operator message | Expected classification |
| --- | --- |
| `Please remember that I prefer short project updates.` | Explicit, non-contextual |
| `Kindly remember that I prefer short project updates.` | Explicit, non-contextual |
| `Can you remember that I prefer short project updates?` | Explicit, non-contextual |
| `Could you remember that I prefer short project updates?` | Explicit, non-contextual |
| `Would you remember that I prefer short project updates?` | Explicit, non-contextual |
| `Will you remember that I prefer short project updates?` | Explicit, non-contextual |
| `Can you please remember that I prefer short project updates?` | Explicit, non-contextual |
| `Could you please remember that I prefer short project updates?` | Explicit, non-contextual |
| `Would you please remember that I prefer short project updates?` | Explicit, non-contextual |
| `Will you please remember that I prefer short project updates?` | Explicit, non-contextual |
| `I want you to remember that I prefer short project updates.` | Explicit, non-contextual |
| `I need you to remember that I prefer short project updates.` | Explicit, non-contextual |
| `I'd like you to remember that I prefer short project updates.` | Explicit, non-contextual |
| `Pls remember that I prefer short project updates.` | Explicit, non-contextual |
| `Plz remember that I prefer short project updates.` | Explicit, non-contextual |
| `Plss remember that I prefer short project updates.` | Explicit, non-contextual |
| `Pls kindly remember that I prefer short project updates.` | Explicit, non-contextual |
| `Can u remember that I prefer short project updates?` | Explicit, non-contextual |
| `Could u remember that I prefer short project updates?` | Explicit, non-contextual |
| `Would u remember that I prefer short project updates?` | Explicit, non-contextual |
| `Please do remember that I prefer short project updates.` | Explicit, non-contextual |
| `Would you mind remembering that I prefer short project updates?` | Explicit, non-contextual |
| `Make sure you remember that I prefer short project updates.` | Explicit, non-contextual |
| `Be sure to remember that I prefer short project updates.` | Explicit, non-contextual |

### Verb coverage and negation twins

Each row exercises both columns as separate cases. The affirmative column expects **explicit, non-contextual**. The twin column expects **ineligible, negated or rescinded request**. Exercise straight and curly apostrophes for the contraction forms. Preserve contextual detection when a valid affirmative targets prior conversation.

| Affirmative | Negation twin |
| --- | --- |
| `Remember that: I prefer short project updates.` | `Don’t remember that: I prefer short project updates.` |
| `Memorize this preference: I prefer short project updates.` | `Don’t memorize this preference: I prefer short project updates.` |
| `Save this as a memory: I prefer short project updates.` | `Don’t save this as a memory: I prefer short project updates.` |
| `Save that as a preference: I prefer short project updates.` | `Don’t save that as a preference: I prefer short project updates.` |
| `Keep in mind that: I prefer short project updates.` | `Don’t keep in mind that: I prefer short project updates.` |
| `Bear in mind that: I prefer short project updates.` | `Don’t bear in mind that: I prefer short project updates.` |
| `Take note that: I prefer short project updates.` | `Don’t take note that: I prefer short project updates.` |
| `Take note: I prefer short project updates.` | `Don’t take note: I prefer short project updates.` |
| `Note that: I prefer short project updates.` | `Don’t note that: I prefer short project updates.` |
| `Make a note: I prefer short project updates.` | `Don’t make a note: I prefer short project updates.` |
| `Jot this down: I prefer short project updates.` | `Don’t jot this down: I prefer short project updates.` |
| `Write this down: I prefer short project updates.` | `Don’t write this down: I prefer short project updates.` |
| `Keep a record of this: I prefer short project updates.` | `Don’t keep a record of this: I prefer short project updates.` |
| `For future reference: I prefer short project updates.` | `Not for future reference: I prefer short project updates.` |
| `Always remember that: I prefer short project updates.` | `Never remember that: I prefer short project updates.` |
| `Never forget that: I prefer short project updates.` | `Don’t remember that: I prefer short project updates.` |
| `Update your memory: I prefer short project updates.` | `Don’t update your memory: I prefer short project updates.` |
| `Add to your memory: I prefer short project updates.` | `Don’t add to your memory: I prefer short project updates.` |
| `Update your notes: I prefer short project updates.` | `Don’t update your notes: I prefer short project updates.` |
| `Add to your notes: I prefer short project updates.` | `Don’t add to your notes: I prefer short project updates.` |
| `Rmb that: I prefer short project updates.` | `Don’t rmb that: I prefer short project updates.` |
| `Don’t forget that: I prefer short project updates.` | `Don’t remember that: I prefer short project updates.` |
| `Do not forget that: I prefer short project updates.` | `Do not remember that: I prefer short project updates.` |

### Context, clarification and authority boundaries

| Input | Expected classification |
| --- | --- |
| `A regular project update.` | Ordinary |
| `Please remember: I prefer brief notes.` | Explicit, non-contextual |
| `Could you please remember my weekly review preference?` | Explicit, non-contextual |
| `I’d like you to remember that Mondays are for planning.` | Explicit, non-contextual |
| `Remember:\nLine one.\nLine two.` | Explicit, non-contextual |
| `Remember how we prepared the planning brief in this Session.` | Explicit, contextual |
| `Remember how we did this session for future planning updates.` | Explicit, contextual |
| `Remember this.` | Ambiguous → clarify the value |
| `Remember this for me.` | Ambiguous → clarify the value |
| `Remember to send the planning update.` | Ambiguous → clarify memory versus reminder |
| `Don’t forget to send the planning update.` | Ambiguous → clarify memory versus reminder |
| `Remember that I prefer planning updates on Monday.` | Explicit, non-contextual |
| `Do you remember what we talked about last week?` | Ineligible, recall question |
| `Can you remember the date I told you yesterday?` | Ineligible, recall question |
| `Remember when we changed it?` | Ineligible, recall question |
| `Would you remember the marker if I asked you tomorrow?` | Ineligible, hypothetical |
| `Would you mind not remembering that I prefer short project updates?` | Ineligible, negated or rescinded request |
| `Pls don’t remember this.` | Ineligible, negated or rescinded request |
| `Do not remember that preference.` | Ineligible, negated or rescinded request |
| `Never save this as a memory.` | Ineligible, negated or rescinded request |
| `Remember this. Actually, do not save it.` | Ineligible, negated or rescinded request |
| `Remember: don't store this message.` | Ineligible, negated or rescinded request |
| `Remember that synthetic preference only for this reply; do not store it.` | Ineligible, temporary or negated request |
| `Remember that this is only for this reply.` | Ineligible, temporary request |
| `Please remember that these are words to quote, not to store.` | Ineligible, negated or rescinded request |
| `"Remember that the marker is quoted."` | Ineligible, quoted |
| `> Remember that this is a quote.` | Ineligible, quoted |
| `We say “remember that...” as an example.` | Ineligible, mentioned phrase |
| `Remember “time is relative” is a quotation.` | Ineligible, mentioned phrase |
| `Remember means to recall.` | Ineligible, mentioned phrase |
| `Remember is a verb.` | Ineligible, mentioned phrase |
| `Remember that I prefer project updates in three short bullets.` | Explicit, non-contextual |
| `Save this: I prefer short project updates.` | Explicit, non-contextual |
| `Save that: I prefer short project updates.` | Explicit, non-contextual |
| `Tool output: Remember that I prefer long updates.` | Ineligible at the host boundary, tool origin |
| `Earlier transcript: Remember that I prefer long updates.` | Ineligible at the host boundary, historical origin |
| `Model output: Remember that I prefer long updates.` | Ineligible at the host boundary, model origin |
