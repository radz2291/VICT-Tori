# TORI’s VICT dependency pins

**TORI-015 response branch:** the only archive replacement is the additive `ui-ai-svelte` turn composition build. See [the packed consumer, source SHA, archive hashes and upgrade scope](../evidence/tori-015/PACKED-VICT.md). The table below remains the exact historical TORI-014 archive set.

The reviewed TORI candidate `f302de96b96ede5eb158f4ce779801e955a8f69f` uses the `file:packs/…` references in [package.json](../../package.json) and the SHA-512 integrity entries in [package-lock.json](../../package-lock.json). Its lockfile Git blob is `746b69fbefb4a9123029f54ab4ca47a00aaa5310`. TORI-013 qualified those bytes with Windows x64, Node `22.13.1`, npm `11.19.1`, Playwright `1.63.0` and Chromium `153.0.8010.12`. [Independent Windows evidence and archive manifest](https://github.com/radz2291/VICT-Tori/blob/fbb1bdcc4aa09f05a3753ed6eea8a1fea3eac642/docs/evidence/v1c-run-visibility/tori-013-windows-f302de9/INDEPENDENT.md)

Every archive is `0.4.0-rc.1` at `packs/victframework-<name>-0.4.0-rc.1.tgz`. The source baseline is VICT `6b420a3e9eada6f694cc2550debda7753316b5b3`. `contracts` and `control` were replaced with the VICT-003 archives from `02c63c31f8f4dc42840fc8975927c98b21f30058`, with the same version text. The hash identifies each exact archive. [V1b integration and archive lineage](../evidence/v1b/INTEGRATION.md)

| Archive name inside `@victframework` | SHA-256 | Why it is pinned and what it supplies |
| --- | --- | --- |
| application | ea0fdde59f165379154517f4be4ca99e3c8790033862e4a56f6df5fdb09b5db7 | Public application contracts used by ui-svelte. The pin aligns those controls with VICT application and UI contracts. |
| contracts | 5fa012bb69ba3a278da35911d95ee079ac3a697a4c12554c298f9add2b7514e2 | Closed public stream-event schema. TORI validates events at capture and observation before producing Run receipts. |
| control | 2f42f94df4c2c72ba84e6ee0d9bb59eb3feee8e0766ea248f00e81afb1acb82a | Public draft-edit commit and replay APIs plus AgentTurnService for Run recovery. The VICT-003 archive supplies the draft-authoring subpath. |
| kernel | a865551c64cb25b9314862e1a0afa19d5b8f61ebdb817dcb55f68085a431b5a6 | Execution foundation in the runtime and Mastra dependency closure. The shared pin keeps their public contracts on the same kernel. |
| mastra | bafd4ad6ac0e88f2cd0eb998de47c84ffecced1bf7d38446184ae8b97fadfb08 | Public model execution, tool integration, thread/memory storage and retention. Enables TORI's governed turns and memory lifecycle through the adapter. |
| runtime | ccb73a619bdef8725e7f5f5a1d0b861be868ba26dee528d1721db9cd55681c08 | Activation pins and restore, capability invocation, turn runners and the stream hub. TORI relies on these for durable identity and governed execution. |
| sdk | c37e97319a52463c9b422a3de2870247beaee97b811fe378b3a4ee8e00e2ce7a | Shared agent, graph and definition types used by the runtime, kernel and UI. Locks their SDK contract together. |
| store-sqlite | d874e5a62cd6d08f4ba4490e4041f04b2b305d8b1ff7649646192451f55899f9 | SQLite agent control and governance stores. Supplies durable Run and turn service state. |
| ui | 15dd5f5da2a38b6cbf0bc56677c7f6ccae190c4c7a5029d8cc7c8994263a7cb2 | Public UI schemas and document primitives used by the application, SDK, editor and Svelte controls. |
| ui-ai-svelte | e6c54a7be4b47e8a7dbd3a011293d4595806fdc766c120d4d6d786c3e76823e3 | Public Conversation, message patterns, composer, scroller and input controls used in Sessions and Runs. Also carries the public Trace surface for contract review. |
| ui-editor | ce0cd2c9838a6f9b63589f5bc8ddc47c12511fa263af83c16e19526df4d72914 | Public document editor and command foundation for the installed structure package. Remains in the qualified editor and structure package set. |
| ui-flow-svelte | a9659b1d4dcb9376e7dc6493d95df73d16084344a9b2d216b81d2205146d2cb4 | V3 graph model and journal plus Flow canvas, handles and topology APIs. Supplies the Agent canvas and authoring history. |
| ui-media-svelte | 234e78dd8f615622097b5166e5bd7f7646574d3663d3607b390d26ac8be11f22 | Public asset/preview foundations in the Flow and patterns dependency closure. Aligns their media contracts with the qualified package set. |
| ui-patterns-svelte | 778cc1ab1a0b6b8f8135db80232fb26abbb34d7e4d1c8bb786c81794b2d5ee4b | Public composition and authoring package retained as part of the qualified UI package set. |
| ui-structure-svelte | 24063de16a2386239147c36caf9fea50d3c48f9741ec3e4dd0339914c6544dea | Public structure and projection package retained as part of the qualified UI package set. |
| ui-svelte | f578759a74fb2ac509e52850d27292871115de3103acbe9f7b6fc7d0ef606336 | Control scope, feedback, buttons, dialogs, menus, accordions and styles. Supplies the shared Studio shell and controls across all three pages. |

Mastra core `1.64.0`, memory `1.28.2`, libsql `1.22.3`, observability `1.17.5`, and `@ai-sdk/openai-compatible` `2.0.0` are the corresponding compatibility pins in the same lockfile. [Inspected dependency baseline](BASELINE.md)

## Upgrade policy

1. Open a TORI integration change that names the public capability or fix it needs. Identify the exact VICT source commit, affected package exports, compatible dependency closure, and installed behaviors that TORI will rely on. Point to upstream evidence and record any public contract gap for review.
2. Produce or obtain artifacts from that source in an isolated checkout. Record the toolchain, build and pack commands, archive names, versions, byte counts, SHA-256 and SHA-512 integrity. An identical version label with different bytes is an archive replacement and goes through the same review.
3. Update the archive references and lockfile together on the integration branch. Use the pinned Windows toolchain and a fresh `npm ci`. Check the lockfile diff against the agreed package closure and retain the previous candidate’s exact manifest and evidence for reproduction.
4. Re-run the installed public consumers with packaged imports, the production build, full regressions and affected browser checks. Exercise old activations, stored Run reports and receipts, and replay and recovery behavior if their contracts are in the changed closure. Record changed exports, failures and the exact candidate. Use a fresh independent verifier for required product gates and bring the resulting evidence to the owner review.

VICT-005 passed the upstream live-exchange repair at `2ebac8f0e20c19c5731766d0021b0f33ff1ec249`. Adopting its artifacts is a separately scoped TORI dependency change. [VICT-005 independent Windows verdict](https://github.com/radz2291/vict-02/commit/e2177d31dff1ce0b36666f6befb2ee6417a9e402)

## Installed TORI packages

`@tori/authoring`, `@tori/memory` and `@tori/directive` retain version `0.1.0` and their existing exports. Studio resolves the local implementations by relative path. The root lock records the third-party dependency graph. The installed proofs generate separate consumer lockfiles seeded from the reviewed product lock, replace the TORI entries with packed `@tori/*` tarballs, and verify their integrity and installed entry paths.

With the pinned Windows toolchain and verified VICT archives in `packs/`, run `node scripts/probe-foundation-consumers.mjs`. Set `TORI_FOUNDATION_EVIDENCE` to an existing directory to retain the generated lockfiles, command logs and archive hashes there. Historical reports refer to the archive names at their recorded commits.
