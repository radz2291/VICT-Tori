# TORI Studio

Build and pack the pinned VICT checkout by following the [G0 instructions](../../docs/evidence/g0/DEPENDENCIES.md). The consumer probe prints the directory containing the tarballs. Copy its `packs` directory into this directory, then use Node 24.15.0 and npm 11.19.1.

```powershell
npm ci --no-audit --no-fund
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 48743 --strictPort
```

Open [TORI Studio](http://127.0.0.1:48743/). The [owner walkthroughs](../../docs/evidence/u0/OWNER-REVIEWS.md) list the authoring actions to try. Agents, Workflows and Creative each store a separate draft in browser local storage for this origin. Switching to a different port or browser profile gives you a different set of drafts.

The browser check takes the absolute Playwright ESM entry path, Chrome executable, Studio URL, consumer URL, Studio directory, and consumer directory. The last two arguments start temporary Vite servers. The consumer directory must already contain the production build from the G0 probe.
