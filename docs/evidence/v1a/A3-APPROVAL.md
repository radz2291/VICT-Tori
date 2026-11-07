# A3 synthetic approval and refusal

This supplemental fixture closes the approval evidence gap in the bounded A3 report. It ran in the independent installed-consumer checkout for `d5232a3c31e457a4d0b3a55eeecd3e6351d5bb6b` with a test-file overlay only. The Studio and package bytes were unchanged. Use Node 24.15.0 and run `node --test tests/a3-approval.test.mjs` after installing the pinned packages. The first attempt failed because the fixture omitted the required ID factory. The corrected fixture passed.

| Probe | Result |
| --- | --- |
| Pending approval and self-approval | VICT emitted `tool.awaiting_approval`. The requester could not approve its own invocation even with the approver role. The effect count remained zero. |
| Separate approver approves | The protected in-memory counter advanced exactly once. The invocation settled as completed and emitted `tool.completed`. |
| Separate approver declines | The counter did not advance. The invocation settled as declined and emitted `tool.failed`. |

The fixture uses the installed public VICT turn executor, capability gate, SQLite control store and deterministic Mastra model. It performs no external write or provider call and does not grant the Studio a write tool. Both the builder and fresh verifier `/root/a3_verifier` passed the supplemental check on unchanged `d5232a3` runtime and package bytes. The independent run used only the fixture from `fed8452`, Git blob `5319c534105885ae397afe9e634a833a8b610a0f`. The approved invocation `95711f86-e057-47f3-a0da-a7cbb82ea77c` completed with one effect. The declined invocation `18c7e86d-28dc-4a7e-936a-fe243cf0b883` recorded zero. Ledger replay left both counts unchanged. The original [independent A3 report](A3.md) retains its bounded attribution.
