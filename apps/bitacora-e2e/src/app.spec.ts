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
      /* Se cuentan las que NO están entregadas, que es lo que el Tablero
         muestra: la semilla incluye una Orden ya entregada justamente para
         que ese filtro se ejerza. Contar la tabla entera comparaba contra un
         número que la pantalla nunca iba a enseñar. */
      return new Promise<number>((res) => {
        const p = db.transaction('ordenes').objectStore('ordenes').getAll();
        p.onsuccess = () =>
          res(
            (p.result as { entregadoEn: number | string }[]).filter(
              (o) => o.entregadoEn === 0,
            ).length,
          );
      });
    });

  const enElTaller = await contar();
  expect(enElTaller).toBeGreaterThan(0);
  await expect(page.locator('.fila')).toHaveCount(enElTaller);

  // La semilla es idempotente: recargar no vuelve a sembrar.
  await page.reload();
  await expect(page.locator('.fila').first()).toBeVisible();
  expect(await contar()).toBe(enElTaller);
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
    ['Dueño', '/'],
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

      /* Y que ahí haya algo. El Dueño entraba por Ajustes, que abre en una
         pestaña que hoy es un párrafo: la peor primera impresión posible. */
      await expect(page.locator('li.fila').first()).toBeVisible();
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
    await expect
      .poll(delMenu)
      .toEqual([
        'Tablero',
        'Ajustes',
        'Órdenes',
        'Recepción',
        'Próximas visitas',
      ]);

    await page.locator('.menu__perfil').click();
    await page.getByRole('menuitem', { name: /Técnico/ }).click();

    // Las mismas cinco, en otro orden: lo primero es lo que ese Perfil más usa.
    await expect
      .poll(delMenu)
      .toEqual([
        'Órdenes',
        'Tablero',
        'Recepción',
        'Próximas visitas',
        'Ajustes',
      ]);
  });

  /* EL corazón del ADR: el Perfil ofrece y no prohíbe. Ninguna ruta lleva
     guarda ni redirección, y ninguna pantalla dice "no tenés permiso". */
  test('ninguna ruta está bloqueada para ningún Perfil', async ({ page }) => {
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

  /* La auditoría del 2026-08-22 encontró que un Dueño no tenía NINGÚN camino
     en la interfaz hasta Recepción ni hasta Próximas visitas: el menú le daba
     un subconjunto y el resto quedaba solo para quien supiera escribir la URL.
     Eso no es ofrecer menos, es prohibir sin decirlo. */
  test('desde el menú se llega a las cinco pantallas, con cualquier Perfil', async ({
    page,
  }) => {
    const TODAS = [
      '/',
      '/recepcion',
      '/ordenes',
      '/proximas-visitas',
      '/ajustes',
    ];

    for (const perfil of ['asesor', 'tecnico', 'dueno']) {
      await page.addInitScript((p) => {
        localStorage.setItem('bitacora.perfil', p);
      }, perfil);
      await page.goto('/');
      await expect(page.locator('.menu__item').first()).toBeVisible();

      const enElMenu = await page
        .locator('.menu__item')
        .evaluateAll((els) =>
          (els as HTMLAnchorElement[]).map((e) => new URL(e.href).pathname),
        );

      expect([...enElMenu].sort()).toEqual([...TODAS].sort());
    }
  });
});

test.describe('lo que la auditoría del 2026-08-22 encontró roto', () => {
  /* Pulsar dos veces la misma fila vaciaba el panel y lo dejaba en "Elegí una
     Orden". Desde la pantalla eso se lee como que la app dejó de responder. */
  test('volver a pulsar una Orden no borra su detalle', async ({ page }) => {
    await page.goto('/');
    const cuerpo = page.locator('li.fila').first().locator('.fila__cuerpo');
    const panel = page.locator('mat-sidenav.shell__panel');

    await cuerpo.click();
    await expect(panel).toContainText('A1-2418');

    await cuerpo.click();
    await expect(panel).toContainText('A1-2418');
  });

  /* Era un botón primario que no hacía absolutamente nada. Un botón muerto en
     esa posición enseña que la app está rota aunque el resto funcione. */
  test('Recibir vehículo lleva a Recepción', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /Recibir vehículo/ }).click();

    await expect(page).toHaveURL(/\/recepcion$/);
    await expect(page.locator('.cuadro__titulo')).toHaveText('Recepción');
  });

  /* Ajustes abría en la pestaña Taller, que es un párrafo: el Dueño entraba a
     la app y veía la única pantalla con cero contenido. */
  test('Ajustes abre en la pestaña que tiene contenido', async ({ page }) => {
    await page.goto('/ajustes');

    await expect(page.locator('[role="tabpanel"]')).toHaveAttribute(
      'id',
      'panel-apariencia',
    );
    await expect(page.getByRole('radio').first()).toBeVisible();
  });
});

/* ---------------------------------------------------------------------------
   Recepción (#102). Hasta este ticket no había forma de crear una Orden desde
   la app: la interfaz solo sabía leer lo que la semilla había dejado puesto.
   --------------------------------------------------------------------------- */
/** Llena el paso 1 con un carro que el Taller no conoce. */
async function llenarElCarro(page: Page, placa = 'BNT 907') {
  await page.fill('#placa', placa);
  await page.fill('#marca', 'Mazda');
  await page.fill('#modelo', 'BT-50');
  await page.fill('#anio', '2020');
  await page.fill('#cliente', 'Ferretería El Roble');
  await page.fill('#telefono', '2244-5566');
}

const siguiente = (page: Page) =>
  page.getByRole('button', { name: 'Siguiente' }).click();

test.describe('recibir un vehículo', () => {
  test('recorre los cuatro pasos y deja la Orden con lo que dijo el cliente', async ({
    page,
  }) => {
    await page.goto('/');
    /* Se espera a que la semilla termine: contar antes daba 0 y la aserción
       de después comparaba contra un número que nunca fue el real. */
    await expect(page.locator('li.fila').first()).toBeVisible();
    const antes = await page.locator('li.fila').count();

    await page.goto('/recepcion');
    await expect(page.locator('.riel__cuenta')).toHaveText('Paso 1 de 4');
    await llenarElCarro(page);
    await siguiente(page);

    await expect(page.locator('.riel__cuenta')).toHaveText('Paso 2 de 4');
    await page
      .locator('textarea')
      .first()
      .fill('Se calienta cuando queda en presa');
    await siguiente(page);

    await expect(page.locator('.riel__cuenta')).toHaveText('Paso 3 de 4');
    await page.fill('#odometro', '84500');
    await page.getByText('½', { exact: true }).click();
    await siguiente(page);

    // El paso 4 enseña la ficha antes de guardar nada.
    await expect(page.locator('.ficha__placa')).toHaveText('BNT 907');
    await expect(page.locator('.ficha')).toContainText('84 500 km');
    await page.getByRole('button', { name: /Recibir veh/ }).click();

    // Sale al Tablero con la Orden nueva ya seleccionada y su detalle abierto.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('li.fila')).toHaveCount(antes + 1);

    const panel = page.locator('mat-sidenav.shell__panel');
    await expect(panel).toContainText('Mazda BT-50 2020');
    await expect(panel).toContainText('BNT 907');
    // El Folio se muestra completo, con su letra (ADR 0010).
    await expect(panel).toContainText(/Orden A1-\d+/);
    /* Y la queja sobrevive a la Recepción, en las palabras del Cliente: si no,
       la ficha sería una pantalla bonita que no deja nada. */
    await expect(panel).toContainText('«Se calienta cuando queda en presa»');
    await expect(panel).toContainText('84 500 km');
  });

  /* El historial sigue al carro: la misma placa no puede crear un segundo
     Vehículo, o el historial se parte en dos. */
  test('una placa conocida reconoce el vehículo y no lo duplica', async ({
    page,
  }) => {
    await page.goto('/recepcion');

    await page.fill('#placa', '863 549');
    await page.locator('#marca').click();

    await expect(page.locator('.conocido')).toContainText('Ya lo conocemos');
    // Y rellena lo que el Taller ya sabe, editable.
    await expect(page.locator('#marca')).toHaveValue('Toyota');
    await expect(page.locator('#cliente')).toHaveValue('Marielos Quesada');
    await expect(page.locator('#telefono')).toHaveValue('8888-1111');

    await siguiente(page);
    await page.locator('textarea').first().fill('Sigue sonando');
    await siguiente(page);
    await siguiente(page);
    await page.getByRole('button', { name: /Recibir veh/ }).click();
    await expect(page).toHaveURL(/\/$/);

    // Dos Órdenes para el mismo carro, un solo carro en la lista de placas.
    const conEsaPlaca = page.locator('li.fila').filter({ hasText: '863 549' });
    await expect(conEsaPlaca).toHaveCount(2);
  });

  /* Es el argumento de venta del producto: el glosario dice que el trabajo
     declinado reaparece cuando el Vehículo regresa, y regresa justo acá. */
  test('avisa el trabajo declinado con su monto al reconocer la placa', async ({
    page,
  }) => {
    await page.goto('/recepcion');

    await page.fill('#placa', '863 549');
    await page.locator('#marca').click();

    const aviso = page.locator('.pendiente');
    await expect(aviso).toContainText('Quedó pendiente de antes');
    await expect(aviso).toContainText('96 000');
    await expect(aviso).toContainText('Cambio de faja de distribución');
    // Con su motivo, que es lo que se vuelve a conversar.
    await expect(aviso).toContainText('próxima visita');
  });

  /* Un botón deshabilitado sin explicación es indistinguible de uno roto. */
  test('dice qué falta en cada paso, y no deja saltar hacia adelante', async ({
    page,
  }) => {
    await page.goto('/recepcion');

    const avanzar = page.getByRole('button', { name: 'Siguiente' });
    await expect(avanzar).toBeDisabled();
    await expect(page.locator('.pie__falta')).toContainText('Falta la placa');

    // Y el riel tampoco deja adelantarse a un paso que no se ha alcanzado.
    await expect(
      page.getByRole('button', { name: /Confirmar/ }),
    ).toBeDisabled();

    await page.fill('#placa', 'XYZ 111');
    await expect(page.locator('.pie__falta')).toContainText('Falta la marca');
    await page.fill('#marca', 'Kia');
    await page.fill('#cliente', 'Alguien');
    await expect(avanzar).toBeEnabled();

    await avanzar.click();
    await expect(page.locator('.pie__falta')).toContainText(
      'al menos una cosa',
    );
  });

  /* Volver atrás no puede castigar: es lo primero que se hace cuando el
     Cliente se acuerda de algo a medio camino. */
  test('volver atrás conserva lo escrito', async ({ page }) => {
    await page.goto('/recepcion');
    await llenarElCarro(page);
    await siguiente(page);
    await page.locator('textarea').first().fill('Chilla al frenar');
    await siguiente(page);

    await page.getByRole('button', { name: 'Atrás' }).click();
    await expect(page.locator('textarea').first()).toHaveValue(
      'Chilla al frenar',
    );
    await page.getByRole('button', { name: 'Atrás' }).click();
    await expect(page.locator('#marca')).toHaveValue('Mazda');
  });

  test('varias quejas quedan como varios Reportes, no como un párrafo', async ({
    page,
  }) => {
    await page.goto('/recepcion');
    await llenarElCarro(page, 'MOT 45');
    await siguiente(page);

    await page.locator('textarea').first().fill('Chilla cuando freno');
    await page.getByRole('button', { name: /Dijo otra cosa/ }).click();
    await page
      .locator('textarea')
      .nth(1)
      .fill('Y tampoco prende el aire acondicionado');

    await siguiente(page);
    await siguiente(page);
    await expect(page.locator('.ficha__subtitulo').first()).toContainText(
      '(2)',
    );
    await page.getByRole('button', { name: /Recibir veh/ }).click();

    const panel = page.locator('mat-sidenav.shell__panel');
    await expect(panel).toContainText('«Chilla cuando freno»');
    await expect(panel).toContainText(
      '«Y tampoco prende el aire acondicionado»',
    );
  });
});

/* ---------------------------------------------------------------------------
   Lo que el sistema entiende de la queja.

   La sugerencia se enseña SIEMPRE con su motivo y SIEMPRE se puede cambiar:
   una etiqueta que aparece sola obliga a creerle a ciegas o a ignorarla
   siempre, y las dos salidas son malas.
   --------------------------------------------------------------------------- */
test.describe('la sugerencia sobre la queja', () => {
  test('marca lo reconocido y dice por qué lo propone', async ({ page }) => {
    await page.goto('/recepcion');
    await llenarElCarro(page);
    await siguiente(page);

    await page.locator('textarea').first().fill('Chilla cuando freno');

    await expect(page.locator('.queja__titulo')).toHaveText('Ruido al frenar');
    const marcadas = page.locator('.opcion--marcada');
    await expect(marcadas.filter({ hasText: 'Al frenar' })).toHaveCount(1);
    await expect(marcadas.filter({ hasText: 'Ruido' })).toHaveCount(1);
    await expect(marcadas.filter({ hasText: 'Mecánica' })).toHaveCount(1);

    // Y cita las palabras del Cliente, no las del diccionario.
    await expect(page.locator('.sugerencia__porque')).toContainText('«Chilla»');
  });

  /* Desmarcar algo y verlo volver solo dos segundos después —porque se siguió
     dictando— es lo que hace que se deje de confiar en toda la pantalla. */
  test('deja de proponer en el grupo que se toca a mano', async ({ page }) => {
    await page.goto('/recepcion');
    await llenarElCarro(page);
    await siguiente(page);

    const texto = page.locator('textarea').first();
    await texto.fill('Chilla cuando freno');
    const alFrenar = page
      .locator('.opcion')
      .filter({ hasText: 'Al frenar' })
      .first();
    await expect(alFrenar).toHaveClass(/opcion--marcada/);

    await alFrenar.click();
    await expect(alFrenar).not.toHaveClass(/opcion--marcada/);

    // Se sigue escribiendo y NO vuelve a marcarse solo.
    await texto.fill('Chilla cuando freno, sobre todo bajando');
    await expect(alFrenar).not.toHaveClass(/opcion--marcada/);
  });

  /* Una moneda al aire con cara de certeza es peor que un espacio en blanco. */
  test('no propone especialidad cuando no le alcanza', async ({ page }) => {
    await page.goto('/recepcion');
    await llenarElCarro(page);
    await siguiente(page);

    await page
      .locator('textarea')
      .first()
      .fill('Le dieron un golpe y desde entonces suena el motor');

    await expect(
      page.locator('.opcion--marcada').filter({ hasText: 'Mecánica' }),
    ).toHaveCount(0);
    await expect(
      page.locator('.opcion--marcada').filter({ hasText: 'Pintura' }),
    ).toHaveCount(0);
    await expect(page.locator('.sugerencia__porque')).toContainText(
      'No alcanza para proponer',
    );
  });
});

/* ---------------------------------------------------------------------------
   El Dictado.

   El motor de voz va SIMULADO, y no es una comodidad: la Web Speech API de
   Chromium manda el audio a un servicio de Google que necesita una clave que
   el navegador de pruebas no trae, así que el reconocimiento de verdad no se
   puede ejercer sin un micrófono y una persona hablando. Lo que sí se puede
   —y es lo que rompe— es toda la máquina de estados alrededor: qué entra al
   campo, qué pasa cuando el motor falla, y que el campo siga funcionando sin
   micrófono.
   --------------------------------------------------------------------------- */
interface VozSimulada {
  parcial(texto: string): void;
  final(texto: string): void;
  fallar(codigo: string): void;
  cerrar(): void;
  sesiones(): number;
}

declare global {
  interface Window {
    __voz?: VozSimulada;
  }
}

async function ponerMotorDeVoz(page: Page) {
  await page.addInitScript(() => {
    interface Sesion {
      onresult: ((e: unknown) => void) | null;
      onerror: ((e: unknown) => void) | null;
      onend: (() => void) | null;
      onstart: (() => void) | null;
    }
    let viva: Sesion | null = null;
    let sesiones = 0;

    class ReconocimientoFalso implements Sesion {
      lang = '';
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      onstart: (() => void) | null = null;
      onspeechstart: (() => void) | null = null;
      onspeechend: (() => void) | null = null;
      start() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const sesion: Sesion = this;
        viva = sesion;
        sesiones++;
        this.onstart?.();
      }
      stop() {
        this.onend?.();
      }
      abort() {
        if (viva === (this as Sesion)) viva = null;
      }
    }

    (window as unknown as Record<string, unknown>)['SpeechRecognition'] =
      ReconocimientoFalso;

    const emitir = (texto: string, isFinal: boolean) => {
      const alternativa = { transcript: texto, confidence: 0.9 };
      const resultado = Object.assign([alternativa], { isFinal, length: 1 });
      const lista = Object.assign([resultado], { length: 1 });
      viva?.onresult?.({ resultIndex: 0, results: lista });
    };

    window.__voz = {
      parcial: (t: string) => emitir(t, false),
      final: (t: string) => emitir(t, true),
      fallar: (codigo: string) => viva?.onerror?.({ error: codigo }),
      cerrar: () => viva?.onend?.(),
      sesiones: () => sesiones,
    };
  });
}

test.describe('el dictado', () => {
  test.beforeEach(async ({ page }) => {
    await ponerMotorDeVoz(page);
  });

  test('lo dictado entra al campo y se añade a lo que ya había', async ({
    page,
  }) => {
    await page.goto('/recepcion');
    await llenarElCarro(page);
    await siguiente(page);

    await page.getByRole('button', { name: /Dictar lo que dice/ }).click();

    /* Lo que se va oyendo se ve APARTE, no dentro del campo: metido dentro
       habría que reescribirlo en cada parcial y el cursor se movería solo. */
    await page.evaluate(() => window.__voz?.parcial('chilla cuando'));
    await expect(page.locator('.campo__parcial')).toContainText(
      'chilla cuando',
    );
    await expect(page.locator('textarea').first()).toHaveValue('');

    await page.evaluate(() => window.__voz?.final('Chilla cuando freno'));
    await expect(page.locator('textarea').first()).toHaveValue(
      'Chilla cuando freno',
    );

    /* El Cliente habla en tandas. La segunda no puede borrar la primera. */
    await page.evaluate(() => window.__voz?.final('y también vibra'));
    await expect(page.locator('textarea').first()).toHaveValue(
      'Chilla cuando freno y también vibra',
    );
  });

  /* Lo dictado alimenta al intérprete igual que lo tecleado: si no, dictar
     saldría peor que escribir, que es lo contrario de un acelerador. */
  test('lo dictado también se interpreta', async ({ page }) => {
    await page.goto('/recepcion');
    await llenarElCarro(page);
    await siguiente(page);

    await page.getByRole('button', { name: /Dictar lo que dice/ }).click();
    await page.evaluate(() => window.__voz?.final('Chilla cuando freno'));

    await expect(page.locator('.queja__titulo')).toHaveText('Ruido al frenar');
    await expect(
      page.locator('.opcion--marcada').filter({ hasText: 'Mecánica' }),
    ).toHaveCount(1);
  });

  /* Chromium cierra la sesión sola a los 15 s de silencio en modo continuo, y
     ese plazo no está documentado en ningún lado. Sin reabrirla, el micrófono
     se apaga a media conversación y nadie se entera. */
  test('si el motor cierra la sesión solo, la vuelve a abrir', async ({
    page,
  }) => {
    await page.goto('/recepcion');
    await llenarElCarro(page);
    await siguiente(page);

    await page.getByRole('button', { name: /Dictar lo que dice/ }).click();
    await expect
      .poll(() => page.evaluate(() => window.__voz?.sesiones()))
      .toBe(1);

    await page.evaluate(() => window.__voz?.cerrar());
    await expect
      .poll(() => page.evaluate(() => window.__voz?.sesiones()))
      .toBe(2);
  });

  /* Los ocho códigos de error de la API no se pueden enseñar tal cual: lo que
     importa es qué puede hacer quien está de pie frente al Cliente. */
  test('sin internet lo dice en una línea que apunta al teclado', async ({
    page,
  }) => {
    await page.goto('/recepcion');
    await llenarElCarro(page);
    await siguiente(page);

    await page.getByRole('button', { name: /Dictar lo que dice/ }).click();
    await page.evaluate(() => window.__voz?.fallar('network'));

    await expect(page.locator('.campo__problema')).toContainText(
      'necesita internet',
    );
    await expect(page.locator('.campo__problema')).toContainText('escribir');

    // Y el campo sigue funcionando, que es todo el punto de ADR 0004.
    await page.locator('textarea').first().fill('Se escribe igual');
    await expect(page.locator('textarea').first()).toHaveValue(
      'Se escribe igual',
    );
  });

  /* En iOS el constructor existe y el motor contesta `service-not-allowed`:
     preguntar `'webkitSpeechRecognition' in window` da falso positivo, así que
     el soporte se detecta por lo que el motor CONTESTA. */
  test('si el motor dice que no, el micrófono desaparece', async ({ page }) => {
    await page.goto('/recepcion');
    await llenarElCarro(page);
    await siguiente(page);

    await page.getByRole('button', { name: /Dictar lo que dice/ }).click();
    await page.evaluate(() => window.__voz?.fallar('service-not-allowed'));

    await expect(page.getByRole('button', { name: /Dictar/ })).toHaveCount(0);
  });
});

test.describe('sin motor de voz', () => {
  /* La prueba de que la voz no se volvió el camino: quitando el micrófono, la
     Recepción se completa igual. */
  test('no hay botón de micrófono y la recepción se completa igual', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const w = window as unknown as Record<string, unknown>;
      delete w['SpeechRecognition'];
      delete w['webkitSpeechRecognition'];
    });

    await page.goto('/recepcion');
    await llenarElCarro(page, 'SIN VOZ');
    await siguiente(page);

    await expect(page.getByRole('button', { name: /Dictar/ })).toHaveCount(0);

    await page.locator('textarea').first().fill('Todo escrito a mano');
    await siguiente(page);
    await siguiente(page);
    await page.getByRole('button', { name: /Recibir veh/ }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('mat-sidenav.shell__panel')).toContainText(
      '«Todo escrito a mano»',
    );
  });
});

/* ---------------------------------------------------------------------------
   Las tres pestañas de Órdenes (#104). Estaban vacías: cero filas y un párrafo.
   --------------------------------------------------------------------------- */
test.describe('las pestañas de Órdenes', () => {
  const filas = (page: Page) =>
    page.locator('[role="tabpanel"] li.fila, [role="tabpanel"] li.declinada');

  const abrir = async (page: Page, nombre: string) => {
    await page.goto('/ordenes');
    await page.getByRole('tab', { name: new RegExp(nombre, 'i') }).click();
  };

  /* Lo entregado ya no está en el taller. Sin una sola Orden entregada en la
     semilla, este filtro pasaría igual sin estar haciendo nada. */
  test('En el taller deja fuera lo entregado', async ({ page }) => {
    await abrir(page, 'En el taller');

    await expect(filas(page)).toHaveCount(4);
    await expect(page.locator('[role="tabpanel"]')).not.toContainText(
      'Isuzu D-Max',
    );
  });

  /* Y el Tablero se llama "En el taller": tiene que enseñar lo mismo. */
  test('el Tablero enseña lo mismo que su propio título dice', async ({
    page,
  }) => {
    await abrir(page, 'En el taller');
    const enLaPestana = await filas(page).count();

    await page.goto('/');
    await expect(page.locator('li.fila')).toHaveCount(enLaPestana);
  });

  /* El carro listo NO se va de "En el taller": sigue ocupando espacio hasta
     que lo recogen. Por entregar es una vista de lo mismo, no otra gaveta. */
  test('Por entregar muestra los listos, y siguen en el taller', async ({
    page,
  }) => {
    await abrir(page, 'Por entregar');

    await expect(filas(page)).toHaveCount(1);
    await expect(page.locator('[role="tabpanel"]')).toContainText(
      'Suzuki Swift',
    );

    await page.getByRole('tab', { name: /En el taller/i }).click();
    await expect(page.locator('[role="tabpanel"]')).toContainText(
      'Suzuki Swift',
    );
  });

  /* El trabajo declinado es de la LÍNEA, no de la Orden: una misma Orden puede
     tener una aprobada y otra declinada. Y conserva motivo y monto, que es lo
     que se vuelve a proponer cuando el carro regrese. */
  test('Declinado lista por línea, con su motivo y su monto', async ({
    page,
  }) => {
    await abrir(page, 'Declinado');

    await expect(filas(page)).toHaveCount(2);

    const primera = page.locator('li.declinada').first();
    await expect(primera).toContainText('Cambio de faja de distribución');
    await expect(primera).toContainText('863 549');
    await expect(primera).toContainText('próxima visita');
    await expect(primera.locator('.declinada__monto')).toContainText('96');
  });

  /* La Orden del Toyota tiene dos líneas aprobadas y una declinada: en la
     lista aparece SOLO la declinada, no la Orden entera. */
  test('de una Orden con líneas mixtas solo sale la declinada', async ({
    page,
  }) => {
    await abrir(page, 'Declinado');

    const delToyota = page
      .locator('li.declinada')
      .filter({ hasText: '863 549' });
    await expect(delToyota).toHaveCount(1);
    await expect(delToyota).not.toContainText('Cambio de bomba de agua');
  });

  /* Lo declinado no se está trabajando, así que su color no puede aparecer en
     la fila como si alguien lo estuviera haciendo. */
  test('la especialidad declinada no se cuenta en la fila del Tablero', async ({
    page,
  }) => {
    await page.goto('/');

    const toyota = page.locator('li.fila').filter({ hasText: '863 549' });
    // Mecánica está declinada en una línea y aprobada en dos: sale una vez.
    await expect(toyota.locator('app-etiqueta-especialidad')).toHaveCount(1);
  });
});
