import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { ConfiguracionTallerStore } from '../../data-access/configuracion-taller.store';
import { EtiquetaEspecialidad } from '../etiqueta-especialidad/etiqueta-especialidad';
import { MenuEstado } from '../menu-estado/menu-estado';
import {
  tiempoParadoLegible,
  type Orden,
} from '../../data-access/ordenes.store';
import { Boton } from '../boton/boton';

/**
 * Una Orden en la lista. Es el componente que une los dos prototipos: la fila
 * medida en #77 (densidades, identificadores, estados, foco) y el botón
 * **Ver orden** del prototipo de componentes.
 *
 * ## Por qué no es un `mat-list-item`
 *
 * Tres motivos que se leen en el código de Material, no de memoria:
 *
 * 1. Su alto es un token en **píxeles fijos** —48/64/88 según el número de
 *    líneas (`list/_m3-list.scss`)—, y la escalera de este proyecto es
 *    56/72/96 (#18 §6.5). Peor: un alto en px no se mueve con el `font-size`
 *    de la raíz, que es exactamente el mecanismo con el que la perilla de
 *    densidad y el zoom al 200 % de SC 1.4.4 funcionan acá.
 * 2. `sanityCheckListItemContent` avisa por consola a partir de tres líneas, y
 *    la fila amplia tiene cinco áreas (cabecera, título, cliente, chips y
 *    detalle).
 * 3. La rejilla cambia de forma por densidad —de una línea a dos a tarjeta—, y
 *    `MatListItem` impone su propia estructura de título y líneas.
 *
 * ## El selector es un atributo, no un elemento
 *
 * `li[app-fila-orden]`: un `<app-fila-orden>` metido en un `<ul>` no es HTML
 * válido y rompe la relación lista↔elemento que el lector de pantalla anuncia.
 * Es el mismo patrón que usa `mat-list-item`.
 *
 * ## La densidad la lee el componente, no se la pasan
 *
 * La perilla vive en `ConfiguracionTallerStore` y la fila la consulta ahí. Un
 * `@Input` obligaría a cada pantalla que use una fila a inyectar el store y
 * reenviarlo, y bastaría con que una lo olvidara para tener dos densidades en
 * la misma lista. Un `:host-context([data-densidad])` en el CSS tampoco vale:
 * dejaría el `<html>` como segunda fuente de verdad del mismo dato.
 *
 * ## Dos botones, no un botón dentro de otro
 *
 * El cuerpo de la fila selecciona; **Ver orden** abre el detalle. Van como
 * hermanos dentro del `<li>` y no anidados, porque un `<button>` dentro de un
 * `<button>` es HTML inválido — que es justo lo que hacía el prototipo de
 * componentes, donde la fila era un `<article tabindex="0">` con el botón
 * dentro.
 */
@Component({
  selector: 'li[app-fila-orden]',
  templateUrl: './fila-orden.html',
  styleUrl: './fila-orden.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Boton, MenuEstado, EtiquetaEspecialidad],
  host: {
    class: 'fila',
    '[class.fila--seleccionada]': 'seleccionada()',
    '[class.fila--compacta]': 'compacta()',
    '[class.fila--amplia]': 'amplia()',
  },
})
export class FilaOrden {
  readonly #configuracion = inject(ConfiguracionTallerStore);

  readonly orden = input.required<Orden>();
  readonly seleccionada = input(false);

  readonly elegida = output<void>();
  readonly detallePedido = output<void>();

  /** A 56 px no hay segunda línea: se van el cliente y el detalle. */
  protected readonly compacta = computed(
    () => this.#configuracion.densidad() === 'compacta',
  );
  /** Con guante la fila es una tarjeta y el detalle sale sin abrir la Orden. */
  protected readonly amplia = computed(
    () => this.#configuracion.densidad() === 'guantes',
  );

  protected readonly tiempo = computed(() =>
    tiempoParadoLegible(this.orden().tiempoParado),
  );
}
