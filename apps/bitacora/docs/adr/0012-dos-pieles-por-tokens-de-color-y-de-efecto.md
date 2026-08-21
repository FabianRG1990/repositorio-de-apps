# Dos pieles conmutables por tokens de color y de efecto

Bitácora tiene que verse como el estándar visual de Moofy VIP —oscuro, translúcido, con sombras y acento teal— y además ofrecer un **modo taller** claro y de alto contraste para el patio. **Decidimos sostener las dos con un único juego de tokens `--app-*` en el que la piel cambia VALORES y nunca REGLAS**, y que ese juego incluya los **efectos** (vidrio, velo, sombras) y no solo los colores.

La comprobación de que el corte está bien puesto es mecánica y se lee en el diff: fuera de `apps/bitacora/src/styles.scss` no existe **ningún** selector condicionado a la piel. Ningún `[data-piel='taller'] .fila`, ninguna clase `--claro` en un componente.

Esto sale del prototipo de [#79](https://github.com/FabianRG1990/repositorio-de-apps/issues/79), que montó las dos pieles conmutables sobre la lista de Órdenes real.

## El corte: los componentes nombran roles, no colores

Un componente escribe `background: var(--app-capa-reposo)`, nunca `rgba(255,255,255,0.02)`. La diferencia importa porque en oscuro esa capa es un velo de luz y en claro tiene que ser un escalón de superficie: son dos cosas distintas con el mismo papel, y solo un nombre de rol las abarca.

Tres piezas hacen falta para que el vocabulario cierre:

1. **Los efectos son tokens.** `--app-vidrio`, `--app-velo`, `--app-shadow` y compañía. Sin esto la piel clara es imposible: el vidrio no es un tono, es una caja.
2. **Cada sombra es una lista completa en un solo token.** `box-shadow: var(--a), var(--b)` con una de las dos en `none` produce `none, none`, que no es una lista válida y tira la declaración entera.
3. **Cada estado va en tres piezas** —texto, píldora y borde— en vez de un color con `color-mix` en el componente. En oscuro el mismo tono sirve para las tres; en claro no.

## Angular Material se conmuta con `color-scheme`, gratis

`mat.theme()` sin `theme-type` usa `color-scheme`, y eso hace que emita **cada** token `--mat-sys-*` como `light-dark(<claro>, <oscuro>)` (`core/tokens/_system.scss`, función `_generate-sys-colors`, verificado en `@angular/material@22.0.7`). Conmutar Material entero es entonces cambiar la propiedad `color-scheme` en el bloque de cada piel: no hay que re-emitir el tema, ni duplicar la hoja, ni mantener dos temas de Material.

**Pero las dos capas se tocan y hay que decidir quién manda.** Material pinta con sus tokens, no con el `color` que hereda: la etiqueta del item de menú salía de `--mat-list-list-item-label-text-color` y la piel no llegaba hasta ahí. Medido, el item **en reposo** daba 12,73:1 y el **activo** 7,97:1 — la jerarquía al revés, el elemento no seleccionado gritando más que el seleccionado. Donde eso pase, el puente es apuntar el token de Material al nuestro (`--mat-list-list-item-label-text-color: var(--app-text-soft)`), que sigue siendo un valor y no una regla.

## Qué pasa con el `backdrop-filter`

Se apaga entero (`--app-vidrio: none`) **y la superficie de debajo pasa a opaca en el mismo movimiento**. No es opcional: el efecto solo existe sobre algo translúcido — _"to see the effect the element or its background needs to be transparent or partially transparent"_ ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)) —, así que apagar el filtro y dejar la superficie en `rgba(...)` no devuelve un plano opaco: devuelve el fondo crudo colándose por el alfa. Por eso `--app-surface` es `rgba(9,18,29,0.78)` en una piel y `#ffffff` en la otra.

Conviene saber, además, que un elemento con `backdrop-filter` distinto de `none` se vuelve un _backdrop root_ y acota el efecto de sus descendientes: es la causa habitual de que el vidrio "no se vea" estando bien escrito.

## Qué pasa con las sombras

En la piel taller no hay ninguna sobre planos permanentes, y su trabajo lo hace el **escalón de superficie**. No es una preferencia: las sombras desaparecen al sol ([#18](https://github.com/FabianRG1990/repositorio-de-apps/issues/18) §5.4), así que separar planos con ellas es separar con algo que el entorno borra.

Las superficies claras son la escalera `surface-container-*` de Material 3 (tonos HCT 100/98/96/94/92), que [#72](https://github.com/FabianRG1990/repositorio-de-apps/issues/72) §7.1 midió en ~1,05:1 por escalón. Medido en esta implementación: 1,052 · 1,052 · 1,110, y 1,165 del lienzo a la superficie.

La sombra sigue estando disponible para lo que **flota** —hoja, menú, diálogo—, que es donde M3 la mantiene y donde sí dice algo: que ese plano es temporal.

## Qué queda de lo medido en #72 — y qué acepta cada piel

Medido sobre la app corriendo, componiendo cada color con su alfa sobre el fondo real tomado del render (no del CSS):

|                                      | moofy         | taller         |
| ------------------------------------ | ------------- | -------------- |
| Puntos de texto que llegan a **7:1** | **6 de 14**   | **14 de 14**   |
| Texto de cuerpo                      | 14,29:1       | 13,31:1        |
| Texto secundario                     | 5,43:1        | 7,68:1         |
| Etiquetas del panel                  | 5,81:1        | 8,59:1         |
| Insignias de estado                  | 5,45 – 6,87:1 | 7,27 – 7,46:1  |
| Item de menú: reposo → activo        | 5,55 → 7,97:1 | 8,16 → 11,53:1 |

**El objetivo 7:1 se le exige al modo taller y no a la piel de Moofy.** Las dos cumplen AA (4,5:1) en todo el texto medido; lo que separa a una de otra es el margen que #18 §5.1 compra para el sol, el reflejo y la película de grasa sobre el vidrio, y ese margen solo hace falta donde está el sol. Moofy es la piel de oficina y se conserva tal cual, con su texto a opacidad 0,56 y sus 5,4:1: cambiarla sería dejar de replicar el estándar, que es su único motivo de existir.

Lo demás de #72 vale para las dos pieles y así queda:

- **Anillo de foco de 2 px con `outline-offset: 2px`**, donde el hueco hace de segundo anillo (§7.2). Solo cambia el color: claro sobre oscuro, oscuro sobre claro.
- **El paso de jerarquía se compra subiendo el primario, no bajando el secundario** (§9). Por eso en taller el primario va a 12:1 y el secundario a 7:1, en vez de dejar caer el secundario.
- **Nada codificado solo por matiz** (HFES §7.2.5.3): cada estado lleva su texto además de su color.
- **Un borde de lista no es un borde de plano.** En claro, poner los bordes de fila al 3:1 que pide SC 1.4.11 convierte la lista en una hoja de cálculo, que es el defecto que §5.2 y §5.9 señalan como el más caro. Los dos roles se separaron en dos tokens: `--app-border` delimita planos grandes y cumple 3:1; `--app-border-lista` es decoración y en taller vale 1,3:1, porque la separación real la hacen el escalón y el espacio.

## Qué pasa con Inter

**Nada todavía, y eso es un hallazgo, no una omisión: hoy la app no carga ninguna fuente.** `styles.scss` pide `Roboto` y no hay un solo `@font-face` ni enlace a Google Fonts en el proyecto, así que Bitácora se está viendo con la fuente que cada dispositivo tenga a mano — distinta en la tableta del taller y en el monitor de recepción.

La decisión de tipografía **no la cierra este ADR**. Lo que sí queda decidido es el marco:

- **Google Sans Flex no entra por la puerta de atrás.** Si se adopta la de Moofy, va self-hosted como cualquier otra: Bitácora es PWA offline-first y una fuente que se pide a un CDN no está cuando no hay red.
- **Inter sigue siendo la candidata con trabajo hecho**: subset latino de 87 544 B ya en `docs/prototypes/fonts/`, y la razón por la que se eligió — el cero cortado — **no la ofrece el build que sirve Google Fonts** ([#72](https://github.com/FabianRG1990/repositorio-de-apps/issues/72) §6.3).
- **590 vs. 600 se decide mirándolos en pantalla**, no citando a nadie: #72 §6.6 desarmó las dos justificaciones que se le daban al 590.
- La piel **no depende** de esto. `font-family` es un token más el día que se resuelva, y ninguna de las dos pieles cambia por él.

## Consequences

- **Un componente nuevo se escribe una sola vez.** Si nombra roles, ya funciona en las dos pieles; si nombra un color, la piel taller lo delata al instante. Es un criterio de revisión, no una convención de estilo.
- **El coste de la segunda piel es un bloque de tokens**, no una hoja paralela. Es lo que #79 quería evitar y la razón de haber elegido este corte.
- **Cada nuevo componente de Material puede necesitar su puente.** El del menú apareció midiendo; los que vengan aparecerán igual. La regla es: si un componente de Material se ve fuera de la piel, se apunta su token al `--app-*` que corresponda, y nunca al revés.
- **La conmutación real todavía no existe para el usuario.** Hoy vive en un conmutador de prototipo que solo se dibuja en desarrollo. Ponerla en Ajustes, persistirla y decidir si sigue al `prefers-color-scheme` del sistema es trabajo de [#80](https://github.com/FabianRG1990/repositorio-de-apps/issues/80).
- **El objetivo 7:1 queda como propiedad verificable del modo taller**, con un método reproducible: componer el color sobre el fondo tomado del render y medir. Si un cambio futuro lo baja, se puede demostrar.
