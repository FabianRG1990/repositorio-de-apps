# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

**Layout: multi-context.** This monorepo hosts one Angular app per client (`apps/<client>/`), and each client's business vocabulary is its own bounded context — unrelated to any other client's. There is no shared business domain across apps beyond the shared tech stack.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root — lists every client context and points at its `CONTEXT.md`. Read the map first, then only the `CONTEXT.md` files relevant to the client/app you're working in.
- **`docs/adr/`** at the repo root — cross-cutting decisions for the whole monorepo (Nx, Angular, testing stack, tooling). Read these regardless of which client you're working on.
- **`apps/<client>/docs/adr/`** — decisions scoped to that one client's app only.

If any of these files don't exist yet for the client you're working on, **proceed silently** — don't flag their absence, don't suggest creating them upfront. `/domain-modeling` creates a client's `CONTEXT.md` (and adds an entry to `CONTEXT-MAP.md`) lazily, the first time a term from that client's domain actually gets resolved.

## File structure (adapted from the skill's default `src/<context>/` convention to this monorepo's `apps/<client>/` convention)

```
/
├── CONTEXT-MAP.md              ← lists every client context
├── docs/adr/                   ← monorepo-wide decisions (Nx, Angular, tooling)
└── apps/
    ├── acme-dashboard/
    │   ├── CONTEXT.md          ← Acme's business vocabulary
    │   └── docs/adr/           ← Acme-specific decisions
    └── other-client-app/
        ├── CONTEXT.md
        └── docs/adr/
```

`apps/shell` is the placeholder app generated with the workspace — it carries no business domain and never gets a `CONTEXT.md`.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in that client's `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids, and don't borrow another client's terminology — contexts here don't share vocabulary.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR (root `docs/adr/` or the client's `apps/<client>/docs/adr/`), surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
