# Diseño premium B2B aplicable a una app de taller (Bitácora)

> Investigación del ticket [#18](https://github.com/FabianRG1990/repositorio-de-apps/issues/18) del mapa [#14](https://github.com/FabianRG1990/repositorio-de-apps/issues/14).
> Alimenta el ticket [#25](https://github.com/FabianRG1990/repositorio-de-apps/issues/25) (prototipar tokens de diseño).
> Fecha: 2026-08-17. No hereda nada de `apps/bahia`.

---

## 1. Pregunta

¿Qué patrones de diseño visual (tipografía, paleta de color, densidad de layout, jerarquía de información) usan los productos SaaS B2B considerados "premium" y modernos — tanto referencias generales (Apple, Stripe, Linear, Vercel) como software de gestión/operaciones específicamente — que sean aplicables a una app usada por personal de taller en un entorno de trabajo (no oficina)?

Investigar qué hace que una herramienta operativa (no marketing) se perciba como premium sin sacrificar la legibilidad/usabilidad en el piso del taller (manos sucias, pantallas táctiles, luz variable, uso rápido entre tareas).

---

## 2. Resumen ejecutivo

1. **Lo premium en herramientas operativas no es un estilo, es un conjunto de escalas cerradas.** Geist, Linear, Stripe, Carbon y Atlassian convergen en unidad base de **8 px** (Geist en 4 px), 10–14 pasos de espaciado, 10 pasos de color por matiz y radios de **4–6 px**. Ninguno improvisa valores; Carbon lo dice literal: _"deviating from the spacing scales should be avoided whenever possible."_
2. **La densidad se controla con interlineado a tamaño constante, no con tamaño de fuente.** Carbon: `body-compact-01` 14/18 vs `body-01` 14/20. Geist: `label-16` 16/20 vs `copy-16` 16/24. **Y el padding horizontal de una fila no cambia entre densidades (16 px fijo); solo cambia el vertical.**
3. **El cuerpo de texto de los SaaS densos (14–15 px) NO es transferible.** Se lee a 60 cm en un monitor (≈20–24 arcmin). En tableta a 45 cm, 14 px caen en 11–15 arcmin, **por debajo del mínimo normativo de 16′** (ANSI/HFES 100-2007 §7.2.6.1). **El cuerpo de Bitácora es 18 px; el dato de vistazo, 28 px; el piso absoluto, 14 px.**
4. **Contraste objetivo 7:1 en texto de cuerpo, no 4,5:1.** WCAG fija 4,5:1 para agudeza 20/40 y 7:1 para 20/80; el sol, el reflejo y la grasa sobre el vidrio producen sobre el usuario el mismo efecto que una pérdida de sensibilidad al contraste. Bordes e iconos: objetivo 4,5:1 (mínimo 3:1 de SC 1.4.11).
5. **Áreas táctiles: 48 px mínimo · 56 px estándar · 72–80 px para la acción primaria y para uso con guante**, con ≥ 8 px de separación siempre, ≥ 16 px entre controles de una barra y ≥ 24 px si hay uno destructivo. Los 24 px de WCAG y los 44 px de Apple son **pisos de accesibilidad, no objetivos industriales**; la evidencia empírica converge en 9,5 mm sin guante y 18–20 mm en condiciones adversas, sin ganancia por encima de 22 mm.
6. **Con guante la evidencia es concreta.** Ray et al. (2016): con dimensionado MIL-STD (15/20 mm) los participantes **no cometieron errores**; con dimensionado Apple (8,5 mm) sí (F(1,5)=15,00, p=,012). Causa dominante de fallo: **la tela suelta disparaba scroll espurio**, no apuntar mal → subir el umbral de scroll a ≥12–16 px y no depender de gestos.
7. **Escala de espaciado 2/4/8/12/16/20/24/32/40/48/64/80**, radio base **8 px** (equivalente proporcional del 6 px de Geist/Stripe sobre controles de 56–72 px), borde 1–1,25 px, foco 2 px con 2 px de offset.
8. **Movimiento: 0 ms para aparecer, 100–150 ms para desaparecer** (asimetría de Linear: `highlightFadeIn: 0s` / `fadeOut: 0.15s`), respuesta visible al toque **≤ 100 ms** (MIL-STD-1472F §5.4.6.4). Capas de estado M3: hover 0,08 / focus 0,12 / pressed 0,12.
9. **Pesos 400 / 590 / 680** (valores fuera de rejilla de Linear con Inter Variable). **Prohibidos ≤ 300**: Apple lo desaconseja y ANSI/HFES lo cuantifica (trazo entre 1/6 y 1/12 de la altura de carácter). Tracking **positivo** en ≤18 px (regla Carbon, el único sistema hecho para tablas densas), negativo solo en ≥28 px.
10. **Ningún estado codificado solo por color** (ANSI/HFES: _"purely chromatic contrasts have poor visibility"_), polaridad positiva (texto oscuro sobre claro), color saturado reservado a estado y acción primaria (principio ISA-101), y confirmación explícita obligatoria en acciones críticas (MIL-STD-1472F §5.4.6.6).
11. **Un solo escalar controla la densidad**: `--scale: 1 → 1,25` para el "modo taller" (modelo `spacingUnit` de Stripe), justificado porque a contraste efectivo de ~3:1 la norma exige subir el carácter a 30 arcmin.
12. **Y por qué importa el aspecto en una demo de venta:** Kurosu & Kashimura (CHI '95, n=252, 26 variantes) midieron una correlación de **r = 0,589** entre belleza aparente y usabilidad aparente. La contracara documentada: la estética **enmascara** problemas de usabilidad en pruebas — de ahí que las cifras del §5 sean innegociables.

---

## 3. Convenciones de unidades usadas en este documento

Todas las cifras físicas dependen de cuántos milímetros mide un píxel CSS en el dispositivo real. No es una constante:

| Contexto                                          | Definición                                  | mm por px CSS  |
| ------------------------------------------------- | ------------------------------------------- | -------------- |
| Píxel de referencia CSS (escritorio, 96 dpi)      | 1/96 in                                     | 0,265 mm       |
| Teléfono Android/iOS (1 px CSS = 1 dp = 1 pt)     | 1/160 in (Android mdpi) / 1/163 in (iPhone) | **≈ 0,157 mm** |
| Tableta tipo iPad (264 ppi, DPR 2)                | 2/264 in                                    | **≈ 0,192 mm** |
| Tableta Android de gama media (~180 ppi, DPR 1,5) | 1,5/180 in                                  | ≈ 0,212 mm     |

En este documento se usa **0,157 mm/px para teléfono** y **0,19–0,21 mm/px para tableta**. Cuando una fuente cita milímetros (MIL-STD, NN/g, ANSI/HFES) se convierte con esas equivalencias y se indica el dispositivo.

Métrica tipográfica asumida: **x-height ≈ 0,55 em** (valor propio de Inter, que declara "a tall x-height to aid in legibility of lower-case text"). Con una tipografía de x-height menor (0,50 em, p. ej. muchas grotescas clásicas) todos los tamaños de fuente derivados suben ~10 %.

---

## 4. Qué hace que un producto se perciba "premium" (mecánica, no adjetivos)

Ninguna de las referencias premium publica un documento que diga "así se ve caro". Lo que sí publican —o dejan en su CSS de producción— son **decisiones numéricas repetidas**. Al comparar Vercel Geist, Linear, Stripe, IBM Carbon, Atlassian y Apple, la percepción de calidad se reduce a siete mecanismos concretos.

### 4.1 La apariencia cambia el juicio de usabilidad (y aquí se vende una demo)

Kurosu y Kashimura (Hitachi Design Center, CHI '95, _Apparent usability vs. inherent usability_) hicieron que 252 participantes evaluaran 26 variantes de una interfaz de cajero automático en dos ejes: qué tan fácil de usar _parecía_ y qué tan bella era. La usabilidad aparente correlacionó más fuerte con la belleza aparente (**r = 0,589**) que con la usabilidad inherente. Es el origen del _aesthetic-usability effect_.

Para Bitácora esto no es decoración: la Fase 1 **es una demo de venta**. El dueño del taller juzgará la profundidad funcional del sistema por su aspecto antes de tocar nada. Pero el mismo efecto tiene su contracara documentada — la estética _enmascara_ problemas de usabilidad y los hace más difíciles de detectar en pruebas. Es decir: lo premium ayuda a vender y estorba a validar. Las cifras duras del §5 son el antídoto.

### 4.2 Escalas discretas y cerradas, sin valores fuera de escala

Todos los sistemas maduros cierran el espacio de decisión. Carbon lo dice literalmente: _"deviating from the spacing scales should be avoided whenever possible"_, y sobre responsividad: _"Are the spacing tokens responsive? **No**."_

**Convergencia de la unidad base — es unánime:**

| Sistema        | Unidad base                                                                | Sub-pasos  |
| -------------- | -------------------------------------------------------------------------- | ---------- |
| IBM Carbon     | `miniUnit = 8px`                                                           | 2, 4       |
| Atlassian      | `space.100 = 8px` (el número es el % de la base)                           | 2, 4, 6    |
| Stripe HDS     | `space-100 = 8px` (mismo esquema de nombres que Atlassian)                 | 1, 2, 4, 6 |
| Vercel Geist   | `--spacing: 0.25rem = 4px`                                                 | —          |
| Carbon 2x Grid | _"The basic unit of 2x Grid geometry is the **8-pixel square mini unit**"_ | —          |

Stripe y Atlassian llegaron **independientemente al mismo esquema de nombres** (`100` = la unidad de 8 px, el número es el porcentaje). Carbon publica 13 pasos (2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160); Atlassian 14 en el rango 0–80 px; Stripe 36 pasos de 0 a 200 px, con incrementos de 4 px hasta 44 y de 8 px de ahí en adelante.

Linear va un paso más allá en la nomenclatura: sus radios se llaman `--radius-4`, `--radius-6`, `--radius-8`, `--radius-12`… **el número _es_ el valor**. No hay abstracción `sm/md/lg` que memorizar ni discutir.

### 4.3 El color como escala semántica de 10 pasos, no como paleta

El modelo más implementable de todo el conjunto es el de **Geist** (derivado de Radix). Geist declara: _"There are 10 color scales in the system"_, y asigna a cada tramo un rol fijo:

| Pasos          | Rol declarado (verbatim)                                                                 |
| -------------- | ---------------------------------------------------------------------------------------- |
| Background 1–2 | _"two background colors for pages and UI components"_; el 2 _"should be used sparingly"_ |
| **1–3**        | _"Component Backgrounds… 1 = default, 2 = hover, 3 = active"_                            |
| **4–6**        | _"Borders… 4 = default, 5 = hover, 6 = active"_                                          |
| **7–8**        | _"High Contrast Backgrounds"_ (el relleno sólido)                                        |
| **9–10**       | _"Text and Icons… designed for **accessible** text and icons"_                           |

Lo interesante: **Geist no publica ni una sola relación de contraste**. Codifica la accesibilidad _estructuralmente_ — los pasos 9–10 "son los accesibles". Elegir bien el paso sustituye a medir el ratio. Carbon y Atlassian tampoco publican ratios; **solo Apple los declara** (4,5:1 hasta 17 pt, 3:1 a 18 pt o en negrita, atribuidos a WCAG AA, con APCA nombrado como métrica alternativa).

**La neutralidad de la rampa gris es una decisión visible.** Geist usa un gris **puro** (hue 0°, saturación 0 % en los 10 pasos). Stripe usa un neutro con **matiz azul** (`neutral-500` = `#64748d`) y concentra los pasos finos en los extremos (25/50/75 y 950/975/990), donde la diferencia perceptual es menor. Ambas son coherentes; lo que ninguna hace es mezclar grises de distinta temperatura.

**Y el color saturado se reserva.** Es también el principio central de la práctica ISA-101 de HMI de alto rendimiento: fondo gris apagado, proceso en colores desaturados, y el color saturado (rojo, ámbar) **reservado a la condición anormal**, de modo que una alarma real salte contra una pantalla por lo demás silenciosa. _(Confianza: media — ISA-101.01-2015 es de pago; esta descripción proviene de fuentes secundarias consistentes entre sí, no del texto normativo.)_

### 4.4 La densidad se controla con interlineado, no con tamaño de fuente

Este es el hallazgo más útil de toda la investigación para el ticket #25.

- **Carbon** define dos variantes del _mismo_ tamaño: `body-compact-01` = **14 px / 18 px (1,286)** y `body-01` = **14 px / 20 px (1,429)**. Dos píxeles de interlineado _son_ el interruptor de densidad.
- **Geist** codifica la misma idea con dos familias: _"Label… designed for single-lines"_ vs. _"Copy… designed for multiple lines of text, having a higher line height than Label."_ `label-16` = 16/20 (1,25); `copy-16` = 16/24 (1,50). **Mismo tamaño, 4 px de interlineado separan denso de cómodo.**
- **Carbon lo refuerza en su tabla de datos:** el `padding` **horizontal es constante en 16 px** en las cinco densidades; **solo cambia el vertical** (xs 2 px, sm/md 7 px, lg/xl 16 px).

La escalera de altura de fila de Carbon es la única publicada por un sistema B2B: **xs 24 px · sm 32 px · md 40 px · lg 48 px (por defecto) · xl 64 px**. Con la advertencia textual: _"Extra large row heights are only recommended if your data is expected to have two lines of content in a single row."_ Y el detalle crítico para nosotros: **32 px y 40 px están por debajo del mínimo táctil de 44 pt de Apple** — xs/sm/md de Carbon son densidades _de puntero_, no de dedo.

### 4.5 El cuerpo denso vive en 14–15 px; el 16 px es tamaño de marketing

Carbon lo declara sin rodeos: _"The productive type set uses a base type size of **14 px**, while the expressive type set uses a base type size of **16 px**."_ Y explica cuándo se usa el productivo:

> _"Product pages have a higher density of information housed inside containers for space efficiency, and in these situations fixed type styles are a must."_ … _"space efficiency is key. Keeping content condensed is helpful to support focus on complex tasks."_

Convergencia: Carbon **14 px** · Atlassian por defecto **14 px** · Geist `copy-14`/`label-14` (_"most commonly used text style"_) **14 px** · Linear **15 px** (`--text-regular: 0.9375rem`, un valor deliberadamente no obvio) · Apple macOS **13 pt**. Los 17 pt de iOS son un número **táctil**, no de densidad de escritorio.

Geist marca el límite explícitamente: `copy-20`/`copy-24` son _"For hero areas on **marketing** pages"_ — excluidos del UI de producto.

**Pero esto es exactamente lo que NO se hereda tal cual** para el taller (§5.3): esos 14–15 px se leen a 50–60 cm en un monitor de 0,265 mm/px, lo que equivale a ~20–24 arcmin. En una tableta a 45 cm, 14 px son ~11–15 arcmin: por debajo del mínimo normativo.

### 4.6 El peso y el tracking hacen el "acabado" — y aquí las referencias se bifurcan

**Pesos:**

| Sistema            | Cuerpo  | Énfasis                                              | Nota                                                                                      |
| ------------------ | ------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Stripe (marketing) | **300** | **400**                                              | Ningún titular de stripe.com pasa de 400                                                  |
| Linear             | 400     | **510 / 590 / 680**                                  | Valores _fuera_ de la rejilla 500/600/700, para corregir el peso óptico de Inter Variable |
| Geist              | normal  | semibold (titulares), medium (botones)               |                                                                                           |
| Carbon             | 400     | **600** (titulares ≤32 px), **300** (display ≥42 px) |                                                                                           |
| Apple              | Regular | Semibold/Bold                                        | _"avoid Ultralight, Thin, and Light"_                                                     |

El truco de Linear (**590 en vez de 600**) es copiable y gratis: con una fuente variable, los pesos intermedios corrigen el salto óptico entre Medium y Semibold que Inter tiene en la rejilla de 100. Los pesos 300 de Stripe, en cambio, **caen fuera de la guía de Apple** y fuera del piso de trazo de HFES (§5.3); funcionan en una página de marketing a 34 px, no en una app de piso de taller.

**Tracking — bifurcación real, no un detalle:**

- **Negativo en tamaños pequeños:** Linear (−0,011 em a 15 px, hasta −0,015 em a 10 px), Geist (−0,02 em de 14 a 20 px; −0,04 em de 24 a 32; −0,06 em ≥ 40 px, **y 0 en todo el texto de cuerpo**), Stripe (−0,01/−0,02 em solo en titulares).
- **Positivo en tamaños pequeños:** **Carbon** (+0,32 px a 12 px ≈ +0,027 em; +0,16 px a 14 px ≈ +0,011 em).
- **Apple cruza el cero en 12 pt:** la tabla de tracking de SF Pro va de **+6/1000 em a 11 pt**, **0 a 12 pt**, negativo de 13 a 20 pt (mínimo **−0,43 pt a 17 pt**), y otra vez positivo de 24 pt en adelante (+0,40 pt hacia 34 pt).

**Carbon es el atípico, y lo es precisamente porque es el único diseñado para tablas de datos densas.** Para una herramienta operativa, el tracking positivo en tamaños pequeños es la opción mejor sustentada; el negativo se reserva a los tamaños de vistazo/display.

### 4.7 Radios, bordes y movimiento: el detalle que se nota sin verse

- **Radios: 4–6 px es el consenso operativo; 8–16 px es marketing.** Geist base **6 px**. Stripe HDS `radius-md` **6 px** (escala 2/4/6/16/32) — pero su app de documentación usa una escala distinta y más redonda (**4/8/10 px**), y el valor por defecto de su Appearance API es **4 px**. Linear: 4/6/8/12/16/24/32.
- **Bordes:** Stripe define `border-sm 1px · **border-md 1,25px** · border-lg 2px`. Ese 1,25 px es deliberado: en pantallas 2× rinde más nítido que 1 px sin leerse como 2 px.
- **Movimiento — la asimetría de Linear es el hallazgo.** Sus tokens: `quickTransition **0,1 s**`, `regularTransition **0,25 s**`, `highlightFadeIn **0 s**`, `highlightFadeOut **0,15 s**`. **El resaltado aparece instantáneo y solo se desvanece al salir.** Esa asimetría es buena parte de por qué Linear "se siente rápido": el feedback nunca se hace esperar, y lo único que se anima es la desaparición. Coincide con el requisito duro de MIL-STD-1472F §5.4.6.4 (**respuesta del display ≤ 100 ms**).
- **Capas de estado (Material 3, tokens oficiales):** hover **0,08** · focus **0,12** · pressed **0,12** · dragged **0,16** de opacidad. Un modelo de estados completo con cuatro números.

### 4.8 Un solo control escalar para la densidad

Stripe es el único que publica un modelo de densidad de una sola perilla: en la Appearance API, `spacingUnit` es _"The base spacing unit that all other spacing is derived from. Increase or decrease this value to make your layout more or less spacious"_ (valor por defecto `2px`). Carbon es el único que **envía** una escalera real de densidad (las 5 alturas de fila). Atlassian dice que la densidad configurable llegará _"in the future"_; Geist y Linear no tienen ninguna.

Para Bitácora esto se traduce directo: **una sola variable escalar controla el "modo taller"** (§6.1), y las alturas de fila se exponen como una escalera corta y con reja táctil, no como un slider libre.

---

## 5. Restricciones duras del entorno de taller

Estas cifras no son preferencias: son el piso por debajo del cual la app deja de funcionar en el taller. Cualquier decisión "premium" del capítulo anterior que choque con una de ellas, pierde.

### 5.1 Contraste

**WCAG 2.2, SC 1.4.3 Contrast (Minimum), nivel AA** — el texto debe tener una relación de contraste de al menos **4,5:1**; el texto grande, **3:1**. "Texto grande" se define como **≥ 18 pt o ≥ 14 pt en negrita**, y la propia norma da la equivalencia: _"The ratio between sizes in points and CSS pixels is `1pt = 1.333px`, therefore `14pt` and `18pt` are equivalent to approximately `18.5px` and `24px`."_ ([Understanding SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html))

El razonamiento de la norma es el que nos interesa, porque es extrapolable al taller:

- _"A contrast ratio of 3:1 is the minimum level recommended by [ISO-9241-3] and [ANSI-HFES-100-1988]"_ para texto estándar.
- _"The 4.5:1 ratio is used in this success criterion to account for the loss in contrast that results from moderately low visual acuity, congenital or acquired color deficiencies."_ Con el cálculo explícito: _"A user with 20/40 would thus require a contrast ratio of `3 * 1.5 = 4.5 to 1`."_
- **AAA (SC 1.4.6) exige 7:1** y _"was chosen for level AAA because it compensated for the loss in contrast sensitivity usually experienced by users with vision loss equivalent to approximately 20/80 vision."_

**Lectura para el taller:** el sol directo, el reflejo en la pantalla y una capa de grasa o polvo sobre el vidrio producen exactamente el mismo efecto que una pérdida de sensibilidad al contraste — el negro percibido sube y el contraste efectivo se colapsa. Diseñar el texto de cuerpo a 7:1 (el umbral AAA, pensado para 20/80) no es "sobre-ingeniería": es comprar el margen que el ambiente se va a comer. **El objetivo de este proyecto es 7:1 para todo el texto de cuerpo y de datos, no 4,5:1.**

**SC 1.4.11 Non-text Contrast (AA)** — los componentes de interfaz (bordes de campo, límites de botón, iconos que transmiten información) y los objetos gráficos necesitan **3:1** contra lo que los rodea. Esto prohíbe los bordes `#E5E7EB` sobre blanco que son el cliché visual del SaaS moderno: sobre blanco (`#FFF`) ese gris da ~1,2:1.

**SC 1.4.12 Text Spacing (AA)** — el contenido debe seguir funcionando si el usuario fuerza: interlineado ≥ **1,5×** el tamaño de fuente, espacio entre párrafos ≥ **2×** el tamaño de fuente, `letter-spacing` ≥ **0,12 em**, `word-spacing` ≥ **0,16 em**. En la práctica esto significa: nada de alturas fijas en `px` en tarjetas y filas.

**SC 1.4.4 Resize Text (AA)** — el texto debe poder ampliarse al **200 %** sin pérdida de contenido ni de funcionalidad.

### 5.2 Tamaño de área táctil

Siete fuentes, ordenadas de menos a más exigente. Lo notable es que **convergen**: todo lo que es evidencia empírica (no piso de accesibilidad) cae entre 9 y 22 mm.

| Fuente                                                   | Cifra                                                         | Separación exigida                 | mm→px en tableta (0,192) |
| -------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------- | ------------------------ |
| WCAG 2.2 SC 2.5.8 Target Size (Minimum), **AA**          | 24 × 24 px CSS (≈ 4,6 mm)                                     | círculo de 24 px sin intersección  | — (es el piso legal)     |
| WCAG 2.2 SC 2.5.5 Target Size (Enhanced), **AAA**        | 44 × 44 px CSS (≈ 8,4 mm)                                     | no especifica                      | —                        |
| Apple HIG — tamaño de control **por defecto** iOS/iPadOS | 44 × 44 pt (≈ 8,5 mm)                                         | 12 pt con bisel / 24 pt sin bisel  | —                        |
| Material Design 3                                        | **48 × 48 dp ≈ 9 mm**; rango recomendado **7–10 mm**          | **8 dp**                           | —                        |
| ANSI/HFES 100-2007 §6.2.9                                | **≥ 9,5 × 9,5 mm**; sin ganancia por encima de **22 mm**      | **≥ 3,2 mm** de "dead space"       | 49 px                    |
| Parhi, Karlson & Bederson 2006                           | **9,2 mm** (discretas) / **9,6 mm** (seriales)                | probado a 0 mm                     | 48–50 px                 |
| MIL-STD-1472F §5.4.6 (no teclado)                        | **16 × 16 mm** mín, 38 mm máx                                 | 3 mm mín (5 mm si "first contact") | 83 px                    |
| MIL-STD-1472G, **con guantes** (vía Ray et al. 2016)     | **20 × 20 mm**                                                | 3 mm                               | 104 px                   |
| Wang et al. 2024, cabina de avión (PLOS ONE)             | **18 mm** menor tasa de error; **21 mm** menor tiempo y carga | —                                  | 94–109 px                |

**Texto normativo de SC 2.5.8:** _"The size of the target for pointer inputs is at least 24 by 24 CSS pixels"_, con cinco excepciones. La más útil de todas para diseño premium es **Spacing**: _"Undersized targets (those less than 24 by 24 CSS pixels) are positioned so that if a 24 CSS pixel diameter circle is centered on the bounding box of each, the circles do not intersect another target or the circle for another undersized target"_ ([Understanding SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)). Es decir: **el área táctil efectiva se puede lograr con separación y padding invisible, no solo agrandando el pixel visible** — esta es la puerta por la que entra el refinamiento visual (§7).

Ojo con una atribución muy repetida y falsa: la página _Understanding_ de **SC 2.5.5 no da ninguna derivación empírica** del 44 × 44 ni una equivalencia en mm. Solo argumenta que "_touch … is an input mechanism with coarse precision_". Quien diga que "44 px es lo que dice la investigación" no está citando WCAG. Y en el HIG actual **44 × 44 pt es el tamaño _por defecto_, no el mínimo**: el mínimo declarado para iOS/iPadOS es **28 × 28 pt** (macOS 20, tvOS 56, visionOS 28). La cifra realmente comparable es que tvOS —pensado para uso a distancia de sala— sube su control por defecto a **66 × 66 pt** y su tipografía a 29 pt: Apple ya reconoce que la distancia obliga a escalar.

**Datos antropométricos** (NN/g): _"The average person's fingertips are 1.6–2 cm wide. The impact area of the typical thumb is even larger — an average of 2.5 cm wide"_; recomiendan **10 × 10 mm** mínimo y _"about 2 mm of spacing — the often-recommended minimum"_.

**Guantes — el único estudio con números.** Ray, Michelson, Price & Fausset (2016), _Touch Zone Sizing for Mobile Devices in Military Applications_ (HCII/DUXU, LNCS): diseño 2 × 2 (dimensionado Apple 44 pt ≈ 8,5 mm vs. MIL-STD 15 mm; con y sin guante), n = 6, iPad en rodillera dentro de un SUV en movimiento, 50 ensayos por condición, guantes ignífugos con tejido conductivo en la **yema** (no en la punta).

- El guante tuvo efecto principal significativo sobre aciertos (F(1,5)=12,67, p=,016) y fallos (F(1,5)=9,37, p=,028).
- El dimensionado tuvo efecto principal sobre errores (F(1,5)=15,00, p=,012): _"Participants made no errors in the MIL-STD-1472 conditions, whereas participants did make errors in the Apple conditions."_
- Conclusión textual: seguir MIL-STD _"reduces the likelihood of activation errors; however, this comes at the cost of decreased information density."_ — la tensión de §7, medida.
- **Dos mecanismos que sí podemos diseñar en contra:** (a) el material conductivo en la yema fuerza un contacto **más plano, más grande y más oclusivo** que la punta del dedo; (b) **la tela suelta del guante provocaba contacto prematuro y disparaba scroll espurio** — la causa dominante de fallo no fue apuntar mal, sino que el gesto se convirtiera en desplazamiento.

MIL-STD-1472F añade requisitos de interacción que valen tanto como los de tamaño: **tiempo de respuesta del display ≤ 100 ms** (§5.4.6.4), y toda acción táctil de **tarea crítica** _"shall require confirming an additional, confirmatory action"_ (§5.4.6.6).

> **Conclusión operativa.** El mínimo de WCAG (24 px) es un piso de accesibilidad web, no un objetivo de diseño industrial; el 44 px tampoco lo es. La evidencia empírica converge en **~9,5 mm sin guante** y **~18–20 mm en condiciones adversas (guante, movimiento, prisa)**, con ganancia nula por encima de 22 mm. Para Bitácora en tableta: **48 px mínimo absoluto · 56 px para cualquier control real · 72–80 px (≈ 14–15 mm) para la acción primaria de la pantalla y para todo lo que se toque con guante puesto**, con **≥ 16 px de separación** (≥ 5 mm) entre controles adyacentes y **≥ 24 px** si uno de ellos es destructivo. Y un umbral de scroll elevado (≥ 12–16 px de desplazamiento antes de convertir un `pointerdown` en scroll), por el hallazgo de la tela suelta.

### 5.3 Legibilidad: distancia de visión → tamaño de fuente

La fuente dura es **ANSI/HFES 100-2007**, _Human Factors Engineering of Computer Workstations_, §7.2.6.1 Character Height:

> _"The minimum character height **shall be 16 arc minutes** and **should be 22 to 30 arc minutes** at the design viewing distance, except where speed of recognition is unimportant, such as footnotes and subscripts and superscripts, in which case character height should be at least **10 arc minutes**."_

Comentario de la misma norma: _"For rapid and accurate identification of individual characters, 16 to 18 minutes of arc is normally adequate, although **reading speed continues to increase until character height exceeds 22 arc minutes**"_, y _"Warnings or other essential information requires larger characters to ensure that individuals with low vision (visual acuity of 20/70 or less) can read it."_ Para caracteres **de color** exige **≥ 20′**, y **≥ 30′** si hay que discriminar el color de un carácter aislado (§7.2.6.2).

El borrador público de la revisión 2019 agrega la regla que más importa aquí:

> _"The height of characters with less than ideal contrast relative to the background should be larger. **With the minimal contrast ratio of 3, character height should be 30′ of arc or larger.**"_

Otras cifras normativas del mismo cuerpo:

- **Distancia de diseño mínima: 40 cm** (HFES 2019), con la nota: _"ISO 9241-303 suggests a 30 cm design viewing distance, which may be more common for hand held displays on mobile devices."_
- **Grosor de trazo: 1/6 a 1/12 de la altura de carácter** (HFES §7.2.6.4) — equivalente al 8,3 %–16,7 %. Una tipografía Thin/Hairline en texto funcional viola el piso de 1/12. MIL-STD-1472F §5.2.1.6.4.3 añade: _"Where users must read quickly under adverse conditions (e.g., poor lighting), a **sans serif** style should be used"_, y evitar todo en mayúsculas.
- **Relación ancho/alto de carácter:** 0,5:1 a 1:1, óptimo 0,6–0,9:1 (§7.2.6.3).
- **Espacio mínimo entre líneas:** _"one-half character height"_ (MIL-STD-1472F §5.5.5.13).
- **Polaridad:** _"Where feasible, **dark characters should be displayed on a light background**"_ (MIL-STD-1472F §5.2.5.2.4) — texto oscuro sobre fondo claro, no al revés. Otra razón (además del alcance del mapa) para no priorizar modo oscuro.
- MIL-STD-1472F §5.2.1.6.4.1 confirma el mismo umbral por otra vía: **≥ 16′, preferido 20′**; caracteres de color **≥ 21′, preferido 30′**; y texto de advertencia **30–60′** _"as measured from the longest anticipated viewing distance, with the larger size used where conditions may be adverse"_.

**Cálculo.** `altura de carácter h ≈ D × θ(rad)`, es decir h = 0,00465·D a 16′, 0,00640·D a 22′, 0,00873·D a 30′. Convertir esa altura a `font-size` depende de qué llame "carácter" la norma, y las dos revisiones difieren: la de **2007** dice _character height_ (lectura habitual: altura de mayúscula, ≈ 0,70–0,72 em) y la de **2019** dice explícitamente _x-height_ (≈ 0,55 em en Inter). Se dan las dos lecturas y se recomienda dentro de la banda común.

**`font-size` requerido en px CSS, tableta a 0,192 mm/px**

| Distancia                            | 16′ mínimo   | 22′ lectura cómoda | 30′ contraste degradado |
| ------------------------------------ | ------------ | ------------------ | ----------------------- |
| 300 mm (teléfono, 0,157 mm/px)       | 16–21 px     | 22–29 px           | 30–39 px                |
| **400 mm** (tableta en mano)         | **14–18 px** | **19–24 px**       | 26–33 px                |
| **450 mm** (tableta apoyada, de pie) | 15–20 px     | **21–27 px**       | 29–37 px                |
| 500 mm (tableta en carro)            | 17–22 px     | 23–30 px           | 32–42 px                |
| 600 mm (pantalla montada, vistazo)   | 20–27 px     | 28–36 px           | 38–50 px                |

_(rango bajo = lectura de altura de mayúscula 0,72 em; rango alto = lectura de x-height 0,55 em)_

**Lectura para el taller.** El cuerpo de texto de un SaaS de oficina (14–16 px a 50–60 cm en un monitor de 0,265 mm/px ≈ 20–24′) **no es transferible tal cual** a una tableta: en tableta a 45 cm, 16 px caen en ~13–17′, en el filo o por debajo del mínimo normativo. **El cuerpo base de esta app es 18 px y el objetivo cómodo es 20 px**, con los datos de vistazo (placa, número de orden, estado) en 28–32 px. Y ningún texto funcional por debajo de **14 px** — 10′ está reservado por la norma a notas al pie, no a etiquetas de campo.

### 5.4 Luz variable y contraste efectivo

**Lo que sí es normativo.** ANSI/HFES 100-2007 §7.2.5.3 exige que el display _"exhibit a contrast ratio of at least 3 to 1 under all office illumination conditions"_, y también bajo **1 000 lx de iluminación ambiente uniforme** y bajo una fuente especular de **1 000 cd/m²**. Su justificación: _"Visibility improves with increasing contrast **up to a contrast ratio of 3 to 1, above which it rapidly levels off**"_ — pero ojo, eso se refiere al contraste **físico medido del display**, no a la relación de contraste texto/fondo de WCAG, que es una métrica distinta y ya descuenta la agudeza del observador. La misma sección añade una advertencia directamente aplicable: _**"purely chromatic contrasts have poor visibility"**_ → **nada puede codificarse solo por matiz**.

MIL-STD-1472F pide contraste de luminancia **≥ 3,0** entre marcas y fondo (§5.2.3.1.8), y —relevante para una tableta que va del pasillo en sombra al patio al sol— un **rango de ajuste de luminancia del display de no menos de 50:1** (§5.2.1.6.2.1).

**Lo que NO es normativo (y por eso no lo usamos como cifra de diseño).** Los umbrales de "legible al sol" que circulan (800 / 1 000 / 1 500 / 2 500 nits) provienen exclusivamente de blogs técnicos de fabricantes de displays industriales; no se encontró norma ni estudio revisado por pares que los respalde. Las normas correctas si algún día hace falta una cifra defendible son **ISO 15008:2017** (presentación visual en vehículo; exige cumplir el contraste sobre la línea especular crítica bajo sol directo) y **SAE J1757-1_202108** (metrología de displays vehiculares, metodología de _ambient contrast ratio_); ambas de pago. _(Confianza: baja para los nits; alta para HFES/MIL-STD.)_

**Palancas de diseño que sí se sostienen:**

1. **Presupuesto de contraste con margen: 7:1 en texto de cuerpo y de datos** (umbral AAA de WCAG, calibrado para 20/80), no 4,5:1. El razonamiento es el de §5.1: el sol, el reflejo y la película de grasa sobre el vidrio actúan sobre el usuario igual que una pérdida de sensibilidad al contraste.
2. **Cuando el contraste efectivo cae a ~3:1, la norma manda subir el carácter a 30′** — de ahí el "modo taller" del §6.
3. **Nada codificado por matiz solo** (HFES §7.2.5.3): todo estado lleva forma, texto o icono además del color.
4. **Texto oscuro sobre fondo claro** como polaridad por defecto (MIL-STD-1472F §5.2.5.2.4).
5. **Evitar pesos ligeros.** Apple HIG: _"In general, avoid light font weights … prefer Regular, Medium, Semibold, or Bold … avoid Ultralight, Thin, and Light font weights, which can be difficult to see"_; y _"If you're using a custom font with a thin weight, aim for larger than the recommended sizes."_ Coincide con el piso de trazo 1/12 de HFES.

### 5.5 Uso rápido entre tareas

El ticket describe "uso rápido entre tareas". El hallazgo primario relevante es de Mark, Gudith y Klocke, _The Cost of Interrupted Work: More Speed and Stress_ (CHI '08): las personas **completan la tarea interrumpida en igual o menos tiempo y sin pérdida de calidad, pero a costa de más estrés, frustración, presión de tiempo y esfuerzo**. (Nota de honestidad: la cifra viral de "23 minutos y 15 segundos para retomar una tarea" **no** proviene de ese paper; se le atribuye por entrevistas y por otro trabajo del mismo grupo sobre probabilidad de reanudación. No la usamos.)

Consecuencia de diseño, no de adjetivos: el costo de la interrupción se paga en **carga cognitiva al reanudar**, así que la pantalla debe reconstruir el contexto sola — "en qué orden estaba, qué vehículo, qué falta" visible sin navegar — y el estado del formulario debe sobrevivir a que la tableta se bloquee.

---

## 6. Recomendaciones concretas y numéricas por eje

Insumo directo para el ticket [#25](https://github.com/FabianRG1990/repositorio-de-apps/issues/25). Cada cifra lleva su origen entre paréntesis. **Dispositivo de referencia: tableta 10–11" en horizontal, sostenida o apoyada a 40–50 cm.**

### 6.1 Tipografía

**Familia.** `Inter Variable` con respaldo de sistema. Razones citables, no gusto: declara _"a tall x-height to aid in legibility of lower-case text"_ con **eje de tamaño óptico** (text ↔ display), trae **tabular numbers** y **cero cortado** (`slashed zero`) como _features_ OpenType, cubre 147 idiomas y es SIL OFL. El cero cortado y las cifras tabulares no son adorno: esta app muestra placas, VIN, números de orden y números de parte, donde confundir `0`/`O` es un error de trabajo real.

```
--font-sans: "Inter Variable", "Inter", -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
--font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
```

**Escala.** Base `rem` = 16 px, pero la escala de producto **arranca en 18 px** (§5.3). Todos los valores en `rem` para cumplir SC 1.4.4 (200 %).

| Token             | px     | line-height | ratio | peso    | tracking     | Uso                                               |
| ----------------- | ------ | ----------- | ----- | ------- | ------------ | ------------------------------------------------- |
| `caption-14`      | 14     | 20          | 1,43  | 400     | **+0,16 px** | Metadatos, sellos de tiempo. **Piso absoluto.**   |
| `label-16`        | 16     | 20          | 1,25  | **590** | +0,16 px     | Etiquetas de campo, encabezados de columna        |
| `body-compact-18` | **18** | **24**      | 1,33  | 400     | +0,1 px      | **Texto por defecto de la app**; filas y tarjetas |
| `body-18`         | 18     | 28          | 1,56  | 400     | +0,1 px      | Párrafos de más de 4 líneas (notas, diagnóstico)  |
| `label-18`        | 18     | 24          | 1,33  | **590** | +0,1 px      | Etiqueta enfatizada al mismo tamaño del cuerpo    |
| `heading-20`      | 20     | 28          | 1,40  | 590     | 0            | Título de sección/tarjeta                         |
| `heading-24`      | 24     | 32          | 1,33  | 590     | 0            | Título de pantalla                                |
| `data-28`         | **28** | 32          | 1,14  | **680** | −0,02 em     | **Dato de vistazo**: placa, nº de orden           |
| `data-36`         | 36     | 40          | 1,11  | 680     | −0,022 em    | Dato dominante (contador, total)                  |
| `display-48`      | 48     | 52          | 1,08  | 680     | −0,03 em     | Pantalla de estado a distancia / kiosco           |

Justificación de cada decisión:

- **18 px de cuerpo** (no 14–16 px como Carbon/Atlassian/Geist): a 45 cm en tableta, 18 px caen en **17–23 arcmin**, dentro del rango normativo de ANSI/HFES 100-2007 (mínimo 16′, recomendado 22–30′). 14 px caerían en 13–17′, por debajo del mínimo.
- **28 px para el dato de vistazo:** a 50–60 cm equivale a 22–30′, es decir lectura cómoda sin acercarse.
- **Piso de 14 px:** por debajo, la norma reserva ese rango a notas al pie (10′). Coincide con el piso práctico de los sistemas de referencia (12 px en Carbon/Atlassian/Geist a distancia de escritorio, escalado a nuestra distancia).
- **Tracking positivo ≤18 px** (regla Carbon, el único sistema diseñado para tablas densas), **0** de 20 a 24 px, **negativo ≥28 px** (Geist/Apple). Coincide con el cruce por cero de la curva de SF Pro en 12 pt.
- **Pesos 400 / 590 / 680** (truco de Linear con Inter Variable). **Prohibidos 100–300**: Apple lo dice (_"avoid Ultralight, Thin, and Light"_) y ANSI/HFES §7.2.6.4 lo cuantifica (**trazo entre 1/6 y 1/12 de la altura de carácter**).
- **Interlineado ≥ 1,33** en todo el texto de cuerpo, y el contenedor debe sobrevivir a 1,5× forzado (SC 1.4.12).
- `font-variant-numeric: tabular-nums` en toda columna numérica y en todo dato alineado verticalmente; `font-feature-settings: "zero" 1` (cero cortado) en placa, VIN, nº de orden y nº de parte.

**Modo taller — una sola perilla.** Siguiendo el modelo `spacingUnit` de Stripe: una variable escalar `--scale` que multiplica el tamaño raíz.

```
:root            { --scale: 1;    }  /* 18 px de cuerpo */
:root[data-modo="taller"] { --scale: 1.25; }  /* 22,5 px de cuerpo, 35 px de dato */
```

Justificación: cuando el contraste efectivo cae a ~3:1 (sol, reflejo, pantalla sucia), ANSI/HFES exige subir el carácter a **30′**; a 45 cm eso son ~29–37 px, y 1,25× lleva `data-28` a 35 px. **Debe ser una preferencia persistida y visible, no un ajuste enterrado.**

### 6.2 Color y contraste

**Estructura.** Adoptar el modelo de 10 pasos de Geist/Radix (§4.3), que es el único que hace la accesibilidad estructural en vez de una medición caso por caso:

```
--{hue}-bg-1 / bg-2          fondos de página y de superficie
--{hue}-1 .. --{hue}-3       fondo de componente:  default / hover / active
--{hue}-4 .. --{hue}-6       borde:                default / hover / active
--{hue}-7 .. --{hue}-8       relleno sólido de alto contraste
--{hue}-9 .. --{hue}-10      texto e iconos (los pasos "accesibles")
```

**Matices:** `neutral` (base), `brand` (un solo acento), `success`, `warning`, `danger`, `info`. Nada más. La rampa neutra en gris puro (hue 0°, sat 0 %, como Geist) o con un matiz frío mínimo (como Stripe, `#64748d` en el 500) — **probar ambas en #25**; lo prohibido es mezclar grises de temperaturas distintas.

**Objetivos de contraste — más exigentes que AA a propósito** (§5.1, §5.4):

| Elemento                                           | Objetivo                              | Mínimo tolerado | Origen                                |
| -------------------------------------------------- | ------------------------------------- | --------------- | ------------------------------------- |
| Texto de cuerpo y de datos                         | **7:1**                               | 4,5:1           | WCAG AAA 1.4.6 (calibrado para 20/80) |
| Texto ≥ 24 px o ≥ 18 px en negrita                 | **4,5:1**                             | 3:1             | WCAG 1.4.3                            |
| Bordes, iconos informativos, indicadores de estado | **4,5:1**                             | 3:1             | WCAG 1.4.11 + margen por sol          |
| Anillo de foco                                     | **4,5:1** contra ambos vecinos        | 3:1             | WCAG 1.4.11                           |
| Texto deshabilitado                                | exento, pero **≥ 3:1** de todos modos | —               | Legibilidad en sol                    |

**Reglas duras:**

1. **Ningún borde por debajo de 3:1.** El `#E5E7EB` sobre blanco que es el cliché del SaaS moderno da ~1,2:1 y es invisible en el taller. Si hace falta separar sin gritar, **separar con superficie** (escalones de fondo 1–3), no con un borde hairline.
2. **El color nunca es el único portador de información.** ANSI/HFES 100-2007 §7.2.5.3: _"purely chromatic contrasts have poor visibility"_. Todo estado = color **+** icono/forma **+** texto.
3. **Saturación reservada.** Superficie y crominancia baja en ~90 % de la pantalla; el color saturado se reserva a estado (retrasado, esperando repuesto, listo) y a la acción primaria. Es el principio ISA-101 (§4.3) y el que hace que una pantalla se lea "cara" y "tranquila" a la vez.
4. **Polaridad positiva**: texto oscuro sobre fondo claro (MIL-STD-1472F §5.2.5.2.4).
5. Si un carácter de color debe leerse como color (chip de estado), **≥ 20′**; para discriminar el color de un carácter aislado, **≥ 30′** (ANSI/HFES §7.2.6.2). Traducido: **un chip de estado no puede tener texto por debajo de 16–18 px.**

**Modo oscuro** — fuera de alcance del mapa #14, y hay una razón técnica adicional para no invertirlo: MIL-STD-1472F prefiere explícitamente polaridad positiva para lectura en condiciones adversas. Nota única, no se profundiza.

### 6.3 Espaciado

**Base 4 px, unidad de referencia 8 px** (convergencia unánime, §4.2). Nombres autoexplicativos al estilo Linear — el número _es_ el valor:

```
--space-2   2px      --space-24   24px
--space-4   4px      --space-32   32px
--space-8   8px      --space-40   40px
--space-12  12px     --space-48   48px
--space-16  16px     --space-64   64px
--space-20  20px     --space-80   80px
```

(Los 12 pasos comunes a Carbon, Atlassian y Stripe. **No se sale de la escala**, regla Carbon.)

Aplicación:

| Contexto                                  | Valor                                                      |
| ----------------------------------------- | ---------------------------------------------------------- |
| Padding interno de tarjeta de orden       | 20–24 px                                                   |
| Separación entre tarjetas de una lista    | 12 px (compacta) / 16 px (estándar)                        |
| Padding horizontal de fila de tabla/lista | **16 px constante en todas las densidades** (regla Carbon) |
| Padding vertical de fila                  | **es el que cambia con la densidad**                       |
| Margen de página                          | 16 px (< 768) / 24 px (768–1439) / 32 px (≥ 1440)          |
| Separación entre secciones                | 32–48 px                                                   |
| Gap entre etiqueta y campo                | 8 px                                                       |
| Gap entre icono y texto                   | 8 px                                                       |

Regla de conjunto, verbatim de Carbon: _"Sections of a UI are allowed to be dense, but the whole page should not be crowded; there should be white space to let the user's eye rest."_

### 6.4 Radios, bordes y foco

**Radios: 4 / 8 / 12 / 16 / 999 px.** Base de componente **8 px**.

Justificación numérica (no gusto): el consenso de escritorio es 4–6 px sobre controles de 32–40 px, es decir una relación radio/altura de **0,15–0,19**. Nuestros controles son de 56–72 px; mantener esa relación da **8–11 px**. Un radio de 6 px sobre un botón de 72 px se lee casi cuadrado y pierde el acabado; uno de 16 px se lee como app de consumo. **8 px** es el equivalente proporcional del 6 px de Geist/Stripe.

- Tarjeta de orden: **12 px**. Chip de estado: **999 px** (píldora). Campo de formulario: **8 px**. Botón: **8 px**.
- **Bordes:** 1 px estándar; **1,25 px** para bordes de contenedor (truco de Stripe, rinde más nítido en pantallas 2× sin leerse como 2 px); 2 px para el anillo de foco.
- **Foco visible obligatorio:** anillo de **2 px con 2 px de offset**, contraste ≥ 3:1 contra ambos vecinos (SC 1.4.11). Con guantes y prisa, saber qué está activo importa más que en oficina.
- **Elevación sin sombras pesadas:** preferir escalones de superficie (fondos 1–3, modelo Linear `level-0..3`) sobre `box-shadow` difuso — la sombra suave desaparece bajo el sol y solo agrega ruido de render.

### 6.5 Áreas táctiles y densidad de listas

**Escalera de targets** (derivada de §5.2):

| Rol                                                             | Alto/ancho mínimo   | mm aprox. (tableta) | Origen                                                              |
| --------------------------------------------------------------- | ------------------- | ------------------- | ------------------------------------------------------------------- |
| Piso absoluto, cualquier control                                | **48 px**           | 9,2 mm              | M3 48 dp; ANSI/HFES ≥9,5 mm; Parhi 9,2 mm                           |
| Control estándar (botón, campo, chip accionable)                | **56 px**           | 10,8 mm             | NN/g ≥10 mm                                                         |
| Acción primaria de la pantalla; todo lo que se toque con guante | **72–80 px**        | 13,8–15,4 mm        | MIL-STD 15 mm; Wang et al. 18–21 mm óptimo                          |
| Techo útil                                                      | **~115 px (22 mm)** | 22 mm               | ANSI/HFES: _"greater than 22 mm square do not improve performance"_ |

**Separación:** ≥ **8 px** siempre (M3: _"targets separated by 8dp of space or more promote balanced information density and usability"_); ≥ **16 px** (≈5 mm, MIL-STD _first contact_) entre controles adyacentes de una barra de acciones; ≥ **24 px** si uno de ellos es destructivo.

**Alturas de fila / tarjeta de orden** — escalera corta, con reja táctil:

| Densidad               | Alto de fila    | Disponible en                                                                |
| ---------------------- | --------------- | ---------------------------------------------------------------------------- |
| Compacta               | **56 px**       | Táctil ✅ (es el mínimo estándar)                                            |
| Estándar (por defecto) | **72 px**       | Táctil ✅                                                                    |
| Cómoda / modo taller   | **96 px**       | Táctil ✅                                                                    |
| —                      | 24 / 32 / 40 px | ❌ **Nunca**: son las densidades _de puntero_ de Carbon, por debajo de 44 px |

Regla de implementación, tomada de Carbon: **el padding horizontal no cambia entre densidades (16 px); solo cambia el vertical.** Y regla derivada de M3: _"Don't apply component scaling by default if it would result in a target below 48x48 CSS pixels."_

**Umbral de scroll:** exigir **≥ 12–16 px** de desplazamiento antes de convertir un `pointerdown` en scroll. Es la mitigación directa del hallazgo de Ray et al. (2016): la tela suelta del guante provocaba contacto prematuro y **el scroll espurio fue la causa dominante de toque perdido**, por encima de apuntar mal.

### 6.6 Breakpoints y layout

Se adopta la rejilla de **Atlassian** (la única cuyos cortes coinciden con los tamaños reales de tableta) con el gutter de 16 px:

| Nombre | Viewport      | Columnas | Gutter    | Margen    |
| ------ | ------------- | -------- | --------- | --------- |
| xxs    | 320–479       | 2        | 12 px     | 16 px     |
| xs     | 480–767       | 6        | 12 px     | 16 px     |
| s      | 768–1023      | 6        | 12 px     | 16 px     |
| **m**  | **1024–1439** | **12**   | **16 px** | **32 px** |
| l      | 1440–1767     | 12       | 16 px     | 32 px     |
| xl     | ≥ 1768        | 12       | 16 px     | 32 px     |

- **`m` (1024–1439) es el breakpoint de diseño principal:** es donde cae la tableta de 10–11" en horizontal.
- **Ancho máximo de contenido: 1296 px** para pantallas tipo tablero/listado/búsqueda (Atlassian _fixed-wide_: _"dashboards, directories, search results"_); 864 px para lectura larga (_fixed-narrow_).
- Los breakpoints se anclan al **viewport, no al contenedor** (regla explícita de Atlassian).
- Padding de página con `max(--space-16, env(safe-area-inset-left))` (patrón de Linear) — importante en tableta con funda/rodillera.

### 6.7 Componentes clave

**Tarjeta de orden de trabajo** (el componente central de la app):

| Elemento                                  | Especificación                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Alto mínimo                               | 96 px (densidad estándar 72 px si es fila simple)                                                             |
| Radio                                     | 12 px                                                                                                         |
| Padding                                   | 20 px vertical / 16 px horizontal                                                                             |
| Placa / nº de orden                       | `data-28` (28 px, peso 680, `tabular-nums` + cero cortado), contraste ≥ 7:1                                   |
| Vehículo y cliente                        | `body-compact-18` (18/24, 400)                                                                                |
| Estado                                    | Chip píldora, alto **32 px**, texto ≥ 16 px, **icono + texto + color**, contraste texto ≥ 4,5:1 y borde ≥ 3:1 |
| Especialidad (mecánico/eléctrico/pintura) | Chip secundario, mismo patrón, jamás solo color                                                               |
| Acción primaria                           | Botón de **72 px** de alto, ancho ≥ 160 px, peso 590                                                          |
| Toda la tarjeta como target               | Sí, ≥ 96 px; las acciones internas separadas ≥ 16 px del borde para no competir                               |

**Campo de formulario:** alto **56 px**; texto **18 px** — nunca por debajo de 16 px, regla dura de Stripe: _"ensure that you choose a font size of at least 16px for input fields on mobile"_ (por debajo, iOS hace auto-zoom y descoloca el layout); etiqueta **encima** en `label-16` peso 590, nunca _placeholder_ como etiqueta; borde ≥ 3:1; error con icono + texto, no solo rojo.

**Acciones críticas** (cerrar orden, eliminar, facturar): confirmación explícita obligatoria — MIL-STD-1472F §5.4.6.6: _"shall require confirming an additional, confirmatory action"_. El botón destructivo va separado ≥ 24 px del resto y **no** comparte fila con la acción de uso frecuente.

**Iconos:** 24 px de trazo en un target de 48 px como mínimo (patrón M3: _"an icon may appear to be 24 x 24dp, but the padding surrounding it comprises the full 48 x 48dp touch target"_). Un icono **nunca va solo** en una acción primaria: siempre icono + etiqueta.

### 6.8 Movimiento

| Token              | Valor      | Uso                                                  |
| ------------------ | ---------- | ---------------------------------------------------- |
| `--motion-instant` | **0 ms**   | Aparición de selección, resaltado, feedback de toque |
| `--motion-fast`    | **100 ms** | Hover, cambios de estado, desaparición de resaltado  |
| `--motion-base`    | **150 ms** | Transiciones de componente                           |
| `--motion-slow`    | **250 ms** | Entrada de panel/hoja                                |

- **Asimetría deliberada** (patrón Linear `highlightFadeIn: 0s` / `highlightFadeOut: 0.15s`): lo que confirma una acción aparece **instantáneo**; solo se anima lo que desaparece.
- **Respuesta visible al toque en ≤ 100 ms**, requisito duro (MIL-STD-1472F §5.4.6.4).
- **Capas de estado** con las opacidades de Material 3: hover **0,08**, focus **0,12**, pressed **0,12**, dragged **0,16**.
- Respetar `prefers-reduced-motion`.

### 6.9 Qué NO copiar de las referencias

- **Los 14–15 px de cuerpo** de Carbon/Atlassian/Geist/Linear: son de escritorio a 60 cm, no de tableta a 45 cm (§4.5, §5.3).
- **Los pesos 300** de Stripe: fuera de la guía de Apple y del piso de trazo de HFES.
- **Los `copy-20`/`copy-24`** de Geist: el propio Geist los marca como _"for hero areas on marketing pages"_.
- **Las densidades xs/sm/md** de Carbon (24/32/40 px): son de puntero, no de dedo.
- **El tracking negativo** en texto pequeño (Linear, Geist): la evidencia de tablas densas (Carbon) va en la dirección contraria.
- **Los bordes hairline** de baja opacidad: violan SC 1.4.11 y desaparecen al sol.

---

## 7. Tensiones entre "premium" y "usable con guantes"

La tensión no es una opinión: está **medida**. Ray et al. (2016) la enuncian como conclusión del estudio — seguir el dimensionado grande de MIL-STD _"reduces the likelihood of activation errors; **however, this comes at the cost of decreased information density**."_

Ocho tensiones reales y cómo se resuelven sin ceder ninguno de los dos lados.

| #   | Tensión                                                                           | Resolución                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Densidad premium** (14 px, filas de 32–40 px) **vs. dedo con guante** (≥ 48 px) | La densidad **no se compra reduciendo el target**. Se compra por interlineado a tamaño constante (Carbon 14/18 vs 14/20; Geist Label vs Copy) y por padding vertical, manteniendo el horizontal fijo. Y la excepción _Spacing_ de SC 2.5.8 permite lograr el área efectiva con **padding invisible**, no con píxel visible: un chip de 32 px de alto puede tener un target de 56 px si el hueco lo permite. |
| 2   | **Bordes sutiles** (el look "moderno") **vs. SC 1.4.11** (3:1)                    | Separar con **superficie**, no con línea: escalones de fondo 1–3 (modelo Linear `level-0..3`, Geist "Component Backgrounds"). Cuando el borde sea necesario, usar el paso 4–6 de la rampa, que **por construcción** cumple contraste. Es más limpio _y_ más legible.                                                                                                                                        |
| 3   | **Tipografía ligera y elegante vs. sol y trazo**                                  | La elegancia se compra con **tracking, escala e interlineado**, no adelgazando el trazo. Pesos 400/590/680; prohibidos ≤300 (Apple + trazo 1/6–1/12 de HFES). El peso 590 de Linear existe precisamente para tener refinamiento sin perder cuerpo.                                                                                                                                                          |
| 4   | **Menos texto, más icono** (minimalismo) **vs. legibilidad y velocidad**          | Icono **siempre con etiqueta** en acciones primarias. El icono solo se admite en acciones secundarias, con target ≥ 48 px y nombre accesible. El minimalismo se ejerce **quitando elementos**, no quitando palabras a los que quedan.                                                                                                                                                                       |
| 5   | **Blanco generoso vs. cabe menos información**                                    | Regla de Carbon: _"Sections of a UI are allowed to be dense, but the whole page should not be crowded."_ Densidad **local** (la tarjeta de orden es apretada y rica), respiro **global** (entre secciones, 32–48 px).                                                                                                                                                                                       |
| 6   | **Gestos elegantes (swipe) vs. la tela del guante dispara scroll espurio**        | Toda acción primaria por **tap sobre target grande**. El swipe existe solo como atajo **redundante**, nunca como única vía. Umbral de scroll ≥ 12–16 px antes de convertir el `pointerdown`.                                                                                                                                                                                                                |
| 7   | **Animación "premium" vs. respuesta ≤ 100 ms**                                    | Asimetría de Linear: **aparecer en 0 ms**, desaparecer en 100–150 ms. La sensación de calidad viene de que **nada se hace esperar**, no de que todo se deslice.                                                                                                                                                                                                                                             |
| 8   | **Modo oscuro "se ve caro" vs. polaridad positiva y alcance del mapa**            | Fuera de alcance (#14), y con respaldo técnico: MIL-STD-1472F §5.2.5.2.4 prefiere texto oscuro sobre fondo claro en condiciones adversas. No se invierte esfuerzo aquí.                                                                                                                                                                                                                                     |

**El principio que resuelve las ocho:** _lo premium en una herramienta operativa se construye por sustracción y por sistema — menos matices, menos tamaños, menos radios, menos duraciones, todo dentro de escalas cerradas — no por refinamiento de detalles pequeños._ Reducir el número de decisiones visibles es gratis en términos de legibilidad, y es exactamente lo que hacen Geist (10 pasos por matiz), Linear (radios autonombrados) y Carbon (13 pasos de espaciado, "no salirse"). El taller no necesita que la app tenga menos contraste o elementos más chicos; necesita que **todo lo que hay esté justificado**.

---

## 8. Fuentes

### Normas y especificaciones (confianza alta)

| Fuente                                                                       | Qué aporta                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Enlace                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **WCAG 2.2** (W3C Recommendation)                                            | SC 1.4.3 (4,5:1 / 3:1, definición de texto grande y equivalencia 18,5 px / 24 px), 1.4.4 (200 %), 1.4.6 (7:1), 1.4.11 (3:1 no textual), 1.4.12 (1,5× / 2× / 0,12 em / 0,16 em), 2.5.5 (44 px), 2.5.8 (24 px + excepción _Spacing_)                                                                                                                                                                                                                                                                        | https://www.w3.org/TR/WCAG22/                                                                                                                                                                                                                                            |
| **WCAG 2.2 Understanding**                                                   | Racional de las relaciones (20/40 → 4,5:1; 20/80 → 7:1); nota: 2.5.5 **no** aporta derivación empírica del 44 px                                                                                                                                                                                                                                                                                                                                                                                          | https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum · [target-size-minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)                                                                                                                    |
| **ANSI/HFES 100-2007**, _Human Factors Engineering of Computer Workstations_ | §6.2.9 zona táctil ≥9,5 mm, dead space ≥3,2 mm, sin ganancia >22 mm · §7.2.5.3 contraste ≥3:1 bajo 1 000 lx, _"purely chromatic contrasts have poor visibility"_ · §7.2.6.1 altura de carácter 16′ mínimo / 22–30′ recomendado / 10′ notas al pie · §7.2.6.2 color ≥20′, discriminación ≥30′ · §7.2.6.4 trazo 1/6–1/12                                                                                                                                                                                    | [PDF público](https://www.xybix.com/hubfs/ANSI_HFES_100-200727E2.pdf)                                                                                                                                                                                                    |
| **BSR/HFES 100 (borrador 2019)**                                             | Define la altura como **x-height**; regla "contraste 3:1 → carácter ≥30′"; distancia de diseño mínima 40 cm; nota sobre ISO 9241-303 y los 30 cm en dispositivos de mano                                                                                                                                                                                                                                                                                                                                  | [PDF público](https://higherlogicdownload.s3.amazonaws.com/HFES/42fffbb4-31e1-4e52-bda6-1393762cbfcd/UploadedImages/Technical_Standards_Docs/ANSIHFES_100-2019_V2.pdf)                                                                                                   |
| **MIL-STD-1472F**, _Design Criteria — Human Engineering_                     | §5.4.6 zona táctil 16×16 mm mín / 38 mm máx, separación 3 mm (5 mm en _first contact_) · §5.4.6.4 respuesta ≤100 ms · §5.4.6.6 confirmación en tareas críticas · §5.2.1.6.4.1 16′ mín / 20′ preferido, color 21′/30′ · §5.2.1.6.4.3 sans serif en condiciones adversas · §5.2.5.2.4 polaridad positiva · §5.5.5.13 interlínea ≥ ½ altura de carácter                                                                                                                                                      | [PDF DENIX (DoD)](https://www.denix.osd.mil/soh/denix-files/sites/21/2016/03/02_MIL-STD-1472F-Human-Engineering.pdf)                                                                                                                                                     |
| **Apple Human Interface Guidelines**                                         | Tipografía: por defecto 17 pt iOS / 13 pt macOS, **mínimo 11 pt / 10 pt**; _"avoid Ultralight, Thin, and Light"_; tabla de tracking de SF Pro (cruce por cero en 12 pt, mínimo −0,43 pt a 17 pt). Accesibilidad: control **por defecto** 44×44 pt, **mínimo 28×28 pt** (tvOS 66, visionOS 60); padding 12 pt con bisel / 24 pt sin bisel; contraste 4,5:1 ≤17 pt, 3:1 a 18 pt o negrita; 200 % de ampliación. **Apple no publica valores hex de sus colores de sistema** y desaconseja fijarlos en código | [typography](https://developer.apple.com/design/human-interface-guidelines/typography) · [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)                                                                                    |
| **Material Design 3**                                                        | Objetivo táctil **48×48 dp ≈ 9 mm**, rango recomendado **7–10 mm**, separación **8 dp**; _"Don't apply component scaling by default if it would result in a target below 48x48 CSS pixels"_; contraste 3:1 texto grande / 4,5:1 texto pequeño; escala tipográfica completa y opacidades de capa de estado (0,08 / 0,12 / 0,12 / 0,16) desde los tokens oficiales                                                                                                                                          | [structure](https://m3.material.io/foundations/designing/structure) · [density](https://m3.material.io/foundations/layout/grids-spacing/density) · [tokens](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-typescale.scss) |

### Investigación revisada por pares (confianza alta)

- **Kurosu, M. & Kashimura, K. (1995).** _Apparent usability vs. inherent usability: experimental analysis on the determinants of the apparent usability._ CHI '95 Conference Companion. 252 participantes, 26 variantes de UI de cajero; **r = 0,589** entre belleza aparente y usabilidad aparente. [DOI 10.1145/223355.223680](https://dl.acm.org/doi/10.1145/223355.223680) · síntesis: [NN/g](https://www.nngroup.com/articles/aesthetic-usability-effect/)
- **Parhi, P., Karlson, A. K. & Bederson, B. B. (2006).** _Target size study for one-handed thumb use on small touchscreen devices._ MobileHCI '06. n=20, de pie, pulgar; sin diferencias significativas de error por encima de **9,6 mm (discretas)** y **7,7 mm (seriales)**; recomendación: **9,2 mm discretas / 9,6 mm seriales**. [PDF](https://www.microsoft.com/en-us/research/wp-content/uploads/2006/01/parhi-mobileHCI06.pdf) · [DOI 10.1145/1152215.1152260](https://dl.acm.org/doi/10.1145/1152215.1152260)
- **Ray, J., Michelson, S., Price, C. & Fausset, C. (2016).** _Touch Zone Sizing for Mobile Devices in Military Applications._ DUXU / HCI International, LNCS. **El único estudio con números sobre toque con guante.** 2×2 (Apple 8,5 mm vs MIL-STD 15 mm × con/sin guante), n=6, vehículo en movimiento. Guante: efecto sobre aciertos F(1,5)=12,67 p=,016 y fallos F(1,5)=9,37 p=,028. Dimensionado: efecto sobre errores F(1,5)=15,00 p=,012 — cero errores en las condiciones MIL-STD. Cita MIL-STD-1472**G**: 15 mm sin guante / **20 mm con guante**, 3 mm de separación. [DOI 10.1007/978-3-319-40406-6_7](https://link.springer.com/chapter/10.1007/978-3-319-40406-6_7)
- **Wang, X. et al. (2024).** _The research of touch screen usability in civil aircraft cockpit._ PLOS ONE 19(2): e0292849. Nueve tamaños de 9 a 21 mm, n=14: **21 mm** mínimo tiempo y carga; **18 mm** mínima tasa de error. [DOI](https://doi.org/10.1371/journal.pone.0292849)
- **Mark, G., Gudith, D. & Klocke, U. (2008).** _The Cost of Interrupted Work: More Speed and Stress._ CHI '08. La tarea interrumpida se completa igual o más rápido y sin pérdida de calidad, pero con **más estrés, frustración, presión de tiempo y esfuerzo**. (La cifra viral de "23 min 15 s" **no** procede de este trabajo.) [DOI 10.1145/1357054.1357072](https://dl.acm.org/doi/10.1145/1357054.1357072)

### Sistemas de diseño de referencia (valores de primera mano)

> Nota de procedencia: Geist, Linear y Stripe **no publican sus valores numéricos**; los que aparecen en §4 y §6 fueron leídos de sus hojas de estilo de producción. Carbon, Atlassian y Apple sí los publican en prosa/tabla.

| Sistema                     | Publica números                                                                                                                                                                                                                                  | Enlace                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel Geist**            | Solo estructura y guía de uso; los valores están en el CSS. Foundations = Introduction, Colors, Typography, Materials (no existen `/spacing/gap` ni `/radius`)                                                                                   | https://vercel.com/geist/typography · https://vercel.com/geist/colors                                                                                                                                                                                                                                                                                                                           |
| **Linear**                  | No publica documentación de diseño; todo desde `static.linear.app/web/_next/static/css/index.*.css`                                                                                                                                              | https://linear.app                                                                                                                                                                                                                                                                                                                                                                              |
| **Stripe**                  | Sistema interno "HDS" expuesto como variables CSS; solo la Appearance API está documentada (`spacingUnit: 2px`, `borderRadius: 4px`, y la regla de ≥16 px en inputs móviles)                                                                     | https://docs.stripe.com/elements/appearance-api                                                                                                                                                                                                                                                                                                                                                 |
| **IBM Carbon**              | **Sí, y es la referencia más aplicable.** Alturas de fila 24/32/40/48/64 px, escala de espaciado de 13 pasos, `miniUnit = 8px`, gutter 32 px, conjuntos tipográficos productivo (14 px) y expresivo (16 px), y la guía de estrategia de densidad | [data-table](https://carbondesignsystem.com/components/data-table/style/) · [spacing](https://carbondesignsystem.com/elements/spacing/overview/) · [type-sets](https://carbondesignsystem.com/elements/typography/type-sets/) · [style-strategies](https://carbondesignsystem.com/elements/typography/style-strategies/) · [2x-grid](https://carbondesignsystem.com/elements/2x-grid/overview/) |
| **Atlassian Design System** | Sí. `space.100 = 8px` con nomenclatura porcentual, bandas de uso (0–8 / 12–24 / 32–80 px), tipografía por defecto 14/20, breakpoints y anchos máximos (1296 / 864 px)                                                                            | [spacing](https://atlassian.design/foundations/spacing) · [typography](https://atlassian.design/foundations/typography) · [grid](https://atlassian.design/foundations/grid)                                                                                                                                                                                                                     |
| **Inter** (tipografía)      | x-height alto declarado, eje de tamaño óptico, `tabular-nums`, cero cortado, SIL OFL                                                                                                                                                             | https://rsms.me/inter/                                                                                                                                                                                                                                                                                                                                                                          |
| **NN/g**                    | Objetivo táctil ≥10×10 mm, yema 1,6–2 cm, pulgar 2,5 cm, separación ≥2 mm                                                                                                                                                                        | [touch-target-size](https://www.nngroup.com/articles/touch-target-size/)                                                                                                                                                                                                                                                                                                                        |

### Afirmaciones con confianza media o baja (marcadas como tales en el texto)

| Afirmación                                                                                        | Estado                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filosofía de color de **ISA-101** (gris apagado, color saturado reservado a la condición anormal) | **Media.** ISA-101.01-2015 es de pago; la descripción proviene de fuentes secundarias consistentes entre sí. Ninguna cifra de tamaño de fuente atribuida a ISA-101 pudo verificarse: todas las que circulan proceden de blogs. **Se usa ANSI/HFES 100-2007 §7.2.6.1 como fuente citable de mínimos.** |
| Umbrales de nits para legibilidad al sol (800 / 1 000 / 1 500 / 2 500)                            | **Baja.** Solo blogs técnicos de fabricantes de displays. Las normas correctas —de pago— serían **ISO 15008:2017** y **SAE J1757-1_202108**. Por eso el documento no usa ninguna cifra de nits como parámetro de diseño.                                                                              |
| Cifras de objetivo táctil atribuidas a **ISO 9241-410/411** (9,0 mm cuadrado / 11,0 mm circular)  | **No usar.** Solo aparecen en agregadores; los PDF de ISO son vistas previas.                                                                                                                                                                                                                         |
| Texto de **MIL-STD-1472G/H**                                                                      | **Media.** G y H no son de descarga libre; los números provienen del **1472F** público más la lectura de G que hacen Ray et al. (2016). Difieren levemente (16 mm vs 15 mm de mínimo).                                                                                                                |
| Rejilla de 8 dp / 4 dp de **Material 3**                                                          | **No verificable hoy.** Las páginas actuales de M3 solo declaran la separación de 8 dp; los valores de rejilla viven en un widget interactivo que no expone texto. La convergencia en 8 px se sustenta en Carbon, Atlassian y Stripe, que sí la publican.                                             |
| Interpretación de "character height" en ANSI/HFES                                                 | **Ambigüedad real.** La revisión 2007 dice _character height_ (lectura habitual: altura de mayúscula ≈0,70–0,72 em) y la de 2019 dice explícitamente _x-height_ (≈0,55 em). El §5.3 da las dos lecturas como banda y recomienda dentro de la intersección.                                            |
