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
import { EtiquetaEspecialidad } from '../../shared/etiqueta-especialidad/etiqueta-especialidad';
import { FilaOrden } from '../../shared/fila-orden/fila-orden';
import { DetalleStore } from '../../data-access/detalle.store';
import { OrdenesStore } from '../../data-access/ordenes.store';
import { colones } from '../../shared/formato';
import { Boton } from '../../shared/boton/boton';

const PESTANAS: readonly Pestana[] = [
  { id: 'en-taller', label: 'En el taller', icon: ['fas', 'warehouse'] },
  { id: 'por-entregar', label: 'Por entregar', icon: ['fas', 'key'] },
  { id: 'entregado', label: 'Entregado', icon: ['fas', 'circle-check'] },
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
  imports: [ListaPestanas, FilaOrden, EtiquetaEspecialidad, Boton],
})
export class Ordenes {
  readonly store = inject(OrdenesStore);
  readonly #detalle = inject(DetalleStore);
  readonly pestanas = PESTANAS;
  readonly activa = signal<string>('en-taller');
  protected readonly colones = colones;

  protected verOrden(folio: string) {
    if (this.store.folioSeleccionado() !== folio) {
      this.store.seleccionar(folio);
    }
    this.#detalle.pedir();
  }
}
