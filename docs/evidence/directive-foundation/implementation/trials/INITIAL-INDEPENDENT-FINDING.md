# Independent timing challenge on ac62c02

Verifier session `/root/tori009_verifier` reconstructed `ac62c029111fc3021a8107ddb95e650b3e4bf966` in a detached Windows checkout, on Node 22.13.1 with all 16 lock-matching archives. Its independent Directive browser driver completed. A separate controlled-clock provider fixture identified a material timing failure:

| Observation | Value |
| --- | --- |
| Fixture ordinary reply | Completed |
| Directive request | 22,000 ms, counted from acceptance |
| Simulated time consumed by ordinary reply | 23,000 ms |
| Directive settlement | Timeout |
| Interpreter provider attempts | 0 |

The old candidate scheduled interpretation only after an ordinary reply committed, so it could never prove overlapping interpretation and ordinary generation. The same challenge passed its 100-second post-reply deadline case, three quiet recall fixtures, and a valid late-output Stop that preserved the new turn with zero memory or receipt mutations. The Windows connection ended before the first reviewer could deliver a complete verdict. The overlap finding was repaired and challenged again in a new independent session.
