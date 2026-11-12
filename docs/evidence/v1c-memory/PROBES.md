# TORI-006 pinned backing probes

**Decision: dedicated local SQLite.** Probe 1 failed at the installed VICT policy boundary. Under the [accepted specification](../../implementation/MEMORY-FOUNDATION.md), any failed or inconclusive probe selects SQLite. The existing LibSQL-backed Mastra store continues to own Session history. The saved-memory record and receipt will commit together in a separate local SQLite transaction. Native Mastra working memory and semantic recall stay off in the model-facing activation.

These probes ran before product implementation on the clean prepared branch baseline 9e642977593b616422471d8260b8e8c585c6c844, spec 8854562dda920f583e6cc1d80de51f6add6d7ba9, in a new worktree tracking origin/codex/tori-v1c-memory-foundation in radz2291/VICT-Tori. The approved TORI-005 baseline is 4c035cd75f63c68bd002dee5683ca3fa02e778cf and tested product b349e547f4e144db47d63f89e0ef3c7c49db8c75. The prior workspace and concurrent work were left in place.

| Probe | Installed result | Observed evidence |
| --- | --- | --- |
| 1. Resource scope and schema | **FAIL** | Native Mastra returned the saved schema-shaped value in a new thread for the same resource and no value after independently changing actor, project or agent. The template was JSON Schema. Programmatic updateWorkingMemory accepted and returned an invalid revision value. The public VICT AgentProfileRegistry rejected the resource scope field with VICT_AGENT_UNKNOWN_ARTIFACT_FIELD. The installed public memory artifact only supports enabled and template for working memory. The adapter constructs its own Memory instance and binds the resource to actor only. Its public composition does not accept a scoped/schema-based working-memory policy. |
| 2. LibSQL retention | **PASS** | createDedicatedMastraStore returned LibSQLStore at mastra/mastra-store.db. Executing messages, threads and spans pruning removed the one aged message and one aged thread belonging to the same resource (zero spans). A SQLite read verified the source message/thread rows were gone and the one mastra_resources row still held the exact memory. The public reader returned that value after reopening the store with a fresh thread ID. |
| 3. Programmatic write, model boundary and reconciliation | **PASS for the isolated prototype** | A native programmatic write with a durable pending SQLite operation was excluded before reconciliation. After closing both stores and reopening them, the stored value matched the pending digest; exactly one receipt was committed and a repeat finalized zero rows. A committed operation without a matching resource was excluded with “storage unavailable / memory missing”. A captured VICT → Mastra → deterministic model invocation included the pre-dispatch fixture data and zero memory write tools when native working memory was disabled. Enabling the legacy policy exposed updateWorkingMemory. This is a boundary prototype; product behavior is verified separately. |

Reproduce with the [TORI-005 archives and lockfile](../authoring-foundation/dependencies.json), Node 22.13.1 and npm 11.19.1:

~~~powershell
npm ci --no-audit --no-fund
node scripts/probe-memory-backing.mjs
~~~

The probe command exited 0 and reported the individual outcomes above. It uses synthetic data and disposable stores and makes no provider call. Installed versions: VICT Mastra and Runtime 0.4.0-rc.1; Mastra core 1.64.0, memory 1.28.2 and libsql 1.22.3. Lockfile blob 746b69fbefb4a9123029f54ab4ca47a00aaa5310. VICT Mastra archive SHA-256 bafd4ad6ac0e88f2cd0eb998de47c84ffecced1bf7d38446184ae8b97fadfb08.
