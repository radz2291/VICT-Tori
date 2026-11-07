# V1a foundation and ownership

Owner scope: [issue #3](https://github.com/radz2291/VICT-Tori/issues/3), coordinated in Work TORI-003, standard revision 1. Base a9eaf445b9025dcb65dbf8a97446871e746dae25 (clean origin/main), branch codex/tori-v1a in a new worktree. Original clean U0 HEAD bd162547fe9f729ad6ea1b5cc4744a61a22b0e24 untouched. Design Constitution, verification and reference evidence come from 1b39881be6568ea7067f7b252f5e84abe7e399ea. No U0 app, test or runtime bytes are inherited.

| Scope | Responsibility and pin |
| --- | --- |
| CAP-01 / T01 | VICT Flow v3 owns typed draft edits/history/validation. TORI owns the assembly vocabulary, local document storage and selection projection. VICT runtime AgentProfileRegistry owns canonical activation and restoration from an exact saved revision. |
| CAP-02/03/05/06 | VICT MastraProductAgent runs a pinned profile. Mastra owns model orchestration and conversational memory. TORI supplies a loopback host, one local actor, one allowed provider/model and turn/session associations. No tools, delegated work or effects. |
| CAP-26 / X12 | VICT normalized events and outcomes; TORI stores public milestones and reported usage only. No reasoning payload or raw provider errors. |
| CAP-34 / X15 | Public installed VICT packages from 6b420a3e9eada6f694cc2550debda7753316b5b3, version 0.4.0-rc.1, Mastra core 1.64.0. Independent TORI consumer evidence remains to be produced. |

Temporary owner-selected development route: Z.AI Coding API, `glm-5.3-flash` only. The upstream VICT Studio host at the immutable pin already configures this same route, but its application code and existing live agent are not TORI dependencies. The TORI model factory is injected through public `MastraProductAgent`; endpoint choice is pinned with activation, with no automatic switching. Z.AI General API rejected the initial temporary key with HTTP 429 / 1113. The owner explicitly selected the existing Coding route for this local test. Vendor [Coding Plan scope](https://docs.z.ai/devpack/tool/others) is separate from observed connectivity; no support or distribution rights are inferred for TORI. Credentials stay in the owner's Pi files, read only on the server after local launch opt-in.

Reasoning selection requires both endpoint support and a supported activation binding; the VICT profile's closed generation schema has no reasoning-effort field. The candidate explains this gap. No runtime effect is claimed for a draft field or the design-only JIT fixture.
