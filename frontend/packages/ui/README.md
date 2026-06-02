# @org/ui

Shared shadcn/ui component library for the workspace. Reusable **primitives** (button,
card, sidebar, chart, …) live here; **app-specific** pages and feature components live in
the consuming app (e.g. `apps/life-ops-dashboard`).

- **Stack:** shadcn 4.x · Tailwind CSS v4 · Nx 22.x (package-based / TS-solution workspace)
- **Linking:** consumed as `@org/ui` via npm workspaces + package `exports` (no legacy
  `tsconfig.base.json` path aliases). Subpaths resolve via the `"./*": "./src/*"` export.

---

## Where things live

```
frontend/
├─ package.json                         # ROOT/workspace: Nx tooling + "workspaces" list.
│                                       #   DO NOT add component/block deps here.
│
├─ apps/life-ops-dashboard/             # the APP — pages + app-specific feature components
│  ├─ components.json                   #   ui → @org/ui (lib), components/hooks → @/… (app)
│  ├─ postcss.config.mjs                #   Tailwind v4 entry plugin (EXACT name — see gotchas)
│  ├─ tsconfig.json                     #   paths: "@/*" and "@org/ui/*"
│  ├─ package.json                      #   deps the APP imports (+ tw-animate-css, @org/ui)
│  └─ src/
│     ├─ app/
│     │  ├─ global.css                  #   THE Tailwind entry (tailwindcss + tw-animate-css
│     │  │                              #     + lib styles import + @source glob)
│     │  └─ dashboard/page.tsx          #   ← block PAGES land here
│     ├─ components/                    #   ← block FEATURE components (app-sidebar, data-table…)
│     └─ hooks/                         #   ← block hooks (use-mobile)
│
└─ packages/ui/                         # the LIBRARY (@org/ui) — shared primitives
   ├─ components.json                   #   package-scoped aliases (@org/ui/components, …)
   ├─ package.json                      #   the lib's OWN deps (radix-ui, cva, recharts, …)
   ├─ tsconfig.lib.json                 #   baseUrl + paths INSIDE compilerOptions
   └─ src/
      ├─ index.ts                       #   barrel re-exports (optional)
      ├─ styles.css                     #   theme TOKENS only (no @import 'tailwindcss')
      ├─ lib/utils.ts                   #   cn() helper
      └─ components/ui/                 #   ← shared PRIMITIVES (button, card, sidebar, chart…)
```

**Rule of thumb for "which file?":**
- Editing what a *primitive* imports/looks like → `packages/ui/src/components/ui/`
- A dashboard/page or a one-app feature → `apps/<app>/src/`
- "where do deps go?" → see [§3 below](#3-️-dependency-ownership--the-step-that-recurs-every-time)

---

## shadcn runbook

### 0. First-time setup — already done, do not repeat
The integration is wired. For reference, it consists of:
- This lib generated via `nx g @nx/react:library packages/ui --importPath=@org/ui`.
- **App** `apps/<app>/postcss.config.mjs` → `{ plugins: { '@tailwindcss/postcss': {} } }`.
- **App** `src/app/global.css`:
  ```css
  @import 'tailwindcss';
  @import 'tw-animate-css';
  @import '../../../../packages/ui/src/styles.css';   /* theme tokens */
  @source '../../../../packages/ui/src/**/*.{ts,tsx}'; /* scan lib for classes */
  ```
- **Lib** `src/styles.css` → theme tokens only (`@theme`, `:root`, `.dark`); the Tailwind
  entry + plugin imports live in the app.
- **Lib** `components.json` → package-scoped aliases (`@org/ui/components`, `@org/ui/lib/utils`, …).
- **App** `components.json` → `ui` → `@org/ui/components/ui` (lib), `components`/`hooks` → `@/…` (app).
- `baseColor`, `style`, `iconLibrary` are **identical** in both `components.json` files (required).
- **Lib** `tsconfig.lib.json` has `baseUrl` + `paths: { "@org/ui/*": ["./src/*"] }` **inside
  `compilerOptions`**; the app `tsconfig.json` has `"@org/ui/*": ["../../packages/ui/src/*"]`.

### 1. Add a shared primitive → run from the **lib**
```bash
cd packages/ui
npx shadcn@latest add <component>
```
Running here lands the component **and its deps** in this package together — no cleanup.
Optionally re-export from `src/index.ts` for barrel imports (`import { X } from '@org/ui'`).

### 2. Add a block (e.g. `dashboard-01`) → run from the **app**
```bash
cd apps/<app>
npx shadcn@latest add <block>
```
shadcn splits the files automatically: primitives → this lib, page + feature components +
hooks → the app. **Then do the dependency reconciliation below.**

### 3. ⚠️ Dependency ownership — the step that recurs every time
shadcn installs **all** new deps into the `package.json` of *wherever you ran the command*;
it does not understand the lib/app split. After every block (and any component added from
the app):

> **Rule:** if a file under `packages/ui/src` imports a package, that package must be in
> **`packages/ui/package.json`**. Remove lib-only deps that ended up in the app's `package.json`.

Quick audit:
```bash
# external imports made by lib components:
grep -rhoE "from ['\"][^.@][^'\"]*['\"]|from ['\"]@[^/]+/[^'\"]+['\"]" packages/ui/src
```
Then `npm install` from the workspace root.

### Worked example — `npx shadcn@latest add dashboard-01`

Run from the app:
```bash
cd apps/life-ops-dashboard
npx shadcn@latest add dashboard-01
```

**Files shadcn created, and where they landed:**
```
packages/ui/src/components/ui/        ← PRIMITIVES (registry:ui → the lib)
  avatar, badge, breadcrumb, button, card, chart, checkbox, drawer,
  dropdown-menu, input, label, select, separator, sheet, sidebar,
  skeleton, sonner, table, tabs, toggle, toggle-group, tooltip   (.tsx)

apps/life-ops-dashboard/src/components/   ← FEATURE components (registry:component → the app)
  app-sidebar, chart-area-interactive, data-table,
  nav-documents, nav-main, nav-secondary, nav-user,
  section-cards, site-header                                     (.tsx)

apps/life-ops-dashboard/src/app/dashboard/page.tsx                ← the PAGE
apps/life-ops-dashboard/src/hooks/use-mobile.ts                   ← the HOOK
```

**Dependency reconciliation (§3) for this block** — shadcn dumped *all* deps into the app's
`package.json`; here's how they actually split:

| Dep | Imported by | Belongs in |
|---|---|---|
| `radix-ui`, `class-variance-authority`, `lucide-react` | many lib primitives | `packages/ui` (already there) |
| `recharts` | lib `chart.tsx` **and** app `data-table.tsx`/`chart-area-interactive.tsx` | **both** |
| `sonner` | lib `sonner.tsx` **and** app `data-table.tsx` | **both** |
| `vaul` | lib `drawer.tsx` | move to `packages/ui` |
| `next-themes` | lib `sonner.tsx` | move to `packages/ui` |
| `@dnd-kit/*`, `@tanstack/react-table`, `@tabler/icons-react`, `zod` | app `data-table.tsx` & nav components | keep in app |
| `tw-animate-css` | app `global.css` | keep in app |

Net result: add `recharts`, `sonner`, `vaul`, `next-themes` to `packages/ui/package.json`;
leave the `@dnd-kit`/`@tanstack`/`@tabler`/`zod`/`tw-animate-css` set in the app. Then
`npm install` and `npx nx typecheck ui`.

### Verify
```bash
npx nx typecheck ui          # proves the lib is self-contained (resolves vs its OWN deps)
npx nx dev <app>             # render check
```

---

## Gotchas hit during setup (read before debugging)

| Symptom | Cause | Fix |
|---|---|---|
| `Module not found: tw-animate-css` (but it's installed) | `postcss.config.mjs` missing/misnamed → Tailwind never runs → Turbopack tries to resolve the `style`-only export of tw-animate-css | Ensure `apps/<app>/postcss.config.mjs` exists (exact name) |
| `Cannot find module '@org/ui/lib/utils'` on `nx typecheck ui` | `baseUrl`/`paths` placed at the top level of `tsconfig.lib.json` instead of inside `compilerOptions` (silently ignored) | Move them into `compilerOptions` |
| Components land in the app instead of the lib | App `components.json` `ui` alias not resolvable — needs `@org/ui/*` in the app `tsconfig.json` `paths` | Add the path mapping |
| Lib component imports `@/lib/utils` and breaks in the app | `@/` collides with the app's `@/` | Lib must use **package-scoped** imports (`@org/ui/lib/utils`); keep scoped aliases in the lib `components.json` |

## Notes
- Tailwind scans new lib files automatically via the app's `@source` glob — no action when
  adding components.
- Assumptions hold within current majors. Re-validate this runbook on Tailwind v4→v5,
  a shadcn major, or Nx 22→23.

## Running unit tests
Run `nx test ui` to execute the unit tests via [Jest](https://jestjs.io).
