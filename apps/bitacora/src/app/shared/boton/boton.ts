import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Cuánto pesa lo que hace el botón.
 *
 * - `solido`   — la acción principal de la pantalla. Una sola por vista.
 * - `contorno` — acciones secundarias que igual se usan a diario.
 * - `callado`  — lo que acompaña sin competir: volver, cerrar, cancelar.
 * - `peligro`  — lo que quita algo. No es rojo por decoración: es lo único
 *                que separa "quitar" de "guardar" cuando se pulsa con prisa.
 */
export type TonoBoton = 'solido' | 'contorno' | 'callado' | 'peligro';

/**
 * El botón de Bitácora.
 *
 * Reemplaza a `matButton`. El [ADR 0015](../../../docs/adr/0015-la-fila-de-ordenes-es-propia-y-el-boton-es-de-material.md)
 * lo había resuelto con Material por una razón de **capacidad** —"hay
 * equivalente real y sus alturas son tokens sobrescribibles"— y esa razón se
 * sostiene: el botón de Material hace lo que tiene que hacer. Lo que nunca se
 * comprobó es si se **parecía**, y medido contra el item del menú lateral —que
 * sí replica la referencia visual— no comparte una sola seña:
 *
 * | | Item de menú | `matButton` |
 * |---|---|---|
 * | Radio | 15,2 px | 9999 px |
 * | Filete de acento | 3 px izquierda | ninguno |
 * | Realce interior | inset 1 px | ninguno |
 * | Esquinita | 12 px | ninguna |
 * | Espaciado | 1,25 px | 0,096 px |
 *
 * Nada de lo que hay acá está inventado: **cada seña se copia de una pieza que
 * ya replicaba la referencia**. El radio y el filete son los del item de menú;
 * la esquinita es su mismo `::after`; el realce interior sale de su sombra.
 *
 * Es un **atributo** y no un elemento propio —`button[app-boton]`— por lo mismo
 * que la fila de Órdenes: así el botón sigue siendo un `<button>` de verdad,
 * con su tipo, su `disabled` y su semántica, y se puede poner sobre un `<a>`
 * cuando lo que hace es navegar.
 */
@Component({
  selector: 'button[app-boton], a[app-boton]',
  template: '<ng-content />',
  styleUrl: './boton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  /* El tono y el alto viajan como ATRIBUTOS y no como clases. Con `[class]`
     el binding compone la lista entera, y quien use el botón casi siempre le
     pone además una clase suya —`.pantalla__accion`, `.pie__seguir`— para
     colocarlo; un atributo no compite con eso. */
  host: {
    '[attr.data-tono]': 'tono()',
    '[attr.data-alto]': 'alto()',
    '[attr.data-ancho]': 'ancho() ? "" : null',
  },
})
export class Boton {
  readonly tono = input<TonoBoton>('contorno');
  /**
   * Alto fuera de la escalera de densidad.
   *
   * Por omisión el botón mide `--app-boton-alto`, que la perilla de densidad
   * mueve a 48, 56 o 64 px junto con la altura de fila. `grande` le suma el
   * escalón de la acción principal; `chico` lo baja para las acciones que
   * viven dentro de una tarjeta o de un pie.
   */
  readonly alto = input<'chico' | 'normal' | 'grande'>('normal');
  /** Ocupa todo el ancho disponible. Para pies y paneles estrechos. */
  readonly ancho = input(false);
}
