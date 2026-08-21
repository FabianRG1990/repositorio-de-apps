import { test, expect } from '@playwright/test';

test('el shell arranca en el tablero', async ({ page }) => {
  await page.goto('/');

  // Aserción web-first: reintenta hasta que Angular termine de renderizar,
  // en vez de leer innerText una sola vez (ver issue #42).
  await expect(page.locator('.cuadro__titulo')).toHaveText('En el taller');
  await expect(page.locator('.shell__menu')).toBeVisible();
  await expect(page.locator('.shell__panel')).toBeVisible();
});

test.describe('navegación del menú lateral', () => {
  test('cambia la pantalla dentro del cuadro sin recrear el shell', async ({
    page,
  }) => {
    await page.goto('/');

    // Se marca el contenedor para detectar si el shell se destruye al navegar.
    await page.locator('.shell').evaluate((el) => {
      (el as HTMLElement).dataset['testigo'] = 'vivo';
    });

    await page.getByRole('link', { name: 'Órdenes' }).click();

    await expect(page).toHaveURL(/\/ordenes$/);
    await expect(page.locator('.cuadro__titulo')).toHaveText('Órdenes');
    // El shell sobrevivió: es lo que distingue rutas hijas de rutas hermanas.
    await expect(page.locator('.shell')).toHaveAttribute(
      'data-testigo',
      'vivo',
    );
  });

  test('marca el item activo con aria-current', async ({ page }) => {
    await page.goto('/ordenes');

    await expect(page.getByRole('link', { name: 'Órdenes' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

test.describe('pestañas de arriba', () => {
  test('cambian el panel sin tocar la URL', async ({ page }) => {
    await page.goto('/ordenes');

    await expect(page.locator('[role="tabpanel"]')).toHaveAttribute(
      'id',
      'panel-en-taller',
    );

    await page.getByRole('tab', { name: 'Declinado' }).click();

    await expect(page.locator('[role="tabpanel"]')).toHaveAttribute(
      'id',
      'panel-declinado',
    );
    // El mecanismo es una señal con @switch, no el router.
    await expect(page).toHaveURL(/\/ordenes$/);
  });

  test('se recorren con las flechas, como manda el patrón de tablist', async ({
    page,
  }) => {
    await page.goto('/ordenes');

    await page.getByRole('tab', { name: 'En el taller' }).focus();
    await page.keyboard.press('ArrowRight');

    await expect(
      page.getByRole('tab', { name: 'Por entregar' }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: 'Por entregar' })).toBeFocused();
  });
});

test.describe('cajones laterales', () => {
  test('colapsar el menú lo deja en riel y desliza el cuadro', async ({
    page,
  }) => {
    await page.goto('/');

    const contenido = page.locator('.mat-drawer-content');
    const margenIzquierdo = () =>
      contenido.evaluate((el) => parseFloat(getComputedStyle(el).marginLeft));

    const margenAncho = await margenIzquierdo();

    await page.locator('.cuadro__hamburguesa').click();

    // `expect.poll` en vez de una espera fija: la transición dura 500 ms y un
    // `waitForTimeout(600)` deja el margen a medio camino cuando la máquina va
    // cargada, que es como este test se puso intermitente.
    await expect.poll(margenIzquierdo).toBeLessThan(margenAncho);

    // Riel: quedan los iconos, se va el texto de las etiquetas. El enlace
    // SIGUE llamándose "Tablero" —el `title` le da nombre accesible, que es
    // justo lo que un enlace de solo icono necesita—, así que lo que se
    // comprueba es el texto visible, no el rol.
    await expect(page.locator('.menu__item fa-icon').first()).toBeVisible();
    await expect(page.locator('.menu__item').first()).toHaveText('');
    await expect(page.getByRole('link', { name: 'Tablero' })).toHaveAttribute(
      'title',
      'Tablero',
    );
  });

  test('el panel derecho se puede ocultar y refleja la selección', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.locator('.panel__vacio')).toBeVisible();

    await page.locator('.fila').first().click();
    await expect(page.locator('.panel__vistazo')).toBeVisible();
    await expect(page.locator('.panel__encabezado')).toContainText('Orden');

    await page.locator('.cuadro__alternar-panel').click();

    await expect
      .poll(() =>
        page
          .locator('.mat-drawer-content')
          .evaluate((el) => parseFloat(getComputedStyle(el).marginRight)),
      )
      .toBe(0);
  });
});

test('el scroll se queda dentro del cuadro y no en la ventana', async ({
  page,
}) => {
  await page.goto('/');

  // La cadena de `min-height: 0` es lo que sostiene esto; sin ella el
  // contenido desborda y el scroll se va al documento.
  const desborda = await page.evaluate(
    () =>
      document.documentElement.scrollHeight >
      document.documentElement.clientHeight,
  );
  expect(desborda).toBe(false);
  await expect(page.locator('.pantalla')).toHaveCSS('overflow-y', 'auto');
});

test('en móvil la fila del tablero no corta el nombre del vehículo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 420, height: 850 });
  await page.goto('/');

  await expect(page.locator('.fila').first()).toBeVisible();

  // Con las tres columnas en una sola línea al centro le quedaban ~80 px y
  // "Toyota Hilux 2019" se veía como "Toyot…". El ellipsis no da error: hay
  // que medir el desborde.
  const titulo = page.locator('.fila__titulo').first();
  const cortado = await titulo.evaluate(
    (el) => el.scrollWidth > el.clientWidth,
  );
  expect(cortado).toBe(false);
});

test('el item raíz sigue activo aunque la URL lleve un query param', async ({
  page,
}) => {
  // `exact: true` a secas compara la URL entera, así que cualquier parámetro
  // apagaba el item del tablero (issue #86). El parámetro de acá es uno
  // cualquiera a propósito: la prueba es de la app, no del prototipo de #79.
  await page.goto('/?desde=prueba');

  await expect(page.getByRole('link', { name: 'Tablero' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test.describe('ajustes de apariencia', () => {
  test.beforeEach(async ({ page }) => {
    // Cada prueba arranca sin nada elegido, como un Taller recién instalado.
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('la piel elegida se aplica y sobrevive a recargar', async ({ page }) => {
    await page.goto('/ajustes');
    await page.getByRole('tab', { name: 'Apariencia' }).click();
    await page.getByRole('radio', { name: /Taller/ }).click();

    await expect(page.locator('html')).toHaveAttribute('data-piel', 'taller');

    // "Persiste entre sesiones" es el criterio del ticket, así que se recarga.
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-piel', 'taller');
  });

  test('el tamaño mueve el alto de la fila del tablero', async ({ page }) => {
    const altoDeFila = () =>
      page
        .locator('.fila')
        .first()
        .evaluate((el) => el.getBoundingClientRect().height);

    await page.goto('/');
    const normal = await altoDeFila();

    await page.goto('/ajustes');
    await page.getByRole('tab', { name: 'Apariencia' }).click();
    await page.getByRole('radio', { name: /Guantes/ }).click();
    await page.goto('/');

    // La escalera de #18 §6.5 es 56 / 72 / 96: con guantes la fila crece.
    expect(await altoDeFila()).toBeGreaterThan(normal);
  });

  test('el color de marca tiñe la app entera, no solo Ajustes', async ({
    page,
  }) => {
    await page.goto('/ajustes');
    await page.getByRole('tab', { name: 'Apariencia' }).click();

    const acento = () =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--app-accent-strong')
          .trim(),
      );
    const antes = await acento();

    await page.locator('#marca').evaluate((el: HTMLInputElement) => {
      el.value = '#c23d5a';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await expect.poll(acento).not.toBe(antes);

    // El acento lo escribe el store en <html>, así que viaja a las demás
    // pantallas sin que cada una tenga que enterarse.
    await page.goto('/');
    expect(await acento()).not.toBe(antes);
  });
});
