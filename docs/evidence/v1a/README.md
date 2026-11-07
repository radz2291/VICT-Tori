# V1a early hands-on checkpoint

The Studio is running on [127.0.0.1:48761](http://127.0.0.1:48761/) on the owner's Windows host. The local review database contains only the synthetic Research Assistant and its test Sessions. Use the desktop Assembly and phone Inspector to review the visual hierarchy and selection, then open Sessions and Runs to inspect real provider evidence. Feedback on node density, where to expose a shared value, and the phone Inspector is especially useful. This checkpoint is open for owner and independent review; it is not V1a acceptance.

## Run from a clean checkout

Use Node 24.15.0 and npm 11.19.1. Prepare a separate VICT checkout at `6b420a3e9eada6f694cc2550debda7753316b5b3`, run `npm ci` and `npm run build` there, then run these commands from the V1a worktree:

```powershell
./scripts/pack-vict.ps1 -Source C:/path/to/pinned-VICT-checkout
npm ci --strict-peer-deps
npm test
npm run build
npm run dev
```

The install uses public package tarballs, not source aliases or an installed VICT Studio. The backend is provided by the loopback dev host; `vite preview` alone does not run it. Studio stores local state under ignored `.data/`. Set `TORI_DATA_DIR` to a new absolute directory under `.data/` to try the blank-project path without changing a review project.

For the **temporary owner-selected local test connection**, set `TORI_ZAI_ROUTE=coding` and `TORI_ENABLE_PI_ZAI=1` in the server process before launch. This opts into the existing Pi Z.AI entry on this machine. For a configured server credential, use process-level `TORI_ZAI_API_KEY` and the matching `TORI_ZAI_ROUTE`; default route is General API. Do not enter a key in the browser. A Session is pinned to its activation's route. If the route changes, a new activation and Session are required; existing Sessions and Runs retain their original pins. The preview makes no connection until a user sends a turn. See [provider scope and evidence](OWNERSHIP.md).

## Walkthrough

1. On a blank project, choose **Add Agent**. Enter a name and system instructions. In Inspector choose **Show instructions as node**. Edit the Text source, then select the root from Library and confirm its inline and Inspector values agree. Click blank canvas to clear selection.
2. Choose **Add model**. Select **GLM-5.3 Flash**, set an output limit, and choose **Connect to Model** in Inspector or wire its output to the root's Model port. An Instruction Text output dragged to Model should be rejected. Use **Fit** to recover the entire graph.
3. Save, reload, and verify the same graph and selection. Choose **Activate**, then **Start Session**. An existing Session remains pinned if you edit and save a newer draft.
4. Send a synthetic question and follow-up. Open **Inspect runs** to see the actual provider route/model, activation identity, sent output limit, usage and public lifecycle events. On phone, use Library to reveal a node and Inspector to edit it; Session compose and Runs remain separate task pages.

The automated browser path uses Playwright 1.63.0. Run `node tests/browser.mjs` against a **fresh** local data directory, with Playwright on the module path (or `TORI_PLAYWRIGHT_MODULE` pointing at an installed package). Set `TORI_BROWSER_LIVE=1` only with the owner-permitted test connection; the scenario sends two short synthetic turns. Captures go to ignored `.local/v1a-browser`.

See [control inventory](CONTROL-AUDIT.md) for coverage, and [ownership](OWNERSHIP.md) for architecture and boundaries.
