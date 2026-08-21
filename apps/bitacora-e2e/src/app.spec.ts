import { test, expect, type Page } from '@playwright/test';

/* A Bitácora se entra eligiendo un Perfil (ADR 0005). Estas pruebas no ejercen
   esa pantalla —tiene la suya, más abajo—, así que arrancan con el Perfil ya
   elegido, igual que un aparato donde ya se eligió una vez. Va Dueño porque es
   el único al que la app le OFRECE editar la apariencia del Taller. */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    /* La bandera la pone el bloque del Perfil, que necesita justo lo
       contrario. Sin ella, esto volvería a sembrar el Perfil en CADA
       navegación —`addInitScript` corre en todas— y esas pruebas nunca verían
       un aparato recién instalado. */
    if (localStorage.getItem('e2e.sin-perfil')) return;
    localStorage.setItem('bitacora.perfil', 'dueno');
  });
});

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
  // que medir el desborde. Se mide `.fila__modelo` y no `.fila__titulo`,
  // porque el título pasó a ser un contenedor de dos piezas y el desborde lo
  // sufre la de dentro.
  const cortado = await page
    .locator('.fila__modelo')
    .first()
    .evaluate((el) => el.scrollWidth > el.clientWidth);
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
    // Cada prueba arranca sin apariencia elegida, como un Taller recién
    // instalado. Se borra SOLO esa clave: un `clear()` se llevaría por delante
    // el Perfil, y sin Perfil la app manda a elegirlo antes de nada.
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('bitacora.apariencia'));
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

test('las Órdenes salen de la base y la semilla no las duplica', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.fila').first()).toBeVisible();

  const contar = () =>
    page.evaluate(async () => {
      const abrir = indexedDB.open('bitacora');
      const db = await new Promise<IDBDatabase>((res, rej) => {
        abrir.onsuccess = () => res(abrir.result);
        abrir.onerror = () => rej(abrir.error);
      });
      return new Promise<number>((res) => {
        const p = db.transaction('ordenes').objectStore('ordenes').count();
        p.onsuccess = () => res(p.result);
      });
    });

  const enLaBase = await contar();
  expect(enLaBase).toBeGreaterThan(0);
  await expect(page.locator('.fila')).toHaveCount(enLaBase);

  // La semilla es idempotente: recargar no vuelve a sembrar.
  await page.reload();
  await expect(page.locator('.fila').first()).toBeVisible();
  expect(await contar()).toBe(enLaBase);
});

/* ---------------------------------------------------------------------------
   Lo que #77 midió sobre el prototipo, vuelto a medir sobre la app.

   No se hereda al pasar a componentes de la plantilla: varios de esos
   defectos existían justamente porque nadie los había medido.
   --------------------------------------------------------------------------- */
test.describe('la lista de órdenes, medida sobre el render', () => {
  /* 1600 px: la fila conserva su forma de columnas por encima de 52 rem de
     LISTA, y con los dos cajones abiertos el viewport de fábrica de Playwright
     —1280— deja la lista en 46 rem, donde ya reflujo. Medirla ahí sería medir
     otra forma. */
  const ANCHA = { width: 1600, height: 900 };

  const preparar = async (
    page: Page,
    piel: string,
    densidad: string,
    viewport = ANCHA,
  ) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(
      (a) => {
        localStorage.setItem('bitacora.apariencia', JSON.stringify(a));
      },
      { piel, densidad, marca: '#3da5c2' },
    );
    await page.goto('/');
    await expect(page.locator('li.fila').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
  };

  /* La escalera de #18 §6.5 es 56 / 72 / 96 px, medida para un dedo con
     guante. Compacta y normal la cumplen exacta; la amplia usa el 96 como
     PISO y crece, porque enseña el detalle sin abrir la Orden. */
  test('la escalera de altura de fila da 56 y 72 px exactos', async ({
    page,
  }) => {
    for (const [densidad, esperado] of [
      ['compacta', 56],
      ['normal', 72],
    ] as const) {
      await preparar(page, 'oficina', densidad);
      const altos = await page
        .locator('li.fila')
        .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));

      expect(altos.every((h) => Math.abs(h - esperado) < 1)).toBe(true);
    }

    await preparar(page, 'oficina', 'guantes');
    const amplia = await page
      .locator('li.fila')
      .first()
      .evaluate((e) => e.getBoundingClientRect().height);
    expect(amplia).toBeGreaterThanOrEqual(96);
  });

  /* Cada fila es su propia rejilla, así que con columnas `auto` los chips
     caían en una x distinta por fila y la columna dejaba de existir. */
  test('las columnas de la lista caen en la misma x en todas las filas', async ({
    page,
  }) => {
    await preparar(page, 'oficina', 'normal');

    for (const parte of ['app-etiqueta-especialidad', 'app-insignia-estado']) {
      const equis = await page
        .locator('li.fila ' + parte)
        .evaluateAll((els) =>
          els.map((e) => Math.round(e.getBoundingClientRect().left)),
        );
      expect(new Set(equis).size).toBe(1);
    }
  });

  /* La placa identifica el carro: no puede ser ella la que se corta. Con el
     título en una sola cadena, "Hyundai Elantra 2018 · TSJ 1204" quedaba en
     "TSJ 1…". */
  test('la placa y el folio nunca se cortan, aunque el modelo sí', async ({
    page,
  }) => {
    for (const ancho of [1600, 1366, 1280, 1024, 520, 360]) {
      await preparar(page, 'oficina', 'normal', { width: ancho, height: 900 });

      const cortes = await page.locator('li.fila').evaluateAll((els) =>
        els.map((li) => {
          const corta = (sel: string) => {
            const el = li.querySelector(sel) as HTMLElement;
            return el.scrollWidth > el.clientWidth + 1;
          };
          return { placa: corta('.fila__placa'), folio: corta('.fila__folio') };
        }),
      );

      expect(cortes.filter((c) => c.placa || c.folio)).toEqual([]);
    }
  });

  /* SC 1.4.4 pide 200 % sin desborde horizontal. La consulta de medio no
     servía: mira la ventana, que no cambia de tamaño al subir la letra. */
  test('al 200 % de tamaño de letra no hay desborde horizontal', async ({
    page,
  }) => {
    await preparar(page, 'taller', 'normal');
    await page.evaluate(
      () => (document.documentElement.style.fontSize = '32px'),
    );

    await expect
      .poll(() =>
        page
          .locator('.pantalla')
          .evaluate((el) => el.scrollWidth > el.clientWidth),
      )
      .toBe(false);

    // Y el texto creció de verdad, no es que se haya quedado igual.
    const cuerpo = await page.evaluate(
      () => getComputedStyle(document.body).fontSize,
    );
    expect(cuerpo).toBe('32px');
  });

  /* #18 §6.4: 2 px de trazo con 2 px de hueco, y por TECLADO — un `:focus` a
     secas también lo dispara el ratón. */
  test('el anillo de foco es de 2 px con 2 px de hueco, por teclado', async ({
    page,
  }) => {
    await preparar(page, 'taller', 'normal');
    await page.locator('.pantalla__accion').focus();
    await page.keyboard.press('Tab');

    const anillo = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const s = getComputedStyle(el);
      return {
        clase: el.className,
        trazo: s.outlineWidth,
        hueco: s.outlineOffset,
        estilo: s.outlineStyle,
        visible: el.matches(':focus-visible'),
      };
    });

    expect(anillo).toMatchObject({
      clase: 'fila__cuerpo',
      trazo: '2px',
      hueco: '2px',
      estilo: 'solid',
      visible: true,
    });
  });

  /* ANSI/HFES 100-2007 §7.2.5.3: el color nunca es el único portador. Cada
     tono lleva su figura, y a 20 px, que es donde se DISCRIMINA por color. */
  test('cada estado lleva su propia figura además de su color', async ({
    page,
  }) => {
    await preparar(page, 'oficina', 'normal');

    const marcas = await page
      .locator('li.fila app-insignia-estado .insignia')
      .evaluateAll((els) =>
        els.map((el) => {
          const antes = getComputedStyle(el, '::before');
          return {
            tono: (el as HTMLElement).dataset['tono'],
            figura: antes.clipPath + '|' + antes.borderRadius,
            lado: antes.width,
          };
        }),
      );

    const porTono = new Map(marcas.map((m) => [m.tono, m.figura]));
    expect(porTono.size).toBeGreaterThan(1);
    expect(new Set(porTono.values()).size).toBe(porTono.size);
    expect(marcas.every((m) => parseFloat(m.lado) >= 20)).toBe(true);
  });

  /* El cero cortado es la razón por la que #18 §6.1 eligió Inter: en una placa
     confundir 0 con O es un error de trabajo real. Se comprueba por PÍXELES y
     no leyendo el CSS: la app pedía la característica desde el principio y la
     fuente que la trae no se estaba cargando, así que el CSS decía que sí y la
     pantalla decía que no. */
  test('el cero cortado se dibuja de verdad en la placa', async ({ page }) => {
    await preparar(page, 'taller', 'normal');
    const placa = page.locator('.fila__placa').first();

    const conRasgos = await placa.screenshot();
    await page.addStyleTag({
      content:
        '.fila__placa { font-variant-numeric: normal !important; font-feature-settings: normal !important; }',
    });
    const sinRasgos = await placa.screenshot();

    expect(conRasgos.equals(sinRasgos)).toBe(false);
  });

  /* El agujero que Ver orden vino a tapar: en una tableta el panel está
     cerrado, así que tocar la fila seleccionaba una Orden y no pasaba nada
     visible. */
  test('en tableta Ver orden abre el panel con la Orden pulsada', async ({
    page,
  }) => {
    await preparar(page, 'oficina', 'normal', { width: 520, height: 900 });

    const panel = page.locator('mat-sidenav.shell__panel');
    await expect(panel).toBeHidden();

    const primera = page.locator('li.fila').first();
    const folio = (await primera.locator('.fila__folio').textContent())?.trim();
    await primera.getByRole('button', { name: /Ver orden/ }).click();

    await expect(panel).toBeVisible();
    await expect(panel.locator('.panel__encabezado')).toContainText(
      'Orden ' + folio,
    );
  });

  /* SC 1.4.10 pone el piso del reflujo en 320 px de ancho. A 360 la
     especialidad y el estado en la misma línea medían 370 px contra los 342
     disponibles —"Esperando repuesto" solo ya son 204— y la pantalla
     desbordaba en horizontal. */
  test('a 360 px de ancho no hay desplazamiento horizontal', async ({
    page,
  }) => {
    await preparar(page, 'oficina', 'normal', { width: 360, height: 850 });

    const desborde = await page.evaluate(() => {
      const pantalla = document.querySelector('.pantalla') as HTMLElement;
      return {
        pantalla: pantalla.scrollWidth > pantalla.clientWidth,
        documento:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      };
    });

    expect(desborde).toEqual({ pantalla: false, documento: false });
  });

  /* Con guantes la fila ya ES una tarjeta de una columna, así que el reflujo
     no debe tocarla. Cuando lo hacía, le reasignaba las áreas y la
     especialidad se quedaba sin celda en esa plantilla: se auto-colocaba en
     una fila implícita, debajo del detalle y pegada al borde derecho. */
  test('la tarjeta de guantes no la reordena el reflujo', async ({ page }) => {
    await preparar(page, 'taller', 'guantes', { width: 1440, height: 900 });

    const sitios = await page
      .locator('li.fila')
      .first()
      .evaluate((li) => {
        /* Se compara el CENTRO y no el borde de arriba: la insignia de estado
           es más alta que la etiqueta de especialidad —lleva relleno y borde—
           y en la misma línea quedan centradas entre sí, así que sus `top`
           difieren 5,5 px estando perfectamente alineadas. */
        const centro = (sel: string) => {
          const c = (
            li.querySelector(sel) as HTMLElement
          ).getBoundingClientRect();
          return c.top + c.height / 2;
        };
        const izquierda = (sel: string) =>
          (li.querySelector(sel) as HTMLElement).getBoundingClientRect().left;
        return {
          esp: centro('app-etiqueta-especialidad'),
          estado: centro('app-insignia-estado'),
          detalle: centro('.fila__detalle'),
          espIzq: izquierda('.fila__especialidades'),
          cuerpoIzq: izquierda('.fila__cuerpo'),
        };
      });

    // Las insignias comparten línea, y esa línea va antes del detalle.
    expect(Math.abs(sitios.esp - sitios.estado)).toBeLessThan(2);
    expect(sitios.esp).toBeLessThan(sitios.detalle);
    // Y arrancan donde arranca el resto de la tarjeta, no en el borde derecho.
    expect(sitios.espIzq).toBeCloseTo(sitios.cuerpoIzq, 0);
  });
});

/* ---------------------------------------------------------------------------
   El Perfil (ADR 0005 / #90).

   Lo que se comprueba acá es la frontera del ADR: el Perfil decide qué pantalla
   se abre y qué se ofrece, y NO decide qué está permitido.
   --------------------------------------------------------------------------- */
test.describe('el Perfil', () => {
  /* Este bloque necesita justo lo contrario que el resto: un aparato donde
     nadie ha elegido todavía.

     El borrado tiene que pasar SOLO en la primera carga. `addInitScript` corre
     en cada navegación, así que la versión ingenua volvía a borrar el Perfil
     después de elegirlo y las pruebas que navegan o recargan veían siempre la
     pantalla de entrada. La marca va en `sessionStorage`, que sobrevive a la
     recarga sin ensuciar lo que se está midiendo. */
  const sinElegir = async (page: Page) => {
    await page.addInitScript(() => {
      localStorage.setItem('e2e.sin-perfil', '1');
      if (sessionStorage.getItem('e2e.perfil-borrado')) return;
      sessionStorage.setItem('e2e.perfil-borrado', '1');
      localStorage.removeItem('bitacora.perfil');
    });
  };

  test('sin Perfil elegido, la app manda a elegirlo', async ({ page }) => {
    await sinElegir(page);
    await page.goto('/');

    await expect(page).toHaveURL(/\/entrar$/);
    await expect(
      page.getByRole('heading', { name: /Quién está usando/ }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Asesor/ })).toBeVisible();
  });

  /* No es un login y el vocabulario tiene que dejarlo claro: nadie escribe
     nada, y elegir mal no cuesta nada porque se cambia en un clic. */
  test('la pantalla de entrada no se parece a un inicio de sesión', async ({
    page,
  }) => {
    await sinElegir(page);
    await page.goto('/');

    // Aserción web-first: reintenta y además evita el `?? ''` que hacía falta
    // para el caso de que `textContent` viniera nulo.
    await expect(page.locator('.entrada')).not.toContainText(
      /sesión|contraseña|usuario|ingresar|login/i,
    );
    // Y no hay nada donde escribir.
    await expect(page.locator('input, [contenteditable]')).toHaveCount(0);
  });

  /* La mitad del ADR que hasta ahora no se ejercía: "el Perfil determina qué
     pantalla se abre". Va como tres pruebas y no como un bucle: cada una
     necesita un aparato recién instalado, y eso es una página limpia. */
  for (const [nombre, url] of [
    ['Asesor', '/'],
    ['Técnico', '/ordenes'],
    ['Dueño', '/ajustes'],
  ] as const) {
    test(`el ${nombre} entra por ${url}`, async ({ page }) => {
      await sinElegir(page);
      await page.goto('/');

      await page.getByRole('button', { name: new RegExp(nombre) }).click();

      /* Se compara el `pathname` en vez de montar una expresión regular con la
         URL dentro: la versión con `RegExp` necesitaba escapar las barras y un
         condicional para el caso de la raíz, y las dos cosas son ruido en una
         prueba que solo quiere saber dónde acabó. */
      await expect.poll(() => new URL(page.url()).pathname).toBe(url);
    });
  }

  test('lo elegido sobrevive a recargar y no vuelve a preguntar', async ({
    page,
  }) => {
    await sinElegir(page);
    await page.goto('/');
    await page.getByRole('button', { name: /Técnico/ }).click();
    await expect(page).toHaveURL(/\/ordenes$/);

    await page.reload();

    await expect(page).toHaveURL(/\/ordenes$/);
    await expect(page.locator('.menu__perfil-nombre')).toHaveText('Técnico');
  });

  /* La otra mitad: "qué se ofrece hacer". El menú cambia; nada se prohíbe. */
  test('el menú ofrece cosas distintas según el Perfil', async ({ page }) => {
    const delMenu = () =>
      page.locator('.menu__item .mdc-list-item__primary-text').allInnerTexts();

    await page.goto('/');
    await expect.poll(delMenu).toEqual(['Tablero', 'Órdenes', 'Ajustes']);

    await page.locator('.menu__perfil').click();
    await page.getByRole('menuitem', { name: /Técnico/ }).click();

    await expect.poll(delMenu).toEqual(['Órdenes', 'Tablero']);
  });

  /* EL corazón del ADR: el Perfil ofrece y no prohíbe. Ajustes no está en el
     menú del Técnico y aun así se abre entera escribiendo la URL — no hay
     guarda, no hay redirección, no hay pantalla de "no tenés permiso". */
  test('lo que no se ofrece sigue abriéndose por URL', async ({ page }) => {
    await sinElegir(page);
    await page.goto('/');
    await page.getByRole('button', { name: /Técnico/ }).click();
    await expect(page).toHaveURL(/\/ordenes$/);

    await page.goto('/ajustes');

    await expect(page).toHaveURL(/\/ajustes$/);
    await expect(page.locator('.cuadro__titulo')).toHaveText('Ajustes');
    expect(await page.locator('.raiz').textContent()).not.toMatch(/permiso/i);
  });

  /* Y si la pantalla abierta no está en el menú de ese Perfil, se AÑADE en vez
     de desaparecer: cambiar de Perfil no puede dejar al usuario sin rastro de
     dónde está. */
  test('la pantalla abierta nunca desaparece del menú', async ({ page }) => {
    await page.goto('/proximas-visitas');

    const delMenu = () =>
      page.locator('.menu__item .mdc-list-item__primary-text').allInnerTexts();

    // El Dueño no tiene Próximas visitas en su lista, pero la tiene abierta.
    await expect.poll(delMenu).toContain('Próximas visitas');
    await expect(
      page.getByRole('link', { name: 'Próximas visitas' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  /* "Cambiar de Perfil en vivo es gratis y no pierde estado" — así que no
     navega. El destino de entrada se usa al entrar y solo ahí. */
  test('cambiar de Perfil no se lleva al usuario de la pantalla', async ({
    page,
  }) => {
    await page.goto('/ordenes');
    await page.getByRole('tab', { name: 'Declinado' }).click();

    await page.locator('.menu__perfil').click();
    await page.getByRole('menuitem', { name: /Asesor/ }).click();

    await expect(page).toHaveURL(/\/ordenes$/);
    // Ni siquiera se perdió la pestaña abierta dentro de la pantalla.
    await expect(page.locator('[role="tabpanel"]')).toHaveAttribute(
      'id',
      'panel-declinado',
    );
    await expect(page.locator('.menu__perfil-nombre')).toHaveText('Asesor');
  });

  test('el desplegable marca cuál es el Perfil de ahora', async ({ page }) => {
    await page.goto('/');
    await page.locator('.menu__perfil').click();

    await expect(page.getByRole('menuitem', { name: /Dueño/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(
      page.getByRole('menuitem', { name: /Asesor/ }),
    ).not.toHaveAttribute('aria-current', 'true');
  });

  /* #18 §6.4 otra vez, sobre la pantalla nueva: 2 px de trazo y 2 px de hueco,
     y por teclado. */
  test('las tarjetas de Perfil se enfocan con anillo de 2+2 px', async ({
    page,
  }) => {
    await sinElegir(page);
    await page.goto('/');
    /* Sin foco dentro del documento, el primer Tab no mueve nada: se pulsa un
       elemento NO enfocable —el rótulo— para fijar desde dónde empieza el
       recorrido, y el Tab siguiente cae en la primera tarjeta. Tiene que ser
       con TECLADO: `focus()` no enciende `:focus-visible`, así que probaría
       otra cosa. */
    await page.locator('.entrada__marca').click();
    await page.keyboard.press('Tab');

    const anillo = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const s = getComputedStyle(el);
      return {
        clase: el.className,
        trazo: s.outlineWidth,
        hueco: s.outlineOffset,
        visible: el.matches(':focus-visible'),
      };
    });

    expect(anillo).toMatchObject({
      clase: 'perfil',
      trazo: '2px',
      hueco: '2px',
      visible: true,
    });
  });
});
