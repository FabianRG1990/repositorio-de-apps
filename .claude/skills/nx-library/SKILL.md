---
name: nx-library
description: Scaffold an Nx library following this workspace's conventions — the exact generator flags plus the src/lib folder, barrel, tag & importPath conventions for this monorepo's Angular libs. Use when creating/scaffolding a library in this Nx monorepo. Companion to nx-generate, which covers generic generator mechanics (discovery, dry-run, verify).
---

Scaffold an Angular **library** the way this workspace's libs should be shaped, per the multi-context layout in `docs/agents/domain.md` (one bounded context per client, no shared business domain across clients). This is the convention delta only — for generator discovery, `--dry-run`, `nx format --fix`, and post-generate verification, follow `nx-generate`.

`<client>` is the owning client's short name (e.g. `bahia`, matching its `apps/<client>/` folder); `<domain>` is the feature slug within that client's context.

**Note:** as of this skill's authoring, this workspace has no libraries yet — this is the intended convention for the first one, not an observed pattern. Revisit this file once a few real libs exist, in case actual usage diverges from the plan below.

## 1. Generate

Angular, **non-buildable** (source consumed directly → only `lint` + `test` targets), Vitest:

```
nx g @nx/angular:library libs/<client>/<domain> \
  --name=<client>-<domain> \
  --importPath=@repositorio-de-apps/<client>-<domain> \
  --prefix=<client> \
  --unitTestRunner=vitest-angular \
  --style=scss --standalone --tags= \
  --no-interactive
```

The **positional argument is the project `directory`** (Nx binds argv[0] to `directory`, which is required) — pass the full `libs/<client>/<domain>` path there, and keep `--name` for the Nx project name; don't also pass a separate `--directory` (that specifies it twice). Set `--unitTestRunner` **explicitly**: the generator's enum is `vitest-angular | vitest-analog | jest | none` (there is no `vitest`). Use `vitest-angular` — it's what `apps/shell` and `apps/bahia` already use (`@angular/build:unit-test` executor, esbuild bundler, Angular ≥ 21). `linter=eslint` comes from `nx.json` defaults — omit it. Components are standalone (Angular default): `@Component` + `imports:` array, no NgModule.

## 2. `src/lib/` shape

Nx generates only `src/lib/<name>/<name>.ts`. Add the folders the lib actually needs (skip the rest):

- `components/` — standalone components, one folder each; co-located `<name>.ts` / `.html` / `.scss` / `.spec.ts`.
- `utils/` — pure, framework-free helpers; `*.utils.ts` (+ `*.utils.spec.ts`).
- `types/` — TS types, interfaces, domain models.
- `store/` (feature lib) or `stores/` (shared lib) — NgRx Signals store `*.store.ts` + composable `with-*.feature.ts`, matching the `@ngrx/signals` + `withEntities` direction already decided for `bahia`'s data layer; specs under `store/specs/`, test doubles under `store/tests/` as `*.testing.ts`.
- `forms/` — reactive forms: `schemas/*.schema.ts`, `*.validator.ts`, `*-form.types.ts`.
- `dialog/` — dialog components, one folder each (same 4-file co-location).
- `directives/`, `exports/` (third-party barrels: `material.ts`, `primeng.ts`), `environments/`, `assets/{img,icons}/` — as needed.
- `lib.routes.ts` at `src/lib/` root — exports `<client><Domain>Routes: Route[]`.

## 3. Barrel, tags, importPath

**`src/index.ts` — export sparingly.** `components/`, `utils/`, `types/`, `forms/` internals stay private unless another lib imports them.

- Feature lib:
  ```
  export { <client><Domain>Routes as default } from './lib/lib.routes';
  export * from './lib/lib.routes';
  ```
  then re-export only the store + dialogs other libs consume.
- Shared lib: re-export the stores, shared components, and the `exports/` barrels.

**Tags:** keep `tags: []` for now — `nx.json` doesn't configure `@nx/enforce-module-boundaries` or any tag-based dependency rules in this workspace. If that changes (e.g. to keep clients from importing each other's libs), tag libs by `client:<name>` and add the corresponding boundary rule here.

**importPath:** scoped `@repositorio-de-apps/<client>-<domain>`, matching the workspace's own package scope (`@repositorio-de-apps/source` in the root `package.json`).

**Done when** the lib generates, its `src/lib/` carries the folders it needs with a sparse barrel, `tags: []`, and the scoped importPath — and `nx-generate`'s verify step passes.
