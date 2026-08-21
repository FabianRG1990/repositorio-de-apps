import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  ETIQUETA_ESPECIALIDAD,
  OrdenesStore,
  tiempoParadoLegible,
} from '../../data-access/ordenes.store';

/**
 * El panel derecho del estándar: contextual al contenido central. En Moofy VIP
 * ese sitio lo ocupa el carrito; acá lo ocupa el detalle de la Orden que esté
 * seleccionada, que es el equivalente de dominio.
 *
 * No navega ni cambia de ruta: solo refleja lo que el centro tiene elegido.
 */
@Component({
  selector: 'app-panel-detalle',
  templateUrl: './panel-detalle.html',
  styleUrl: './panel-detalle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule],
})
export class PanelDetalle {
  readonly store = inject(OrdenesStore);
  protected readonly tiempo = tiempoParadoLegible;
  protected readonly especialidad = ETIQUETA_ESPECIALIDAD;
}
