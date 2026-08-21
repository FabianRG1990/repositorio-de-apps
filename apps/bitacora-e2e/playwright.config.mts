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
  /* 60 s en vez de los 30 s de fábrica. No es que las pruebas hagan de más:
     contra `nx serve` en modo desarrollo —que sirve los módulos sin bundlear—
     Firefox tarda entre 16 y 23 s en las pruebas del shell, contra 1-3 s de
     Chromium. Con 23 s de caso peor, 30 s deja un 30 % de margen y basta que
     ocho workers se peleen la CPU para agotarlo: de ahí los rojos
     intermitentes que solo aparecían con la suite completa (issue #92). */
  timeout: 60_000,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'yarn nx run bitacora:serve',
    url: 'http://localhost:4202',
    reuseExistingServer: true,
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
