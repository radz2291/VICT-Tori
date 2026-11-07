# Integrated V1a owner preview

Radzi accepted bounded A4 at `e94e2b7c903263bc62a7c2ae0bc52edaa56638fd`. The [integrated Studio preview](http://127.0.0.1:48789/) runs `ff130a6e657c3fac8f784c636538c7bf39b550b1`. Its isolated review database contains the new live Session and labeled historical fixture Runs. The child Run now displays `Reference reviewer · r1`, verified in the browser by opening it from the parent and returning to the parent. [Child revision screenshot](integrated-child-revision.png)

In **Agents**, open **V1a Live Review Agent** and inspect the connected Model Reference, Context Source and Memory Policy. Edit the instructions, then **Save** and **Activate** to create a new pinned revision. Choose **Start Session** to send on that revision. The prepared Session is available from **Sessions** if you want to inspect the verified turns first. **Inspect runs** opens the selected Session's receipt. In **Runs**, the historical parent/child and governed read Runs are marked **Deterministic fixture**. Their historical Sessions open as **Fixture history**.

| Evidence | What passed |
| --- | --- |
| Live in this integrated preview | Browser edit, save, activation, Session creation, and Run inspection. Two Z.AI Coding API turns on GLM-5.3 Flash completed with HTTP 200 on the same activation. Both dispatched max output 4,096, temperature 0.4 and top-p 0.8. Explicit demand on the first turn read the pinned reference once. The second made zero source reads and the model recalled the synthetic identifier from Session history. |
| Deterministic fixtures | [A1](A1-INDEPENDENT.md) proved output caps, invalid-draft rejection and restart isolation. [A2](A2-INDEPENDENT.md) proved retries and deadlines. [A3](A3.md) proved context refusal, scoped memory, actual local MCP stdio, and the step-limit boundary. The [approval fixture](A3-APPROVAL.md) exercised allow and decline without an external write. [A4](A4-INDEPENDENT.md) proved schema validation, child authorization, cancellation and linked Runs. |
| Open live limits | Behavior at a 2,048 cap and provider termination at the cap remain unverified. The MCP and child paths in this preview are historical fixture evidence. |

The integrated preview uses the previously permitted Coding route and server-side credential resolution. Its fixture Session history does not allow sending through the live host.

## Agents alignment

Candidate `c279e73915b2b90b95be3d423344b9e597b0434a` on `codex/tori-v1a-a4`. Both examples use the same Studio build. They have separate local execution hosts because the fixture interceptor and Session admission are host-wide.

1. [V1a Live Review Agent](http://127.0.0.1:48789/). In **Agents**, select **GLM-5.3 Flash** and inspect **Max output tokens**. Detach the Integer to edit inline, or expose it again from the Model Inspector. The browser verified 4,096 across those changes and reloaded the saved draft. Open the live Session and **Inspect runs** for the two previously verified Coding turns. This alignment pass made no additional provider turn.
2. [Quellight delegation fixture](http://127.0.0.1:48792/). In **Agents**, select **GLM-5.3 Flash** for the inline 4,096 limit and optional typed binding. Select **Child Agent** on the canvas or in the Library to inspect the exact reference, scope, required grant, task, and expected fixture result. Context and memory are bound to the parent. The MCP node is unconnected. Choose **Start Session**, send “Read the synthetic observatory reference.”, then **Inspect runs** → **Open child Run · completed** → **Open parent Run**.

Chromium on Node 24.15.0 ran the prepared-host fixture walkthrough. Parent `ed3e5a7e-49b1-4aee-9535-94e2186e7075` completed at r9, dispatched 4,096, and accepted the Finding output. Child `3a47d2f3-b4e3-4df0-98ea-3a9a2e8f0963` completed at r1 on activation `v1_b764abe533d5aaf4783628481eed312ee9a8fb68e35b28db638e0cb620c7b664`. The browser followed both links. Reproduce the broader browser check with `TORI_BROWSER_A2=1`, `TORI_BROWSER_A3=1`, `TORI_BROWSER_A4=1`, and `node tests/a1-browser.mjs`. The initial prepared-host probe timed out at a punctuation-sensitive status locator. The rerun matched the status text and completed on r9.

### Saved-definition boundary

The full A1–A4 deterministic Chromium suite passed on `c279e73`, including restart isolation. The sequential Node suite passed 11/11 with `node --test --test-concurrency=1 tests/*.test.mjs`.

Installed `@victframework/runtime@0.4.0-rc.1` publicly exports `AgentProfileRegistry`, which resolves exact child profile references into the parent's activation. TORI's `src/assembly.ts` admits one Agent Definition root. `server/studio.mjs` keeps one editable revision chain, registers it as `tori-local-agent`, and registers the bounded child from `server/a4-runtime.mjs`. The child is `tori.child.reference-reviewer@1`, with one model step, zero tools and a temporary child memory thread. A direct Research Session and child-scoped Project Knowledge or MCP require a second saved definition, reference resolution against it, and governed child context and tool admission. The live host refuses fixture child activation and mismatched Sessions.

### Installed control inventory

The presented surfaces use `@victframework/ui-svelte@0.4.0-rc.1` Select for fixed choices, Button and primitives Button for actions and navigation, Menubar and Dialog for shell commands and dialogs, Checkbox for the context opt-in, and Feedback and StatusBadge for messages and states. `@victframework/ui-ai-svelte@0.4.0-rc.1` supplies Input, Textarea and Conversation. `@victframework/ui-flow-svelte@0.4.0-rc.1` supplies SvelteFlow and Handle. The binding details use a read-only semantic list. The browser observed inline and linked limits, the connected fixture badge, the pinned child revision and both Run links. See [V1a verification](VERIFICATION.md) and [A4 evidence](A4.md) for responsive, disabled and error states.
