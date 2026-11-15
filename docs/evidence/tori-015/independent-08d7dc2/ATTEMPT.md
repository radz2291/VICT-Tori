# TORI-015 Windows verifier attempt for 08d7dc2

**HELD.** Independent qualification of `08d7dc24b53cdf10c9edab125fd699874c031fba` stopped during the serial regression run after the builder reproduced a narrow-screen Memory focus/visibility regression on the same candidate. Recorded by Codex, independent verifier, on 15 November 2026.

The candidate differed from `3ada3a08d869bce6805b3a85484f4335a1d54b23` only in the deadline unit fixture. The installed lock blob and all 16 archive hashes matched the preceding Windows attempt. A fresh clean detached checkout ran the independent deadline challenge and both probes passed. A current graph with no deadline could save and could not activate. The 1000 ms child pin aborted the child under a 120000 ms parent and the child settled cancelled with `TORI_CHILD_DEADLINE`. [Inputs](inputs.json) and [challenge](deadline-challenge.json)

The verifier stopped its own process tree after the suite reported passing 13 recovery cells and before the browser phase. The partial output is retained. No final qualification claim is made for this commit. [Partial regression log](unit.log) and [driver log](driver.log)
