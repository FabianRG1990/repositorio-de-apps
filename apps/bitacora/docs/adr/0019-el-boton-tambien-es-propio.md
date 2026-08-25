# El botón también es propio

El [ADR 0015](./0015-la-fila-de-ordenes-es-propia-y-el-boton-es-de-material.md) repartió las piezas entre Angular Material y componentes propios, y a los botones les tocó Material con esta justificación, entera: _"hay equivalente real, y sus alturas son tokens sobrescribibles"_.

**Eso es un argumento de capacidad, y sigue siendo cierto.** Lo que faltó fue el otro: si se **parecían**. **Decidimos que el botón sea propio**, y esta enmienda corrige el ADR 0015 en esa casilla y solo en esa. Sale del ticket [#108](https://github.com/FabianRG1990/repositorio-de-apps/issues/108).

## Lo que faltaba medir

Contra el item del menú lateral, que es la pieza que sí replica la referencia visual:

| Seña               | Item de menú        | `matButton`       |
| ------------------ | ------------------- | ----------------- |
| Radio de esquina   | 15,2 px             | 9999 px           |
| Filete de acento   | 3 px a la izquierda | ninguno           |
| Realce interior    | inset 1 px al 6 %   | ninguno           |
| Esquinita inferior | triángulo de 12 px  | ninguna           |
| Espaciado de letra | 1,25 px             | 0,096 px          |
| Borde              | 1 px sólido         | 0 px en el sólido |

**Seis señas, cero coincidencias.** No es que el botón de Material esté mal hecho: es que está hecho según otro sistema. Un rectángulo redondeado de 15 px junto a una píldora de 9999 no se leen como dos variantes de la misma familia; se leen como dos productos.

## De dónde sale cada seña del botón nuevo

De ninguna parte nueva. El radio y el filete son los del item de menú; la esquinita es su mismo `::after` —el código de allá lleva escrito que es _"el detalle que más se nota del original y no cuesta nada"_—; el realce interior sale de su sombra, que en la piel de taller vale `none` y por eso el botón sólido queda plano ahí, tal como [ADR 0012](./0012-dos-pieles-por-tokens-de-color-y-de-efecto.md) decidió.

## Cuatro tonos, porque son cuatro pesos de acción

`solido` (uno por pantalla), `contorno`, `callado` —volver, cerrar, cancelar— y `peligro`, que es lo único que separa "quitar" de "guardar" cuando se pulsa con prisa.

## Considered Options

- **Botón propio** (elegida).
- **Seguir con Material y reescribirle la carcasa por tokens**: se probó en la cabeza y se descartó. Los seis valores están en tokens distintos por variante (`--mat-button-filled-*`, `--mat-button-outlined-*`, `--mat-button-text-*`), la esquinita y el filete no son tokens de nada —hay que inyectar un `::after` y un borde igual—, y el resultado sería un botón propio con el peso de Material encima y 26 sobrescrituras repartidas por cinco pantallas.
- **Cambiar la referencia visual para que sean píldoras**: es la otra forma de resolver la incoherencia, y no la que se pidió.

## Consequences

- **Se van 26 sobrescrituras `--mat-button-*`** repartidas en cinco hojas, y con ellas la única razón por la que cada pantalla tenía que saber cómo se llaman por dentro los tokens de Material. Lo que queda en las hojas es colocación.
- **El resto del ADR 0015 sigue en pie.** La fila propia, la insignia con figura, la etiqueta de especialidad y las tres razones por las que la fila no puede ser un `mat-list-item` no cambian. Material sigue en el proyecto para los cajones, la lista del menú y el desplegable.
- **La regla del mapeo se corrige, no se tira.** Sigue siendo "Material donde hay equivalente real y su carcasa no estorba", con el añadido de que _no estorbar_ incluye parecerse: la comprobación es mirar la pieza al lado de la que ya replica la referencia, no solo si el componente hace el trabajo.
- El tono viaja como **atributo** y no como clase, porque quien lo usa casi siempre le pone además una clase suya para colocarlo y `[class]` compone la lista entera.
- Contraste medido en 9 puntos por piel: ≥ 7,11:1 en oficina y ≥ 7,27:1 en taller. Los dos objetivos, cumplidos.
