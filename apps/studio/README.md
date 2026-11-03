# TORI Studio

Build and pack the pinned VICT checkout by following the [G0 instructions](../../docs/evidence/g0/DEPENDENCIES.md). The consumer probe prints the directory containing the tarballs. Copy its `packs` directory into this directory, then use Node 24.15.0 and npm 11.19.1.

```powershell
npm ci --no-audit --no-fund
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 48742 --strictPort
```

Open [TORI Studio](http://127.0.0.1:48742/). The [first walkthrough](../../docs/evidence/u0/OWNER-REVIEWS.md) lists the authoring actions to try.

The browser check takes the absolute Playwright ESM entry path, Chrome executable, Studio URL, consumer URL, Studio directory, and consumer directory. The last two arguments start temporary Vite servers. The consumer directory must already contain the production build from the G0 probe.
