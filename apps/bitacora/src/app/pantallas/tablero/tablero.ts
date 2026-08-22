import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FilaOrden } from '../../shared/fila-orden/fila-orden';
import { DetalleStore } from '../../data-access/detalle.store';
import { OrdenesStore } from '../../data-access/ordenes.store';

@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.html',
  styleUrl: './tablero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, MatButtonModule, RouterLink, FilaOrden],
})
export class Tablero {
  readonly store = inject(OrdenesStore);
  readonly #detalle = inject(DetalleStore);

  /**
   * Ver orden hace dos cosas, y la segunda es la que le da sentido: selecciona
   * la Orden y PIDE que se muestre el detalle. Antes de este botón, tocar una
   * fila en una tableta seleccionaba una Orden cuyo detalle vive en un panel
   * que en esa anchura está cerrado — o sea, no pasaba nada visible.
   */
  protected verOrden(folio: string) {
    if (this.store.folioSeleccionado() !== folio) {
      this.store.seleccionar(folio);
    }
    this.#detalle.pedir();
  }
}
