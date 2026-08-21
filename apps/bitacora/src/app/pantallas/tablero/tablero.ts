import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FilaOrden } from '../../shared/fila-orden/fila-orden';
import { OrdenesStore } from '../../data-access/ordenes.store';

@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.html',
  styleUrl: './tablero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, MatButtonModule, FilaOrden],
})
export class Tablero {
  readonly store = inject(OrdenesStore);
}
