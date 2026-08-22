<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## Commits

Un commit es **un cambio lógico que se puede revertir solo**. No se juntan en un
mismo commit el código, su configuración, su documentación y un pase de formato:
eso produce una foto del estado final, no un paso del camino, y deja el historial
inservible para `git revert` y `git bisect`.

- Separar por tipo de cambio, en este orden: tooling/configuración → comportamiento
  → pruebas → documentación → pases mecánicos (formato, renombrados, movidas). Un
  pase mecánico nunca comparte commit con un cambio de significado, porque esconde
  el diff real.
- Nunca mezclar refactor con cambio de comportamiento. Primero el refactor en su
  commit, después el cambio encima.
- Cada commit deja el árbol funcionando — compila y sus pruebas pasan.
- `git add <ruta>` o `git add -p`; nunca `git add -A` sin leer antes `git status`.
- Asunto imperativo en español, ≤ ~72 caracteres. Cuerpo con el **porqué**: la
  restricción, la alternativa descartada, la trampa evitada. El diff ya muestra qué
  cambió.

Antes de abrir el PR, leer `git log --oneline` de la rama: si dos commits solo
tienen sentido juntos, hay que unirlos; si el mensaje de uno necesita un "y
también", hay que partirlo.

## Formato

El CI corre `nx format:check`, y `.prettierignore` **no** excluye Markdown: un `.md`
sin formatear (investigación, ADR, `CONTEXT.md`) deja el PR en rojo igual que un
`.ts`.

Dos hooks lo cubren, y hacen falta los dos:

- **`PostToolUse`** (`.claude/hooks/format-on-write.mjs`) pasa Prettier sobre cada
  archivo escrito con `Write`/`Edit`.
- **`PreToolUse`** (`.claude/hooks/format-check-on-commit.mjs`) no deja pasar un
  `git commit` con archivos sin formatear. Cubre lo que el primero no ve: un
  `sed` masivo, un script, cualquier cosa que toque archivos desde el shell —
  que es exactamente lo que dejó el CI en rojo en el PR #68 (issue #69). **Avisa,
  no arregla**: lo que se commitea es el índice, así que formatear el archivo del
  disco dejaría el commit igual de mal y el arreglo suelto fuera.

Si commiteás por fuera de Claude Code, corré `yarn nx format:write` antes.

En Windows, `prettier --check` local da falsos positivos por CRLF. El log del CI
(Linux, LF) es la fuente de verdad — no persigas archivos que solo fallan
localmente. El hook del commit **no** tiene ese problema: compara el contenido que
git va a guardar, ya normalizado a LF, no el del disco.

## Agent skills

### Issue tracker

Issues and the Wayfinder map/tickets live as GitHub Issues in this repo (`FabianRG1990/repositorio-de-apps`), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Multi-context layout — one `CONTEXT.md` per client app under `apps/<client>/`, indexed by a root `CONTEXT-MAP.md`; monorepo-wide ADRs live in `docs/adr/`, client-specific ADRs in `apps/<client>/docs/adr/`. See `docs/agents/domain.md`.
