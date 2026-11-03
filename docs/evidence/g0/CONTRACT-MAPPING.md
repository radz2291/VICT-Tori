# G0 graph mapping in progress

Flow v3 is the native authoring graph. Its public `GraphSessionV3` applies operations against an expected revision, accepts an application validation callback and owns Undo/Redo. Its strict schema carries node IDs, type IDs, port IDs, edge IDs, parameter values and presentation. Store TORI semantic bindings in a versioned envelope keyed by the same IDs. Persist the native graph and bindings atomically. Edits to bindings must follow the same revision and history boundary as graph edits.

Use `setParameter` for node body and inspector edits. Both surfaces read the same effective value, including the node type default. A reusable resource is identified by definition ID and revision. An invocation has its own node ID and explicit reference to that resource. Showing a resource or relationship changes presentation and keeps the underlying binding. Removing a graph edge and removing its semantic binding must be one operation.

| TORI relationship | Mapping and checks |
| --- | --- |
| Typed data | Native output and input handles, with domain schema and cardinality checks |
| Control | Dedicated handles and explicit branch or join metadata |
| Tool availability | Agent-to-tool binding with a pinned resource and requested scope |
| Delegation | Agent-to-child binding with a pinned resource and delegation policy |
| Context/reference | Informational edge, with a separate opt-in context binding |
| Provenance | Read-only projection of a run or import record, with origin and artifact versions |

Set native `allowCycles` for mixed graphs. Validate executable cycles on the data and control subgraph. Report unconfigured resources and unsupported execution cycles in readiness diagnostics so incomplete drafts can still be saved. Reject incompatible connections before committing an edit. Structure Explorer can project selected identities and relationships for inspection.

| Fixture | Coordinator and boundary to prove |
| --- | --- |
| Quellight agent graph | Mastra agent step with tool and delegation declarations. Protected effects require a VICT policy boundary. |
| AI-to-business workflow | VICT owns progression and protected action approval. A Mastra agent step exchanges typed inputs and outputs with that coordinator. |
| Creative Weave | Reference relationships and visual groups are authoring data. A converted executable graph has explicit inputs, outputs and adapter support. Simulated artifact provenance keeps its origin. |

This records the initial source-to-domain mapping. The package consumer build has passed. Transaction parity, fixture behavior, revisioned reopen and installed-browser editing are still to be demonstrated.
