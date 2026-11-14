# Independent verification attempt 2

Verifier: `tori013-independent-verifier-20261114`, fresh session `/root/verifier`.
Frozen replacement: `78a410ffe5c26f0367b3dc51acf1dc359ec5b596`.

The detached checkout switched to the replacement with attempt 1 preserved. The orchestrator supplied the repaired runtime and Studio candidates and manifest, and authorized sequential pinned installation. Approximately 1.17 GB was initially free.

| Command | Result |
| --- | --- |
| `npm ci --offline --no-audit --no-fund` | Exit 1: `ENOTCACHED` for `zwitch-2.0.4.tgz`; cleanup also reported `EPERM` within the incomplete dependencies. Local log: `.local/independent/install-02.log`. |
| `npm ci --prefer-offline --no-audit --no-fund` | Exit 1: `ENOSPC` during extraction. Approximately 259 MB remained when it began and under 1 MB afterward. Local log: `.local/independent/install-03.log`. |

No parallel verifier install ran. No product tests, browser checks, installed-consumer qualification or live calls used the incomplete installation. Even this small attempt document could not initially be written; its details were preserved in the read-back Work event.

After the owner freed space and continued, the same pinned `npm ci --prefer-offline --no-audit --no-fund` succeeded on attempt 4, installing 413 packages. The existing posthog engine advisory and esbuild install-script advisory remained. Log: `.local/independent/install-04.log`. Windows Node `22.13.1`, npm `11.19.1`, unchanged lock blob `746b69fbefb4a9123029f54ab4ca47a00aaa5310`. The expired waiting Work lease was reconciled and a new execution attempt claimed under the same verifier identity. Executable verification began only after the successful installation.
