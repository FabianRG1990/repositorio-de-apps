import { test, expect } from '@playwright/test';

test('la app carga y muestra el encabezado de Bitácora', async ({ page }) => {
  await page.goto('/');

  // Aserción web-first: reintenta hasta que Angular termine de renderizar,
  // en vez de leer innerText una sola vez (ver issue #42).
  await expect(page.locator('h1')).toHaveText('Bitácora');
});

// Instalar un paquete y verlo en node_modules no prueba nada. Lo que prueba la
// cadena es que el navegador dibuje: los iconos Pro solo pueden venir del
// registro privado de FontAwesome, así que si este test pasa en CI es porque
// el secreto está bien puesto. Se retira junto con el componente cuando #79
// fije el sistema visual.
test.describe('diagnóstico de la pila de UI', () => {
  test('FontAwesome Pro dibuja sus dos estilos', async ({ page }) => {
    await page.goto('/');

    for (const prueba of ['fa-pro-solid', 'fa-pro-regular']) {
      const svg = page.locator(`[data-prueba="${prueba}"] svg`);
      await expect(svg).toBeVisible();
      // Un <svg> sin <path> es un icono que no resolvió.
      await expect(svg.locator('path').first()).toBeAttached();
    }
  });

  test('ng-icons dibuja el set de Phosphor', async ({ page }) => {
    await page.goto('/');

    const svg = page.locator('[data-prueba="ng-icon"] svg');
    await expect(svg).toBeVisible();
    await expect(svg.locator('path').first()).toBeAttached();
  });

  test('Angular Material renderiza y toma los tokens del tema', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.locator('[data-prueba="mat-chip"]')).toBeVisible();

    const boton = page.locator('[data-prueba="mat-button"]');
    await expect(boton).toBeVisible();

    // Sin la clave `color` en mat.theme(), Material emite SOLO tokens de
    // tipografía: los componentes salen transparentes y el fallo es mudo. Se
    // comprueba que el token exista y que el botón relleno lo esté usando.
    const primario = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--mat-sys-primary')
        .trim(),
    );
    expect(primario).not.toBe('');

    const fondo = await boton.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(fondo).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('PrimeNG renderiza con el preset Aura', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('[data-prueba="p-tag"]')).toBeVisible();
    const boton = page.locator('[data-prueba="p-button"] button');
    await expect(boton).toBeVisible();

    // Sin preset, el botón de PrimeNG queda sin fondo.
    const fondo = await boton.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(fondo).not.toBe('rgba(0, 0, 0, 0)');
  });

  // Se habilita en cuanto haya clave de licencia. PrimeNG 22 inyecta un banner
  // rojo fijo "Invalid PrimeUI License" abajo a la derecha cuando no la
  // encuentra —en shadow root cerrado y con z-index máximo, hecho a propósito
  // para que no se pueda ocultar por CSS—. En una demo de venta eso no puede
  // aparecer, así que la ausencia del banner merece prueba permanente.
  test.fixme('no aparece el banner de licencia de PrimeUI', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.locator('#p-license-host')).toHaveCount(0);
  });
});
