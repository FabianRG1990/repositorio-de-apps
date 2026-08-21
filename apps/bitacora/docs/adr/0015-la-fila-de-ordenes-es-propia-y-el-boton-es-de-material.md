# La fila de Órdenes es un componente propio; el botón sí es de Material

Los dos prototipos de Bitácora se hicieron por separado y no coincidían: uno tenía los **componentes** —entre ellos **Ver orden**— y el otro la **lista medida y corregida** en [#77](https://github.com/FabianRG1990/repositorio-de-apps/issues/77). Al unirlos sobre la plantilla real había que decidir, pieza por pieza, cuál se resuelve con Angular Material y cuál se queda como componente propio.

**Decidimos que la fila de la lista, la insignia de estado y la etiqueta de especialidad son componentes propios, y que los botones son de Material con sus tokens de alto apuntados a la escalera táctil del proyecto.** Sale del ticket [#81](https://github.com/FabianRG1990/repositorio-de-apps/issues/81).

## El mapeo, con la razón de cada casilla

| Pieza                        | Resolución                        | Por qué                                                                                                     |
| ---------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Fila de la lista             | **Propia** (`li[app-fila-orden]`) | Tres bloqueos en el código de Material, abajo                                                               |
| Insignia de estado           | **Propia**                        | El alto de `mat-chip` es un token fijo de 32/28/24 px y el marcador ya pide 20; además el chip es focusable |
| Etiqueta de especialidad     | **Propia**                        | Mismo motivo, y su color sale de `oklch()` con el matiz por dominio                                         |
| Ver orden / Recibir vehículo | **Material** (`matButton`)        | Hay equivalente real, y sus alturas son tokens sobrescribibles                                              |
| Cajones, lista del menú      | **Material** (ya en uso)          | Sin cambios en este ticket                                                                                  |

**PrimeNG no entra**, y no por descarte: pide `@angular/core ^22.1.0` y el workspace está en `~22.0.4`. Subirlo es un `nx migrate` que tiene su propio ticket ([#78](https://github.com/FabianRG1990/repositorio-de-apps/issues/78)) y mezclarlo acá habría metido una migración del workspace dentro de un ticket de componentes. Nada de lo que hizo falta lo aportaba PrimeNG.

## Por qué la fila no puede ser un `mat-list-item`

Los tres motivos se leen en `node_modules/@angular/material`, no de memoria:

1. **El alto es un token en píxeles fijos**: 48 / 64 / 88 px según el número de líneas (`list/_m3-list.scss`). La escalera de este proyecto es **56 / 72 / 96** (#18 §6.5). Y peor que el número: un alto en píxeles **no se mueve con el `font-size` de la raíz**, que es exactamente el mecanismo con el que funcionan acá la perilla de densidad y el zoom al 200 % de SC 1.4.4.
2. **`sanityCheckListItemContent` avisa por consola a partir de tres líneas**, y la fila amplia tiene cinco áreas: cabecera, título, cliente, insignias y detalle.
3. **`MatListItem` impone su propia estructura** de título y líneas, y acá la rejilla cambia de forma por densidad — de una línea a dos a tarjeta.

El selector es `li[app-fila-orden]` y no `<app-fila-orden>` porque un elemento propio dentro de un `<ul>` no es contenido permitido y rompe la relación lista↔elemento que el lector de pantalla anuncia. Es la misma forma que ofrece `mat-list-item`, y obligó a ampliar la regla de ESLint a `type: ['element', 'attribute']`.

## Dos botones hermanos, no uno dentro del otro

El cuerpo de la fila selecciona; **Ver orden** abre el detalle. Van como hermanos dentro del `<li>`: un `<button>` dentro de otro `<button>` es HTML inválido. El prototipo lo resolvía haciendo la fila un `<article tabindex="0">`, que **cambia el problema de sitio** —un objetivo enfocable sin rol— en vez de quitarlo.

Ver orden existe porque tapa un agujero real: en una tableta el panel de detalle está cerrado, así que tocar una fila seleccionaba una Orden y **no pasaba nada visible**. La fila pide el detalle a través de un contador; el shell decide cómo enseñarlo, porque eso depende de la anchura y una fila de la lista no la conoce. Es un contador y no un booleano para que pedir la misma Orden dos veces vuelva a abrir el panel si entretanto se cerró.

## El reflujo lo decide la lista, no la ventana

`@media (max-width: …)` no sirve acá, y hay dos mediciones que lo prueban:

- **A 1280 px de ventana la lista mide 740 px, y a 1024 mide 958** — más ancha con menos ventana, porque el shell colapsa el menú y el panel. La consulta de ventana no ve eso.
- **Con el zoom por tamaño de letra de SC 1.4.4 la ventana no cambia de tamaño**, así que la consulta nunca dispara: al 200 % las columnas fijas sumaban más de lo que quedaba y la lista **desbordaba en horizontal**.

Con `@container` y los umbrales en `rem`, los dos casos reordenan. Son **dos** escalones y no uno: con un corte único en 52 rem, el tramo de 1152 a 1366 px —las portátiles más comunes— saltaba de la fila de 72 px a la apilada de 179 por 40 px de diferencia de ancho.

## Consequences

- **Las columnas de la lista van a ancho fijo.** Cada fila es su propia rejilla —el grid del `<ul>` no llega dentro del componente—, así que con `auto` el ancho lo decidía el texto de cada Orden y las insignias caían en una x distinta por fila: la columna dejaba de existir y la lista dejaba de escanearse de arriba abajo. El precio es que el modelo del vehículo se trunca antes.
- **La placa nunca es lo que se corta.** Con el título en una sola cadena, "Hyundai Elantra 2018 · TSJ 1204" quedaba en "TSJ 1…". El modelo cede y la placa lleva `flex: none`.
- **La especialidad se deriva de las Líneas**, no de la Orden, porque es de la Línea (ADR 0001) y una Orden puede tocar tres. Con más de una el nombre se oculta a la vista y **sigue en el árbol de accesibilidad**: si el color quedara solo, la etiqueta dejaría de cumplir #18 §6.2 regla 2.
- **El estado lleva figura además de color** — círculo, triángulo y rombo, a 20 px. ANSI/HFES 100-2007 §7.2.6.2: una marca solo se **discrimina** por color a partir de 30 minutos de arco, ~23–30 px a 45 cm.
- **La app carga por fin la tipografía que pedía.** Declaraba `Roboto` sin `@font-face` ni paquete, así que caía a Arial y nada de lo medido en #77 se estaba dibujando. Entra Inter Variable subseteada, servida desde la propia app: el archivo de Google Fonts no trae `zero`, `cv05`, `cv08` ni `case` (#72 §6.3), y Bitácora tiene que abrir sin conexión. Esto **cierra el hallazgo que el [ADR 0012](./0012-dos-pieles-por-tokens-de-color-y-de-efecto.md) dejó abierto**.
- **Los `@font-face` de peso único están prohibidos en este proyecto.** CSS Fonts 4 §7.2 recorta el peso pedido al descriptor: con valor único, `font-weight: 590` se vuelve 400 en silencio.
- **La escalera de altura se cumple exacta en compacta y normal** —56,0 y 72,0 px medidos— y el 96 es el **piso** de la fila amplia, que crece hasta ~240 px porque enseña el detalle sin abrir la Orden.
- **Contraste medido sobre píxeles, no sobre CSS**: 10 de 10 puntos de texto en cada piel, ≥ 5,62:1 en oficina (objetivo AA) y ≥ 7,85:1 en taller (objetivo 7:1 de #18 §5.4).
- **El corte del [ADR 0012](./0012-dos-pieles-por-tokens-de-color-y-de-efecto.md) aguanta**: los tres componentes nuevos no tienen un solo selector condicionado a la piel. Lo que hizo falta fueron cinco tokens nuevos —el alto de fila y de botón por densidad, la claridad y el croma de la especialidad, y el par fondo/tinta del botón sólido—, todos declarados en `styles.scss`.
