# repositorio-de-apps

Monorepo Nx para las aplicaciones y sistemas que se desarrollan para clientes.

## Stack

- [Nx](https://nx.dev) 23 (monorepo integrado, `apps/` + `libs/`)
- [Angular](https://angular.dev) 22 (standalone components, zoneless)
- [Vitest](https://vitest.dev) para pruebas unitarias (integración nativa `vitest-angular`)
- [Playwright](https://playwright.dev) para pruebas end-to-end
- [Yarn](https://yarnpkg.com) 4 (Berry) como package manager
- ESLint + Prettier

## Estructura

```
apps/           # una carpeta por aplicación de cliente (ej. apps/acme-dashboard)
apps/*-e2e/     # pruebas Playwright de cada app
libs/           # código compartido entre apps (ui, data-access, utils, etc.)
```

`apps/shell` es una app placeholder generada al crear el workspace. Bórrala (`npx nx g @nx/workspace:remove shell` y su `shell-e2e`) cuando generes la primera app real de un cliente, o duplícala como referencia.

## Comandos principales

```sh
yarn install                 # instalar dependencias

npx nx g @nx/angular:application apps/<nombre-cliente> \
  --style=scss --e2eTestRunner=playwright --unitTestRunner=vitest-angular   # nueva app de cliente

npx nx g @nx/angular:library libs/<nombre-lib>          # nueva librería compartida

npx nx build <app>            # compilar
npx nx test <app>              # pruebas unitarias
npx nx lint <app>              # lint
npx nx e2e <app>-e2e            # pruebas end-to-end

npx nx graph                   # ver el grafo de dependencias del workspace
npx nx affected -t build,test,lint   # ejecutar solo sobre lo afectado por el cambio actual
```

## Convenciones

- Nombra cada app de cliente de forma descriptiva y en kebab-case (ej. `apps/acme-dashboard`, no `apps/app1`).
- El código compartido entre dos o más apps va en `libs/`, no se copia entre apps.
- El scope de npm del workspace es `@repositorio-de-apps` (ver `package.json`); las libs generadas heredan ese prefijo en sus imports.
