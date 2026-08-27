import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DetalleStore } from '../../data-access/detalle.store';
import {
  OrdenesStore,
  tiempoParadoLegible,
} from '../../data-access/ordenes.store';
import { Boton } from '../../shared/boton/boton';
import { EtiquetaEspecialidad } from '../../shared/etiqueta-especialidad/etiqueta-especialidad';
import { colones } from '../../shared/formato';
import { MenuEstado } from '../../shared/menu-estado/menu-estado';

/**
 * El panel derecho del estándar: contextual al contenido central. En el diseño
 * de referencia ese sitio lo ocupa el carrito de compra; acá lo ocupa el
 * **resumen** de la Orden que esté seleccionada.
 *
 * Resumen y no la Orden entera. El panel mide 310 px de ancho, y ahí las
 * Líneas de servicio con sus montos, las quejas del Cliente y el estado de
 * entrada se convertían en una columna larguísima de texto envuelto: había que
 * leer en vertical algo que existe para verse de un vistazo. Lo que queda es
 * lo que se responde sin leer —cuánto lleva parado, qué carro, quién, en qué
 * estado, cuánto suma y por qué entró— y un botón que abre la Orden completa
 * en su ventana.
 *
 * No navega ni cambia de ruta: solo refleja lo que el centro tiene elegido.
 */
@Component({
  selector: 'app-panel-detalle',
  templateUrl: './panel-detalle.html',
  styleUrl: './panel-detalle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, MenuEstado, EtiquetaEspecialidad, Boton],
})
export class PanelDetalle {
  readonly store = inject(OrdenesStore);
  readonly #detalle = inject(DetalleStore);

  protected readonly tiempo = tiempoParadoLegible;
  protected readonly colones = colones;

  protected readonly aprobadas = computed(() =>
    (this.store.seleccionada()?.lineas ?? []).filter((l) => !l.declinada),
  );

  protected readonly declinadas = computed(() =>
    (this.store.seleccionada()?.lineas ?? []).filter((l) => l.declinada),
  );

  protected readonly totalAprobado = computed(() =>
    this.aprobadas().reduce((t, l) => t + l.monto, 0),
  );

  protected readonly totalDeclinado = computed(() =>
    this.declinadas().reduce((t, l) => t + l.monto, 0),
  );

  /* Pide la Orden por el mismo contador que usa la fila de la lista, en vez de
     alcanzar la ventana directamente: el panel no sabe —ni tiene por qué—
     dónde está montada. */
  protected verLaOrden() {
    this.#detalle.pedir();
  }
}
