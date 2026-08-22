import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// For CI, you may want to set BASE_URL to the deployed application.
// Bitácora sirve en el 4202: el 4200 lo ocupa `shell` y el 4201 `bahia`, y el
// CI levanta las tres suites e2e en paralelo (ver issue #39).
const baseURL = process.env['BASE_URL'] || 'http://localhost:4202';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import 'dotenv/config';

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Generated as a .mts file so Node forces ESM regardless of workspace
 * `type`. Playwright routes `.mts` through its ESM loader (dynamic import,
 * bypassing the pirates CJS-compile path), and Nx's native TS strip loads
 * `.mts` directly. Playwright's configLoader auto-discovers
 * `playwright.config.mts` via its extension list
 * (.ts/.js/.mts/.mjs/.cts/.cjs).
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  /* 45 s. Los 60 de antes eran un parche para tolerar la lentitud del dev
     server; con el build y los workers acotados (abajo), el peor caso de
     Firefox medido en cuatro corridas cae en 17,1–22,2 s, contra los 46,5 s
     del punto de partida. Con 45 s el margen es de 2× sobre el peor de los
     peores, y queda sitio para una máquina de CI más lenta.

     No se baja a los 30 de fábrica: el margen seguiría siendo amplio, pero el
     coste de equivocarse es un rojo intermitente que hace desconfiar de la
     suite entera, y el de acertar es no ahorrar nada — un timeout alto no
     cuesta tiempo en las pruebas que pasan. */
  timeout: 45_000,

  /* La MITAD del problema del issue #92 era esta, y el ticket la había
     descartado ("alarga la corrida entera para todos"). La medición dice lo
     contrario: con menos workers la suite es a la vez más estable Y más
     rápida.

     Misma máquina (16 núcleos lógicos), misma suite de 72 pruebas, contra el
     build:

     | workers | peor prueba de Firefox | suma Firefox | corrida completa |
     | --- | --- | --- | --- |
     | 8 (el 50 % de fábrica) | 28,0 s | 274,8 s | 55,5 s |
     | 4 | 7,1 s | 135,8 s | 49,7 s |
     | 2 | 4,5 s | 111,9 s | 69,1 s |

     Ocho workers no compran velocidad: se pelean la CPU. Cada worker levanta
     un navegador entero, y Firefox paga la contención mucho más caro que
     Chromium — de ahí que los rojos de #92 fueran siempre suyos. Bajar a
     cuatro deja la corrida completa donde estaba y hunde el peor caso, que es
     el número del que dependía el flake.

     Los tres valores de la tabla son de una corrida cada uno y hay ruido de
     fondo: con la configuración final, cuatro corridas seguidas dieron un peor
     caso de 17,1 / 17,8 / 22,2 / 18,8 s. El orden de magnitud es lo que manda,
     no el número exacto.

     En CI no se toca: Playwright ya usa un solo worker cuando detecta `CI`. */
  workers: process.env['CI'] ? 1 : '25%',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  /* La suite corre contra el BUILD, no contra el dev server.

     El dev server sirve los módulos sin bundlear, y Firefox lo paga mucho más
     caro que Chromium: era la causa de fondo de los rojos intermitentes del
     issue #92, donde tres a cinco pruebas de Firefox se pasaban del timeout
     solo cuando la suite corría completa.

     Medido en la misma máquina, misma suite de 72 pruebas:

     | | dev server | build |
     | --- | --- | --- |
     | Firefox, peor prueba | 46,5 s | 18,7 s |
     | Firefox, suma | 370,3 s | 234,3 s |
     | Chromium, peor prueba | 5,9 s | 2,7 s |
     | corrida completa | 72,9 s | 47,3 s |

     Y de propina prueba lo que de verdad se le entrega al taller: con el dev
     server, un fallo que solo aparezca con la optimización activada no lo veía
     nadie hasta desplegar.

     El `timeout` propio es más largo que los 60 s de fábrica de Playwright
     porque `serve-static` compila antes de servir. */
  webServer: {
    command: 'yarn nx run bitacora:serve-static',
    url: 'http://localhost:4202',
    reuseExistingServer: true,
    timeout: 180_000,
    cwd: workspaceRoot,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Webkit queda fuera a propósito, igual que en bahia-e2e. Necesita
    // librerías de sistema (libgtk-4, libgraphene, libevent, libopus,
    // GStreamer) que la imagen de ubuntu-latest no trae, y la única forma de
    // instalarlas en CI es apt — que es justo lo que colgaba el job hasta seis
    // horas (ver issue #65).

    // Uncomment for mobile browsers support
    /* {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }, */

    // Uncomment for branded browsers
    /* {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    } */
  ],
});
