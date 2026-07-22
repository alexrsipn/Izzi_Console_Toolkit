# AGENTS.md

## Project

Angular 19 standalone app running as an Oracle Field Service (OFS) plugin. Manages technician exchange between Izzi Residencial and PyME business lines.

## Commands

```bash
npm run build          # Production build → dist/plgn-izzi-console-toolkit
npm run start          # Dev server (localhost:4200)
npm run start-tunnel   # Dev server + --disable-host-check (for OFS plugin testing via Cloudflare Tunnel)
npm test               # Karma + Jasmine (Chrome required)
```

## Post-build deploy steps

1. In generated `dist/.../index.html`, comment out `<base href="/">`
2. Zip only `.js`, `.html`, `.css` from the dist folder (exclude `.txt`, `.ico`)
3. Upload `.zip` to OFS Plugin Settings

## Architecture

- **State**: `@ngrx/component-store` — all business logic lives in `src/app/app.store.ts`
- **Components**: Smart/Dumb pattern — components stay thin, logic belongs in stores or services
- **Plugin comms**: `window.postMessage()` encapsulated in `src/app/services/ofs-api-plugin.service.ts`
- **No router** — single-page app with `mat-tab-group` for navigation
- **HTTP calls**: OFS REST API (`ofs-rest-api.service.ts`) + AWS backend (`aws.service.ts`)

## Key files

| File | Purpose |
|---|---|
| `src/app/app.store.ts` | Central store — all effects, updaters, state |
| `src/app/services/ofs-api-plugin.service.ts` | OFS plugin API (postMessage) |
| `src/app/services/ofs-rest-api.service.ts` | OFS REST API HTTP calls |
| `src/app/services/aws.service.ts` | AWS token + date reports |
| `src/app/services/resource-tree.service.ts` | Tree/forest construction from flat resource lists |
| `src/app/services/excel-export.service.ts` | XLSX export via SheetJS |
| `src/app/services/dialog.service.ts` | Material dialogs (error, success, confirm) |

## Code conventions

- **Tailwind first** — resolve Material vs Tailwind conflicts globally in `src/styles.scss`, prefer Tailwind utilities
- **TypeScript strict mode** — `noImplicitReturns`, `noFallthroughCasesInSwitch`, `strictTemplates` all enabled
- **Component prefix**: `app-`
- **Inline styles**: SCSS for Angular Material, Tailwind for everything else
- **Quotes in TS**: Single quotes (`.editorconfig`)
- **Indent**: 2 spaces

## Gotchas

- `xlsx` is installed from a CDN tarball (`https://cdn.sheetjs.com/...`), not npm registry
- `moment` and `dayjs` both in deps — prefer `dayjs` for new code
- `axios` in deps but unused by services — avoid adding new deps without need
- No tests exist yet — `npm test` will run karma but finds no `.spec.ts` files
- Production build budget: 2MB error / 1.5MB warning for initial bundle
- Angular Material theme is prebuilt `deeppurple-amber` — custom theming goes in `src/custom-theme.sass`
- `index.html` has a stale `<router-outlet>` tag (no router configured)
