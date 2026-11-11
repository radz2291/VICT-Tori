# TORI Studio authoring foundation

The next slice extends the Authoring Agent from an instruction editor into a workspace collaborator. From the existing left dock, the operator describes what they want to build, asks for a review, and requests changes. The agent uses real Studio actions and checks their results against the workspace. The first end-to-end scenario builds Quellight and a Research specialist from an empty agent library.

Radzi agreed this direction in the TORI-004 discussion on 12 November 2026. This slice follows the reviewed V1b implementation and precedes V1c. The product baseline is `59e568426183d2199be90ca96dd0d31bdd53fbd5`. The starting repository commit with review evidence is `aabc80737905671911942c0435b85c5dee285aed` on `codex/tori-v1b`. Owner review of TORI-004 continues on that candidate. The follow-on needs its own assignment and implementation handoff. [V1b integration evidence](../evidence/v1b/INTEGRATION.md) · [Stage sequence](ROADMAP.md)

## Studio experience

Use the approved Studio as the visual and interaction reference. Authoring stays in the left dock, with the draft and results visible in the existing Configure, Canvas, Sessions and Runs views. Keep the current draft, selection, viewport and focus when opening or closing the dock. Use installed public VICT controls for every covered role, including fixed-choice pickers, and audit the actual controls at each walkthrough. [Studio Design Constitution](../specs/STUDIO-DESIGN-CONSTITUTION.md)

Keep enough Session context to resolve a follow-up to the same workspace, definition or Run. Derive actor, project and current selection from trusted Studio context. Keep exact references to the definition, draft instance, revision, node or Run being discussed. Recheck these references before acting when selection or revision has changed. Ask which object the operator means if the request could change more than one.

A request to review or suggest improvements uses inspection actions and leaves drafts, saved revisions and activations untouched. Cite the actual definition or Run behind each recommendation. A request to apply a change uses the authorized Studio actions and shows the affected objects, what changed and the result. Make draft changes undoable through the regular history. Report completed changes and remaining work separately when a multi-step request stops partway through.

## Studio action boundary

Start by mapping the installed VICT public APIs for definition creation, graph editing, validation, history, Save, activation, capability discovery, execution and observation. V1b already proves an open-draft transaction through `@victframework/control/draft-authoring`, a revision-checked Flow journal, Stop at the journal and an applied Run receipt. Reuse that transaction path for supported draft mutations. Creation, Save and testing must use the same canonical operations and authority checks as their manual Studio equivalents. Where an operation is currently private to the host or missing from a public package, record the exact gap, which acceptance check depends on it and the smallest supported adapter or upstream change. [V1b package and transaction map](../evidence/v1b/INTEGRATION.md) · [Capability ownership](CAPABILITY-OWNERSHIP.md)

| Action family | First supported behavior | Evidence |
| --- | --- | --- |
| Inspect | Discover authorized definitions, draft revisions, resources and available actions. Read an exact Run and its visible tool results. | Match returned IDs and revisions to Studio. A review turn issues no mutating actions. |
| Create and configure | Create an agent draft, set its name, instructions and allowed model, and add or connect supported knowledge, tool and specialist nodes. | The graph appears in Configure and Canvas with stable identities and typed links. Manual and agent edits use the same journal and validation. |
| Validate and save | Check draft structure and activation readiness separately. Save a structurally valid draft when requested through the existing Save operation. | Readiness diagnostics identify the relevant nodes or bindings. Save records the exact revision and that revision reopens. |
| Test and inspect | Start a scoped test through the existing activation and execution boundary. Read its actual Run, including the specialist and tool result. | Show the tested activation, target, input and observed output. Activation uses the same authorization as the manual action. |

Register actions with stable IDs and revisions, typed inputs and outputs, and declared effects and grants. Describe what each action can do and expose it only within the current scope. The model selects from that catalog. A prompt, resource, script or tool result cannot grant permission or broaden the workspace. Apply the same rules to the specialist the Authoring Agent creates.

For a draft edit, verify the expected revision at commit, preserve intervening manual work and use the existing Stop fence. Record the actual outcome in the linked Run. Correlate the turn, operation, target and relevant revisions. A stale edit, scope denial or cancellation before commit leaves the target unchanged. Retrying an operation after a lost acknowledgement reconciles its original result. A committed change retains its receipt and remains undoable. Keep activation immutable and gate protected effects through the existing authority path.

## Registered tools and later coding work

For this slice, use an already registered read-only script-backed tool. Give it a stable identity and revision, typed input and output, a declared read scope and a permitted script entry point. The registered adapter resolves the implementation from trusted configuration, validates the request and returns the actual bounded result and invocation evidence. Use the same capability discovery, admission, invocation and trace contracts as other tool backends. Start with approved fixture knowledge and synthetic data in an isolated workspace. [Capability catalog](../specs/CAPABILITY-CATALOG.md) · [Effect and adapter contracts](../specs/CONTRACTS.md)

Prove extensibility by registering a second compatible script-backed tool through that same catalog. The Authoring Agent discovers it, connects it and tests it using the same chat and Studio action integration. Capture the separate tool identity, revision, grants and result. Include a refused call outside the tool’s read scope.

Carry forward the scoped CLI and workspace for investigating, writing scripts and testing new tools. Agents should later be able to use reusable tools backed by scripts, CLI programs, APIs or MCP servers through defined inputs, outputs and permissions. The first slice proves registered-tool discovery and use. Tool creation, arbitrary script authoring and the fuller coding workspace follow with their own containment and execution proof.

## Acceptance walkthrough

1. Open an isolated Studio with neither Quellight nor Research defined. Use the existing Authoring Agent and a plain-language brief to create a Quellight agent and a Research specialist. Connect Quellight to the Research specialist. Bind the approved knowledge and registered read-only script-backed tool to the specialist within its allowed scope. Validate and save the definitions, then run an authorized test through the supported runtime. Show the real graph, saved and activated revisions, actual specialist and tool result, and linked Run.
2. In the same Authoring Session, ask for a review of that Run and a suggested improvement. Verify that the reply cites the actual Run and that the draft and saved revision stay unchanged. Ask the agent to apply the improvement. Inspect its change and receipt, Undo and Redo it, then save and reopen the result.
3. Register a second compatible tool. Ask the agent to discover, connect and test it. Show the actual result and the unchanged chat integration. Exercise wrong-scope denial, an intervening manual edit, Stop before commit and a retry after a lost acknowledgement.
4. Review the actual flow on desktop and at the Studio narrow breakpoint. Capture the exact candidate, installed package and fixture revisions, evidence from the Run and draft history, and the independent verifier’s findings. Keep deterministic probes and live execution evidence distinct. Submit the working candidate to the owner for review. [Verification runbook](../governance/VERIFICATION.md)

This authoring walkthrough adds an earlier Quellight assembly scenario. The existing real-world acceptance scenarios and their requirements remain in force, including Quellight domain parity in T08 and contained coding in T09. V1c retains its background, recovery, memory and advanced child execution scope. Workflow and creative authoring remain on the roadmap. [Product acceptance](../specs/ACCEPTANCE.md)

