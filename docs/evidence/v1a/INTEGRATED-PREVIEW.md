# Integrated V1a owner preview

Radzi accepted bounded A4 at `e94e2b7c903263bc62a7c2ae0bc52edaa56638fd`. The [integrated Studio preview](http://127.0.0.1:48789/) runs `ff130a6e657c3fac8f784c636538c7bf39b550b1`. Its isolated review database contains the new live Session and labeled historical fixture Runs. The child Run now displays `Reference reviewer · r1`, verified in the browser by opening it from the parent and returning to the parent. [Child revision screenshot](integrated-child-revision.png)

In **Agents**, open **V1a Live Review Agent** and inspect the connected Model Reference, Context Source and Memory Policy. Edit the instructions, then **Save** and **Activate** to create a new pinned revision. Choose **Start Session** to send on that revision. The prepared Session is available from **Sessions** if you want to inspect the verified turns first. **Inspect runs** opens the selected Session's receipt. In **Runs**, the historical parent/child and governed read Runs are marked **Deterministic fixture**. Their historical Sessions open as **Fixture history**.

| Evidence | What passed |
| --- | --- |
| Live in this integrated preview | Browser edit, save, activation, Session creation, and Run inspection. Two Z.AI Coding API turns on GLM-5.3 Flash completed with HTTP 200 on the same activation. Both dispatched max output 4,096, temperature 0.4 and top-p 0.8. Explicit demand on the first turn read the pinned reference once. The second made zero source reads and the model recalled the synthetic identifier from Session history. |
| Deterministic fixtures | [A1](A1-INDEPENDENT.md) proved output caps, invalid-draft rejection and restart isolation. [A2](A2-INDEPENDENT.md) proved retries and deadlines. [A3](A3.md) proved context refusal, scoped memory, actual local MCP stdio, and the step-limit boundary. The [approval fixture](A3-APPROVAL.md) exercised allow and decline without an external write. [A4](A4-INDEPENDENT.md) proved schema validation, child authorization, cancellation and linked Runs. |
| Open live limits | Behavior at a 2,048 cap and provider termination at the cap remain unverified. The MCP and child paths in this preview are historical fixture evidence. |

The integrated preview uses the previously permitted Coding route and server-side credential resolution. Its fixture Session history does not allow sending through the live host.
