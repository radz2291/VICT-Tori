# TORI Studio

Use Node 24.15.0 and npm 11.19.1. Build and pack the pinned VICT checkout by following the [G0 instructions](../../docs/evidence/g0/DEPENDENCIES.md). Copy the probe's verified `packs` directory into `apps/studio`. The lockfile expects those tarballs.

From `apps/studio`, run the same commands on Windows or a POSIX shell.

```text
npm ci --no-audit --no-fund
npm run build
npm run preview -- --host 127.0.0.1 --port 48746 --strictPort
```

Open [TORI Studio](http://127.0.0.1:48746/). For active development, substitute `npm run dev` for `npm run preview`.

Drafts and simulated records live in this browser profile and origin. **File → Open blank project** starts with empty graphs and operations. **File → Open sample project** opens an isolated workspace with the seeded Creative directions. **File → Reset sample project** restores that workspace after confirmation. Use **File → Export graph draft** to back up the active graph and **Import graph draft** to load a compatible Flow v3 graph as an undoable edit. Graph exports contain the graph and node layout. Session history, run records and Studio settings remain in browser storage. A separate port or browser profile opens separate data.

See the [integrated U0 walkthrough](../../docs/evidence/u0/integration/README.md) for review paths and simulation limits.

## Browser checks

Run the scripts from the repository root against a running Studio. The browser opens a fresh profile for each suite.

```text
node scripts/check-studio-integration.mjs <playwright-entry> <chrome> <studio-url>
node scripts/check-studio-workflow-fixtures.mjs <playwright-entry> <chrome> <studio-url>
node scripts/check-studio-creative.mjs <playwright-entry> <chrome> <studio-url>
node scripts/check-studio-docks.mjs <playwright-entry> <chrome> <studio-url>
node scripts/check-studio-final.mjs <playwright-entry> <chrome> <studio-url>
node scripts/check-studio-responsive.mjs <playwright-entry> <chrome> <studio-url>
node scripts/audit-studio-ui.mjs <playwright-entry> <chrome> <studio-url> <output-directory>
```

`check-studio-browser.mjs` takes the same first three arguments and accepts an optional G0 consumer URL as its fourth argument. Its fifth and sixth arguments can start temporary Vite servers from an absolute Studio directory and a prebuilt consumer directory.
