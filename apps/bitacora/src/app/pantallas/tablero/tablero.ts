import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  ETIQUETA_ESPECIALIDAD,
  OrdenesStore,
  tiempoParadoLegible,
} from '../../data-access/ordenes.store';

@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.html',
  styleUrl: './tablero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule],
})
export class Tablero {
  readonly store = inject(OrdenesStore);
  protected readonly tiempo = tiempoParadoLegible;
  protected readonly especialidad = ETIQUETA_ESPECIALIDAD;
}
