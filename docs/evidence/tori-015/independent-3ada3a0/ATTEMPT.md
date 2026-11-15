# TORI-015 Windows verifier attempt for 3ada3a0

**HELD.** The two earlier deadline findings passed the independent recheck at `3ada3a08d869bce6805b3a85484f4335a1d54b23`. The full serial suite stopped in a test fixture before the remaining gates could run. Recorded by Codex, independent verifier, on 15 November 2026.

The installed checkout used the unchanged lock `0e797590275f560025a010a7b41a38e25832b8f6` and all 16 hashes from the fresh Windows offline install. The independent challenge rejected activation for a saved current graph with a missing deadline. The child recorded its 1000 ms pin, its signal aborted at 1000 ms under a 120000 ms parent, and it settled with `TORI_CHILD_DEADLINE`. [Independent challenge](deadline-challenge.json)

The serial regression command started and passed all 16 recovery cases. The deadline unit fixture then entered an indefinite hold on a parent follow-up request after the child result. The verifier read the synthetic SQLite store while the fixture was held. It showed the child cancelled with `TORI_CHILD_DEADLINE` and the parent Running at its 120000 ms deadline after `tool.failed`. The frozen fixture clock had advanced only to the child deadline. The candidate's simulated provider awaited abort on the parent follow-up instead of sending a finite response. [Read-only snapshot](host-deadline-fixture-snapshot.json) and [partial regression log](unit.log)

The verifier stopped this qualification's process tree and preserved the driver output. The corrected fixture is needed to complete the qualification at an exact integrated commit. [Driver log](driver.log)
