import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EtiquetaEspecialidad } from '../../shared/etiqueta-especialidad/etiqueta-especialidad';
import { InsigniaEstado } from '../../shared/insignia-estado/insignia-estado';
import {
  OrdenesStore,
  tiempoParadoLegible,
} from '../../data-access/ordenes.store';

/**
 * El panel derecho del estándar: contextual al contenido central. En el diseño
 * de referencia ese sitio lo ocupa el carrito de compra; acá lo ocupa el detalle
 * de la Orden que esté seleccionada, que es el equivalente de dominio.
 *
 * No navega ni cambia de ruta: solo refleja lo que el centro tiene elegido.
 */
@Component({
  selector: 'app-panel-detalle',
  templateUrl: './panel-detalle.html',
  styleUrl: './panel-detalle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, InsigniaEstado, EtiquetaEspecialidad],
})
export class PanelDetalle {
  readonly store = inject(OrdenesStore);
  protected readonly tiempo = tiempoParadoLegible;
}
