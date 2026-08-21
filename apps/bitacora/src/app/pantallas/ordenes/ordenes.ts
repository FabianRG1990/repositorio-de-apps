import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  ListaPestanas,
  type Pestana,
} from '../../shared/lista-pestanas/lista-pestanas';
import {
  OrdenesStore,
  tiempoParadoLegible,
} from '../../data-access/ordenes.store';

const PESTANAS: readonly Pestana[] = [
  { id: 'en-taller', label: 'En el taller', icon: ['fas', 'warehouse'] },
  { id: 'por-entregar', label: 'Por entregar', icon: ['fas', 'key'] },
  { id: 'declinado', label: 'Declinado', icon: ['fas', 'circle-minus'] },
];

/**
 * Pantalla con pestañas. El cambio de panel NO pasa por el router —el mismo
 * mecanismo del estándar—: una señal decide y `@switch` intercambia el panel
 * dentro del cuadro, sin tocar la URL ni recrear el shell.
 */
@Component({
  selector: 'app-ordenes',
  templateUrl: './ordenes.html',
  styleUrl: './ordenes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListaPestanas],
})
export class Ordenes {
  readonly store = inject(OrdenesStore);
  readonly pestanas = PESTANAS;
  readonly activa = signal<string>('en-taller');
  protected readonly tiempo = tiempoParadoLegible;
}
