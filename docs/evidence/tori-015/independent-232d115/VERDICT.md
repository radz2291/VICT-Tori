# TORI-015 independent Windows verdict for 232d115

**FAIL.** Two exact-candidate deadline challenges contradicted the approved policy. The fresh Windows verifier signed this verdict against `232d11540d53a842299d7eb41aad21307fd6ddc1` on 15 November 2026. The full suite was deferred for the repaired candidate.

The qualification used a detached clean worktree, Windows x64, Node `22.13.1`, npm `11.19.1`, and the candidate's 16 verified local archives. The manifest records the exact Git tree, lock blob and archive hashes. `npm ci --offline --no-audit --no-fund` installed 413 packages. [Verified inputs](inputs.json) and [install log](npm-ci.log)

| Challenge | Result | Evidence |
| --- | --- | --- |
| Ordinary Session pinned to 120 seconds | PASS | The candidate's controlled-clock test kept the Run alive at 100 seconds, expired it at 120 seconds and distinguished explicit Stop. [Test log](host-deadline-test.log) |
| Current graph missing the authored deadline | FAIL | Removing the 120000 ms value from its current graph permitted a save and a new activation at 90000 ms. [Independent probe](deadline-challenge.mjs) and [result](deadline-challenge-retry.json) |
| Saved child pinned to 1000 ms, under a 120000 ms parent | FAIL | The child Run recorded 120000 ms. At the child's authored deadline it was still Running and its signal had not aborted. It completed after the independent hold released. [Independent result](deadline-challenge-retry.json) |

The first probe's 20 second startup watchdog expired before the child entered its test hold. A rerun with a 120 second readiness budget reproduced both product findings on the same exact commit. A shared-install rerun of the VICT packed browser fixture also failed to start Vite while this host was under load. These attempts are retained and add no evidence for either claim. [First deadline attempt](deadline-challenge.json) and [packed fixture attempt](packed-vict-browser.log)

The builder was notified of both deadline findings. A new independent verdict requires the repaired exact commit and its full regression, browser and installed consumer qualification.
