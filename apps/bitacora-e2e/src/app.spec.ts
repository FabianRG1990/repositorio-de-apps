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
});
