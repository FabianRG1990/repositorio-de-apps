import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FilaOrden } from '../../shared/fila-orden/fila-orden';
import { DetalleStore } from '../../data-access/detalle.store';
import { OrdenesStore } from '../../data-access/ordenes.store';
import { ETIQUETA_ESPECIALIDAD_REPORTE } from '../../data-access/etiquetas-reporte';
import { TallerStore } from '../../data-access/taller.store';
import { Boton } from '../../shared/boton/boton';
import {
  GrupoOpciones,
  type Opcion,
} from '../../shared/grupo-opciones/grupo-opciones';

@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.html',
  styleUrl: './tablero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, Boton, RouterLink, FilaOrden, GrupoOpciones],
})
export class Tablero {
  readonly store = inject(OrdenesStore);
  readonly taller = inject(TallerStore);
  readonly #detalle = inject(DetalleStore);

  /**
   * El filtro por Especialidad.
   *
   * El [ADR 0003] lo decidió así: la Especialidad **no genera columnas ni
   * carriles**, es un filtro sobre la única lista. Y el [ADR 0008] lo llama
   * "la única configuración que cambia lo que se ve": con una sola
   * Especialidad configurada, el filtro no aparece y la pantalla es
   * exactamente la misma que la de un taller de un solo oficio.
   *
   * `null` es "todas", y es el estado de partida: el tablero existe para ver
   * el taller entero, y filtrar es lo que se hace después.
   */
  protected readonly filtro = signal<string | null>(null);

  protected readonly hayFiltro = this.taller.hayQueFiltrar;

  protected readonly opciones = computed<readonly Opcion[]>(() =>
    this.taller
      .especialidades()
      .map((id) => ({ id, etiqueta: ETIQUETA_ESPECIALIDAD_REPORTE[id] })),
  );

  /**
   * Las Órdenes que toca la Especialidad elegida.
   *
   * La Especialidad es de la Línea de servicio y no de la Orden (ADR 0001),
   * así que una Orden entra si CUALQUIERA de sus trabajos es de ese oficio.
   * Lo declinado no cuenta: nadie lo está trabajando, y por eso tampoco pinta
   * su color en la fila.
   */
  protected readonly visibles = computed(() => {
    const elegida = this.filtro();
    const ordenes = this.store.enElTaller();
    if (!elegida) return ordenes;
    return ordenes.filter((o) => o.especialidades.includes(elegida as never));
  });

  protected alternarFiltro(id: string) {
    /* Volver a pulsar la que ya está puesta quita el filtro. Es un solo gesto
       para poner y quitar, y evita tener que ofrecer un botón de "todas" que
       ocupa sitio y dice menos. */
    this.filtro.update((actual) => (actual === id ? null : id));
  }

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
