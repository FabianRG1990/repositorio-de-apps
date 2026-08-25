import { test, expect, type Page } from '@playwright/test';
import { statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

    /* El cajón entra ANIMANDO desde cero, así que leer el margen enseguida lo
       agarra a medio camino: en una corrida cargada salió 19 px, y entonces el
       "ancho" contra el que se compara acababa siendo MENOR que el riel y la
       prueba fallaba diciendo que colapsar lo había ensanchado. Se espera a que
       el cajón esté abierto del todo — el riel ronda los 100 px, así que
       cualquier cosa por encima de 200 ya es el menú entero. */
    await expect.poll(margenIzquierdo).toBeGreaterThan(200);
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

    /* Se enfoca la fila DIRECTAMENTE en vez de tabular desde el botón: desde
       #114 el filtro por Especialidad se mete en medio del orden de
       tabulación, y lo que este test mide es el anillo de la FILA. Tabular a
       ciegas medía lo que hubiera delante. */
    await page.locator('.fila__cuerpo').first().focus();

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
  /* En una tableta el panel está cerrado, así que pulsar una fila seleccionaba
     una Orden y no pasaba nada visible. Ver orden tapa ese agujero — y desde
     #108 lo hace abriendo la VENTANA, que no depende de que haya sitio al
     lado. */
  test('en tableta Ver orden abre la ventana con la Orden pulsada', async ({
    page,
  }) => {
    await preparar(page, 'oficina', 'normal', { width: 520, height: 900 });

    const ventana = page.locator('dialog.ventana');
    await expect(ventana).toBeHidden();

    const primera = page.locator('li.fila').first();
    const folio = (await primera.locator('.fila__folio').textContent())?.trim();
    await primera.getByRole('button', { name: /Ver orden/ }).click();

    await expect(ventana).toBeVisible();
    await expect(ventana.locator('.od__folio')).toContainText('Orden ' + folio);
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
    /* Por folio y no por posición: el tablero ordena por Tiempo parado, así
       que sembrar una Orden más vieja cambia quién va primera. */
    const cuerpo = page
      .locator('li.fila')
      .filter({ hasText: 'A1-2418' })
      .locator('.fila__cuerpo');
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

  /* Ajustes se movió a Apariencia en #101 porque Taller era un párrafo: el
     Dueño entraba a la app y veía la única pantalla con cero contenido. Desde
     #114 las tres tienen contenido, así que vuelve a abrir en Taller — que es
     lo que el Dueño viene a hacer. */
  test('Ajustes abre en Taller, que es lo que el Dueño viene a hacer', async ({
    page,
  }) => {
    await page.goto('/ajustes');

    await expect(page.locator('[role="tabpanel"]')).toHaveAttribute(
      'id',
      'panel-taller',
    );
    await expect(page.locator('#taller-nombre')).toBeVisible();
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

    /* El panel RESUME: el carro, el cliente, el estado y por qué entró. Lo
       textual y el kilometraje viven en la ventana, que es donde caben. */
    const panel = page.locator('mat-sidenav.shell__panel');
    await expect(panel).toContainText('Mazda BT-50 2020');
    await expect(panel).toContainText('BNT 907');
    // El Folio se muestra completo, con su letra (ADR 0010).
    await expect(panel).toContainText(/Orden A1-\d+/);
    await expect(panel).not.toContainText('«Se calienta');

    /* Y la queja sobrevive a la Recepción, en las palabras del Cliente: si no,
       la ficha sería una pantalla bonita que no deja nada. */
    await page.getByRole('button', { name: /Ver la orden/ }).click();
    const ventana = page.locator('dialog.ventana');
    await expect(ventana).toContainText('«Se calienta cuando queda en presa»');
    await expect(ventana).toContainText('84 500 km');
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

    await page.getByRole('button', { name: /Ver la orden/ }).click();
    const ventana = page.locator('dialog.ventana');
    await expect(ventana).toContainText('«Chilla cuando freno»');
    await expect(ventana).toContainText(
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
    await page.getByRole('button', { name: /Ver la orden/ }).click();
    await expect(page.locator('dialog.ventana')).toContainText(
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

    await expect(filas(page)).toHaveCount(5);
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

    // El Swift, avisado hace una hora, y el Terios, que lleva cinco días ahí.
    await expect(filas(page)).toHaveCount(2);
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

    // Frontier, Hilux y el Kia Rio que dejó los amortiguadores para después.
    await expect(filas(page)).toHaveCount(3);

    /* Por placa y no por posición: la lista sigue el orden del tablero, que es
       por Tiempo parado, así que sembrar una Orden más vieja cambia quién va
       primera. */
    const delHilux = page
      .locator('li.declinada')
      .filter({ hasText: '863 549' });
    await expect(delHilux).toContainText('Cambio de faja de distribución');
    await expect(delHilux).toContainText('próxima visita');
    await expect(delHilux.locator('.declinada__monto')).toContainText('96');
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

/* ---------------------------------------------------------------------------
   La ventana de la Orden (#108).

   El panel derecho mide 310 px y ahí la Orden entera se volvía una columna
   larguísima de texto envuelto. El panel resume; la Orden se abre en un
   `<dialog>` nativo, que es quien trae la trampa de foco, el `Esc` y la
   devolución del foco sin librería.
   --------------------------------------------------------------------------- */
test.describe('la ventana de la Orden', () => {
  const abrirLaOrden = async (page: Page, placa: string) => {
    await page.goto('/');
    await expect(page.locator('li.fila').first()).toBeVisible();
    await page
      .locator('li.fila')
      .filter({ hasText: placa })
      .getByRole('button', { name: /Ver orden/ })
      .click();
    return page.locator('dialog.ventana');
  };

  test('se abre como modal de verdad, no como una caja flotante', async ({
    page,
  }) => {
    const ventana = await abrirLaOrden(page, '742 118');

    await expect(ventana).toBeVisible();
    /* `:modal` solo acierta con un `<dialog>` abierto por `showModal()`. Es lo
       que separa una ventana con trampa de foco y fondo inerte de un `<div>`
       posicionado encima. */
    await expect(ventana).toHaveJSProperty('open', true);
    expect(await ventana.evaluate((d) => d.matches(':modal'))).toBe(true);
  });

  test('trae la Orden entera: quejas, montos y cómo entró', async ({
    page,
  }) => {
    const ventana = await abrirLaOrden(page, '742 118');

    // Las palabras del Cliente, tal como las dijo.
    await expect(ventana).toContainText(
      '«En la mañana cuesta que prenda, hace un ruido y no arranca»',
    );
    await expect(ventana).toContainText(
      '«Y también chilla cuando freno despacio»',
    );
    /* Los trabajos con su monto, y el total de lo APROBADO. Desde #110 son
       tarjetas editables y no una tabla de solo lectura. */
    await expect(ventana).toContainText('Diagnóstico de carga');
    await expect(ventana.locator('.trabajos__totales')).toContainText(
      /Aprobado · ₡25\s000/u,
    );
    // Lo declinado, con su motivo y fuera del total aprobado.
    await expect(ventana.locator('.trabajos__totales')).toContainText(
      /Declinado · ₡178\s000/u,
    );
    await expect(
      ventana.locator('.trabajo').filter({ hasText: 'Cambio de alternador' }),
    ).toContainText('Va a cotizar el repuesto');
    // Y el estado de entrada.
    await expect(ventana).toContainText(/61\s870 km/u);
  });

  /* El total es de lo APROBADO. Sumar lo declinado sería cobrarle al Cliente
     algo que dijo que no. */
  test('el total no incluye lo declinado', async ({ page }) => {
    const ventana = await abrirLaOrden(page, '742 118');

    const total = await ventana
      .locator('.trabajos__totales')
      .locator('span')
      .first()
      .innerText();
    /* El separador de miles de `es-CR` es un espacio FINO INSEPARABLE, no uno
       normal: comparar contra "25 000" tecleado a mano falla aunque el número
       esté bien. `\s` sí lo cubre. */
    expect(total).toMatch(/25\s000/u);
    expect(total).not.toMatch(/178\s000/u);
  });

  test('Esc la cierra y devuelve el foco al botón que la abrió', async ({
    page,
  }) => {
    const ventana = await abrirLaOrden(page, '742 118');
    await expect(ventana).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(ventana).toBeHidden();
    /* Lo devuelve el navegador, no nosotros: es la mitad del motivo de usar el
       `<dialog>` nativo en vez de un `<div>`. */
    expect(
      await page.evaluate(() => document.activeElement?.textContent?.trim()),
    ).toContain('Ver orden');
  });

  /* Con `showModal` el fondo queda inerte pero la página SIGUE desplazándose
     detrás: con la rueda sobre el velo, el tablero se movía debajo. */
  test('mientras está abierta, la página de atrás no se desplaza', async ({
    page,
  }) => {
    await expect(await abrirLaOrden(page, '742 118')).toBeVisible();

    /* Se mira el estilo EN LÍNEA y no el calculado: el `overflow` del elemento
       raíz se propaga al viewport, y el valor calculado del propio elemento
       vuelve a "visible" aunque el efecto esté aplicado. */
    expect(
      await page.evaluate(() => document.documentElement.style.overflow),
    ).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(page.locator('dialog.ventana')).toBeHidden();
    /* El evento `close` no es síncrono con `close()`: la ventana ya no se ve
       mientras el manejador que limpia todavía no corrió. */
    await expect
      .poll(() => page.evaluate(() => document.documentElement.style.overflow))
      .toBe('');
  });

  test('el panel de al lado resume, no repite la Orden', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('li.fila').first()).toBeVisible();
    await page.locator('li.fila').filter({ hasText: '742 118' }).click();

    const panel = page.locator('mat-sidenav.shell__panel');
    // Lo del vistazo: sí.
    await expect(panel).toContainText('Tiempo parado');
    await expect(panel).toContainText('Nissan Frontier 2021');
    await expect(panel).toContainText('No enciende en frío');
    // La Orden entera: no.
    await expect(panel).not.toContainText('«En la mañana');
    await expect(panel).not.toContainText('Diagnóstico de carga');
  });
});

/* ---------------------------------------------------------------------------
   Los botones (#108).

   Eran de Material y no compartían una sola seña con la referencia visual. Lo
   que se comprueba acá son las señas, no que "se vean bien": el radio, el
   filete de acento y la esquinita son medibles.
   --------------------------------------------------------------------------- */
test.describe('los botones', () => {
  test('no queda ninguno de Material', async ({ page }) => {
    for (const [ruta, anclaje] of [
      ['/', 'li.fila'],
      ['/recepcion', '#placa'],
      ['/ordenes', 'li.fila'],
    ]) {
      await page.goto(ruta);
      // Se espera a que la pantalla exista, en vez de a un reloj.
      await expect(page.locator(anclaje).first()).toBeVisible();
      expect(
        await page.locator('.mat-mdc-button-base').count(),
        `en ${ruta}`,
      ).toBe(0);
    }
  });

  test('llevan las señas de la referencia, medidas', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('li.fila').first()).toBeVisible();

    const señas = await page.evaluate(() => {
      const leer = (sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const c = getComputedStyle(el);
        const despues = getComputedStyle(el, '::after');
        return {
          radio: c.borderRadius,
          bordeIzq: c.borderLeftWidth,
          espaciado: c.letterSpacing,
          esquinita: despues.width,
        };
      };
      return {
        referencia: leer('.menu__item--activo'),
        principal: leer('.pantalla__accion'),
        secundario: leer('.fila__accion'),
      };
    });

    // El item de menú es la pieza que ya replicaba la referencia.
    expect(señas.principal).toMatchObject({
      radio: señas.referencia?.radio,
      bordeIzq: señas.referencia?.bordeIzq,
      espaciado: señas.referencia?.espaciado,
      esquinita: señas.referencia?.esquinita,
    });
    expect(señas.secundario).toMatchObject({
      radio: señas.referencia?.radio,
      esquinita: señas.referencia?.esquinita,
    });
  });

  /* La acción principal se sale un escalón hacia arriba de la escalera táctil:
     #18 §5.2 pide el de arriba para la acción principal con guante. */
  test('el principal es más alto que el secundario', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('li.fila').first()).toBeVisible();

    const alto = (sel: string) =>
      page
        .locator(sel)
        .first()
        .evaluate((e) => e.getBoundingClientRect().height);

    expect(await alto('.pantalla__accion')).toBeGreaterThan(
      await alto('.fila__accion'),
    );
  });
});

/* ---------------------------------------------------------------------------
   Las impresiones (#108).

   `window.print()` abre un diálogo del sistema que Playwright no puede cerrar,
   así que se sustituye por una función que anota QUÉ había en el papel en ese
   instante. Es justo lo que hay que comprobar: que el papel exista y que lleve
   lo que le toca a cada lector.
   --------------------------------------------------------------------------- */
test.describe('los tres papeles', () => {
  const capturar = async (page: Page) => {
    await page.addInitScript(() => {
      (window as unknown as { __papeles: unknown[] }).__papeles = [];
      window.print = () => {
        const hoja = document.querySelector('app-hoja-impresion');
        (window as unknown as { __papeles: unknown[] }).__papeles.push({
          documento: document.documentElement.dataset['imprimiendo'],
          texto: hoja?.textContent ?? '',
        });
      };
    });
  };

  const leerPapeles = (page: Page) =>
    page.evaluate(
      () =>
        (
          window as unknown as {
            __papeles: { documento: string; texto: string }[];
          }
        ).__papeles,
    );

  const abrirEImprimir = async (page: Page, boton: string) => {
    await capturar(page);
    await page.goto('/');
    await expect(page.locator('li.fila').first()).toBeVisible();
    await page
      .locator('li.fila')
      .filter({ hasText: '742 118' })
      .getByRole('button', { name: /Ver orden/ })
      .click();
    await page.getByRole('button', { name: boton, exact: true }).click();
    /* El papel no existe cuando se pulsa: la hoja se pinta solo para el
       documento elegido, y el store espera dos cuadros antes de imprimir. */
    await expect.poll(async () => (await leerPapeles(page)).length).toBe(1);
    return (await leerPapeles(page))[0];
  };

  /* El mecánico no cotiza, ejecuta. Una hoja con precios pegada al parabrisas
     es una hoja con precios circulando por el patio. */
  test('el del taller lleva la queja y NO lleva montos', async ({ page }) => {
    const papel = await abrirEImprimir(page, 'El taller');

    expect(papel.documento).toBe('taller');
    expect(papel.texto).toContain('742 118');
    expect(papel.texto).toContain('«En la mañana cuesta que prenda');
    expect(papel.texto).toContain('Diagnóstico de carga');
    expect(papel.texto).toContain('Notas del técnico');
    // Ni un colón.
    expect(papel.texto).not.toContain('₡');
  });

  /* Lo declinado va en el papel del Cliente a propósito: es lo que lo trae de
     vuelta, y se relee en la casa cuando ya no hay nadie vendiéndolo. */
  test('el del cliente lleva montos y lo que quedó pendiente', async ({
    page,
  }) => {
    const papel = await abrirEImprimir(page, 'El cliente');

    expect(papel.documento).toBe('cliente');
    expect(papel.texto).toMatch(/₡25\s000/u);
    expect(papel.texto).toContain('Quedó pendiente');
    expect(papel.texto).toMatch(/₡178\s000/u);
    expect(papel.texto).toContain('Recibido conforme');
  });

  test('el de archivo lleva el estado de entrada y qué se declinó', async ({
    page,
  }) => {
    const papel = await abrirEImprimir(page, 'Archivo');

    expect(papel.documento).toBe('archivo');
    expect(papel.texto).toContain('Estado de entrada');
    expect(papel.texto).toMatch(/61\s870 km/u);
    expect(papel.texto).toContain('Silla de bebé atrás');
    expect(papel.texto).toContain('Declinado');
  });

  /* La bandera de `<html>` es lo que la hoja de impresión mira para tapar la
     app. Si se quedara puesta, la pantalla quedaría en blanco. */
  test('la bandera de impresión no se queda puesta', async ({ page }) => {
    await abrirEImprimir(page, 'El taller');

    expect(
      await page.evaluate(
        () => document.documentElement.dataset['imprimiendo'],
      ),
    ).toBeUndefined();
  });

  test('la ventana NO se cierra al imprimir', async ({ page }) => {
    await abrirEImprimir(page, 'El taller');

    /* Quien imprime casi siempre saca dos —la del taller y la del cliente— una
       detrás de otra. */
    await expect(page.locator('dialog.ventana')).toBeVisible();
  });

  test('en pantalla el papel no se ve nunca', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('li.fila').first()).toBeVisible();

    await expect(page.locator('app-hoja-impresion')).toBeHidden();
  });
});

/* ---------------------------------------------------------------------------
   Editar la Orden (#110).

   Tres verbos: anotar, autorizar y declinar. Es lo que el taller hace entre
   recibir el carro y entregarlo, y era el hueco que quedaba después de #108:
   la Orden se leía y se imprimía, pero no se editaba.
   --------------------------------------------------------------------------- */
test.describe('editar la Orden', () => {
  const abrir = async (page: Page, placa: string) => {
    await page.goto('/');
    await expect(page.locator('li.fila').first()).toBeVisible();
    await page
      .locator('li.fila')
      .filter({ hasText: placa })
      .getByRole('button', { name: /Ver orden/ })
      .click();
    await expect(page.locator('dialog.ventana')).toBeVisible();
  };

  const anotar = async (page: Page, descripcion: string, monto: string) => {
    await page.getByRole('button', { name: /Anotar trabajo/ }).click();
    await page.fill('#trabajo-desc', descripcion);
    await page.fill('#trabajo-monto', monto);
    await page.getByRole('button', { name: 'Anotar', exact: true }).click();
  };

  test('un trabajo anotado aparece en la Orden y suma al total', async ({
    page,
  }) => {
    await abrir(page, '742 118');
    // La semilla trae uno aprobado de ₡25 000 y uno declinado.
    await expect(page.locator('.trabajos__totales')).toContainText(/25\s000/u);

    await anotar(page, 'Cambio de pastillas delanteras', '62000');

    const nuevo = page
      .locator('.trabajo')
      .filter({ hasText: 'Cambio de pastillas delanteras' });
    await expect(nuevo).toBeVisible();
    await expect(nuevo).toContainText(/62\s000/u);
    // 25 000 + 62 000. Lo declinado no entra en el aprobado.
    await expect(page.locator('.trabajos__totales')).toContainText(/87\s000/u);
  });

  /* Nace sin autorizar: nadie ha dicho que sí todavía, y decirlo con palabras
     es lo que evita que se ejecute un trabajo que el Cliente no aprobó. */
  test('un trabajo nuevo nace sin respuesta del cliente', async ({ page }) => {
    await abrir(page, '742 118');
    await anotar(page, 'Revisión de suspensión', '40000');

    const nuevo = page
      .locator('.trabajo')
      .filter({ hasText: 'Revisión de suspensión' });
    await expect(nuevo).toContainText('Sin respuesta del cliente');
    await expect(
      nuevo.getByRole('button', { name: 'Autorizar' }),
    ).toBeVisible();
  });

  test('dice qué falta mientras no se pueda anotar', async ({ page }) => {
    await abrir(page, '742 118');
    await page.getByRole('button', { name: /Anotar trabajo/ }).click();

    const guardar = page.getByRole('button', { name: 'Anotar', exact: true });
    await expect(guardar).toBeDisabled();
    await expect(page.locator('.anotar__falta')).toContainText(
      'qué es el trabajo',
    );

    await page.fill('#trabajo-desc', 'Algo');
    await expect(page.locator('.anotar__falta')).toContainText('el monto');

    await page.fill('#trabajo-monto', '1000');
    await expect(guardar).toBeEnabled();
  });

  /* La constancia dice QUIÉN y POR QUÉ MEDIO: es lo único que sostiene al
     taller en una disputa (#15, ADR 0007). */
  test('autorizar deja constancia de persona y medio', async ({ page }) => {
    await abrir(page, '742 118');

    const sinRespuesta = page
      .locator('.trabajo')
      .filter({ hasText: 'Diagnóstico de carga' });
    await sinRespuesta.getByRole('button', { name: 'Autorizar' }).click();

    /* El campo se busca DENTRO de la fila, no por su id: el id lleva el
       identificador de la Línea, que es un UUID que la prueba no conoce. */
    await sinRespuesta.locator('.formulario__campo input').fill('Doña Marta');
    await sinRespuesta
      .locator('.formulario .opcion')
      .filter({ hasText: 'Llamada' })
      .click();
    await page.getByRole('button', { name: /Registrar el sí/ }).click();

    await expect(sinRespuesta).toContainText(
      'Autorizado por Doña Marta por llamada',
    );
  });

  test('declinar pide motivo y lo conserva', async ({ page }) => {
    await abrir(page, '742 118');

    const linea = page
      .locator('.trabajo')
      .filter({ hasText: 'Diagnóstico de carga' });
    await linea.getByRole('button', { name: 'Declinar' }).click();
    await linea.locator('.formulario__campo input').fill('Lo va a pensar');
    await linea
      .locator('.formulario')
      .getByRole('button', { name: 'Declinar', exact: true })
      .click();

    await expect(linea).toContainText('Declinado');
    await expect(linea).toContainText('«Lo va a pensar»');
    // Y sale del total aprobado, que se queda en cero.
    await expect(page.locator('.trabajos__totales')).toContainText(
      'Aprobado · ₡0',
    );
  });

  /* Un dedo torpe en una tableta no puede costar una venta. */
  test('declinar se puede deshacer', async ({ page }) => {
    await abrir(page, '742 118');

    const linea = page
      .locator('.trabajo')
      .filter({ hasText: 'Cambio de alternador' });
    await expect(linea).toContainText('Declinado');

    await linea.getByRole('button', { name: 'Deshacer' }).click();

    await expect(linea).toContainText('Sin respuesta del cliente');
    await expect(linea).not.toContainText('Declinado');
  });

  /* Autorizada Y declinada a la vez no es un estado más rico: es una
     constancia que se contradice. */
  test('una línea no puede quedar autorizada y declinada a la vez', async ({
    page,
  }) => {
    await abrir(page, '905 733');

    const linea = page
      .locator('.trabajo')
      .filter({ hasText: 'Cambio de pastillas' });
    // La semilla la trae autorizada por llamada.
    await expect(linea).toContainText('Autorizado por Ana Lucía Brenes');

    await linea.getByRole('button', { name: 'Declinar' }).click();
    await linea.locator('.formulario__campo input').fill('Se arrepintió');
    await linea
      .locator('.formulario')
      .getByRole('button', { name: 'Declinar', exact: true })
      .click();

    await expect(linea).toContainText('Declinado');
    await expect(linea).not.toContainText('Autorizado por');
  });

  /* El mensaje lo arma Bitácora y lo manda WhatsApp (ADR 0007): acá solo se
     comprueba que el enlace lleve lo que tiene que llevar. */
  test('el enlace de WhatsApp lleva los trabajos sin respuesta', async ({
    page,
  }) => {
    await abrir(page, '742 118');

    const enlace = page.getByRole('link', { name: /Pedir autorización/ });
    const href = await enlace.getAttribute('href');

    expect(href).toContain('https://wa.me/50687774444');
    const texto = decodeURIComponent(href?.split('text=')[1] ?? '');
    expect(texto).toContain('A1-2420');
    expect(texto).toContain('Diagnóstico de carga');
    // Lo declinado NO entra: ya tiene respuesta.
    expect(texto).not.toContain('Cambio de alternador');
  });

  /* Sin nada pendiente no hay a qué invitar, y un botón que abre un mensaje
     vacío se lee como un fallo. */
  test('sin trabajos sin respuesta, no hay botón de pedir autorización', async ({
    page,
  }) => {
    await abrir(page, '905 733');

    await expect(
      page.getByRole('link', { name: /Pedir autorización/ }),
    ).toHaveCount(0);
  });

  /* Lo anotado tiene que llegar hasta el papel, o la edición sería una
     pantalla bonita que no deja nada. */
  test('lo anotado sale en el papel del cliente', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __papeles: unknown[] }).__papeles = [];
      window.print = () => {
        (window as unknown as { __papeles: unknown[] }).__papeles.push(
          document.querySelector('app-hoja-impresion')?.textContent ?? '',
        );
      };
    });

    await abrir(page, '742 118');
    await anotar(page, 'Cambio de faja', '96000');

    const linea = page
      .locator('.trabajo')
      .filter({ hasText: 'Cambio de faja' });
    await linea.getByRole('button', { name: 'Autorizar' }).click();
    await page.getByRole('button', { name: /Registrar el sí/ }).click();
    await expect(linea).toContainText('Autorizado por');

    await page.getByRole('button', { name: 'El cliente', exact: true }).click();
    await expect
      .poll(async () =>
        page.evaluate(
          () => (window as unknown as { __papeles: string[] }).__papeles[0],
        ),
      )
      .toContain('Cambio de faja');
  });

  /* El panel de al lado resume, y ese resumen tiene que seguir a la Orden. */
  test('el resumen del panel sigue lo que se anota', async ({ page }) => {
    await abrir(page, '742 118');
    const panel = page.locator('mat-sidenav.shell__panel');
    await expect(panel).toContainText('1 aprobado');

    await anotar(page, 'Otro trabajo', '10000');

    await expect(panel).toContainText('2 aprobados');
  });
});

/* ---------------------------------------------------------------------------
   Las Fotos del Vehículo (#112).

   El ADR 0006 las decidió hace meses: pertenecen a la Orden, se sacan al
   recibir, y muestran cómo entró el carro. La tabla existía desde #74 y nadie
   la había llenado nunca.

   La foto de prueba se genera con entropía parecida a la de una cámara —
   degradados, manchas y grano—: un lienzo plano se comprimiría a casi nada y
   la medición no diría nada.
   --------------------------------------------------------------------------- */
test.describe('las fotos del vehículo', () => {
  /** Una foto grande y con grano, escrita a disco para poder subirla. */
  async function fotoDePrueba(page: Page): Promise<string> {
    const base64 = await page.evaluate(() => {
      const ANCHO = 2400;
      const ALTO = 1800;
      const c = document.createElement('canvas');
      c.width = ANCHO;
      c.height = ALTO;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error('sin canvas');

      let semilla = 7;
      const azar = () => {
        semilla = (semilla * 1103515245 + 12345) % 2147483648;
        return semilla / 2147483648;
      };

      const fondo = ctx.createLinearGradient(0, 0, 0, ALTO);
      fondo.addColorStop(0, '#8fb4d6');
      fondo.addColorStop(1, '#4b5058');
      ctx.fillStyle = fondo;
      ctx.fillRect(0, 0, ANCHO, ALTO);

      for (let i = 0; i < 500; i++) {
        ctx.beginPath();
        ctx.fillStyle = `hsl(${azar() * 360} 50% ${20 + azar() * 55}%)`;
        ctx.globalAlpha = 0.3 + azar() * 0.5;
        ctx.ellipse(
          azar() * ANCHO,
          azar() * ALTO,
          20 + azar() * 260,
          20 + azar() * 180,
          azar() * Math.PI,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const img = ctx.getImageData(0, 0, ANCHO, ALTO);
      for (let i = 0; i < img.data.length; i += 4) {
        const ruido = (azar() - 0.5) * 46;
        img.data[i] += ruido;
        img.data[i + 1] += ruido;
        img.data[i + 2] += ruido;
      }
      ctx.putImageData(img, 0, 0);

      return c.toDataURL('image/jpeg', 0.92).split(',')[1];
    });

    const ruta = join(tmpdir(), `bitacora-foto-${Date.now()}.jpg`);
    writeFileSync(ruta, Buffer.from(base64, 'base64'));
    return ruta;
  }

  const subir = async (page: Page, ruta: string, cuantas = 1) => {
    await page
      .locator('app-galeria-fotos input[type=file]')
      .setInputFiles(Array.from({ length: cuantas }, () => ruta));
  };

  test('se sacan al recibir y quedan en la Orden', async ({ page }) => {
    await page.goto('/');
    const ruta = await fotoDePrueba(page);

    await page.goto('/recepcion');
    await page.fill('#placa', 'FOT 001');
    await page.fill('#marca', 'Toyota');
    await page.fill('#cliente', 'Prueba de Fotos');
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.locator('textarea').first().fill('Le quiero mostrar un rayón');
    await page.getByRole('button', { name: 'Siguiente' }).click();

    await subir(page, ruta, 2);
    await expect(page.locator('.tira__foto')).toHaveCount(2);

    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.getByRole('button', { name: /Recibir veh/ }).click();
    await expect(page).toHaveURL(/\/$/);

    /* Y siguen ahí después de guardar: las Fotos se escriben en la MISMA
       transacción que la Orden. */
    await page
      .locator('li.fila')
      .filter({ hasText: 'FOT 001' })
      .getByRole('button', { name: /Ver orden/ })
      .click();
    await expect(page.locator('dialog.ventana .tira__foto')).toHaveCount(2);
  });

  /* Comprimir no es una optimización: es lo que hace viable guardar fotos en
     el navegador. Sin esto, veinte fotos por Orden acaban con la cuota. */
  test('lo guardado pesa una fracción de lo que entró', async ({ page }) => {
    await page.goto('/');
    const ruta = await fotoDePrueba(page);
    const original = statSync(ruta).size;

    await page
      .locator('li.fila')
      .first()
      .getByRole('button', { name: /Ver orden/ })
      .click();
    await subir(page, ruta);
    await expect(page.locator('dialog.ventana .tira__foto')).toHaveCount(1);

    const guardado = await page.evaluate(
      () =>
        new Promise<number>((resolver) => {
          const p = indexedDB.open('bitacora');
          p.onsuccess = () => {
            const tx = p.result.transaction('fotos', 'readonly');
            const todo = tx.objectStore('fotos').getAll();
            todo.onsuccess = () =>
              resolver(
                todo.result.reduce(
                  (t: number, f: { blob: Blob }) => t + f.blob.size,
                  0,
                ),
              );
          };
        }),
    );

    // Un orden de magnitud, por lo menos. Medido: unas 35 veces.
    expect(guardado).toBeLessThan(original / 5);
    expect(guardado).toBeGreaterThan(0);
  });

  /* 1600 px de lado largo: de sobra para probar "este rayón ya venía", y no es
     una foto de catálogo. */
  test('se reduce a 1600 px de lado largo', async ({ page }) => {
    await page.goto('/');
    const ruta = await fotoDePrueba(page);

    await page
      .locator('li.fila')
      .first()
      .getByRole('button', { name: /Ver orden/ })
      .click();
    await subir(page, ruta);
    await expect(page.locator('dialog.ventana .tira__foto')).toHaveCount(1);

    const medida = await page
      .locator('.tira__ver img')
      .first()
      .evaluate((i: HTMLImageElement) => ({
        ancho: i.naturalWidth,
        alto: i.naturalHeight,
      }));

    expect(Math.max(medida.ancho, medida.alto)).toBe(1600);
  });

  /* El canvas descarta el EXIF al recomprimir, y eso incluye la etiqueta de
     rotación: sin tratarla, las fotos de teléfono salen acostadas. */
  test('el navegador aplica la orientación al decodificar', async ({
    page,
  }) => {
    await page.goto('/');

    expect(
      await page.evaluate(async () => {
        const b = await fetch(
          'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
        ).then((r) => r.blob());
        await createImageBitmap(b, { imageOrientation: 'from-image' });
        return true;
      }),
    ).toBe(true);
  });

  test('se abren a pantalla completa y se cierran con Esc', async ({
    page,
  }) => {
    await page.goto('/');
    const ruta = await fotoDePrueba(page);

    await page
      .locator('li.fila')
      .first()
      .getByRole('button', { name: /Ver orden/ })
      .click();
    await subir(page, ruta);
    await page.locator('.tira__ver').first().click();

    const visor = page.locator('dialog.visor');
    await expect(visor).toBeVisible();
    expect(await visor.evaluate((d) => d.matches(':modal'))).toBe(true);

    await page.keyboard.press('Escape');
    await expect(visor).toBeHidden();
  });

  test('una foto que salió mal se quita', async ({ page }) => {
    await page.goto('/');
    const ruta = await fotoDePrueba(page);

    await page
      .locator('li.fila')
      .first()
      .getByRole('button', { name: /Ver orden/ })
      .click();
    await subir(page, ruta, 2);
    await expect(page.locator('dialog.ventana .tira__foto')).toHaveCount(2);

    await page.locator('dialog.ventana .tira__quitar').first().click();

    await expect(page.locator('dialog.ventana .tira__foto')).toHaveCount(1);
  });

  /* Las Fotos pertenecen a la ORDEN (ADR 0006): las de un carro no aparecen en
     la Orden de otro. */
  test('las fotos son de su Orden y no de otra', async ({ page }) => {
    await page.goto('/');
    const ruta = await fotoDePrueba(page);

    const filas = page.locator('li.fila');
    await filas
      .nth(0)
      .getByRole('button', { name: /Ver orden/ })
      .click();
    await subir(page, ruta);
    await expect(page.locator('dialog.ventana .tira__foto')).toHaveCount(1);
    await page.keyboard.press('Escape');

    await filas
      .nth(1)
      .getByRole('button', { name: /Ver orden/ })
      .click();
    await expect(page.locator('dialog.ventana .tira__foto')).toHaveCount(0);
  });

  /* Las fotos son para la pantalla: en una impresora láser de taller salen
     como una mancha gris y queman tóner. */
  test('no salen en los papeles impresos', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __papeles: string[] }).__papeles = [];
      window.print = () => {
        (window as unknown as { __papeles: string[] }).__papeles.push(
          document.querySelector('app-hoja-impresion')?.innerHTML ?? '',
        );
      };
    });

    await page.goto('/');
    const ruta = await fotoDePrueba(page);
    await page
      .locator('li.fila')
      .first()
      .getByRole('button', { name: /Ver orden/ })
      .click();
    await subir(page, ruta);
    await expect(page.locator('dialog.ventana .tira__foto')).toHaveCount(1);

    await page.getByRole('button', { name: 'Archivo', exact: true }).click();
    await expect
      .poll(async () =>
        page.evaluate(
          () => (window as unknown as { __papeles: string[] }).__papeles.length,
        ),
      )
      .toBe(1);

    const papel = await page.evaluate(
      () => (window as unknown as { __papeles: string[] }).__papeles[0],
    );
    expect(papel).not.toContain('<img');
  });
});

/* ---------------------------------------------------------------------------
   Lo que el Dueño configura (#114).

   El ADR 0008 le dio al Perfil Dueño cuatro atribuciones y llevaban sin
   construir desde entonces: hasta este ticket entraba a la app y lo único que
   podía tocar era el color.
   --------------------------------------------------------------------------- */
test.describe('los ajustes del Taller', () => {
  test('los datos del taller se guardan y salen en el papel', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as unknown as { __papeles: string[] }).__papeles = [];
      window.print = () => {
        (window as unknown as { __papeles: string[] }).__papeles.push(
          document.querySelector('app-hoja-impresion')?.textContent ?? '',
        );
      };
    });

    await page.goto('/ajustes');
    await page.fill('#taller-nombre', 'Taller Los Yoses');
    await page.fill('#taller-telefono', '2253-8080');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.locator('.aviso--bueno')).toContainText('Guardado');

    /* Un comprobante sin nombre ni teléfono no sirve para volver a llamar, y
       hasta este ticket los tres papeles salían sin membrete. */
    await page.goto('/');
    await expect(page.locator('li.fila').first()).toBeVisible();
    await page
      .locator('li.fila')
      .first()
      .getByRole('button', { name: /Ver orden/ })
      .click();
    await page.getByRole('button', { name: 'El cliente', exact: true }).click();

    await expect
      .poll(async () =>
        page.evaluate(
          () => (window as unknown as { __papeles: string[] }).__papeles[0],
        ),
      )
      .toContain('Taller Los Yoses');
  });

  /* El ADR 0010 hizo que la letra encabece el Folio y que cada Puesto lleve su
     consecutivo para que dos sin conexión nunca acuñen el mismo. Esa promesa
     se cae si dos comparten letra. */
  test('no deja repetir la letra de un Puesto, y dice por qué', async ({
    page,
  }) => {
    await page.goto('/ajustes');
    await page.getByRole('button', { name: /Agregar un puesto/ }).click();
    await page.fill('#letra-nueva', 'A1');
    await page.fill('#nombre-nuevo', 'Otro');
    await page.getByRole('button', { name: 'Crear', exact: true }).click();

    await expect(page.locator('.aviso--malo')).toContainText('folios iguales');
    await expect(page.locator('.puesto:not(.puesto--nuevo)')).toHaveCount(1);
  });

  test('un puesto con letra libre se crea', async ({ page }) => {
    await page.goto('/ajustes');
    await page.getByRole('button', { name: /Agregar un puesto/ }).click();
    await page.fill('#letra-nueva', 'B');
    await page.fill('#nombre-nuevo', 'Tablet del patio');
    await page.getByRole('button', { name: 'Crear', exact: true }).click();

    await expect(page.locator('.puesto')).toHaveCount(2);
    await expect(page.locator('.puesto').last()).toContainText('B');
  });

  /* Sin Puesto no se acuña Folio, y sin Folio no se recibe un carro. */
  test('no deja quitar el último puesto', async ({ page }) => {
    await page.goto('/ajustes');
    await page.getByRole('button', { name: 'Quitar', exact: true }).click();

    await expect(page.locator('.aviso--malo')).toContainText(
      'al menos un puesto',
    );
    await expect(page.locator('.puesto')).toHaveCount(1);
  });

  /* Al resto no se le OFRECE editar, que no es lo mismo que prohibírselo
     (ADR 0005 y 0013): se le enseña el valor, no un campo apagado. */
  test('al Asesor se le enseña, no se le ofrece editar', async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem('bitacora.perfil', 'asesor'),
    );
    await page.goto('/ajustes');

    await expect(page.locator('.solo-lectura')).toBeVisible();
    await expect(page.locator('#taller-nombre')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /Agregar un puesto/ }),
    ).toHaveCount(0);
  });

  test('la tarifa sugiere el monto al anotar un trabajo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('li.fila').first()).toBeVisible();
    await page
      .locator('li.fila')
      .filter({ hasText: '742 118' })
      .getByRole('button', { name: /Ver orden/ })
      .click();

    await page.getByRole('button', { name: /Anotar trabajo/ }).click();
    await page.fill('#trabajo-desc', 'Cambio de pastillas');
    await page.fill('#trabajo-horas', '2');
    await page
      .locator('.anotar .opcion')
      .filter({ hasText: 'Mecánica' })
      .click();

    /* 2 h × ₡14 000 de la tarifa sembrada. Es una SUGERENCIA: el monto sigue
       escribiéndose a mano porque incluye repuestos (ADR 0021). */
    const sugerencia = page.locator('.anotar__sugerencia');
    await expect(sugerencia).toContainText(/28\s000/u);

    await sugerencia.click();
    await expect(page.locator('#trabajo-monto')).toHaveValue('28000');
  });
});

/* ---------------------------------------------------------------------------
   El filtro del tablero (#114).

   El ADR 0003 y el ADR 0008 lo prometieron y nunca se había construido: es "la
   única configuración que cambia lo que se ve".
   --------------------------------------------------------------------------- */
test.describe('el filtro del tablero', () => {
  test('con tres especialidades aparece y filtra de verdad', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('li.fila').first()).toBeVisible();

    const filtro = page.locator('.pantalla__filtro');
    await expect(filtro).toBeVisible();

    const todas = await page.locator('li.fila').count();

    const pintura = filtro.locator('.opcion').filter({ hasText: 'Pintura' });
    await pintura.click();
    /* Se espera a que la opción quede marcada antes de contar: contar en el
       mismo instante del clic lee la lista sin filtrar. */
    await expect(pintura).toHaveClass(/opcion--marcada/);

    const dePintura = await page.locator('li.fila').count();
    expect(dePintura).toBeGreaterThan(0);
    expect(dePintura).toBeLessThan(todas);
    await expect(page.locator('.pantalla__conteo')).toContainText(
      'de esa especialidad',
    );
  });

  /* Un solo gesto para poner y quitar, en vez de un botón de "todas" que ocupa
     sitio y dice menos. */
  test('volver a pulsar la misma quita el filtro', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('li.fila').first()).toBeVisible();
    const todas = await page.locator('li.fila').count();

    const pintura = page
      .locator('.pantalla__filtro .opcion')
      .filter({ hasText: 'Pintura' });
    await pintura.click();
    await expect(page.locator('li.fila')).not.toHaveCount(todas);

    await pintura.click();
    await expect(page.locator('li.fila')).toHaveCount(todas);
  });

  /* Es LA consecuencia visible de configurar las Especialidades, y la razón
     por la que ese ajuste importa (ADR 0003 y 0008). */
  test('con una sola especialidad configurada, el filtro no aparece', async ({
    page,
  }) => {
    await page.goto('/ajustes');
    await page
      .locator('[role="tab"]')
      .filter({ hasText: /Especialidades/i })
      .click();

    for (const quitar of ['Pintura', 'Electricidad']) {
      await page
        .locator('app-ajustes-especialidades .opcion')
        .filter({ hasText: quitar })
        .click();
      await expect(
        page
          .locator('app-ajustes-especialidades .opcion')
          .filter({ hasText: quitar }),
      ).not.toHaveClass(/opcion--marcada/);
    }

    await expect(page.locator('.especialidades__consecuencia')).toContainText(
      'no ofrece filtrar',
    );

    await page.goto('/');
    await expect(page.locator('li.fila').first()).toBeVisible();
    await expect(page.locator('.pantalla__filtro')).toHaveCount(0);
  });

  /* Cada Línea lleva Especialidad (ADR 0001): sin ninguna no habría de dónde
     elegirla, y el Taller no podría recibir un carro. */
  test('el taller no puede quedarse sin especialidades', async ({ page }) => {
    await page.goto('/ajustes');
    await page
      .locator('[role="tab"]')
      .filter({ hasText: /Especialidades/i })
      .click();

    for (const quitar of ['Pintura', 'Electricidad', 'Mecánica']) {
      await page
        .locator('app-ajustes-especialidades .opcion')
        .filter({ hasText: quitar })
        .click();
    }

    await expect(
      page.locator('app-ajustes-especialidades .aviso--malo'),
    ).toContainText('al menos una Especialidad');
  });
});

/* ---------------------------------------------------------------------------
   Cerrar el ciclo de la Orden (#116).

   La máquina de estados quedó quieta tres tickets y bloqueaba dos decisiones
   tomadas hace meses: el Aviso de listo (ADR 0009) y la Próxima visita
   (ADR 0011), que se escribe al entregar — y entregar no existía.
   --------------------------------------------------------------------------- */
test.describe('el ciclo de la Orden', () => {
  const abrirOrden = async (page: Page, texto: string) => {
    await page.goto('/');
    await expect(page.locator('li.fila').first()).toBeVisible();
    await page
      .locator('li.fila')
      .filter({ hasText: texto })
      .getByRole('button', { name: /Ver orden/ })
      .click();
    await expect(page.locator('dialog.ventana')).toBeVisible();
  };

  const mover = (page: Page, estado: string) =>
    page
      .locator('app-ciclo-orden label')
      .filter({ hasText: estado })
      .first()
      .click();

  test('mover el estado se ve en el tablero', async ({ page }) => {
    await abrirOrden(page, 'A1-2418');

    await mover(page, 'En proceso');

    await page.keyboard.press('Escape');
    await expect(
      page.locator('li.fila').filter({ hasText: 'A1-2418' }),
    ).toContainText('En proceso');
  });

  /* El taller no va en línea recta: un carro vuelve de "listo" a "en proceso"
     cuando algo sale mal. Una máquina rígida pelearía con él. */
  test('el estado también camina hacia atrás', async ({ page }) => {
    await abrirOrden(page, 'A1-2418');

    await mover(page, 'Listo para entrega');
    await mover(page, 'En diagnóstico');

    await expect(page.locator('app-ciclo-orden')).toContainText(
      'En diagnóstico',
    );
  });

  test('el aviso de listo deja constancia y arma el mensaje', async ({
    page,
  }) => {
    await abrirOrden(page, 'A1-2418');
    await mover(page, 'Listo para entrega');

    await expect(page.locator('.aviso-listo__pendiente')).toContainText(
      'no se le ha avisado',
    );

    /* El mensaje lo arma Bitácora y lo manda WhatsApp: lo que se comprueba es
       el enlace prellenado, no que salga la app (ADR 0007 y 0009). */
    const enlace = await page
      .locator('.aviso-listo a[app-boton]')
      .getAttribute('href');
    expect(enlace).toContain('wa.me/506');
    expect(decodeURIComponent(enlace ?? '')).toContain('ya está listo');

    await page.getByRole('button', { name: /Registrar que avis/ }).click();
    await page.fill('#aviso-a', 'Don Beto');
    await page.getByRole('button', { name: /Guardar la constancia/ }).click();

    await expect(page.locator('.aviso-listo__hecho')).toContainText(
      'Avisado a Don Beto por WhatsApp',
    );
  });

  /* La pregunta que la Orden contesta es "¿se avisó, y cuándo?", en singular:
     el aviso anterior se retira en vez de apilarse. */
  test('volver a avisar deja un solo aviso', async ({ page }) => {
    await abrirOrden(page, 'A1-2421');

    await page.getByRole('button', { name: /Volver a avisar/ }).click();
    await page.fill('#aviso-a', 'La secretaria');
    await page.getByRole('button', { name: /Guardar la constancia/ }).click();

    await expect(page.locator('.aviso-listo__hecho')).toHaveCount(1);
    await expect(page.locator('.aviso-listo__hecho')).toContainText(
      'La secretaria',
    );
  });

  test('entregar saca el carro del tablero y guarda la próxima visita', async ({
    page,
  }) => {
    await abrirOrden(page, 'A1-2421');

    await page.getByRole('button', { name: /^Entregar el veh/ }).click();
    await page.fill('#proxima-visita', '2026-12-01');
    /* La fecha se repite con el mes en letras: el aparato la enseña en SU
       formato, y una tableta en inglés pone mm/dd donde acá se lee dd/mm. */
    await expect(page.locator('.formulario__eco')).toHaveText(
      '1 de diciembre de 2026',
    );
    await page.getByRole('button', { name: /^Entregar el veh/ }).click();

    await expect(page.locator('.ciclo__entregada')).toContainText(
      'Próxima visita: 1 de diciembre de 2026',
    );

    await page.keyboard.press('Escape');
    await expect(
      page.locator('li.fila').filter({ hasText: 'A1-2421' }),
    ).toHaveCount(0);
  });

  /* Entregar es un clic que cambia el mundo y un dedo torpe sobre una tableta
     no puede costar eso. */
  test('deshacer la entrega devuelve el carro sin borrar la fecha', async ({
    page,
  }) => {
    await abrirOrden(page, 'A1-2421');
    await page.getByRole('button', { name: /^Entregar el veh/ }).click();
    await page.fill('#proxima-visita', '2026-12-01');
    await page.getByRole('button', { name: /^Entregar el veh/ }).click();
    await expect(page.locator('.ciclo__entregada')).toBeVisible();

    await page.getByRole('button', { name: /Deshacer la entrega/ }).click();

    await expect(page.locator('app-ciclo-orden')).toContainText(
      'Listo para entrega',
    );
    await page.keyboard.press('Escape');
    await expect(
      page.locator('li.fila').filter({ hasText: 'A1-2421' }),
    ).toHaveCount(1);
  });

  /* Con el trabajo terminado, entregar ES la acción de la ventana. Antes de
     eso sigue estando —a veces el Cliente se lo lleva a medias— pero medido en
     pantalla competía con "Anotar trabajo" en una Orden que ni siquiera tenía
     el repuesto. */
  test('entregar pesa lo que toca según dónde va el carro', async ({
    page,
  }) => {
    await abrirOrden(page, 'A1-2418');
    const boton = page.locator('.ciclo__entregar-boton');

    await expect(boton).toHaveAttribute('data-tono', 'contorno');

    await mover(page, 'Listo para entrega');

    await expect(boton).toHaveAttribute('data-tono', 'solido');
  });
});

/* ---------------------------------------------------------------------------
   El Vehículo sin recoger (#116, ADR 0009).

   El tablero ordena por Tiempo parado, pero un carro que lleva días esperando
   un repuesto y otro que lleva días listo sin que lo recojan son problemas
   distintos: el primero es del Taller, el segundo es del Cliente.
   --------------------------------------------------------------------------- */
test.describe('el vehículo sin recoger', () => {
  test('el tablero lo marca aparte del que espera repuesto', async ({
    page,
  }) => {
    await page.goto('/');

    const sinRecoger = page.locator('.insignia[data-tono="sin-recoger"]');
    await expect(sinRecoger).toHaveCount(1);
    await expect(sinRecoger).toContainText('Sin recoger');
    // El número es lo accionable: dice cuánto lleva ahí.
    await expect(sinRecoger).toContainText(/\d+ d/u);

    /* El color no puede ser lo único que los separe (ANSI/HFES 100-2007
       §7.2.5.3): el rombo es el repuesto que no llega, el cuadrado es el carro
       que nadie recoge. */
    const forma = (tono: string) =>
      page
        .locator(`.insignia[data-tono="${tono}"]`)
        .first()
        .evaluate((el) => getComputedStyle(el, '::before').clipPath);
    expect(await forma('sin-recoger')).not.toBe(await forma('riesgo'));
  });

  /* Lo que se configura tiene que verse (ADR 0023): un umbral que no mueve el
     tablero es un formulario que guarda en el vacío. */
  test('el umbral de Ajustes mueve la marca del tablero', async ({ page }) => {
    await page.goto('/ajustes');
    await page.fill('#umbral-sin-recoger', '9');
    await page.locator('#umbral-sin-recoger').blur();
    await expect(page.locator('.umbral__eco')).toContainText('a los 9 días');

    await page.goto('/');
    await expect(
      page.locator('.insignia[data-tono="sin-recoger"]'),
    ).toHaveCount(0);

    await page.goto('/ajustes');
    await page.fill('#umbral-sin-recoger', '3');
    await page.locator('#umbral-sin-recoger').blur();

    await page.goto('/');
    await expect(
      page.locator('.insignia[data-tono="sin-recoger"]'),
    ).toHaveCount(1);
  });

  /* Un umbral de cero días marcaría el carro en el mismo instante en que se
     le avisa al Cliente. */
  test('la casilla vacía devuelve el umbral que había', async ({ page }) => {
    await page.goto('/ajustes');

    await page.fill('#umbral-sin-recoger', '');
    await page.locator('#umbral-sin-recoger').blur();

    await expect(page.locator('#umbral-sin-recoger')).toHaveValue('3');
  });

  /* Un carro que se avisó y después volvió a proceso —porque algo salió mal—
     sigue teniendo su Aviso. Marcarlo como abandonado mientras el Taller le
     está metiendo mano sería mentir. */
  test('vuelto a proceso deja de estar sin recoger', async ({ page }) => {
    await page.goto('/');
    await page
      .locator('li.fila')
      .filter({ hasText: 'SJB 4472' })
      .getByRole('button', { name: /Ver orden/ })
      .click();

    await page
      .locator('app-ciclo-orden label')
      .filter({ hasText: 'En proceso' })
      .first()
      .click();
    await page.keyboard.press('Escape');

    await expect(
      page.locator('.insignia[data-tono="sin-recoger"]'),
    ).toHaveCount(0);
  });
});

/* ---------------------------------------------------------------------------
   Próximas visitas (#116, ADR 0011).

   La última pantalla en blanco de #101. La fecha la escribe el Asesor al
   entregar: acá no se calcula nada, y sin fecha escrita el Vehículo no
   aparece nunca.
   --------------------------------------------------------------------------- */
/* En pantalla estrecha la tira de pestañas se queda en iconos. El rótulo se
   escondía con `display: none`, que lo saca TAMBIÉN del árbol de
   accesibilidad: cuatro pestañas seguidas sin nombre (WCAG 2.2 SC 4.1.2). */
test.describe('las pestañas en pantalla estrecha', () => {
  test('el rótulo se esconde a la vista y se queda para el lector', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/ordenes');

    const entregado = page.getByRole('tab', { name: 'Entregado' });
    // Alcanzable por su nombre: es lo que anuncia el lector de pantalla.
    await entregado.click();
    await expect(page.locator('[role="tabpanel"]')).toHaveAttribute(
      'id',
      'panel-entregado',
    );

    // Y sigue sin verse: el icono es lo único que ocupa sitio.
    const rotulo = entregado.locator('span');
    await expect(rotulo).toHaveCSS('clip-path', 'inset(50%)');
  });
});

test.describe('las próximas visitas', () => {
  test('se reparten en montones y las vencidas van primero', async ({
    page,
  }) => {
    await page.goto('/proximas-visitas');

    await expect(page.locator('.grupo')).toHaveCount(3);
    await expect(page.locator('.grupo').first()).toContainText(
      'Ya pasó la fecha',
    );
    /* Lo primero que hay que poder contestar al abrirla es a quién llamar hoy:
       una lista plana por fecha obliga a leerla entera para averiguarlo. */
    await expect(page.locator('.grupo').first()).toContainText(
      'hay que llamar hoy',
    );
  });

  /* El ADR 0011 llama a esto los dos caminos hacia la misma conversación de
     venta: llamar sin el trabajo declinado a mano es llamar sin saber qué
     proponer. */
  test('la visita enseña lo que quedó sin aprobar', async ({ page }) => {
    await page.goto('/proximas-visitas');

    const vencida = page.locator('.grupo').first().locator('.visita').first();
    await expect(vencida).toContainText('Cambio de amortiguadores');
    await expect(vencida.locator('.pendiente__monto')).toContainText(
      /210\s000/u,
    );
  });

  /* Bitácora no manda nada por su cuenta: arma el texto y una persona decide
     y envía (ADR 0009 y 0011). */
  test('el mensaje sale armado, con el taller y lo pendiente', async ({
    page,
  }) => {
    await page.goto('/ajustes');
    await page.fill('#taller-nombre', 'Taller Los Yoses');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.locator('.aviso--bueno')).toContainText('Guardado');

    await page.goto('/proximas-visitas');
    const enlace = await page
      .locator('.visita__llamar')
      .first()
      .getAttribute('href');
    const texto = decodeURIComponent(enlace ?? '');

    expect(enlace).toContain('wa.me/506');
    expect(texto).toContain('Taller Los Yoses');
    expect(texto).toContain('Kia Rio 2020');
    expect(texto).toContain('Cambio de amortiguadores');
  });

  /* La fecha se escribe al entregar y aparece acá: es el ciclo completo, de
     la ventana de la Orden a la lista de llamadas. */
  test('entregar con fecha mete el carro en la lista', async ({ page }) => {
    await page.goto('/');
    await page
      .locator('li.fila')
      .filter({ hasText: 'A1-2421' })
      .getByRole('button', { name: /Ver orden/ })
      .click();
    await page.getByRole('button', { name: /^Entregar el veh/ }).click();
    await page.fill('#proxima-visita', '2027-03-15');
    await page.getByRole('button', { name: /^Entregar el veh/ }).click();
    await expect(page.locator('.ciclo__entregada')).toBeVisible();
    await page.keyboard.press('Escape');

    await page.goto('/proximas-visitas');
    await expect(
      page.locator('.visita').filter({ hasText: 'Suzuki Swift' }),
    ).toContainText('15 de marzo de 2027');
  });

  /* El carro al que se le deshace la entrega conserva su fecha —la escribió
     una persona pensando en el carro— pero está en el Taller: recordarle al
     Cliente que vuelva sería ruido. */
  test('el carro devuelto al taller sale de la lista', async ({ page }) => {
    await page.goto('/ordenes');
    await page.getByRole('tab', { name: /Entregado/i }).click();
    await page
      .locator('li.fila')
      .filter({ hasText: 'Kia Rio' })
      .getByRole('button', { name: /Ver orden/ })
      .click();
    await page.getByRole('button', { name: /Deshacer la entrega/ }).click();
    await page.keyboard.press('Escape');

    await page.goto('/proximas-visitas');
    await expect(
      page.locator('.visita').filter({ hasText: 'Kia Rio' }),
    ).toHaveCount(0);
  });
});
