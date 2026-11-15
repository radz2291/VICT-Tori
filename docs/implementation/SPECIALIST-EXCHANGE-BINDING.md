# TORI-016 — Governed specialist exchange binding

**Separate from V1 acceptance.** Base TORI product: `f302de96b96ede5eb158f4ce779801e955a8f69f`. [VICT-005 independent Windows PASS](https://github.com/radz2291/vict-02/blob/e2177d31dff1ce0b36666f6befb2ee6417a9e402/docs/governance/vict-005-windows-2ebac8f/REPORT.md) qualifies VICT source `2ebac8f0e20c19c5731766d0021b0f33ff1ec249`. It does not authorize a TORI cap or certify the TORI live path.

## R-5 for approval

On the **Delegation → Exchange** canvas wiring, field **Questions per delegated task**. Recommend **1** on a newly opted-in wire, whole integers **0–2**; **0** explicitly disables asking. One allows a useful clarification; two leaves room for a follow-up without making a long conversation the default. Existing wires stay off until edited and activated. The default is a visible authored value, never a fallback inside VICT or at runtime.

Pin the effective cap, policy revision, exact parent and child activation, holding capability, ask capability and wire identity together. Decline activation for missing, malformed, fractional or out-of-range values on opted-in wires. Missing or stale runtime pins fail closed. Scope a question to a delegated task and its admitted holding invocation; admission claims one slot per new actual question operation after authorization. In-flight and settled duplicates share the original slot, changed occurrences refuse, provider retries of that answer don't count again, and read-only receipt replay consumes none. A new question operation with the same wording is not idempotent with an unrelated prior operation. Count an admitted question even if its provider answer subsequently fails. Denials before admission do not consume a question slot. Existing step, tool and deadline limits independently apply; a higher question cap cannot add steps or time. Feedback distinguishes a question cap from a step/tool/deadline limit.

## Binding seam and cap finding

- Parent and saved child currently both call TORI's `governedReadTurn` and public `composeMastraTurnExecutor`; `createChildCapability` hosts the existing one-delegation holding call. Unwired/fixture behavior keeps VICT adapter revision 6. For a wired pair use registry-minted exact revision-7 activations, attach the same opaque exchange and original deadline resolver to both composed executors and invoke the child's original execution through `withAsker` inside the authorized holding call. Keep real actor, session/turn/stream/Run identities. Prove the concrete v2/v3 streaming model in the opted-in route. Keep the answer step tool-free with only an explicitly authorized bounded context projection; do not reuse an ordinary provider factory that prepends transcript, saved memory, or tool instructions. A revision-7 exchange-only provider configuration must preserve existing transport sanitization and count retries without injecting conversation context.
- Use the installed SQLite exchange store in the deployment operational domain. Recover after ownership loss before accepting new work, restoring the actor directory and both original turn/stream pins. Replay via authorized `readReceipt`, with no model/tool dispatch. Persist only sanitized cross-turn metadata in the appropriate technical surface. Reuse approved projection law without extending V1's presentation surface here.
- **Cap admission gap:** in the qualified VICT build, `AgentExchangeDisclosure.allowQuestion` is called both for execution and for `readReceipt`, with no operation/holding identifier. `composeMastraTurnExecutor` routes asks to the coordinator rather than the host capability invoke callback, and the durable store's `claim` false branch means outcome unknown, not limit reached. Counting in any of those locations would either charge replay or misreport a cap denial. The ordinary child tool budget counts unrelated tools, so it is not an exact independent per-task question budget. A synthetic ask-only child can exercise the route, but does not close R-5. Propose an additive public **admission-only** seam in the exchange coordinator, after actor, scope and live-duplicate checks and before provider dispatch. It can carry the exact operation and holding IDs, use an owner-supplied cap (no VICT default), and return a distinct cap denial. Admission and intent durability must agree across parallel calls, restart, Stop and expiry. Preserve VICT-005's recovery contract. Confirm this seam with VICT before enabling a TORI wire.

[Qualified public composition and recovery contract](https://github.com/radz2291/vict-02/blob/2ebac8f0e20c19c5731766d0021b0f33ff1ec249/docs/governance/VICT-004-AGENT-EXCHANGE.md).

## Dependency preparation

The reviewed TORI deployment and VICT-005 proof both use `0.4.0-rc.1` package names. They are different bytes. The reviewed install lacks the public exchange and SQLite receipt exports; the VICT-005 Windows archives expose them with compatibility revision 7. The separate branch stages exactly five different runtime archives; kernel, SDK, VICT UI core and the remaining eight reviewed archives stay unchanged. No UI package is upgraded for exchange and no pin drifts in the V1 review branch.

**Direct swap failed.** The qualified exchange archives omit the reviewed `@victframework/control/draft-authoring` and `@victframework/contracts/sha256` subpath exports. With those archives staged, Node failed before the TORI fixture could run (`ERR_PACKAGE_PATH_NOT_EXPORTED` for `./draft-authoring` from `server/draft-authoring.mjs`). Studio and Workspace Actions also import that subpath, so this is a real host startup/bundle incompatibility, not a test-only issue. Preserve the failed lock candidate on this branch for reproduction; do not use it as a Studio upgrade. A forward-compatible VICT archive set must carry both the reviewed TORI public surface and the verified exchange exports. Requalify the combined set independently, keeping the VICT-005 PASS on its original SHA intact.

| Changed archive (Windows, all 0.4.0-rc.1) | VICT-005 SHA-256 |
| --- | --- |
| contracts | `017c0587843869653f6bd723566dcaf39f2e89b2fb55bc923f35667be9d618de` |
| control | `3cf09cb1bf97f90f50e6f4bbf76a690f309b9a3d39833e54bac0d361ab61386f` |
| mastra | `258e78647d0d10593e95945b92a8cd42d4acc869b51fb8afb00cbe628924ddf2` |
| runtime | `22c2569f4d4eb127fb4233c8aeab4834cd77e8c992e55e347654dfccf59f9173` |
| store-sqlite | `a6fed4d701e5b666b70859ba640c2fc8388a31fe5993305fa72ad6f5de3392f9` |

Stage the reviewed 16 archives in `packs/`. Replace only those five with the named archives from the VICT-005 report. Check both the recorded SHA-256 and the lockfile's SHA-512; keep the other 11 pins. Use Windows Node 22.13.1, npm 11.19.1, and `npm ci`. Pin validation does not imply enabled exchange; no production wire or numeric policy is installed by this preparation.

```powershell
node scripts/probe-exchange-pins.mjs <reviewed-tori-installed-checkout> <vict005-packed-root>
node <vict005-packed-root>/consumer/independent-probe.mjs last-step process-loss settled-before-delivery-owner-loss
```

The Windows pin preflight passed, and the installed VICT last-step and both loss scenarios passed again. Both lost turns closed; the settled receipt bytes and stream high-water marks `[3, 3]` were preserved, and repeated recovery/replay dispatched zero models and tools.

## Windows TORI checks

| Command | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` under the isolated five-archive lock | PASS, 413 packages. npm reported the existing PostHog engine and esbuild install-script warnings. |
| `node --test tests/exchange-wiring.test.mjs tests/run-visibility.test.mjs` | **12/12 PASS.** Two placements use TORI's actual governed turn composition and an offline fixture. The asker continues in the same turn and stream, both streams are sequential, and authorized receipt replay adds no model calls. The ordinary Studio path supplies no exchange binding. This test uses one scripted question; it does not implement or approve the cap. |
| `npm run build` after the same install | **FAIL (1).** Vite reports `Missing "./draft-authoring" specifier in "@victframework/control" package` twice when loading the Studio configuration. V1 remains on its original lock. |

The first fixture startup hit the missing authoring export through a grant constant. The isolated seam now imports the existing TORI grant from its own module, leaving Studio's real authoring package requirement intact. Two fixture-only issues were corrected before the final run: the tool name sanitizer belongs to the Mastra public export, and immediate temp database deletion hit a Windows file lock. The full build failure persists independently of those test corrections.

Next gate: verify one compatible archive set and an exact admission-only cap against two questions plus a distinct overflow request, a concurrent duplicate, a changed duplicate, denied context, both deadlines/Stops, and restart/replay with zero redispatch. At cap 0 there must be no question dispatch; at 1 or 2 only that many distinct admitted operations may dispatch. Preserve the unchanged TORI authoring, recovery, projection and browser suites, then obtain a fresh independent Windows verdict before enabling live exchange.
