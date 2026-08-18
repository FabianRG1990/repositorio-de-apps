import { test, expect } from '@playwright/test';

test('la app carga y muestra el encabezado de Bahía', async ({ page }) => {
  await page.goto('/');

  // Aserción web-first: reintenta hasta que Angular termine de renderizar,
  // en vez de leer innerText una sola vez (ver issue #42).
  await expect(page.locator('h1')).toHaveText('Bahía');
});
