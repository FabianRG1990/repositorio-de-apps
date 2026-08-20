# Acabado visual: qué hace que una lista densa se vea cara (Bitácora)

> Investigación del ticket [#72](https://github.com/FabianRG1990/repositorio-de-apps/issues/72) del mapa [#14](https://github.com/FabianRG1990/repositorio-de-apps/issues/14).
> Alimenta el ticket [#70](https://github.com/FabianRG1990/repositorio-de-apps/issues/70), donde se decide la base visual definitiva.
> Fecha: 2026-08-19. No hereda nada de `apps/bahia`.
>
> **Este documento empieza donde termina [#18](https://github.com/FabianRG1990/repositorio-de-apps/issues/18)** ([`diseno-premium-b2b.md`](./diseno-premium-b2b.md)). Escala tipográfica, contraste, áreas táctiles, espaciado, radios, densidad de fila y movimiento ya están fijados ahí con fuentes. Acá no se repiten: se ejercen.

---

## 1. Pregunta

#18 §7 cierra con un principio — _"lo premium en una herramienta operativa se construye por sustracción y por sistema"_ — y una tabla de ocho tensiones resueltas. El problema no es que falte teoría: es que `docs/prototypes/bitacora-temas.html` no la ejerce.

Cuatro preguntas concretas:

1. ¿Cómo se ve **hoy una pantalla real** de un producto de gestión operativa que se percibe moderno? No el sistema de diseño: el producto terminado.
2. ¿Qué hace, mecánicamente, que **una lista o tabla densa se vea cara y no barata**? Es el componente central de Bitácora ([ADR 0003](../../../apps/bitacora/docs/adr/0003-tablero-unico-y-un-responsable-por-orden.md): una sola lista ordenada por tiempo parado) y donde se juega la percepción entera.
3. **Inter Variable vs. Inter estática**: el peso 590 que pide #18 §4.6 solo existe en la variable. ¿Cuánto pesa, cómo se sirve offline, y vale la pena frente a 600?
4. **Micro-detalles que se notan sin verse**: sombras vs. escalones de superficie, foco de teclado, separar secciones sin líneas, radios anidados.

Y una quinta, que es la más accionable: **¿en qué puntos exactos el prototipo incumple lo que #18 ya decidió?**

---

## 2. Resumen ejecutivo

1. **El listón del rubro es bajo, y hay uno solo que lo levanta.** Mirados de primera mano: Shop-Ware sigue con **la misma pantalla que en abril de 2020** y su board no ordena por estado sino **por técnico**; Tekmetric no toca su Job Board desde marzo de 2023 y usa doce chips saturados con texto blanco; AutoLeap tiene el mismo estado en dos colores distintos en dos pantallas; Mitchell 1 **no es una web app**, es Windows Forms con la paleta de Office 2007 — y aun así su grilla mete **26 órdenes en pantalla a 21 px por fila**. **Shopmonkey es el único con design system real** (§4.2). Superar el listón cuesta tres cosas que ninguno hace: cuatro pasos de texto y tres de borde, **cero líneas entre filas**, y chips tintados claros en vez de rellenos saturados (§4.3).
2. **El "tiempo parado" como criterio de orden no lo hace nadie, y la referencia moderna lo respalda a medias.** Linear expone _"time in status"_ como propiedad de fila, textual en sus docs, **pero no deja ordenar por ella**; ninguno de los cinco productos de taller la expone siquiera. ADR 0003 la puso en el centro: es la decisión más diferenciadora del producto (§4.1).
3. **Todas las referencias modernas violan el contraste de borde que #18 declara obligatorio — y eso confirma a #18, no lo refuta.** Medido: Linear `#e9e8ea` da **1,221:1**, Vercel `#ebebeb` **1,192:1**, Notion `rgba(42,28,0,.07)` **1,149:1**, contra el objetivo de 4,5:1 (mínimo 3:1) de SC 1.4.11. Son productos de oficina. Lo copiable de ellos no es el borde suave: es que **casi no dibujan bordes** (§4.4).
4. **La lista cara se distingue por el estado de reposo, no por el estado activo.** Carbon especifica que el texto de una fila en reposo es `$text-secondary` y sus iconos `$icon-secondary`; **solo al hover y al seleccionar suben a `$text-primary` / `$icon-primary`**. La tabla en descanso es más callada que la fila que estás apuntando. Es el detalle más copiable de todos y el prototipo no lo hace.
5. **Un solo separador, horizontal, y del token más suave.** Carbon usa `border-bottom: $border-subtle` — solo abajo, nunca caja ni rejilla vertical. Linear va más lejos y lo dice en primera persona: su refresco redujo el número de separadores y suavizó su contraste, bajo el principio _"Structure should be felt not seen"_. **El prototipo pone `border: 1px` en las cuatro caras de cada fila** (línea 254): eso es una caja, y N cajas apiladas son una hoja de cálculo.
6. **Un escalón de superficie vale ~1,05:1 y eso alcanza.** Medido sobre los tokens publicados de Material 3: la escalera `surface-container-*` avanza de 2 en 2 tonos HCT en claro, es decir **1,05:1 por escalón**, **1,11:1** entre `surface` y `surface-container`, y **1,29:1** de punta a punta. En oscuro los pasos son desiguales (1,04 / 1,08 / 1,05 / 1,14 / 1,17) y el rango completo llega a **1,57:1**: hace falta más escalón en oscuro para el mismo efecto. El escalón ficha/fondo del prototipo mide **1,11:1** — está bien calibrado; lo que sobra es el borde que lo acompaña.
7. **Zebra: no.** Carbon la clasifica como _modifier_ cuyo propósito es _"make scanning horizontal information easier"_ — se justifica cuando hay que recorrer muchas columnas. La fila de Bitácora tiene cinco campos y un dato de vistazo dominante: no hay recorrido horizontal que asistir. NN/g sí la lista como ayuda válida, así que la decisión se toma por el caso de uso, no por dogma (§5.3).
8. **El encabezado pegajoso del prototipo es un fallo de accesibilidad nivel AA hoy.** WCAG 2.2 SC 2.4.11 _Focus Not Obscured (Minimum)_ exige que el componente enfocado no quede **enteramente** oculto por contenido del autor, y la técnica de fallo F110 nombra literalmente el encabezado pegajoso. El panel del prototipo es `position: sticky` (línea 88) y no hay `scroll-padding-top` en ningún lado.
9. **El foco de teclado moderno son dos anillos, y hay dos fuentes que convergen.** Chromium cambió su anillo por defecto en Chrome 83 a _un contorno negro grueso rodeado por un contorno blanco fino_; WCAG 2.2 SC 2.4.13 (AAA) pide un área equivalente a un **perímetro de 2 px** y **3:1 entre el estado enfocado y el no enfocado de los mismos píxeles**. `outline: 2px solid <oscuro>; outline-offset: 2px;` produce exactamente los dos anillos, porque el hueco del offset deja ver la superficie. El prototipo usa `outline: 3px` sin offset justificado (línea 267): fuera de la escala de #18 §6.4 y sin el anillo separador.
10. **Los radios anidados tienen una fórmula, y ya es API de plataforma.** `radio interno = radio externo − separación`. Apple la convirtió en tipo del sistema en WWDC25 (`ConcentricRectangle` en SwiftUI, que _calcula su radio restando el padding al del padre_). En CSS se hace con `calc()`. En la densidad C del prototipo el radio externo es 12 px con 16 px de padding: la fórmula da negativo, así que **todo lo anidado debe ir a esquina recta** — salvo las píldoras, que son otra forma.
11. **Inter Variable se sirve self-hosted, subseteada a `latin`, y pesa ~88 KB.** El archivo completo son 352 240 B; recortado al `unicode-range` `latin` con las features que el taller necesita queda en **87 544 B**, menos que una sola estática. Contra tres estáticas la variable pierde por 3,3 %, así que **el argumento de peso no decide**: lo que decide es que **590 no existe en ninguna estática**, y que **el build de Inter que sirve Google Fonts no trae `zero`, `ss02`, `cv05`, `cv08` ni `case`** — o sea, no trae el cero cortado que #18 §6.1 puso como razón para elegir Inter (§6). **Y el 590 se queda sin padrino:** rsms no dice en ninguna parte que corrija un salto óptico, y los 510/590/680 resultaron ser del **sitio de marketing** de Linear — **su aplicación usa 450 / 500 / 600 / 700** (§4.1, §6.6). Hay que elegir 590 o 600 mirándolos en pantalla, no citando a nadie.
12. **#18 §6.1 recomienda una propiedad que la especificación CSS desaconseja.** `font-feature-settings: "zero" 1` está explícitamente en la tabla de "no usar" de CSS Fonts 4 §6.12: _"Authors should not use `font-feature-settings` to set any of the font features in the table below"_, y la tabla mapea `zero` → `font-variant-numeric: slashed-zero` y `tnum` → `font-variant-numeric: tabular-nums`. Corrección a #18 (§7.5).
13. **La auditoría del prototipo encontró 40 incumplimientos** de lo que #18 §6 y §7 ya decidieron, más allá de los tres que el ticket había detectado (§8). Los cuatro más caros: el borde-caja por fila; que **todo el CSS está en `px` y no en `rem`**, lo que hace imposible cumplir SC 1.4.4 (200 %) que #18 exige explícitamente; que **el medidor de contraste del propio prototipo está calibrado contra el mínimo tolerado (4,5:1 / 3:1) en vez de contra el objetivo declarado (7:1 / 4,5:1)**, con lo que oculta que el texto secundario en tema claro da 6,82:1 y no llega; y que **el cero cortado que el CSS pide correctamente no se está renderizando**, porque el build de Inter que sirve Google Fonts no trae la feature `zero` (§6.3).

---

## 3. Convenciones

Las mismas de #18 §3. Todo en píxeles CSS salvo donde se diga. Las relaciones de contraste son WCAG 2.x (`(L1+0,05)/(L2+0,05)`) y las calculadas en este documento se marcan como **[medido]** con el método al lado. Los tonos HCT de Material 3 se convierten a luminancia por la relación estándar CIE L\*→Y (`Y = ((L+16)/116)³`), que es la que usa HCT para su eje de tono.

---

## 4. Cómo se ve hoy una pantalla real

#18 citó sistemas de diseño. Esta sección cita **productos terminados**, con valores leídos del CSS de producción o **medidos sobre el DOM renderizado** (Chromium 1440×900 @2×, `getComputedStyle`). Cada cifra dice de dónde salió.

### 4.1 Productos de gestión operativa

#### Linear — la app, no el sitio de marketing

Son dos hojas de estilo distintas y **no dicen lo mismo**. La del producto vive en `static.linear.app/client/assets/Root-DmGSVrXS.css` (482 KB, 7 976 clases StyleX) más `ThemeProvider.KvoQ0Edx.js` y `mixins.stylex.BjLBTeSX.js`; la del sitio, en `static.linear.app/web/_next/static/css/index.*.css`.

**Escala tipográfica de la app** (clases StyleX resueltas contra el CSS):

| Nombre interno            | Tamaño                 | Interlineado           | Peso            |
| ------------------------- | ---------------------- | ---------------------- | --------------- |
| `micro` / `microPlus`     | 0,6875 rem = 11 px     | `normal`               | 450 / 500       |
| `mini` / `miniPlus`       | 0,75 rem = 12 px       | `normal`               | 450 / 500       |
| `small` / `smallPlus`     | 0,8125 rem = 13 px     | `normal`               | 450 / 500       |
| `regular` / `regularPlus` | 0,9375 rem = **15 px** | **1,4375 rem = 23 px** | 450 / **600**   |
| `large` / `largePlus`     | 1,125 rem = 18 px      | `normal`               | 450 / 500       |
| `title3`                  | 1,25 rem = 20 px       | `normal`               | 500, `-0,01rem` |
| `title2`                  | 1,5 rem = 24 px        | 2 rem                  | 500, `-0,01rem` |
| `title1`                  | 2,25 rem = 36 px       | 2,875 rem              | 450             |

**Corrección importante a #18 §4.6.** Los pesos **510 / 590 / 680** son del **sitio de marketing**. El `:root` de la **app** declara otra cosa: `--font-weight-light: 300; --font-weight-normal: 450; --font-weight-medium: 500; --font-weight-semibold: 600; --font-weight-bold: 700`. Es decir: **el producto que #18 puso como referencia de densidad no usa 590 en su interfaz.** Usa 450 de cuerpo y 600 de énfasis. Ver §9 para la resolución.

**Tokens de movimiento de la app** (cita textual del `:root`):

```css
--speed-highlightFadeIn: 0s;
--speed-highlightFadeOut: 0.15s;
--speed-quickTransition: 0.1s;
--speed-regularTransition: 0.25s;
--speed-slowTransition: 0.35s;
--shadow-none: 0 0 0 0 transparent;
```

**La asimetría que #18 §6.8 adoptó está confirmada en el CSS del producto, no solo del sitio.** Y los 100 ms de `quickTransition` coinciden con el presupuesto de Superhuman (§4.1, más abajo) sin que ninguno cite al otro.

**Tres patrones de producción que valen tal cual para Bitácora:**

1. **El hover está condicionado a que exista puntero fino, y `:active` vive fuera de esa condición.**

   ```css
   .sx-bprzre:active {
     background-color: var(--sx-1gakdvt);
   }
   @media (any-hover: hover) and (any-pointer: fine) {
     .sx-bprzre:hover {
       background-color: var(--sx-1gakdvt);
     }
   }
   ```

   En la tableta del taller no hay hover pegado; hay estado _pressed_ — que es justo el `:active` que al prototipo le falta (§5.8, B11).

2. **La selección de fila no usa `border`: usa sombra interior.** `box-shadow: 0 0 0 1px var(--bgSelectedBorder) inset` sobre `background: var(--bgSelected)`. **No hay salto de layout** al seleccionar, que es lo que pasa si se añade un borde de 1 px a una fila que no lo tenía.

3. **Redondeo antiblur del tipo en pantallas no retina** — relevante porque el monitor de recepción de un taller rara vez es 2×:

   ```css
   @supports (font-size: round(up, 1rem, 1px)) {
     @media not all and (min-resolution: 192dpi) {
       :root {
         --font-size-micro: round(up, 0.6875rem, 2px);
       }
     }
   }
   ```

   Y `html, body { touch-action: pan-x pan-y; }`, que mata el doble-tap-zoom.

**El vocabulario de tokens de la app** es, textualmente, el diccionario que necesita una lista densa: fondos `bgSub / bgBase / bgShade / bgSelected / bgFocus` (cada uno con su `…Hover`); bordes `bgBorder / bgBorderFaint / bgBorderSolid / bgBorderStrong`, cada uno × `Hover` × `Thin` × variante alfa, más `bgSelectedBorder`; **texto en cuatro pasos: `labelTitle` › `labelBase` › `labelMuted` › `labelFaint`**; controles en tres niveles (`controlPrimary/Secondary/Tertiary`, cada uno con `…Label`, `…Hover`, `…Selected`); y por matiz, siete pasos fijos (`Bg`, `Base`, `BaseHover`, `Mid`, `Text`, `Foreground`, `Tint`).

> **Límite honesto:** los `--sx-…` que respaldan esos nombres están **declarados vacíos** en el CSS (`--sx-1gakdvt: ;`); Linear los rellena en runtime con su generador LCH. **Los hex de la app no se pueden leer.** Concuerda con lo que ellos mismos publican: _"we kept using LCH for our theme generation, as it is one of the closest color spaces to the human eye"_.

**La paleta que sí es legible es la del sitio** (`index.CtQdVDoA.css`), y es la lección de densidad más transferible del lote — **cuatro pasos de texto, tres de borde, cuatro de fondo, y ni uno más**:

```
claro   bg  #fff · #f8f8f8 · #f4f4f4 · #f0f0f0
        fg  #282a2f · #3c4149 · #6f6e77 · #86848d
        bd  #e9e8ea · #e4e2e4 · #dcdbdd
oscuro  bg  #08090a · #0f1011 · #141516 · #191a1b
        fg  #f7f8f8 · #d0d6e0 · #8a8f98 · #62666d
        bd  #23252a · #34343a · #3e3e44
marca   #5e6ad2 (claro) / #7070ff (oscuro) · acento #7170ff
radios  4 · 6 · 8 · 12 · 16 · 24 · 32 · 9999
--border-hairline: 1px  →  0.5px  bajo @media (min-resolution: 192dpi)
```

**Medido en el DOM de `linear.app`** (maqueta de marketing, pero construida en HTML/CSS con los tokens y la fuente reales): ítem de barra lateral **28 px** de alto, `padding: 0 6px`, `gap: 8px`, `border-radius: 6px`, `font: 510 13px "Inter Variable"`, color `#d0d6e0`; ítem de lista de sección **28 px** (13/19,5); lista densa de "Initiatives" **24 px** el padre y **19,5 px** los hijos, con `padding-left: 26px`; **sin separadores dentro del grupo** y una sola hairline **entre grupos**.

**Y el hallazgo que valida directamente el modelo de Bitácora.** La documentación de opciones de vista de Linear enumera las propiedades que una fila puede mostrar, y ahí está, textual:

> _"Show or hide issue properties such as ID, status, assignee, priority, SLA, project, due date, milestone, cycle, release, estimate, labels, links, customers, customer revenue, **time in status**, created date, updated date, pull requests and commits, and Sentry issues."_

**"Tiempo en estado" es propiedad de primera clase de la lista de Linear.** Es exactamente el _tiempo parado_ del glosario. La diferencia: Linear lo ofrece como **columna opcional** y su menú de `Ordering` (`Status, Manual, Priority, Last created, Last updated, Due date, Link count`) **no permite ordenar por él**. Bitácora lo hace criterio de orden por defecto (ADR 0003) — es una decisión más agresiva que la de la referencia, y sostenible: en un taller el tiempo parado _es_ el dolor.

#### Vercel Geist — la tabla, medida en vivo

Medido sobre `vercel.com/geist/table` renderizada:

| Elemento              | Valor                                                            |
| --------------------- | ---------------------------------------------------------------- |
| Fila de datos         | **40 px** de alto, 14/20 px, color `rgb(77,77,77)`               |
| Fila de cabecera      | **36 px**, `border-bottom: 1px solid #ebebeb` (`--ds-gray-400`)  |
| **Tabla básica**      | **sin separadores entre filas** — solo la línea bajo la cabecera |
| Variante _striped_    | `nth-child(odd)` → `--ds-background-200` = **`#fafafa`**         |
| Variante _bordered_   | `[&_tr:not(:last-child)]:border-b` → alto 41 px (40 + 1)         |
| Tabla de prosa (docs) | fila **56 px** con `border-bottom` y `cursor: copy`              |

Y del `:root`, leído en vivo:

```
--ds-background-100 #fff · --ds-background-200 #fafafa
--ds-gray-400 hsla(0,0%,92%) = #ebebeb
--ds-focus-color hsla(212,100%,48%)
--ds-focus-ring   0 0 0 2px hsla(0,0%,100%), 0 0 0 4px hsla(212,100%,48%)
--ds-shadow-border 0 0 0 1px #00000014, 0 0 0 1px hsla(0,0%,98%)
```

Dos lecturas:

- **El design system del dashboard de Vercel no dibuja líneas entre filas por defecto.** La separación la hacen el ritmo de 40 px y el peso del texto; zebra y bordes son variantes _opt-in_. Es el mismo veredicto de §5.2, llegando por otro camino.
- **`--ds-focus-ring` es literalmente el patrón de dos anillos de §7.2**, escrito con `box-shadow`: 2 px blancos por dentro, 2 px de azul por fuera. Confirma la receta con un producto en producción.

#### Notion — medido en una base de datos publicada

Sobre una base real de 283 filas: **alto de fila exactamente 37 px**, constante en las 26 filas visibles; separador `border-bottom: 1px solid rgba(42, 28, 0, 0.07)` — **hairline alfa de tinte cálido**, que sobre blanco resuelve a `#f0efed`; texto `#2C2C2B`, un negro cálido, no `#000`. Sin zebra y sin bordes verticales entre columnas.

La documentación confirma que **no existe ajuste de alto de fila**: la densidad se gobierna por `Wrap text` por propiedad — _"If your cells contain a lot of content, you can wrap the content to make it appear across multiple lines."_ Una sola perilla, y es de contenido, no de espaciado.

> El `font-size` computado que se leyó (16 px) es el heredado del contenedor de celda; el texto real se pinta más chico en spans internos y **no se verificó**. No usar ese número.

#### Retool — los presets que nadie más publica

Documentación oficial: _"You can use the **Row height** setting to adjust the height of table rows."_ Presets: **X-Small 20 px · Small 32 px · Medium 48 px · Large 60 px · Dynamic** (se ajusta al contenido). No documentan padding de celda ni densidades nombradas tipo _compact/comfortable_.

Para Bitácora es el contrapunto útil: la escalera de #18 §6.5 (**56 / 72 / 96**) empieza donde la de Retool termina, porque la de Retool es de puntero y la nuestra de dedo con guante.

#### Superhuman — el presupuesto de 100 ms, textual

> _"The 100ms rule states that every digital interaction should be faster than 100ms."_
> _"The concept comes from Gmail creator Paul Buchheit, who said that 100ms is the threshold 'where interactions feel instantaneous'."_
> _"That's why Superhuman Mail treats the 100ms rule as the maximum, and actually aims for latency less than 50ms whenever possible."_
> _"But our new renderer is so fast, it can show emails in 1-2 Chrome frames! (<32 ms)"_

Tres fuentes independientes convergen en el mismo número: **MIL-STD-1472F §5.4.6.4** (respuesta del display ≤ 100 ms, vía #18), **`--speed-quickTransition: 0.1s`** de Linear, y la regla de Superhuman. El presupuesto de 100 ms de #18 §6.8 no es una elección de estilo.

#### Height — no verificado

`height.app` corta la conexión contra Chromium (`ERR_CONNECTION_RESET`) y `WebFetch` devuelve `ECONNRESET`; su página de features renderiza en blanco. **No hay un solo valor ni una captura de primera mano.** Lo único disponible son resúmenes de terceros, que no cuentan. **No se reporta nada de Height.**

### 4.2 El rubro: cinco productos de taller, mirados de verdad

Todo lo de abajo sale de capturas oficiales descargadas y examinadas, y de muestreo de píxel. **Ninguno de los cuatro sistemas de taller expone su CSS de producción** — Tekmetric responde 403 por WAF, AutoLeap falla en DNS, Shop-Ware exige OAuth y Mitchell 1 ni siquiera es web. Shopmonkey es la excepción.

#### Tekmetric — kanban de tres columnas fijas

_"Tekmetric's Job Board categorizes 'Active' repairs into three buckets: 'Estimates,' 'Work-in-Progress,' and 'Completed.'"_ Verificado en captura con contadores `Estimates (4) · Work-In-Progress (17) · Completed (5)`.

Su modelo de dominio separa dos cosas que suelen confundirse, y lo dice textual: _"Labels are column-specific… whereas statuses are dynamic and rely on a combination of user input and automation… labels are configurable… while statuses cannot be changed."_ Con límites duros: _"Labels can only be a max length of 22 characters"_ y _"You can only have 20 labels per workflow column."_

Densidad medida sobre captura retina de 2606×1840: tarjeta **151 px CSS**, gap **13 px**, chip de etiqueta **26 px**, barra superior **56 px**, borde `#D0D0D0`. **~6 tarjetas por columna.** Sus 16 colores de etiqueta, muestreados uno a uno del propio selector, son **rellenos sólidos saturados con texto blanco**: `#D2362C #DE623A #CC857A #E78D3B #F2BA42 #8EA441 #449252 #418B97 #3F84E1 #21497C #595AC4 #725EB5 #2B2B2B #586C77 #8F9CA4 #FFFFFF`.

Su changelog oficial no registra **un solo cambio en el Job Board desde marzo de 2023**. **Se ve de ~2019-2021:** sin gradientes ni biseles, radios de 6-8 px y hairlines correctas, pero iconos multicolor tipo emoji en la barra de herramientas mezclados con iconos de línea, doce chips saturados compitiendo entre sí, e inconsistencia interna (en pantallas nuevas ya usan chip tintado claro). Y sus páginas de _features_ **no muestran ni una captura del producto**.

#### Shopmonkey — el listón visual del rubro

_"View the workflow in three different ways: Columns, List, or Parts & Tires."_ · _"Edit, add, delete, and rearrange columns to work for your shop."_ Columnas por defecto: `Estimates · Dropped Off · In Progress · Invoices`.

**La decisión de modelo más interesante del rubro** es que separan estado de columna, y lo dicen: _"For reporting, an order can only have one status at a time: **estimate, repair order, or invoice**."_ Las columnas son categorías del taller; el estado es un enum de tres valores. Bitácora hace algo equivalente por otra vía: una sola lista y la Especialidad como filtro (ADR 0003).

**Y tienen densidad configurable, con las mismas palabras que el ticket #70:** _"View Workflow Cards… in a customizable **Standard** or **Condensed** view"_, con **quince campos conmutables** por vista (`Tags, Vehicle, VIN, License Plate, Customer/Fleet, Phone Number, Service Writer, Due Date, Technicians, Notes, Appointments, Inspections, Authorization Status, Amount, Amount Due`). La tarjeta _Standard_ mide ~480-520 px (**estimado por reescalado, confianza media**) con la foto del vehículo ocupando ~38 %: **dos tarjetas por columna**. El alto de la _Condensed_ no se pudo verificar.

Su CSS de producción sí es accesible (`blob-cdn.shopmonkey.cloud/…/_next/static/css/…`, 780 KB, Next.js + Tailwind con paleta propia): `blue-500 #4A65FF` — **no** el `#3B82F6` de fábrica —, rampa `gray-50 #F7F8FC` … `gray-900 #1D2030` con un medio-paso `gray-850 #25283C`, tokens semánticos (`--color-danger`, `--color-info-success`) y escala de radios de 2 a 52 px. Verificación cruzada: el icono de "pagado" muestreado de la captura da `#4B65FF`, que es el `blue-500` del CSS. **Sin modo oscuro** (tres ocurrencias de `dark:` en 780 KB).

Publican notas de versión **mensuales e ininterrumpidas** de enero de 2025 a julio de 2026. De mayo de 2026, textual: _"headers within Lists and Reports are frozen to the top of the page"_ · _"inactive orders are called out with orange borders"_.

**Se ve de ~2024-2026.** Design system real y verificable, fondo frío `#F7F8FC`, iconografía de línea monocroma consistente, **chips tintados claros con texto oscuro** (no rellenos saturados), control segmentado tipo Linear y una vista de lista que es una tabla ordenable de verdad. **Es el listón que Bitácora tiene que superar.**

#### AutoLeap — kanban de tres columnas más lista de OR

Selector `Kanban | RO list | Partstech list`; columnas `Estimate - 32`, `In Progress - 14`, `Invoiced - 24`; filtros por `Search RO, Authorization, Technicians, Aging, RO Tags, Customer tag`. Textual: _"You can create and add custom columns to your workboard that reflect your auto shop's process."_

Hex muestreados: navegación de marca `#00C19D`, fondo `#FCFCFC`; píldoras `Completed #23B66A`, `in progress #1C6CE3`, `Urgent #EA4011`, `Medium #6F6E82`, `Ordered #D59B43`. **Inconsistencia detectada:** `Urgent` es `#EA4011` en la tabla de servicios y `#1EA765` (verde) en la tarjeta del kanban; y `in progress` va en minúscula mientras `Completed` capitaliza. Sus alturas de fila **no son reportables**: las capturas son renders de marketing reescalados.

**Se ve de ~2022, competente.** Sin gradientes ni esqueuomorfismo, con arrastre, avatares e iconos de línea; pero barra de navegación verde saturada a todo el ancho (patrón de 2019-2021), diez ítems de navegación de primer nivel más seis filtros simultáneos, y tokens de estado inconsistentes.

#### Shop-Ware — el board no es por estado: es por técnico

El hallazgo más contraintuitivo del rubro, verificado en tres capturas oficiales. La pantalla `JOBS IN THE SHOP` tiene cuatro pestañas (`My Jobs | Workflow | Open Jobs | Closed Jobs`), y en `Workflow` **las columnas son nombres de personas** — `Koreen`, `Clint`, `Andrew (out)`, `Joe`, `Tim` — con conteo de autos y puntos de carga horaria, más widgets `61% Daily Workload` / `12% Weekly Workload`. **El estado va como etiqueta de texto dentro de la tarjeta.**

> **Corrección de una fuente que circula:** la frase _"each column represents a status in the repair process"_ se atribuye a Shop-Ware en varios sitios; se rastreó a la base de conocimiento de **otro producto** (Bolton Technology). No aplica.

Nueve estados observados en la tabla `Open Jobs`: `Checked In`, `Inspecting/Diagnosing`, `Continued Diagnostic`, `Needs Estimate`, `Waiting for Approval`, `Parts On Order`, `Parts here -`, `Quality Control`, `Completed/Customer Needs to be Contacted`.

**Alto de fila medido: 51 px de paso, constante** (51/52/51/50/52/51…), dos líneas por fila, **sin zebra**, cabecera `#FAFAFA`. Colores muestreados: barra lateral `#253239`→`#20332A`, botón primario `#3D99BD`, tarjeta `#E7E7E7` **gris sobre página blanca** (el inverso de la convención actual), etiquetas `Loaner #0006FF`, `Priority #F5191B`, `New Customer #69CC63`. **`#0006FF` es azul puro de monitor: la firma de una interfaz sin tokens de color.**

Comparado con la captura archivada de abril de 2020: **misma pantalla, mismo título, mismas cuatro pestañas, mismas tarjetas grises, mismo naranja de alerta.** Lo único agregado en más de cinco años son los puntos de carga, las donas de _workload_ y un `RO Quickview`. Su canal público de producto lleva trece meses sin actualizar. **Se ve de ~2016: bien construido y congelado.**

#### Mitchell 1 Manager SE — no es una web app, es Windows Forms

Verificado sobre las capturas del PDF oficial de entrenamiento (versión demo 9.x, ©2024). Barra de título nativa, menú `File Edit View Configurations Utilities Inventory History Training Videos CRM Help`, barra de iconos coloridos, **navegador tipo VCR** (`|◀ ◀◀ ◀ Record 13 of 39 ▶ ▶▶ ▶| ✓ ✗`), barra de estado con la versión `9.1.0.3253`, y diálogos con **disquete** para guardar y **bote de basura** para borrar.

La grilla WIP tiene **dieciséis columnas** (`Type | Number | Recalls | Messages | Customer | License | Color | Vin | Vehicle | MPI Progress | Sched | Promised | RO Prn | Inv Prn | Status | Time In`), con `Status` como combo editable en línea. **Alto de fila medido: 21 px exactos** (separadores en y = 147, 168, 189, 210, 231…): **~26 órdenes en pantalla, 2,4× más denso que Shop-Ware.** El texto _"Drag a column header here to group by that column"_ es el literal por defecto del `XtraGrid` de DevExpress.

Colores muestreados: grilla en el tema _Yellow_ `#FFFFA5` (el histórico por defecto), líneas `#D9DAE0`, cabecera `#F3F4F5`, fila seleccionada `#E2EAFD`, `Waiting For Parts` **`#4F81BD`**, `Customer Waiting` **`#C0504D`**. **Esos dos últimos son literalmente Accent 1 y Accent 2 del tema por defecto de Office 2007.** El anuncio de la 8.5.1 dice, textual: _"By request we have added a **Dark Theme** option to the menu."_ y _"Users may select from **8.5 to 14 font size**"_ — el modo oscuro llegó en **diciembre de 2024**, y el tamaño de fuente se expresa en **puntos**.

**El juicio justo no es "se ve de 2012": es una aplicación de escritorio Win32 real con paleta de Office 2007.** Y el contrapeso importa: funcionalmente su grilla es potentísima — 21 px por fila, edición en línea, orden múltiple, filtro por columna, agrupación arbitraria, `Ctrl+F`. **Un asesor con oficio hace más por segundo ahí que en el kanban de AutoLeap.** La deuda es estética y de plataforma, no de capacidad. Es exactamente el usuario al que Bitácora le va a pedir que cambie: si la app nueva es más bonita y más lenta de operar, pierde.

### 4.3 El listón, en una tabla

| Producto            | Patrón                        | Alto de fila                   | Separadores                | Modernidad       |
| ------------------- | ----------------------------- | ------------------------------ | -------------------------- | ---------------- |
| **Linear** (medido) | lista                         | 24 / 19,5 px · lateral 28 px   | **ninguno intra-grupo**    | referencia 2026  |
| **Vercel Geist**    | tabla                         | **40 px** (cabecera 36)        | **ninguno** por defecto    | referencia 2026  |
| **Notion**          | tabla                         | **37 px**                      | `1px rgba(42,28,0,.07)`    | referencia       |
| **Retool**          | tabla                         | 20 / 32 / 48 / 60 configurable | —                          | referencia       |
| Mitchell 1          | grilla WinForms               | **21 px**                      | rejilla completa `#D9DAE0` | escritorio Win32 |
| Tekmetric           | kanban 3 columnas fijas       | tarjeta 151 px                 | —                          | ~2019-2021       |
| Shop-Ware           | board **por técnico** + tabla | **51 px** (2 líneas)           | sin zebra                  | ~2016, congelado |
| Shopmonkey          | kanban de columnas libres     | tarjeta ~500 px (Standard)     | —                          | **~2024-2026**   |
| AutoLeap            | kanban 3 columnas + lista     | no reportable                  | —                          | ~2022            |

**Tres cosas superan el listón del rubro sin esfuerzo, porque ninguno de los cinco las hace:**

1. **Cuatro pasos de texto y tres de borde, nada más.** Los cuatro sistemas de taller tienen doce o más colores de estado compitiendo.
2. **Sin líneas entre filas.** El ritmo de la altura de fila y el peso del texto hacen la separación (§5.2). Shop-Ware y Mitchell 1 dibujan rejilla completa.
3. **Chips de estado tintados claros con punto de color**, no rellenos saturados con texto blanco. Solo Shopmonkey lo hace.

Y una cuarta que ni siquiera está en el rubro: **el tiempo en estado como criterio de orden**. Linear lo tiene como propiedad de fila pero no ordena por él; ninguno de los cinco sistemas de taller lo expone. ADR 0003 lo puso en el centro.

### 4.4 Dónde las referencias contradicen a #18 — con números

Esto no se esconde. Se midieron los tokens publicados de Linear (los del sitio, que son los únicos legibles), los de Vercel y el separador de Notion, contra los objetivos duros de #18 §6.2:

| Valor de la referencia                              | Contraste **[medido]** | Objetivo de #18 §6.2  | Veredicto                      |
| --------------------------------------------------- | ---------------------- | --------------------- | ------------------------------ |
| Linear `border-primary #e9e8ea` sobre `#fff`        | **1,221:1**            | 4,5:1 (mínimo 3:1)    | **Falla por un factor de 2,5** |
| Linear `border-tertiary #dcdbdd` sobre `#fff`       | **1,380:1**            | 4,5:1                 | Falla                          |
| Vercel `--ds-gray-400 #ebebeb` sobre `#fff`         | **1,192:1**            | 4,5:1                 | Falla                          |
| Notion `rgba(42,28,0,.07)` ⇒ `#f0efed` sobre `#fff` | **1,149:1**            | 4,5:1                 | Falla                          |
| Vercel zebra `#fafafa` sobre `#fff`                 | 1,044:1                | —                     | Es un escalón, no un borde     |
| Linear `fg-tertiary #6f6e77` sobre `#fff`           | **5,03:1**             | **7:1** (texto/datos) | Falla                          |
| Linear `fg-quaternary #86848d` sobre `#fff`         | **3,68:1**             | 7:1                   | Falla                          |
| Linear `fg-secondary #3c4149` sobre `#fff`          | 10,27:1                | 7:1                   | Pasa                           |
| Linear marca `#5e6ad2` sobre `#fff`                 | 4,70:1                 | 4,5:1                 | Pasa raspando                  |

**Lectura, y es la conclusión de la sección:**

- **Todos los bordes de todas las referencias violan SC 1.4.11.** #18 §6.2 regla 1 lo había anticipado (_"el `#E5E7EB` sobre blanco que es el cliché del SaaS moderno da ~1,2:1"_) y acá queda confirmado con cuatro productos distintos. **La regla de #18 se sostiene: son productos de oficina, no de piso de taller.** Lo que sí se puede copiar de ellos es la otra mitad de la jugada — que **casi no usan bordes**.
- **La escalera de cuatro pasos de texto de Linear no cabe en el objetivo de 7:1.** Sus pasos 3 y 4 dan 5,03:1 y 3,68:1. Es decir: **Bitácora puede tener el patrón de §5.1 (reposo un paso por debajo del apuntado) pero solo con dos pasos, no con cuatro**, y ambos por encima de 7:1. El paso se compra subiendo el primario, no bajando el secundario.
- **Los escalones de superficie de Linear son todavía más chicos que los de M3.** Medidos: claro `1,062 / 1,036 / 1,036` y rango total **1,140:1**; oscuro `1,046 / 1,042 / 1,049` y rango total **1,143:1**. Contra el 1,29 / 1,57 de M3 (§7.1). **Y a Linear le alcanza para separar cuatro planos.** Confirma que un escalón de ~1,04-1,06:1 es suficiente y que **el prototipo, con 1,11:1 de escalón, va sobrado** — puede quitar el borde sin miedo.
- **Linear mantiene el mismo rango de superficies en claro y en oscuro** (1,140 vs. 1,143), donde M3 lo abre de 1,29 a 1,57. Son dos estrategias distintas y no hay que mezclarlas: si Bitácora sigue a Linear, el tema oscuro necesita compensar por otro lado; si sigue a M3, abre los pasos altos. **Decidirlo en #70, no dejarlo al azar de la rampa OKLCH.**

---

## 5. Qué hace que una lista densa se vea cara y no barata

Esta sección es el núcleo. Nueve mecanismos, cada uno con su fuente y su traducción a Bitácora.

### 5.1 El reposo es más callado que lo apuntado

Carbon publica la tabla de color del `data-table` estado por estado, y el hallazgo está en la primera fila:

| Estado de la fila | `background-color`      | `text-color`      | `svg`             |
| ----------------- | ----------------------- | ----------------- | ----------------- |
| Enabled           | `$layer`                | `$text-secondary` | `$icon-secondary` |
| Hover             | `$layer-hover`          | `$text-primary`   | —                 |
| Selected          | `$layer-selected`       | `$text-primary`   | `$icon-primary`   |
| Selected + hover  | `$layer-selected-hover` | —                 | —                 |
| Zebra             | `$layer-accent`         | —                 | —                 |

Fuente: [Carbon — Data table / Style](https://carbondesignsystem.com/components/data-table/style/), leída el 2026-08-19 (la página declara _"Last updated 13 August 2026"_).

**El texto de una fila en reposo no es el texto primario.** Sube a primario únicamente cuando el puntero está encima o la fila está seleccionada. Es lo que produce la sensación de que la tabla "responde": no es el cambio de fondo, es que la fila apuntada se **oscurece tipográficamente** mientras el resto se mantiene un paso atrás.

Es también lo que evita el efecto "muro": veinte filas de texto primario a 7:1 apiladas se leen como una pared. Veinte filas a un paso de distancia con una que sube al frente se leen como una lista.

**Para Bitácora:** el texto de la fila en reposo va en el paso secundario de la rampa; el dato de vistazo (tiempo parado) y el título (vehículo + placa) suben al primario en `:hover`, `:focus-visible` y en la fila seleccionada. Ojo con la restricción del taller (#18 §5.1): el "secundario" de Bitácora debe seguir cumpliendo el objetivo de 7:1, no el 4,5:1 de Carbon — el paso se compra en el primario, subiendo, no en el secundario, bajando.

> **Contra-nota de confianza:** que este patrón sea causa de la percepción de calidad es **inferencia de este documento**, no afirmación de Carbon. Lo que Carbon publica es la tabla de tokens; la lectura de por qué funciona es interpretación. Confianza media.

### 5.2 Un solo separador, horizontal, y del token más suave

Carbon: la fila lleva `border-bottom: $border-subtle` y **nada más**. No hay borde superior, ni laterales, ni reglas verticales entre columnas. La separación entre columnas es `padding: 16px`, no línea.

Linear lo dice en primera persona en su bitácora de diseño ([_A calmer interface for a product in motion_](https://linear.app/now/behind-the-latest-design-refresh)):

> _"Borders and separators help clarify the relationship between elements in the interface… By rounding out their edges and softening the contrast, the polished interface gives users structure on the page without cluttering their view."_

Y enuncia dos principios que son directamente aplicables:

> _"Don't compete for attention you haven't earned."_
> _"Structure should be felt not seen."_

El refresco consistió, entre otras cosas, en **reducir el número de separadores**. En la entrega anterior ([_How we redesigned the Linear UI (part II)_](https://linear.app/now/how-we-redesigned-the-linear-ui)) explican por qué pueden permitírselo: pasaron el sistema de color a LCH, _"which has the benefit that it's perceptually uniform"_, y eso les permitió _"deal with different elevations for our surfaces (e.g. background, foreground, panels, dialogs, and modals)"_. **Es decir: sustituyeron línea por elevación de superficie, y lo que lo hizo posible fue un espacio de color uniforme en luminosidad.** El prototipo de Bitácora ya generó su rampa en OKLCH exactamente por esa razón (líneas 26-31 y 739-743) — tiene el instrumento y no lo usa.

**La regla operativa:**

- Cero bordes verticales entre columnas. Nunca. El grid vertical es el rasgo definitorio de la hoja de cálculo.
- Como máximo **un** separador horizontal, `border-bottom`, y solo si el escalón de superficie no alcanza.
- **Nunca borde en las cuatro caras.** Una fila con caja es una tarjeta; N tarjetas apiladas y pegadas son una tabla dibujada a mano.

**Defecto del prototipo:** `.fila { border: 1px solid var(--bd-soft) }` (línea 254) es exactamente la caja, y `margin-top: -1px` en la densidad compacta (línea 388) es el truco para colapsar los bordes de cajas adyacentes. Con superficie no hace falta ninguno de los dos.

### 5.3 Zebra: la decisión se toma por caso de uso, y acá es "no"

Las dos fuentes no dicen lo mismo, y conviene declararlo.

- **Carbon** la clasifica como modificador y le da un propósito concreto: _"The data table can use a zebra stripes modifier to style the table rows with alternating colors to **make scanning horizontal information easier** for the user."_ ([Data table / Usage](https://carbondesignsystem.com/components/data-table/usage/))
- **NN/g** la lista sin reservas entre las ayudas visuales: _"**Borders**, **zebra striping**, and **hover-triggered highlighting** of a record can all help."_ ([Data Tables: Four Major User Tasks](https://www.nngroup.com/articles/data-tables/))

El criterio que las reconcilia es el de Carbon: la zebra sirve para **no perder la fila mientras el ojo recorre horizontalmente**. Eso pasa cuando hay muchas columnas y el dato que buscás está lejos del identificador.

**La fila de Bitácora no es ese caso.** Tiene cinco campos, un dato de vistazo dominante a la izquierda (el tiempo parado, que además es el criterio de orden) y un ancho de 1296 px como máximo (#18 §6.6). No hay recorrido horizontal que asistir. Además la zebra en Carbon se pinta con `$layer-accent` — el **mismo** token que el fondo del encabezado de columna —, lo que en una rampa de superficies de tres pasos consume un paso entero solo para decorar.

**Decisión: no hay zebra.** Se sustituye por lo que #18 ya pide: escalón de superficie ficha/fondo, separación vertical entre filas en las densidades cómoda y amplia, y hover.

### 5.4 Los números: cifras tabulares, y dónde va cada alineación

La especificación es clara sobre el mecanismo. CSS Fonts 4 §6.7 define `tabular-nums` como _"Enables display of tabular numerals (OpenType feature: `tnum`)"_ y `slashed-zero` como _"Enables display of slashed zeros (OpenType feature: `zero`)"_ ([CSS Fonts Module Level 4, §6.7](https://drafts.csswg.org/css-fonts-4/#font-variant-numeric-prop)).

Lo que hacen las cifras tabulares es dar a todos los dígitos **el mismo avance**. Eso tiene dos consecuencias que se ven aunque no se noten:

1. Una columna de números queda alineada por posición aunque esté alineada a la izquierda.
2. **Un número que cambia en su lugar no mueve nada a su alrededor.** En Bitácora esto es central: el tiempo parado es un contador vivo. Sin `tnum`, pasar de `9h` a `10h` empuja el resto de la fila.

La regla de alineación, que es convención tipográfica antes que de UI: **el texto se alinea a la izquierda, la cantidad comparable se alinea a la derecha**, para que las unidades queden bajo las unidades. Cuando el número es un identificador y no una cantidad (folio, placa, VIN) la alineación es a la izquierda, porque se lee como palabra. **Ninguna de las fuentes primarias consultadas publica una regla explícita de alineación numérica:** ni la página de estilo del `data-table` de Carbon ni el artículo de tablas de NN/g se pronuncian sobre el tema. **Confianza media: es convención tipográfica documentada por uso, no por norma.**

Aplicación a Bitácora:

| Campo                           | Alineación | Cifras                                           |
| ------------------------------- | ---------- | ------------------------------------------------ |
| Tiempo parado (dato de vistazo) | izquierda  | `tabular-nums` — es contador, cambia en su sitio |
| Folio (`A1-2418`)               | izquierda  | `tabular-nums slashed-zero` — es identificador   |
| Placa (`863 549`, `TSJ 1204`)   | izquierda  | `tabular-nums slashed-zero` — es identificador   |
| Horas facturadas / reales       | derecha    | `tabular-nums` — es cantidad comparable          |
| Monto                           | derecha    | `tabular-nums`                                   |

**Defecto del prototipo:** el `.tiempo` y el `.folio` sí llevan `tabular-nums slashed-zero` (líneas 273 y 287), pero **la placa se renderiza dentro de `.titulo`** (línea 854: `${o.vehiculo} · ${o.placa}`), que no lleva ninguna de las dos. #18 §6.1 nombra la placa explícitamente como uno de los cuatro campos que necesitan cero cortado.

### 5.5 Una fila tiene un solo dato de vistazo

La jerarquía dentro de la fila es donde más fácil se cae en lo barato: si tres cosas gritan, ninguna se oye, y la fila se lee como un formulario impreso.

Carbon lo resuelve con tres tamaños y **una sola inversión de peso**:

| Elemento              | Tamaño | Peso               | Token                 |
| --------------------- | ------ | ------------------ | --------------------- |
| Título de la tabla    | 20 px  | Regular / 400      | `$heading-03`         |
| Encabezado de columna | 14 px  | **SemiBold / 600** | `$heading-compact-01` |
| Texto de fila         | 14 px  | Regular / 400      | `$body-compact-01`    |

Lo interesante es que **el título de la tabla, que es el texto más grande, es el más liviano**, y el encabezado de columna, que es del tamaño del cuerpo, es el único en semibold. El tamaño hace la jerarquía; el peso hace la función. No se acumulan.

**Para Bitácora**, con ADR 0003 en la mano: el dato de vistazo es el **tiempo parado**, porque es el criterio de orden — _"arriba lo que más duele"_ (glosario). Todo lo demás baja un escalón:

- Tiempo parado: `data-28` (28 px, peso 680) — uno solo, a la izquierda, `tabular-nums`.
- Vehículo + placa: `body-compact-18` con la placa a peso 590, no un tamaño mayor.
- Cliente, folio, detalle: `body-compact-18` o `caption-14` en el paso secundario de la rampa.
- Estado y especialidad: chips, que aportan color y forma, no tamaño.

Es decir: **la jerarquía se construye con dos tamaños y dos pesos, no con cinco de cada uno.** Es #18 §7 aplicado a un componente.

**Divergencia declarada:** #18 §6.7 pone la placa y el nº de orden como el `data-28` de la tarjeta. ADR 0003 mueve ese lugar al tiempo parado, que es el criterio de orden. La divergencia es correcta y ganada por el ADR, pero **hay que registrarla en #70** para que la tabla de #18 §6.7 no se aplique al pie de la letra.

### 5.6 Los metadatos secundarios se revelan, no se muestran

Carbon documenta el patrón y también su trampa:

> _"use the `overflowMenuOnHover` prop to only show the overflow menu on hover and focus to **reduce the visual clutter of an overflow menu on every row**."_

Y acto seguido:

> _"For mobile and touch devices the data table will detect if the user agent supports hover-over and **persist the overflow menus** even if the `overflowMenuOnHover` prop is enabled."_

([Data table / Usage](https://carbondesignsystem.com/components/data-table/usage/))

Ese par es exactamente la regla: **las acciones por fila aparecen al hover y al foco, y en táctil se quedan puestas.** Bitácora corre en tableta en el piso del taller y en escritorio en recepción — necesita las dos ramas, detectadas por capacidad, no por ancho de viewport. **La consulta exacta que usa Linear en producción es `@media (any-hover: hover) and (any-pointer: fine)`** (§4.1), y deja el `:active` con el mismo color **fuera** del media query — de modo que la tableta, que no tiene hover, recibe igual el feedback al tocar.

Dos consecuencias operativas:

- Si las acciones aparecen en hover, **la fila debe reservar el espacio desde el inicio**. Si el layout se recompone al entrar el puntero, se ve barato y además dispara reflow por fila.
- **El foco cuenta igual que el hover.** Carbon lo dice con esas palabras (_"on hover and focus"_): revelar solo en hover deja la acción inalcanzable por teclado, que además es un fallo de SC 2.4.7.

### 5.7 Encabezado pegajoso: es AA, y el prototipo ya lo incumple

NN/g lo pide sin matices: _"**Freeze** **header** rows and header columns (if the table is larger than the screen)."_ ([Data Tables](https://www.nngroup.com/articles/data-tables/))

Pero pegar un encabezado tiene una obligación normativa que casi siempre se olvida. **WCAG 2.2 SC 2.4.11 _Focus Not Obscured (Minimum)_, nivel AA**:

> _"When a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content."_

Y la técnica de fallo lo nombra literalmente: **F110, _"Failure of Success Criterion 2.4.11 Focus Not Obscured (Minimum) due to a sticky footer or header completely hiding focused elements."_** La propia página de _Understanding_ da la mitigación:

> _"…the focused item is not completely visually obscured by the footer because content in the viewport scrolls up to always display the item with keyboard focus **using scroll padding**."_

([Understanding SC 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)). SC 2.4.12 _Enhanced_ es la versión AAA: **nada** del componente enfocado puede quedar tapado.

**La receta, entonces, no es solo `position: sticky`:**

```css
:root {
  --alto-encabezado: 56px;
  /* +8 px de margen para que quepa el anillo de foco */
  scroll-padding-top: calc(var(--alto-encabezado) + 8px);
}
```

El `+8px` no es adorno: si el anillo de foco lleva 2 px de grosor y 2 px de offset, el elemento "visible" empieza 4 px antes de su caja. Redondeado a la escala de espaciado de #18 §6.3, son 8 px.

**Defecto del prototipo:** `.panel` es `position: sticky; top: 0` (línea 88) y no hay `scroll-padding` en ninguna parte del archivo. Con la lista larga y tabulando hacia abajo, la fila enfocada queda enteramente detrás del panel. Es un fallo AA hoy.

### 5.8 Hover, foco y seleccionado son tres cosas distintas

Carbon modela **cuatro** estados de fondo de fila y uno de borde: `$layer` (reposo), `$layer-hover`, `$layer-selected`, `$layer-selected-hover`, y `$focus` como borde. El seleccionado además cambia el borde inferior a `$border-subtle-selected` y el texto a primario.

Lo que hay que retener:

- **El seleccionado es una superficie, no un contorno.** Si la selección se marca con un borde, compite con el anillo de foco y con el separador. Carbon la marca con fondo. Y cuando además hace falta un filo, **Linear lo dibuja con `box-shadow: 0 0 0 1px var(--bgSelectedBorder) inset`, no con `border`** (§4.1): la sombra no ocupa caja, así que **seleccionar una fila no mueve un píxel del layout**. Con `border` sí: la fila crece 2 px y empuja a las de abajo.
- **Existe `selected + hover`.** Sin ese cuarto estado, pasar el puntero sobre la fila ya seleccionada o no hace nada (parece rota) o la devuelve al color de hover (parece deseleccionada).
- **El foco es borde, no fondo.** Es la única de las tres señales que se dibuja como línea, y por eso es la única que puede permitirse serlo.
- **Falta un quinto:** `:active`. #18 §6.8 exige respuesta visible al toque en ≤ 100 ms (MIL-STD-1472F §5.4.6.4) y da la opacidad de la capa: pressed **0,12** en Material 3. En una tableta no hay hover; **`:active` es el único feedback que existe antes de que la pantalla cambie.**

**Defecto del prototipo:** tiene `:hover` (línea 262) y `:focus-visible` (línea 266). No tiene `:active`, no tiene estado seleccionado, y no tiene `aria-current` ni `aria-selected` en ninguna parte. En la app de venta la lista es el único componente: llegar a la demo sin estado seleccionado es llegar sin el componente.

### 5.9 Cómo se evita el "look de hoja de cálculo" — lista cerrada

Recapitulando lo anterior como reglas ejecutables:

| Rasgo de hoja de cálculo                | Reemplazo                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| Reglas verticales entre columnas        | `padding: 16px` constante (Carbon, #18 §6.3)                                      |
| Borde en las cuatro caras de la fila    | Escalón de superficie; a lo sumo `border-bottom` del token más suave              |
| Todo el texto al mismo peso y contraste | Reposo en el paso secundario, primario solo en hover / foco / seleccionado (§5.1) |
| Cinco tamaños de fuente en una fila     | Dos tamaños y dos pesos (§5.5)                                                    |
| Zebra por defecto                       | Solo si hay recorrido horizontal real (§5.3)                                      |
| Acciones visibles en todas las filas    | Revelar en hover **y** foco; persistir en táctil (§5.6)                           |
| Números proporcionales                  | `font-variant-numeric: tabular-nums` (§5.4)                                       |
| Alturas de fila arbitrarias             | Escalera cerrada 56 / 72 / 96 px (#18 §6.5)                                       |
| Selección marcada con contorno          | Selección marcada con superficie (§5.8)                                           |
| Encabezado pegajoso sin más             | `scroll-padding-top` (§5.7)                                                       |

---

## 6. Inter Variable vs. Inter estática

Todo lo de esta sección está **medido sobre los binarios reales** del release oficial, no estimado.

### 6.1 El release y los tamaños exactos

Release vigente: **Inter 4.1**, tag `v4.1`, publicado el **2024-11-16**. Único asset publicado: `Inter-4.1.zip`, **33 707 794 B** (32,1 MiB). Cadena de versión interna del binario: `Version 4.001;git-9221beed3`. El release **no publica `.woff2` sueltos** — vienen dentro del zip, en `web/`, y son byte-idénticos a los de `docs/font-files/` del repo, que es lo que sirve `rsms.me`. ([`rsms/inter` release v4.1](https://github.com/rsms/inter/releases/tag/v4.1), verificado con `gh api`.)

Archivos completos, sin subsetear (2 937 glifos):

| Archivo                      | Bytes       | KiB       |
| ---------------------------- | ----------- | --------- |
| `InterVariable.woff2`        | **352 240** | **344,0** |
| `InterVariable-Italic.woff2` | 387 976     | 378,9     |
| `Inter-Regular.woff2` (400)  | 111 268     | 108,7     |
| `Inter-Medium.woff2` (500)   | 114 348     | 111,7     |
| `Inter-SemiBold.woff2` (600) | 114 812     | 112,1     |
| `Inter-Bold.woff2` (700)     | 114 840     | 112,2     |

**El argumento de peso no decide nada, y conviene decirlo antes de usarlo mal:**

- 3 estáticas (400 + 600 + 700) = 340 920 B. La variable pesa **+11 320 B (+3,3 %)**: **pierde**.
- 4 estáticas (400 + 500 + 600 + 700) = 455 268 B. La variable ahorra **103 028 B (−22,6 %)**: **gana**.
- Punto de equilibrio: **≈ 3,08 estáticas**.

Bitácora usa tres pesos (400 / 590 / 680), así que por peso de archivo la variable **pierde por poco**. **Lo que la justifica no es el tamaño: es que 590 no existe en ninguna estática.**

### 6.2 El subset latino: ~88 KB, y el español entero cabe

Medido con `fontTools 4.63.0` / `pyftsubset --flavor=woff2` sobre el binario oficial, restringido al `unicode-range` `latin` de Google Fonts:

| Variante (roman, `latin`)                                                 | Bytes      |
| ------------------------------------------------------------------------- | ---------- |
| Mínimo útil (`calt,ccmp,locl,kern,mark,mkmk,tnum,zero,case`)              | 67 156     |
| **"Taller"** (+ `ss02,ss04,cv05,cv08,cv10,frac,sups,subs,sinf,numr,dnom`) | **87 544** |
| "Taller" con `opsz` instanciado a 14 (sin eje óptico)                     | 56 148     |
| "Taller" con `wght` recortado a 400–700 **y** sin `opsz`                  | 40 584     |
| Todas las features                                                        | 105 176    |
| Itálica, set "taller"                                                     | 95 936     |

**Recomendación: ~88 KB** para el roman `latin` con las features del taller y los dos ejes intactos. Es **cuatro veces menos** que los 352 KB del archivo completo, y **menos que una sola estática sin subsetear**. Con eso el debate "variable vs. estáticas" por peso deja de existir.

El `unicode-range` `latin` cubre `U+0000-00FF` más un puñado de signos tipográficos. **El español completo cae entero ahí** — `á é í ó ú ñ ü ¿ ¡ « » °`. `latin-ext` no hace falta.

> **Sin verificar:** que los caracteres de las placas costarricenses estén todos dentro de `latin`. Son A–Z y 0–9, así que casi con seguridad sí, pero no se comprobó carácter por carácter contra el formato real — que además [#35](https://github.com/FabianRG1990/repositorio-de-apps/issues/35) concluyó que no debe validarse con regexp.

### 6.3 Google Fonts sirve una Inter mutilada — y esto sí es descalificante

**Este es el hallazgo que cierra la pregunta.** Comparando la tabla `GSUB` del `.woff2` que sirve `fonts.gstatic.com` contra el binario oficial de rsms:

| Origen                       | Features presentes                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Google Fonts** (Inter v20) | `calt, ccmp, dnom, frac, locl, numr, pnum, tnum`                                                                             |
| **Oficial rsms 4.1**         | `aalt, calt, case, ccmp, cv01…cv14, dlig, dnom, frac, locl, numr, ordn, pnum, salt, sinf, ss01…ss08, subs, sups, tnum, zero` |

**La versión de Google Fonts no tiene `zero` (cero cortado), ni `ss02` (desambiguación), ni `cv05` / `cv08`, ni `case`.**

Para Bitácora eso es descalificante por sí solo, con 590 o sin 590: #18 §6.1 justifica la elección de Inter precisamente por _"el cero cortado y las cifras tabulares"_, porque _"esta app muestra placas, VIN, números de orden y números de parte, donde confundir `0`/`O` es un error de trabajo real"_.

**Y explica un defecto silencioso del prototipo.** Las líneas 273 y 287 declaran `font-variant-numeric: tabular-nums slashed-zero` — el CSS es correcto (§7.5). Pero `slashed-zero` mapea a la feature `zero`, **que el archivo cargado desde Google Fonts no contiene**. El cero cortado del prototipo **no se está renderizando**. Es exactamente la clase de defecto que no se ve hasta que alguien tipea mal un VIN.

### 6.4 Cómo se sirve self-hosted, con las tres trampas

**Nombre de familia:** `InterVariable`. `'Inter var'` es el nombre **legacy**; `docs/inter.css` del repo lo marca con el comentario literal `/* legacy name "Inter var" (Oct 2023) */`. **Ojo: el `README.md` del repo y el `help.txt` del zip 4.1 siguen desactualizados y siguen recomendando `'Inter var'`** — no son la referencia; `docs/inter.css` y `rsms.me/inter` sí.

**Sintaxis de `src`:** `format('woff2')` a secas. La forma `format('woff2-variations')` es **legacy**: CSS Fonts 4 §11.1 la define como alias exacto de `format(woff2) tech(variations)` y dice _"While keywords are preferred to identify font formats, for reasons of backwards compatibility the following strings are also accepted"_ y _"The CSS WG does not anticipate extending this list of format strings in the future."_ ([CSS Fonts 4, descriptor `src`](https://drafts.csswg.org/css-fonts-4/#src-desc)). `tech(variations)` solo sirve para dar un `src` de respaldo a navegadores sin fuentes variables; en un service worker eso duplica archivos a precachear sin ganar nada.

**Eje óptico:** el `fvar` del binario 4.1 declara `opsz` **14 → 32** (por defecto 14) y `wght` **100 → 900** (por defecto 400), con 9 instancias nombradas, todas a `opsz = 14`. `font-optical-sizing: auto` **es el valor inicial** de la propiedad (CSS Fonts 4 §8.1): ya está activo, no hay que escribirlo.

**Las tres trampas, en orden de gravedad:**

1. **El `@font-face` debe declarar `font-weight: 100 900` — un rango, no un valor.** CSS Fonts 4 §7.2 dice que los valores de `font-weight` _"should be clamped to the value of the `font-weight` descriptor in that `@font-face` rule"_. Si el `@font-face` dice `font-weight: 400`, entonces `font-weight: 590` **se recorta a 400 y no hace nada, en silencio**.
   **Y es exactamente lo que hace el prototipo hoy:** `css2?family=Inter:wght@400;500;600;700` (línea 10) devuelve cuatro `@font-face` **separados**, cada uno con un `font-weight` único. Con ese CSS el 590 está muerto antes de escribirse. (`docs/prototypes/bitacora-tokens.html` sí usa `wght@100..900`, que devuelve `font-weight: 100 900`.)
2. **`font-variation-settings` gana sobre todo.** CSS Fonts 4 §7.2 fija la precedencia en orden ascendente y lo pone último: `font-variation-settings: 'wght' 590` **anula `font-weight`** para ese eje, y `font-variation-settings: 'opsz' N` **anula `font-optical-sizing: auto`** en todo el subárbol. **Regla operativa: el peso se pide siempre con `font-weight`; `font-variation-settings` se reserva a `opsz`, que es el único eje sin propiedad de alto nivel que tome un número.**
3. **El `preload` necesita `crossorigin` aunque el archivo sea del mismo origen.** Las fuentes se piden siempre en modo CORS anónimo; sin el atributo, el `preload` no coincide con la petición real y **el archivo se descarga dos veces**. Linear lo hace así (`crossOrigin="anonymous"`, verificado en su HTML).

```css
/* Inter Variable 4.1 · self-hosted · subset latin */
@font-face {
  font-family: 'InterVariable';
  font-style: normal;
  font-weight: 100 900; /* el RANGO es obligatorio: un valor único mata el 590 */
  font-display: swap;
  src: url('./fonts/InterVariable-latin.woff2') format('woff2');
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
    U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212,
    U+2215, U+FEFF, U+FFFD;
}

:root {
  font-family:
    'InterVariable',
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-synthesis-weight: none; /* nada de negritas falsas si la fuente falla */
  --peso-normal: 400;
  --peso-medio: 510;
  --peso-fuerte: 590; /* en vez de 600 */
  --peso-bold: 680; /* en vez de 700 */
}

/* Placas, VIN, folios, números de parte */
.identificador {
  font-variant-numeric: tabular-nums slashed-zero; /* alto nivel: ver §7.5 */
  font-feature-settings:
    'cv08' 1,
    'cv05' 1,
    'case' 1; /* sin equivalente de alto nivel */
}
```

`cv08` (I mayúscula con serifa) y `cv05` (l minúscula con cola) son las que separan `I` de `l` de `1`; `case` alinea paréntesis y signos a la altura de mayúsculas y cifras, que es lo que necesita `[ABC-1234]`. La documentación de Inter lo enuncia como su caso de uso: _"Disambiguate between similar-looking characters with `ss02` or individual character variants: `ss02`, `cv08` Upper-case i with serif, `cv05` Lower-case L with tail, `zero` Slashed zero"_ ([rsms.me/inter — Features](https://rsms.me/inter/#features)). `ss02` hace `zero` más el resto en un solo tag; acá se prefiere la vía de alto nivel para el cero (§7.5) y los `cv*` sueltos para lo demás.

### 6.5 Offline: el service worker de Angular pone las fuentes en `lazy`

El template por defecto de `@schematics/angular` mete `woff2` en el grupo `assets` con `installMode: "lazy"`, y la documentación de Angular es explícita sobre lo que eso significa: `prefetch` _"ensures resources are available whenever they're requested, even if the browser is currently offline"_, mientras que `lazy` _"Does not cache any of the resources up front."_ ([Angular — Service worker configuration](https://angular.dev/ecosystem/service-workers/config))

**En una app offline-first eso es un fallo directo:** si el usuario instala la PWA y pierde conectividad antes de que se pinte texto con Inter, la fuente no está. Además la misma doc advierte que _"the ServiceWorker checks asset groups in the order in which they appear… The first asset group that matches handles the request"_, así que el grupo de fuentes tiene que ir **primero**:

```json
{
  "assetGroups": [
    {
      "name": "fonts",
      "installMode": "prefetch",
      "updateMode": "prefetch",
      "resources": { "files": ["/**/*.woff2"] }
    },
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/**/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff)"
        ]
      }
    }
  ]
}
```

`font-display`: **`swap`**, que es lo que usa la documentación oficial de Inter en todos sus `@font-face`. `optional` es tentador por CLS (bloquea ~100 ms y si no llegó descarta la fuente para toda la navegación, sin reflow), pero en la primerísima visita con red lenta el usuario vería la app entera sin Inter. Con el service worker en `prefetch`, de la segunda carga en adelante los dos se comportan igual.

### 6.6 ¿590 vale la pena frente a 600? Sí, pero con la etiqueta correcta

**El 590 es una instancia real, no un redondeo.** El `fvar` declara `wght` como eje continuo de 100 a 900; las 9 instancias nombradas son atajos, no restricciones. Medido instanciando la fuente y calculando el área de tinta de los glifos (`fontTools.instantiateVariableFont` + `AreaPen`, `opsz = 14`):

| `wght`  | Avance de `H` | Área de `H`   | Área de `o` |
| ------- | ------------- | ------------- | ----------- |
| 400     | 1522          | 697 576       | 507 873     |
| 500     | 1525          | 825 902       | 594 349     |
| **510** | 1525          | **838 601**   | 602 745     |
| **590** | 1527          | **939 238**   | 668 215     |
| 600     | 1527          | 951 710       | 676 194     |
| **680** | 1529          | **1 050 534** | 738 330     |
| 700     | 1530          | 1 074 999     | 753 408     |

590 tiene **1,3 % menos tinta que 600** y cae exactamente al 90 % del tramo 500→600. Interpola de verdad.

**Que Linear usa 510 / 590 / 680 está confirmado con su CSS de producción** — pero, y esto es determinante, **es el CSS de su sitio de marketing**, `static.linear.app/web/_next/static/css/index.CtQdVDoA.css`:

```css
--font-weight-medium: 510;
--font-weight-semibold: 590;
--font-weight-bold: 680;
```

Y sirven `static.linear.app/fonts/InterVariable.woff2?v=4.1` desde su propio origen: **byte-idéntico al oficial de rsms** (352 240 B, `Version 4.001;git-9221beed3`, 2 937 glifos). **No lo subsetean.** También usan `font-feature-settings: "cv01","ss03"` y, en un punto, `"zero" !important`; y `font-variation-settings: "opsz" 28` para display.

**Pero el CSS de la aplicación declara otra escala** (§4.1), y es la que importa, porque es la que produce el aspecto que #18 puso de referencia:

```css
--font-weight-light: 300;
--font-weight-normal: 450;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

**El producto de Linear no usa 590. Usa 450 de cuerpo y 600 de énfasis.** Los 510/590/680 son de su página de ventas. Son dos hojas distintas y ambas están verificadas; la confusión venía de haber leído solo una. Consecuencias para #70:

- **El truco de peso intermedio de Linear existe, pero está en el 450 de cuerpo, no en el 590 de énfasis.** Bajar el cuerpo de 400 a 450 es lo contrario de lo que hace #18 (que fija el cuerpo en 400) y **no es transferible al taller**: #18 §5.3 prohíbe adelgazar el trazo, no engordarlo, así que 450 sería admisible — pero sube la mancha de tinta un 18,4 % (§6.6, tabla) y en una lista densa eso se nota.
- **Para el énfasis, la referencia real de Linear es 600, no 590.** Adoptar 590 sigue siendo defendible — la diferencia medida es 1,3 % de tinta y el costo es cero — pero ya no se puede justificar diciendo "es lo que hace Linear en su producto".

**Pero la justificación que #18 §4.6 le da al 590 no está respaldada por el autor de la tipografía.** #18 dice que _"los pesos intermedios corrigen el salto óptico entre Medium y Semibold que Inter tiene en la rejilla de 100"_. Se buscó esa afirmación en `rsms.me/inter`, el `README`, `docs/inter.css`, el `help.txt` del release y los issues del repo: **rsms no dice nada sobre pesos intermedios ni sobre un salto óptico.** Lo más cercano es que la página oficial declara _"Each glyph has three dedicated designs for weights 100, 400 and 900 to ensure excellent quality at any weight"_ — tres masters y el resto interpolado, lo que **explicaría** que los tramos no sean perceptualmente uniformes, pero es inferencia. Y el issue abierto [#821](https://github.com/rsms/inter/issues/821) (_"Text Weight (450) for High-DPI (Retina) Display users"_) muestra que la comunidad percibe los escalones de 100 como demasiado gruesos, pero sigue sin respuesta del autor.

**Confianza BAJA en "590 corrige el salto óptico de Inter". Confianza ALTA en "590 es lo que hace Linear _en su sitio de marketing_", y confianza ALTA en que _su aplicación usa 600_.** Con las dos correcciones encima, la recomendación honesta para #70 es: **usar la fuente variable sí o sí** (por el 450/510 si se los quiere, y sobre todo por las features que Google Fonts no trae), y **elegir entre 590 y 600 mirándolos en pantalla**, no citando a nadie.

Los saltos medidos ponen el tamaño real del efecto: 400→500 es **+18,4 %** de tinta y 500→600 es **+15,2 %**. Mover 10 puntos dentro de un tramo es un cambio real pero **sutil**. El costo es cero, así que la relación es favorable; no se vende como una mejora dramática.

**Riesgos de `font-weight: 590`, todos acotados:**

| Riesgo                    | Veredicto                                                                                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Caída a estáticas         | **Va a 600, no a 400.** CSS Fonts 4 §5.2: _"If the desired weight is greater than 500, weights greater than or equal to the desired weight are checked in ascending order followed by weights below the desired weight in descending order."_ 590 > 500 ⇒ 600 |
| Caída a fuente de sistema | El sistema elige su cara ≥ 590 (Semibold/Bold). Sin sorpresas                                                                                                                                                                                                 |
| Negrita sintetizada       | No ocurre: CSS Fonts 4 §2.8 dice que los ejes de variación _"do not count as font synthesis"_. Igual se pone `font-synthesis-weight: none` como red                                                                                                           |
| Soporte de navegador      | Los valores numéricos arbitrarios llegan con las fuentes variables (Chrome 62+, Safari 11+, Firefox 62+). Irrelevante para una PWA de 2026. **Confianza media: no se verificó contra caniuse en esta sesión**                                                 |
| **El que sí importa**     | Que el `@font-face` declare un `font-weight` único en vez de `100 900`. Ahí el 590 muere en silencio. Es el bug actual del prototipo                                                                                                                          |

### 6.7 Lo que queda sin verificar en esta sección

- **Nadie miró 510 / 590 / 680 contra 500 / 600 / 700 en pantalla.** Toda la evidencia es del binario y de las especificaciones. Una diferencia de 1,3 % de tinta es exactamente el tipo de cosa que la aritmética no puede juzgar: **antes de cerrar la decisión en #70 hay que verlos lado a lado en la pantalla real.**
- Los tamaños de subset se midieron con el brotli por defecto de `fontTools`; con brotli q11 / zopfli podrían bajar algo más.
- No se comprobó si el build de Angular añade fingerprint a los `.woff2` ni cómo interactúa con el patrón `/**/*.woff2` del `ngsw-config.json`. Hay que mirar el `ngsw.json` generado tras el primer build.

---

## 7. Micro-detalles que se notan sin verse

### 7.1 Cuánto vale un escalón de superficie — con números

#18 §6.4 pide _"preferir escalones de superficie sobre `box-shadow` difuso"_ pero no dice **cuánto** escalón. Material 3 sí lo dice, aunque no en prosa: lo dice en su archivo de tokens, que asigna a cada superficie un tono HCT concreto.

De `tokens/versions/v0_192/_md-sys-color.scss` del repositorio oficial [`material-components/material-web`](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-color.scss):

| Rol                         | Tono claro | Tono oscuro |
| --------------------------- | ---------- | ----------- |
| `surface-container-lowest`  | 100        | 4           |
| `surface`                   | 98         | 6           |
| `surface-container-low`     | 96         | 10          |
| `surface-container`         | 94         | 12          |
| `surface-container-high`    | 92         | 17          |
| `surface-container-highest` | 90         | 22          |

Convertido a relación de contraste WCAG **[medido: L\*→Y por `Y = ((L+16)/116)³`, luego `(Y₁+0,05)/(Y₂+0,05)`]**:

| Salto                             | Claro       | Oscuro      |
| --------------------------------- | ----------- | ----------- |
| `lowest` → `surface`              | **1,051:1** | 1,041:1     |
| `surface` → `low`                 | 1,052:1     | **1,082:1** |
| `low` → `container`               | 1,052:1     | 1,046:1     |
| `container` → `high`              | 1,053:1     | **1,140:1** |
| `high` → `highest`                | 1,054:1     | **1,166:1** |
| `surface` → `container` (2 pasos) | **1,107:1** | —           |
| Rango completo                    | **1,291:1** | **1,565:1** |

Tres lecturas:

1. **Un escalón perceptible cuesta ~1,05:1.** Es un número diminuto: el hairline de `#E5E7EB` sobre blanco que #18 §6.2 prohíbe da ~1,2:1, más que **cuatro** escalones de superficie de M3. Separar con superficie no es "más sutil que un borde suave": es un orden de magnitud más sutil, y aun así funciona. La explicación probable es la función de sensibilidad al contraste: un borde de luminancia entre dos áreas grandes cae en la frecuencia espacial donde el ojo es más sensible, mientras que una línea de 1 px es frecuencia muy alta, donde la sensibilidad se desploma. **Esa explicación es inferencia de este documento, no afirmación de M3; lo que sí está medido son los escalones de la tabla.**
2. **En claro la escalera es uniforme (2 tonos por paso); en oscuro no.** M3 abre los pasos altos (5 tonos) y el rango completo es de 1,57:1 contra 1,29:1. Traducción: **el tema oscuro necesita más escalón para el mismo efecto**, porque cerca del negro la misma diferencia de tono da menos diferencia de luminancia relativa. Cualquier rampa de Bitácora que use los mismos deltas en claro y en oscuro se verá plana en oscuro.
3. **El prototipo ya está calibrado bien y no lo sabe.** Su escalón ficha/fondo mide **1,110:1 en claro y 1,123:1 en oscuro** **[medido sobre la rampa OKLCH de las líneas 744-779, marca azul `#0047c7`]** — casi exactamente el `surface`→`surface-container` de M3. El hover (`sf2` sobre `sf1`) mide **1,141:1 / 1,146:1**, prácticamente idéntico al equivalente de la capa de estado 0,08 de Material 3 (que sobre blanco da **1,171:1** **[medido]**; la capa pressed de 0,12 da **1,271:1**). Es decir: **la rampa de superficies del prototipo sirve; lo que sobra es el borde que le pusieron encima.**

**Cuándo sigue sirviendo una sombra:** cuando el plano **flota** sobre contenido que sigue estando debajo y hay que decir que es temporal — hoja, menú, diálogo. M3 mantiene su escala de elevación en dp (`level0..level5` = 0 / 1 / 3 / 6 / 8 / 12, de `_md-sys-elevation.scss` del mismo repo) precisamente para esos casos. Para planos **permanentes** apilados — fondo, ficha, fila — la sombra solo agrega ruido de render y, según #18 §5.4, desaparece al sol.

### 7.2 El foco de teclado: dos anillos, y el offset los da gratis

Dos fuentes que convergen:

- **Chromium**, desde Chrome 83, dibuja por defecto _un contorno negro grueso rodeado por un contorno blanco fino_, en un trabajo conjunto de Microsoft y Google descrito en [_Updates to Form Controls and Focus_](https://blog.chromium.org/2020/03/updates-to-form-controls-and-focus.html) (30 de marzo de 2020).
- **WCAG 2.2 SC 2.4.13 _Focus Appearance_ (nivel AAA)** exige que el indicador _"is at least as large as the area of a 2 CSS pixel thick perimeter of the unfocused component"_ y _"has a contrast ratio of at least 3:1 between the same pixels in the focused and unfocused states"_. Entre sus ejemplos: _"a solid 2px thick outline"_ cumple el área, y funcionan también _"two nested outlines"_ donde _"the black part is 2px thick"_ ([Understanding SC 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)).

**Por qué dos anillos y no uno:** un anillo de un solo color falla contra el fondo del mismo color. Un producto con temas claro/oscuro y color de marca configurable — que es exactamente Bitácora — no puede garantizar el fondo. Con dos anillos, uno de los dos siempre contrasta.

**El truco es que en CSS no hace falta dibujar dos.** `outline-offset` positivo deja ver la superficie entre el elemento y el contorno: ese hueco **es** el anillo claro.

```css
.fila:focus-visible {
  /* SC 2.4.13: el trazo contrastante mide 2 px */
  outline: 2px solid var(--foco);
  /* el hueco muestra la superficie: es el segundo anillo */
  outline-offset: 2px;
  /* el outline sigue el radio; sin esto el anillo sale cuadrado */
  border-radius: var(--r-md);
}
```

Con eso el hueco del offset muestra el fondo del contenedor, que actúa de separador entre el elemento y el trazo. Si hace falta la garantía dura de Chromium — un anillo claro **por fuera** del oscuro, que funcione sobre cualquier fondo, incluido el de la fila seleccionada — se añade un tercer trazo con `box-shadow`, que no participa del flujo:

```css
.fila:focus-visible {
  outline: 2px solid var(--foco-oscuro);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--foco-claro); /* el anillo exterior de Chromium */
}
```

Nota fina que se paga cara: **`outline` respeta `border-radius` pero no hereda el radio de un ancestro con `overflow: hidden`.** Si el foco cae sobre un elemento dentro de un contenedor recortado, el anillo se corta. Esto pasa en el prototipo: `.seg` tiene `border-radius: 8px; overflow: hidden` (líneas 118-119) y sus botones no tienen radio propio.

Detalle importante sobre la métrica: SC 2.4.13 pide 3:1 **entre los mismos píxeles en estado enfocado y no enfocado** — no "contra los vecinos". #18 §6.2 lo formuló como _"4,5:1 contra ambos vecinos"_, que es la métrica de SC 1.4.11 (objeto gráfico). Ambas aplican y no son la misma; la de #18 es la más exigente de las dos, así que cumplir #18 cumple 2.4.13. **Se conserva el número de #18** y se anota la diferencia de origen.

### 7.3 Separar una sección de otra sin líneas

Tres herramientas, en orden de preferencia:

1. **Espacio.** Regla de Carbon, citada verbatim en #18 §6.3: _"Sections of a UI are allowed to be dense, but the whole page should not be crowded; there should be white space to let the user's eye rest."_ Y #18 §6.3 fija el número: **32–48 px entre secciones**, contra 12–16 px entre elementos de una sección. La proporción es lo que hace el trabajo — un salto de 2 a 4 veces la separación interna se lee como corte sin dibujar nada.
2. **Escalón de superficie.** §7.1: un solo paso (~1,05:1) basta para decir "esto es otro plano". Es lo que hace Carbon con el encabezado de columna, que lleva `$layer-accent` mientras las filas llevan `$layer`.
3. **Peso y tamaño del encabezado.** Carbon (§5.5): el encabezado de sección es del tamaño del cuerpo y el único en semibold. El cambio de peso ancla el inicio de la sección sin ocupar altura.

Lo que **no** se usa: `<hr>`, bordes de sección, cambios de color de acento, iconos decorativos. Es el principio de Linear otra vez — _"Structure should be felt not seen"_.

### 7.4 Radios anidados: la fórmula concéntrica

La regla es geométrica: dos esquinas redondeadas se ven bien anidadas cuando sus arcos son **concéntricos**, es decir cuando comparten centro. Eso ocurre exactamente cuando

```
radio_interno = radio_externo − separación
```

donde la separación es el padding o el gap entre las dos cajas. Si el resultado es cero o negativo, **el elemento interno va a esquina recta**: la curva se la comió el espaciado.

La derivación está en [_The Math Behind Nesting Rounded Corners_](https://cloudfour.com/thinks/the-math-behind-nesting-rounded-corners/) (Cloud Four), que además da la implementación:

```css
--outer-radius: 1em;
--padding: 0.5em;
--inner-radius: calc(var(--outer-radius) - var(--padding));
```

Y **dejó de ser folclore de blogs en 2025**: Apple lo convirtió en tipo del sistema. SwiftUI incorporó [`ConcentricRectangle`](https://developer.apple.com/documentation/swiftui/concentricrectangle), presentado en WWDC25 dentro del nuevo sistema de diseño ([_Get to know the new design system_, sesión 356](https://developer.apple.com/videos/play/wwdc2025/356/)); las formas concéntricas _calculan su radio restando el padding al del contenedor padre_, y el sistema distingue tres tipos de forma: **fija** (radio constante), **cápsula** (radio = mitad de la altura) y **concéntrica**. Además existe un "radio de reserva" para cuando el componente se usa suelto y no anidado.

> **Confianza media en el detalle de Apple:** la documentación de `developer.apple.com` es una SPA y no se pudo leer directamente; lo anterior proviene de resultados de búsqueda consistentes entre sí que citan la página y la sesión de WWDC. La existencia del tipo `ConcentricRectangle` y la fórmula sí son verificables por la URL de la API. La fórmula en sí tiene confianza alta: es geometría, no opinión.

**Aplicación a Bitácora**, con los radios de #18 §6.4 (escala 4 / 8 / 12 / 16 / 999, base de componente 8):

| Contenedor                     | Radio  | Padding | Radio del hijo                |
| ------------------------------ | ------ | ------- | ----------------------------- |
| Tarjeta de orden (densidad C)  | 12 px  | 16 px   | **0 px** — 12 − 16 < 0        |
| Tarjeta de orden con padding 8 | 12 px  | 8 px    | 4 px                          |
| Campo de formulario en tarjeta | 8 px   | —       | (es el hijo)                  |
| Chip de estado                 | 999 px | —       | cápsula: exenta de la fórmula |

Las píldoras no participan: son otro tipo de forma, no un rectángulo con radio grande. Un chip de 32 px de alto con radio 999 px anidado en una tarjeta de radio 12 px **no** es una violación de concentricidad; es una cápsula.

### 7.5 Corrección a #18: `font-variant-numeric`, no `font-feature-settings`

#18 §6.1 recomienda:

> `font-feature-settings: "zero" 1` (cero cortado) en placa, VIN, nº de orden y nº de parte.

La especificación dice explícitamente que no. CSS Fonts Module Level 4 §6.12:

> _"This property provides low-level control over OpenType font features. It is intended as a way of providing access to font features that are not widely used but are needed for a particular use case. **Authors should not use `font-feature-settings` to set any of the font features in the table below. Instead, please use the higher-level replacement properties**, because: The higher-level properties cascade individually. You can set one without setting the whole `font-feature-settings` list [ … ] Some higher-level properties can be synthesized for fonts that do not support the font feature."_

Y la tabla incluye, entre otros:

| Característica OpenType       | Propiedad de alto nivel                   |
| ----------------------------- | ----------------------------------------- |
| Tabular Figures (`tnum`)      | `font-variant-numeric: tabular-nums`      |
| Slashed Zero (`zero`)         | `font-variant-numeric: slashed-zero`      |
| Lining Figures (`lnum`)       | `font-variant-numeric: lining-nums`       |
| Proportional Figures (`pnum`) | `font-variant-numeric: proportional-nums` |

([CSS Fonts 4 §6.12](https://drafts.csswg.org/css-fonts-4/#font-feature-settings-prop))

Las dos razones que da el spec pegan justo en este proyecto:

- **Cascada individual.** `font-feature-settings` es una lista completa: poner `"zero" 1` en `.placa` **borra** cualquier `"tnum" 1` heredado, en vez de sumarse. Con `font-variant-numeric` cada valor cascadea por separado.
- **Síntesis.** Si la fuente falla y cae al `sans-serif` del sistema, la propiedad de alto nivel puede sintetizarse; la de bajo nivel simplemente no hace nada.

Y hay un tercer motivo, de precedencia: CSS Fonts 4 §7.2 resuelve las características _"in ascending order of precedence"_ con `font-feature-settings` al final, por encima de todo `font-variant-*`. Mezclar las dos en un mismo árbol produce anulaciones silenciosas.

**Corrección concreta para #70:**

```css
/* En vez de: font-feature-settings: "tnum" 1, "zero" 1; */
.dato-numerico {
  font-variant-numeric: tabular-nums;
}
.identificador {
  font-variant-numeric: tabular-nums slashed-zero;
} /* placa, VIN, folio, nº de parte */
```

El prototipo ya lo hace bien (líneas 273 y 287): usa `font-variant-numeric: tabular-nums slashed-zero`. **Es #18 el que hay que corregir, no el prototipo.**

---

## 8. Auditoría de `docs/prototypes/bitacora-temas.html`

907 líneas, revisadas una por una contra #18 §6 y §7. El ticket #72 había detectado tres incumplimientos; esta auditoría encuentra **40**. Cada uno con línea y corrección concreta, para que #70 pueda ejecutarse sin volver a decidir nada.

### 8.1 Bloqueantes — rompen una regla dura de #18 o una norma

| #    | Línea(s)                          | Qué hace                                                                                                                       | Qué dice #18 / la norma                                                                                                                                                                                                                | Corrección                                                                                                                                       |
| ---- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| B1   | **todo el archivo**               | Cada tamaño, alto e interlineado está en `px`                                                                                  | #18 §6.1: _"Todos los valores en `rem` para cumplir SC 1.4.4 (200 %)"_                                                                                                                                                                 | Convertir la escala tipográfica y las alturas de fila a `rem`; conservar `px` solo en bordes y anillos de foco                                   |
| B2   | 254                               | `.fila { border: 1px solid var(--bd-soft) }` — caja en las cuatro caras                                                        | #18 §7 tensión 2: separar con **superficie**, no con línea                                                                                                                                                                             | Quitar el borde. La separación la da el escalón `sf1`/`bg1`, ya medido en **1,11:1** (§7.1). Si falta, `border-bottom` solo, del token más suave |
| B3   | 388                               | `margin-top: -1px` para colapsar bordes adyacentes                                                                             | Consecuencia de B2                                                                                                                                                                                                                     | Desaparece al quitar el borde                                                                                                                    |
| B4   | 7-12                              | Inter se carga por `<link>` desde `fonts.googleapis.com`                                                                       | El proyecto es PWA offline-first, sin CDN. Y el build de Google Fonts **no trae `zero`, `ss02`, `cv05`, `cv08` ni `case`** (§6.3)                                                                                                      | Self-host de `InterVariable.woff2` subseteado a `latin` (~88 KB) con `@font-face` propio y grupo `prefetch` en `ngsw-config.json` (§6.4, §6.5)   |
| B5   | 10                                | Pide `wght@400;500;600;700`, que devuelve cuatro `@font-face` con `font-weight` de **valor único**                             | CSS Fonts 4 §7.2: el peso se recorta al descriptor del `@font-face`. Con eso **`font-weight: 590` se recorta a 400 en silencio**                                                                                                       | Inter Variable con `font-weight: 100 900` — el rango es obligatorio (§6.4)                                                                       |
| B5b  | 273, 287                          | Declara `font-variant-numeric: tabular-nums slashed-zero` — CSS correcto, efecto nulo                                          | `slashed-zero` mapea a la feature `zero`, que el archivo de Google Fonts **no contiene** (§6.3). **El cero cortado no se está renderizando**                                                                                           | Se arregla solo al ejecutar B4. El CSS no se toca                                                                                                |
| B6   | 109, 141, 195, 233, 294, 318, 364 | `font-weight: 600`                                                                                                             | #18 §6.1: 590                                                                                                                                                                                                                          | `590` (requiere B5)                                                                                                                              |
| B7   | 220, 274                          | `font-weight: 700`                                                                                                             | #18 §6.1: 680                                                                                                                                                                                                                          | `680` (requiere B5)                                                                                                                              |
| B8   | 281, 290                          | `font-weight: 500`                                                                                                             | #18 §6.1: la escala de pesos es 400 / 590 / 680, no hay 500                                                                                                                                                                            | `400` en `.tiempo small`; `400` en `.folio`                                                                                                      |
| B9   | 88 (+ ausencia)                   | `.panel` es `position: sticky` sin `scroll-padding-top`                                                                        | **WCAG 2.2 SC 2.4.11 (AA)**, fallo F110                                                                                                                                                                                                | `:root { scroll-padding-top: calc(var(--alto-panel) + 8px) }` (§5.7)                                                                             |
| B10  | 267                               | `outline: 3px solid var(--br-solid)` sin offset                                                                                | #18 §6.4: **2 px con 2 px de offset**                                                                                                                                                                                                  | `outline: 2px solid var(--foco); outline-offset: 2px;` (§7.2)                                                                                    |
| B11  | ausencia                          | No hay `:active` en `.fila`                                                                                                    | #18 §6.8 + MIL-STD-1472F §5.4.6.4: respuesta visible al toque ≤ 100 ms; capa pressed 0,12 (M3)                                                                                                                                         | Añadir `.fila:active { background: var(--sf-3) }`. **En tableta es el único feedback que existe**                                                |
| B12  | ausencia                          | No hay estado seleccionado ni `aria-current` / `aria-selected`                                                                 | §5.8; y es el componente central de la demo                                                                                                                                                                                            | Cuatro estados: reposo / hover / seleccionado / seleccionado+hover, todos por superficie                                                         |
| B13  | ausencia                          | No hay `@media (prefers-reduced-motion: reduce)`                                                                               | #18 §6.8: _"Respetar `prefers-reduced-motion`"_                                                                                                                                                                                        | Bloque que anula transiciones                                                                                                                    |
| B14  | 262 / ausencia                    | `.fila:hover` cambia el fondo sin transición; el único `transition` del archivo está en `body` (80-82) y es del cambio de tema | #18 §6.8: aparecer **0 ms**, desaparecer **100–150 ms** (asimetría de Linear)                                                                                                                                                          | `.fila { transition: background 100ms linear; } .fila:hover, .fila:active { transition-duration: 0s; }` — instantáneo al entrar, 100 ms al salir |
| B14b | 262                               | `.fila:hover` no está protegido por ninguna consulta de capacidad                                                              | En táctil el `:hover` **se queda pegado** a la última fila tocada, así que la lista muestra una fila resaltada que no corresponde a nada. Linear lo evita en producción con `@media (any-hover: hover) and (any-pointer: fine)` (§4.1) | Envolver el `:hover` en esa consulta y dejar el `:active` (B11) fuera de ella, con el mismo color                                                |

### 8.2 Fuera de escala — no rompe una norma, rompe el sistema

#18 §7 lo enuncia: _"lo premium se construye por sustracción y por sistema — menos matices, menos tamaños, menos radios, menos duraciones, todo dentro de escalas cerradas"_. Y cita a Carbon: _"deviating from the spacing scales should be avoided whenever possible."_

| #   | Línea(s)                | Valor                                                                                                                   | Escala de #18                                                                                           | Corrección                                                                                    |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| E1  | 107, 178                | `font-size: 13px`                                                                                                       | Piso absoluto **14 px** (#18 §6.1)                                                                      | `14px` con `letter-spacing: 0.16px`                                                           |
| E2  | 124, 194, 238, 302, 527 | `font-size: 15px`                                                                                                       | La escala es 14 / 16 / 18 / 20 / 24 / 28 / 36 / 48                                                      | `14px` (metadato) o `16px` (etiqueta)                                                         |
| E3  | 218                     | `font-size: 28px` en `h1`                                                                                               | Título de pantalla es `heading-24` (24/32, peso 590)                                                    | `24px / 32px / 590`                                                                           |
| E4  | 400, 429, 492           | `.tiempo` en 22 / 26 / 32 px                                                                                            | Dato de vistazo es `data-28` (28/32, 680); el siguiente es `data-36`                                    | **28 px en las tres densidades**, o 28 / 28 / 36                                              |
| E5  | 498                     | `.col-titulo` 20 px en densidad C                                                                                       | `heading-20` existe (20/28, peso **590**) — el peso no está puesto                                      | Añadir peso 590 e interlineado 28                                                             |
| E6  | 512                     | `.detalle` 16px/22px                                                                                                    | `body-compact-18` es 18/24                                                                              | `18px / 24px`                                                                                 |
| E7  | 280                     | `font-size: 0.62em` en `.tiempo small`                                                                                  | Valor arbitrario; a 22 px da **13,6 px**, bajo el piso de 14 px                                         | Valor fijo de la escala: `14px`                                                               |
| E8  | 126, 228, 314, 362      | `padding: 8px 14px` (126), `padding: 6px 12px` (228), `gap: 6px` (314, 362) — el `14` y los `6` no existen en la escala | Escala base 4 (#18 §6.3): 2 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80                        | `14px` → `12px`; `6px` → `4px` u `8px`. Los `2px` de las líneas 186 y 283 sí están en escala  |
| E9  | 36-41                   | `--e1..--e5` = 4/8/16/24/32                                                                                             | Faltan 12, 20, 40, 48 de la escala de #18 §6.3                                                          | Completar la escala y nombrar por valor (`--space-12`), como pide #18                         |
| E10 | 150-151, 163-164        | Swatches de 34×34 px; input color 44×34 px                                                                              | #18 §6.5: **48 px es el piso absoluto de cualquier control**                                            | 48 px mínimo                                                                                  |
| E11 | 127                     | `.seg button { min-height: 40px }`                                                                                      | Ídem: 48 px piso, 56 px estándar                                                                        | `min-height: 56px`                                                                            |
| E12 | 467                     | `border-width: 2px` en la tarjeta de densidad C                                                                         | #18 §6.4: bordes 1 / 1,25 px; **2 px está reservado al anillo de foco**                                 | `1.25px` (truco de Stripe) o quitar (ver B2)                                                  |
| E13 | 524                     | `border-left: 3px` en `.nota`                                                                                           | Ídem: no hay 3 px en la escala de bordes                                                                | `2px`, o barra de superficie sin borde                                                        |
| E14 | 110                     | `letter-spacing: 0.04em` + `text-transform: uppercase` a 13 px                                                          | #18 §6.1: +0,16 px a 14 px ≈ **+0,011 em**                                                              | `letter-spacing: 0.16px` a 14 px; revisar si la versalita aporta                              |
| E15 | 221, 275                | `letter-spacing: -0.01em` a 28 px y a 22/26/32 px                                                                       | #18 §6.1: negativo **solo ≥ 28 px**; de 20 a 24 px es **0**                                             | `-0.02em` a 28 px; `0` en el `h1` si baja a 24 px                                             |
| E16 | ausencia                | No hay `letter-spacing` en el cuerpo ni en los textos ≤ 18 px                                                           | #18 §6.1: **+0,1 px a 18 px**, **+0,16 px a 14 px** (regla Carbon, tracking positivo en tamaños chicos) | Añadirlo. Es la mitad del "acabado" según #18 §4.6                                            |
| E17 | 854                     | La placa va dentro de `.titulo`, sin cifras tabulares ni cero cortado                                                   | #18 §6.1 nombra la placa entre los campos que lo necesitan                                              | Envolver la placa en su propio `<span>` con `font-variant-numeric: tabular-nums slashed-zero` |

### 8.3 Contraste — lo medido, y por qué el medidor no lo vio

El prototipo trae un medidor en pantalla (líneas 821-834), que es una buena idea mal calibrada:

```js
['Texto',      contraste(hex.txHi, hex.sf1), 7],
['Secundario', contraste(hex.txLo, hex.sf1), 4.5],
['Borde',      contraste(hex.bd,   hex.sf1), 3],
['Marca',      contraste(hex.brSolid, hex.sf1), 4.5],
```

**Compara contra el mínimo tolerado, no contra el objetivo.** La tabla de #18 §6.2 tiene dos columnas: objetivo y mínimo tolerado. El medidor usa la segunda. Consecuencias medidas **[rampa OKLCH de las líneas 744-779, marca azul `#0047c7`]**:

| Rol                              | Medido (claro) | Medido (oscuro) | Objetivo #18 §6.2 | Mínimo | Veredicto real                                      |
| -------------------------------- | -------------- | --------------- | ----------------- | ------ | --------------------------------------------------- |
| Texto principal sobre ficha      | 17,28:1        | 14,88:1         | 7:1               | 4,5:1  | Pasa holgado                                        |
| **Texto secundario sobre ficha** | **6,82:1**     | 7,26:1          | **7:1**           | 4,5:1  | **Falla en claro** — y el cliente es texto de datos |
| **Borde sobre ficha**            | **3,65:1**     | **4,21:1**      | **4,5:1**         | 3:1    | **Falla en ambos** contra el objetivo               |
| Marca sólida sobre ficha         | 5,67:1\*       | 5,29:1\*        | 4,5:1             | 3:1    | Pasa                                                |

\* Calculado para el azul por defecto; varía con el matiz elegido, que es justamente lo que el medidor sirve para vigilar.

**A18.** Corregir los umbrales del medidor a `[7, 7, 4.5, 4.5]` y subir la L del paso secundario hasta que el claro llegue a 7:1. El comentario del código en la línea 754 (_"con L 0.72 el borde daba 2,5:1 y no llegaba al mínimo duro de 3:1"_) muestra el problema de raíz: se calibró contra 3:1 cuando el objetivo era 4,5:1.

**A19 — Los chips de estado no pasan por ningún medidor.** Son hex fijos (líneas 51-66). Medidos:

| Chip                | Texto sobre fondo del chip (claro) | (oscuro) | Fondo del chip sobre la ficha     |
| ------------------- | ---------------------------------- | -------- | --------------------------------- |
| `ok` (listo)        | 4,75:1                             | 8,23:1   | **1,13:1** (claro) / 1,09:1 (osc) |
| `wait` (en proceso) | 5,30:1                             | 7,58:1   | **1,12:1** / 1,04:1               |
| `risk` (atrasado)   | 5,95:1                             | 7,01:1   | **1,19:1** / 1,04:1               |

Dos problemas:

- **El texto del chip en tema claro da 4,75–5,95:1**, por debajo del objetivo de 7:1 de #18 §6.2 para texto de datos (el chip es texto de 16 px a peso 590, no "texto grande": el umbral de #18 para grande arranca en 24 px o 18 px en negrita). En oscuro sí pasa. **La asimetría entre temas es el hallazgo: el tema por defecto es el peor.**
- **El chip no tiene borde y su fondo da 1,04–1,19:1 contra la ficha.** #18 §6.7 especifica para el chip de estado: _"contraste texto ≥ 4,5:1 **y borde ≥ 3:1**"_. **El borde no existe.** La forma de píldora — que es medio del "color + forma + texto" de #18 §6.2 regla 2 — es invisible como forma. Corrección: `border: 1px solid` en el paso 4-6 de la rampa del matiz correspondiente.

**A20 — Los marcadores de forma son demasiado chicos para leerse.** `.estado::before` mide 10×10 px (líneas 324-325) y `.esp::before` 8×8 px (371-372). #18 §6.2 regla 5, de ANSI/HFES 100-2007 §7.2.6.2: para que un carácter **se lea como color** hace falta **≥ 20′**, y para **discriminar** el color **≥ 30′**. Con la conversión de #18 §5.3 (18 px ≈ 17–23′ a 45 cm, es decir ~1,0–1,3′ por px), 10 px caen en **10–13′** y 8 px en **8–10′**. Están por debajo del umbral de lectura de color, y muy por debajo del de discriminación de forma: el triángulo, el rombo y el círculo que distinguen los tres estados **no se distinguen**. Corrección: icono de **20–24 px** (patrón M3 de #18 §6.7), no un punto.

**A21 — El color de especialidad no llega al objetivo de bordes/indicadores.** `oklch(0.55 0.14 H)` (línea 856) medido contra la ficha: **4,33:1 mecánica / 5,14:1 eléctrica / 4,26:1 pintura en claro**, y **3,86 / 3,25 / 3,92 en oscuro**. #18 §6.2 fija 4,5:1 como objetivo para iconos informativos e indicadores de estado. **En oscuro los tres fallan y la eléctrica queda a 3,25:1, al borde del mínimo.** Corrección: separar la L del indicador por tema, como ya se hace con los semánticos.

### 8.4 Deuda menor y observaciones

| #   | Línea(s)         | Observación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A22 | 755-756, 770-771 | `--bd` y `--bd-soft` tienen **exactamente los mismos valores** (`L 0.62 c 0.014` en claro, `L 0.6 c 0.018` en oscuro). El token "soft" existe pero no separa nada: es una intención declarada y no ejercida. Al ejecutar B2 el token sobra entero                                                                                                                                                                                                                                                 |
| A23 | 118-119          | `.seg { border-radius: 8px; overflow: hidden }` con botones sin radio propio: los recorta el `overflow`, lo que produce borde con antialias sucio y, peor, **recorta el anillo de foco** de los botones (§7.2)                                                                                                                                                                                                                                                                                    |
| A24 | 464 + 465        | Densidad C: radio 12 px con padding 16 px. Por la fórmula concéntrica (§7.4), `12 − 16 < 0` ⇒ **todo lo anidado va a esquina recta**. Hoy no hay nada rectangular anidado, así que es preventivo, pero hay que fijarlo antes de meter una foto o un subpanel                                                                                                                                                                                                                                      |
| —   | 59-66            | **El prototipo trae tema oscuro; #18 §7 tensión 8 lo había declarado fuera de alcance** con respaldo de MIL-STD-1472F §5.2.5.2.4 (polaridad positiva en condiciones adversas). **No es un defecto:** #70 lo sacó de _Out of scope_ a propósito, y el prototipo respeta la parte que sí es dura — `estado.tema` arranca en `claro` (línea 783), así que el claro es el predeterminado. Lo que falta es **registrar la decisión en un ADR de #70**, no dejarla implícita en el código del prototipo |
| —   | ausencia         | No existe la perilla `--scale` del "modo taller" de #18 §6.1 (`1` / `1.25`). Las tres densidades cambian **layout**, no **tamaño de carácter**; son cosas distintas y #18 pide las dos                                                                                                                                                                                                                                                                                                            |
| —   | ausencia         | La lista no tiene encabezado de columna, ni siquiera en la densidad compacta, que es la que más se parece a una tabla. Carbon lo especifica con superficie propia (`$layer-accent`) y peso 600 al tamaño del cuerpo (§5.5)                                                                                                                                                                                                                                                                        |

### 8.5 Lo que el prototipo hace bien y no hay que tocar

Para que #70 no lo pierda al reescribir:

- **La rampa en OKLCH con luminosidad fija por rol** (líneas 744-779). Es la misma jugada que Linear documenta con LCH, y es lo que permite dejar que el taller elija su color sin poder romper el contraste.
- **El padding horizontal es 16 px constante en las tres densidades** (líneas 385, 422, 464) y solo cambia el vertical. Es la regla de Carbon que #18 §6.3 recoge, y está bien ejecutada.
- **Las alturas 56 / 72 / 96 px** (384, 421, 463) son exactamente la escalera de #18 §6.5.
- **Los semánticos no se personalizan** (líneas 47-50). El razonamiento del comentario es correcto y es el principio ISA-101 de #18 §6.2 regla 3.
- **`font-variant-numeric` en vez de `font-feature-settings`** (273, 287): el prototipo está del lado correcto de la especificación, y es #18 el que hay que corregir (§7.5).
- **Estado = color + forma + texto** (309-354). La intención es la correcta; lo que falla es el tamaño del portador de forma (A20), no el modelo.

---

## 9. Dónde esta investigación corrige o matiza a #18

Declarado explícitamente, para que #70 no tenga que adivinar:

| #18 dice                                                                                                        | Esta investigación encuentra                                                                                                                                                                                          | Resolución                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §6.1 `font-feature-settings: "zero" 1`                                                                          | CSS Fonts 4 §6.12 lo desaconseja explícitamente para esa característica y manda usar `font-variant-numeric: slashed-zero`                                                                                             | **Se corrige #18.** Ver §7.5                                                                                                                                                      |
| §6.2 anillo de foco: _"4,5:1 contra ambos vecinos"_ (métrica SC 1.4.11)                                         | WCAG 2.2 SC 2.4.13 usa otra métrica: 3:1 entre los **mismos píxeles** enfocado vs. no enfocado, más un área ≥ perímetro de 2 px                                                                                       | **Se conserva #18** (es más exigente) y se anota que son dos métricas distintas                                                                                                   |
| §6.4 _"preferir escalones de superficie"_ sin cuantificar                                                       | M3 cuantifica: 2 tonos HCT por escalón ⇒ ~1,05:1 en claro; en oscuro los pasos deben abrirse hasta 5 tonos para el mismo efecto                                                                                       | **Se completa #18** con la cifra y con la asimetría claro/oscuro (§7.1)                                                                                                           |
| §6.7 el `data-28` de la tarjeta es la placa / nº de orden                                                       | ADR 0003 hace del **tiempo parado** el criterio de orden y por tanto el dato de vistazo                                                                                                                               | **Gana el ADR.** Registrar la divergencia en #70 (§5.5)                                                                                                                           |
| §7 tensión 8: modo oscuro fuera de alcance                                                                      | El prototipo de #70 ya lo trae, y funciona (los chips incluso miden **mejor** en oscuro que en claro)                                                                                                                 | Decisión de producto, no de investigación. Debe quedar en un ADR de #70                                                                                                           |
| §4.6: el 590 de Linear _"corrige el salto óptico entre Medium y Semibold que Inter tiene en la rejilla de 100"_ | Dos correcciones. (a) Que eso corrija un salto óptico **no lo dice rsms en ninguna parte** (§6.6). (b) Los 510/590/680 son del **sitio de marketing** de Linear; **su aplicación declara 300/450/500/600/700** (§4.1) | **Se conserva el 590 como opción, pero pierde su respaldo.** Ni el autor de Inter lo justifica ni el producto de Linear lo usa. Decidir 590 vs. 600 mirándolos en pantalla en #70 |
| §4.5: el cuerpo denso vive en 14-15 px                                                                          | La app de Linear usa **15/23 px a peso 450**, no 400. El interlineado de 23 px sobre 15 es 1,53 — más aire del que sugiere la cifra de tamaño                                                                         | Refuerza a #18: la densidad se compra con interlineado, no con tamaño. Y avisa que el "look Linear" incluye un cuerpo **más grueso** (450), no más fino                           |
| §6.2 regla 1: los bordes hairline del cliché SaaS dan ~1,2:1 y están prohibidos                                 | **Confirmado con cuatro productos distintos**, medido: Linear 1,221:1, Vercel 1,192:1, Notion 1,149:1 (§4.4). Ninguna referencia moderna cumple SC 1.4.11 en sus bordes                                               | **Se confirma #18.** Lo copiable de esos productos no es el borde suave: es que **casi no usan bordes**                                                                           |
| §6.2 objetivo 7:1 para texto de cuerpo y datos                                                                  | Choca con §5.1 (el reposo de la fila debería ir un paso por debajo del primario). Carbon baja a `$text-secondary`; con el objetivo de 7:1 ese "secundario" ya no puede ser flojo                                      | El paso se compra **subiendo el primario**, no bajando el secundario (§5.1)                                                                                                       |

---

## 10. Fuentes

Clasificadas por confianza, igual que #18 §8. Lo que no se pudo verificar está declarado como tal.

### 10.1 Normas y especificaciones (confianza alta)

| Fuente                                                                                                                                               | Qué aporta a este documento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WCAG 2.2 — [Understanding SC 2.4.11 _Focus Not Obscured (Minimum)_](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)** | Nivel **AA**: _"When a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content."_ Fallo **F110** por encabezado o pie pegajoso. Mitigación por `scroll-padding`. SC 2.4.12 es la versión AAA                                                                                                                                                                                                                                                       |
| **WCAG 2.2 — [Understanding SC 2.4.13 _Focus Appearance_](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)**                       | Nivel **AAA**: área ≥ _"a 2 CSS pixel thick perimeter of the unfocused component"_ y _"contrast ratio of at least 3:1 between the same pixels in the focused and unfocused states"_. Ejemplos con `2px` de trazo y con dos contornos anidados                                                                                                                                                                                                                                                                   |
| **[CSS Fonts Module Level 4](https://drafts.csswg.org/css-fonts-4/)** (Editor's Draft, W3C CSS WG)                                                   | §6.7 definiciones de `tabular-nums` (`tnum`) y `slashed-zero` (`zero`) · §6.12 _"Authors should not use `font-feature-settings` to set any of the font features in the table below"_ + la tabla de reemplazos · §7.2 precedencia (`font-variation-settings` gana) y recorte del peso al descriptor del `@font-face` · §8.1 `font-optical-sizing: auto` es el valor inicial · §5.2 algoritmo de caída de peso · §2.8 los ejes de variación no cuentan como síntesis · §11.1 `woff2-variations` como alias legacy |
| **[ANSI/HFES 100-2007](https://www.xybix.com/hubfs/ANSI_HFES_100-200727E2.pdf)**                                                                     | §7.2.6.2: color legible ≥ 20′, discriminación de color ≥ 30′. Es la norma con la que se mide el marcador de forma de 8–10 px del prototipo (A20). Citada vía #18 §6.2                                                                                                                                                                                                                                                                                                                                           |
| **[Angular — Service worker configuration](https://angular.dev/ecosystem/service-workers/config)**                                                   | `prefetch` _"ensures resources are available whenever they're requested, even if the browser is currently offline"_ vs. `lazy` _"Does not cache any of the resources up front."_ Y el orden de evaluación de los `assetGroups`                                                                                                                                                                                                                                                                                  |

### 10.2 Sistemas de diseño y productos, con valores de primera mano

| Fuente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Qué aporta                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **IBM Carbon — [Data table / Style](https://carbondesignsystem.com/components/data-table/style/)** y **[/ Usage](https://carbondesignsystem.com/components/data-table/usage/)** (leídas 2026-08-19; la página declara _"Last updated 13 August 2026"_)                                                                                                                                                                                                                                                                                                                                                                                                                                                       | **La referencia más aplicable.** Tabla completa de tokens por estado de fila (reposo en `$text-secondary`, hover y seleccionado en `$text-primary`), `border-bottom: $border-subtle` como único separador, `$layer-selected-hover` como cuarto estado, zebra como modificador con propósito declarado, tipografía 20/400 · 14/600 · 14/400, padding 16 px, alturas 24/32/40/48/64, `overflowMenuOnHover` y su excepción táctil                   |
| **Material 3 — tokens oficiales** en [`material-components/material-web`](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-color.scss) (`_md-sys-color.scss`, `_md-sys-elevation.scss`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Los seis tonos HCT de la escalera `surface-container-*` en claro (100/98/96/94/92/90) y oscuro (4/6/10/12/17/22), de donde salen los escalones medidos de §7.1. Y la escala de elevación en dp (0/1/3/6/8/12)                                                                                                                                                                                                                                    |
| **Linear — [_A calmer interface for a product in motion_](https://linear.app/now/behind-the-latest-design-refresh)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Los dos principios en primera persona: _"Don't compete for attention you haven't earned"_ y _"Structure should be felt not seen"_. Y la declaración de que redujeron el número de separadores y suavizaron su contraste                                                                                                                                                                                                                          |
| **Linear — [_How we redesigned the Linear UI (part II)_](https://linear.app/now/how-we-redesigned-the-linear-ui)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | El paso a LCH _"which has the benefit that it's perceptually uniform"_ para _"deal with different elevations for our surfaces"_, y el aumento de contraste del texto y los iconos neutros                                                                                                                                                                                                                                                        |
| **Linear — CSS de producción** (`static.linear.app/web/_next/static/css/index.CtQdVDoA.css`, descargado 2026-08-19)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `--font-weight-medium: 510`, `--font-weight-semibold: 590`, `--font-weight-bold: 680`. Y que sirven `InterVariable.woff2?v=4.1` desde su propio origen, byte-idéntico al oficial y sin subsetear                                                                                                                                                                                                                                                 |
| **[rsms/inter](https://github.com/rsms/inter)** — release [v4.1](https://github.com/rsms/inter/releases/tag/v4.1), `docs/inter.css`, [rsms.me/inter](https://rsms.me/inter/) y su [lista de features](https://rsms.me/inter/#features)                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Tamaños exactos de los binarios, `fvar` (`opsz` 14–32, `wght` 100–900), el `@font-face` oficial, el nombre `InterVariable` con `'Inter var'` marcado como legacy, y la recomendación de `ss02` / `cv08` / `cv05` / `zero` para desambiguar caracteres parecidos                                                                                                                                                                                  |
| **Linear — CSS de la aplicación** (`static.linear.app/client/assets/Root-DmGSVrXS.css`, 482 KB; más `ThemeProvider.KvoQ0Edx.js` y `mixins.stylex.BjLBTeSX.js`; descargados 2026-08-19)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | La escala tipográfica real del producto (15/23 a peso 450), los tokens de movimiento (`highlightFadeIn 0s` / `highlightFadeOut .15s` / `quickTransition .1s`), el hover condicionado a `@media (any-hover: hover) and (any-pointer: fine)` con `:active` fuera, la selección por `box-shadow … inset`, el redondeo antiblur con `round(up, …)`, y el vocabulario de tokens semánticos (`labelTitle/Base/Muted/Faint`, `bgSelected`, `bgBorder…`) |
| **[Linear — Display options](https://linear.app/docs/display-options)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Textual: la lista puede mostrar u ocultar _"**time in status**"_ entre sus propiedades. Y su menú de `Ordering` (`Status, Manual, Priority, Last created, Last updated, Due date, Link count`) **no permite ordenar por él** — que es justo lo que hace ADR 0003                                                                                                                                                                                 |
| **[Linear — changelog 2024-03-20](https://linear.app/changelog/2024-03-20-new-linear-ui)** y **[2026-03-12](https://linear.app/changelog/2026-03-12-ui-refresh)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | _"increased density and better contrast"_ (Inbox, 2024) · _"Introducing a calmer, more consistent interface"_ · _"Navigation sidebars are slightly dimmer, allowing the main content area to stand out"_ (2026)                                                                                                                                                                                                                                  |
| **[Vercel Geist — Table](https://vercel.com/geist/table)** (medido en DOM renderizado, 2026-08-19)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Fila de datos **40 px**, cabecera 36 px, **sin separadores entre filas por defecto**; zebra y bordes como variantes _opt-in_; y `--ds-focus-ring: 0 0 0 2px hsla(0,0%,100%), 0 0 0 4px hsla(212,100%,48%)`, que es el patrón de dos anillos de §7.2 escrito con `box-shadow`                                                                                                                                                                     |
| **Notion** — base de datos publicada, medida en DOM (283 filas) y **[docs de tablas](https://www.notion.com/help/tables)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Alto de fila **37 px** constante; separador `1px solid rgba(42,28,0,0.07)` (hairline alfa cálida); texto `#2C2C2B`; sin zebra ni bordes verticales. Los docs confirman que **no hay ajuste de alto de fila**: la densidad se gobierna por `Wrap text`                                                                                                                                                                                            |
| **[Retool — Table customization](https://docs.retool.com/apps/guides/data/table/customization)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | _"You can use the **Row height** setting to adjust the height of table rows."_ Presets **20 / 32 / 48 / 60 px** y `Dynamic`                                                                                                                                                                                                                                                                                                                      |
| **[Superhuman — _Superhuman is built for speed_](https://blog.superhuman.com/superhuman-is-built-for-speed/)** (2022-06-28)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | _"The 100ms rule states that every digital interaction should be faster than 100ms."_ · atribución a Paul Buchheit · _"aims for latency less than 50ms whenever possible"_                                                                                                                                                                                                                                                                       |
| **Rubro taller — páginas y soporte oficiales**: [Tekmetric Job Board](https://www.tekmetric.com/post/repairs-management-software-job-board) y [labels vs. statuses](https://support.tekmetric.com/hc/en-us/articles/360039292193) · [Shopmonkey workflow](https://support.shopmonkey.io/hc/en-us/articles/38743858598676), [estados](https://www.shopmonkey.io/help/repair-order-status) y [tarjetas](https://www.shopmonkey.io/help/workflow-cards) · [AutoLeap Work Board](https://autoleap.com/features/work-board/) · [Shop-Ware](https://shop-ware.com/) · [Mitchell 1 Manager SE 8.5.1](https://mitchell1.com/shopconnection/manager-se-8-5-1-wip-screen-enhancements-now-have-it-even-more-your-way/) | Las citas textuales de §4.2 sobre columnas fijas vs. libres, la separación estado/columna de Shopmonkey, las vistas `Standard`/`Condensed` con 15 campos conmutables, el board **por técnico** de Shop-Ware y la llegada del modo oscuro a Mitchell 1 en diciembre de 2024                                                                                                                                                                       |
| **Shopmonkey — CSS de producción** (`blob-cdn.shopmonkey.cloud/shop/stable/…/_next/static/css/d3b13f2aea946976.css`, 780 KB)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | El único sistema del rubro con design system verificable: `blue-500 #4A65FF` (no el `#3B82F6` de fábrica), rampa `gray-50 #F7F8FC` … `gray-900 #1D2030` con medio-paso `gray-850`, tokens semánticos y escala de radios de 2 a 52 px. Sin modo oscuro                                                                                                                                                                                            |
| **[Chromium Blog — _Updates to Form Controls and Focus_](https://blog.chromium.org/2020/03/updates-to-form-controls-and-focus.html)** (2020-03-30)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | El anillo de foco por defecto de Chrome 83 en adelante: un contorno oscuro grueso rodeado por un contorno blanco fino, trabajo conjunto de Microsoft y Google                                                                                                                                                                                                                                                                                    |
| **[NN/g — _Data Tables: Four Major User Tasks_](https://www.nngroup.com/articles/data-tables/)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | _"Borders, zebra striping, and hover-triggered highlighting of a record can all help"_ y _"Freeze header rows and header columns (if the table is larger than the screen)"_. **Contradice parcialmente a Linear** sobre separadores; la tensión se declara y se resuelve en §5.3                                                                                                                                                                 |
| **[Cloud Four — _The Math Behind Nesting Rounded Corners_](https://cloudfour.com/thinks/the-math-behind-nesting-rounded-corners/)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | La derivación geométrica de `outerRadius − gap = innerRadius` y la implementación con `calc()`. La fórmula es geometría, no opinión: confianza alta pese a ser un blog                                                                                                                                                                                                                                                                           |

### 10.3 Mediciones propias hechas para este documento

Todas reproducibles; el método está junto a cada cifra.

| Medición                                                                           | Método                                                                                                                                                                          |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Escalones de superficie de M3 en relación de contraste (§7.1)                      | Tonos HCT del token file → `Y = ((L+16)/116)³` → `(Y₁+0,05)/(Y₂+0,05)`                                                                                                          |
| Rampa completa del prototipo y todos los contrastes de §8.3                        | Reimplementación de las funciones OKLCH→sRGB de las líneas 660-737 del propio prototipo, con la marca azul `#0047c7` por defecto                                                |
| Capas de estado de M3 en relación de contraste (0,08 → 1,171:1; 0,12 → 1,271:1)    | Mezcla alfa de `on-surface` sobre blanco, luego contraste WCAG                                                                                                                  |
| `#E5E7EB` sobre blanco = **1,238:1**                                               | Contraste WCAG. Comparado con `1,05⁴ = 1,216`: el hairline del cliché SaaS pesa más que cuatro escalones de superficie de M3                                                    |
| Escalones de superficie, pasos de texto y bordes de Linear, Vercel y Notion (§4.4) | Contraste WCAG sobre los hex publicados en su CSS; el separador de Notion se resolvió primero mezclando `rgba(42,28,0,0.07)` sobre blanco ⇒ `#f0efed`                           |
| Alturas de fila de Linear, Vercel Geist y Notion (§4.1)                            | Playwright + Chromium 1440×900 @2×, `getComputedStyle` sobre el DOM renderizado                                                                                                 |
| Alturas y hex del rubro taller (§4.2)                                              | Capturas oficiales descargadas y examinadas, con muestreo de píxel. **Ninguno de los cuatro sistemas expone su CSS** (403, DNS, OAuth, o no es web); Shopmonkey es la excepción |
| Tamaños de los binarios de Inter y de los subsets (§6.1, §6.2)                     | `gh api` para el release; `pyftsubset --flavor=woff2` (fontTools 4.63.0) para los subsets; `curl -w %{size_download}` para los de `fonts.gstatic.com`                           |
| Features `GSUB` presentes en cada build de Inter (§6.3)                            | Lectura de la tabla `GSUB` con fontTools sobre el `.woff2` de gstatic y sobre el `.ttf` oficial 4.1                                                                             |
| Área de tinta por peso (§6.6)                                                      | `fontTools.varLib.instancer.instantiateVariableFont` + `AreaPen` sobre los glifos `H` y `o`, a `opsz = 14`                                                                      |

### 10.4 Afirmaciones con confianza media o baja (marcadas como tales en el texto)

| Afirmación                                                                                  | Estado                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El patrón "reposo secundario / apuntado primario" **causa** la percepción de calidad (§5.1) | **Media.** Carbon publica la tabla de tokens; la lectura de por qué funciona es inferencia de este documento, no afirmación de IBM                                                                                                                                                                                                                                        |
| "El 590 corrige el salto óptico de Inter" (#18 §4.6)                                        | **Baja.** rsms no lo dice en `rsms.me/inter`, ni en el `README`, ni en `docs/inter.css`, ni en el `help.txt` del release, ni en los issues. Lo verificable es que **Linear usa 510/590/680** (confianza alta) y que Inter tiene **tres masters** (100/400/900), lo que explicaría la no uniformidad — pero eso último es inferencia                                       |
| `ConcentricRectangle` de Apple y la guía de WWDC25 sobre concentricidad (§7.4)              | **Media.** `developer.apple.com` es una SPA y no se pudo leer directamente; lo escrito proviene de resultados de búsqueda consistentes que citan la [página de la API](https://developer.apple.com/documentation/swiftui/concentricrectangle) y la [sesión 356](https://developer.apple.com/videos/play/wwdc2025/356/). **La fórmula en sí es geometría: confianza alta** |
| Alineación a la derecha para cantidades comparables (§5.4)                                  | **Media.** Es convención tipográfica documentada por uso; ni Carbon ni NN/g publican una regla explícita de alineación numérica                                                                                                                                                                                                                                           |
| Soporte de navegador para `font-weight` numérico arbitrario                                 | **Media.** Se dio por bueno junto con el soporte de fuentes variables; no se verificó contra caniuse en esta sesión                                                                                                                                                                                                                                                       |
| Cobertura del `unicode-range` `latin` para las placas costarricenses                        | **Sin verificar.** Son A–Z y 0–9, así que casi con seguridad sí, pero no se comprobó carácter por carácter                                                                                                                                                                                                                                                                |
| Height como referencia visual                                                               | **Nula.** `height.app` corta la conexión contra Chromium (`ERR_CONNECTION_RESET`) y `WebFetch` devuelve `ECONNRESET`; su página de features renderiza en blanco. **No se reporta nada de Height** en este documento                                                                                                                                                       |
| Alturas de tarjeta de Shopmonkey (~480-520 px _Standard_) y de AutoLeap                     | **Media / nula.** La de Shopmonkey se estimó por reescalado de una captura de marketing; la _Condensed_ no se pudo verificar. Las de AutoLeap **no son reportables**: sus capturas son renders reescalados                                                                                                                                                                |
| Hex del rubro taller (Tekmetric, AutoLeap, Shop-Ware, Mitchell 1)                           | **Media.** Salen de muestreo de píxel sobre capturas oficiales, no de hojas de estilo — esos cuatro no exponen su CSS. Los de Shopmonkey sí son de su CSS de producción: **confianza alta**                                                                                                                                                                               |
| Que los valores medidos en `linear.app` coincidan con la app real                           | **Media.** `linear.app` es una maqueta de marketing, construida con los tokens y la fuente reales pero no es el producto. Los números medidos tienen confianza alta; su equivalencia con la app, media                                                                                                                                                                    |
| Fechas de las versiones 9.2.1 / 8.5.1 de Mitchell 1                                         | **Sin verificar.** El foro donde se anuncian responde 403 por Cloudflare                                                                                                                                                                                                                                                                                                  |
| Que 510/590/680 se distingan de 500/600/700 **a ojo**                                       | **Sin verificar, y es lo más importante que falta.** Ningún navegador se abrió en esta investigación. Diferencia medida: 1,3 % de área de tinta. Hay que verlos lado a lado antes de cerrar #70                                                                                                                                                                           |
