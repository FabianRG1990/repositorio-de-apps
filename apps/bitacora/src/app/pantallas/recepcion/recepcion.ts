import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BitacoraDatos } from '../../data-access/db/bitacora-db';
import type { VehiculoConocido } from '../../data-access/db/recepcion';
import { DetalleStore } from '../../data-access/detalle.store';
import { OrdenesStore } from '../../data-access/ordenes.store';

const VACIO = {
  placa: '',
  marca: '',
  modelo: '',
  anio: '',
  cliente: '',
  telefono: '',
  quienEntrega: '',
  reporta: '',
};

/**
 * Recibir un Vehículo, que hasta este ticket no se podía hacer desde la app:
 * `Repositorio.crear` y `acunarFolio` existían desde #74 y no los llamaba
 * nadie.
 *
 * Se captura lo mínimo más lo que reporta el Cliente. La Orden nace en estado
 * Recibido y **sin Líneas de servicio**: esas se añaden al diagnosticar, que
 * es cuando se sabe qué tiene el carro.
 *
 * El formulario no valida el formato de la placa. #35 lo dejó decidido: en el
 * país conviven formatos distintos y una expresión regular que rechace uno
 * legítimo bloquea el ingreso de un carro que está físicamente en el patio.
 */
@Component({
  selector: 'app-recepcion',
  templateUrl: './recepcion.html',
  styleUrl: './recepcion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButtonModule, FontAwesomeModule],
})
export class Recepcion {
  readonly #datos = inject(BitacoraDatos);
  readonly #ordenes = inject(OrdenesStore);
  readonly #detalle = inject(DetalleStore);
  readonly #router = inject(Router);

  protected readonly campos = signal({ ...VACIO });
  protected readonly conocido = signal<VehiculoConocido | null>(null);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected escribir<C extends keyof typeof VACIO>(campo: C, valor: string) {
    this.campos.update((c) => ({ ...c, [campo]: valor }));
    if (campo === 'placa') this.error.set(null);
  }

  /**
   * Al salir del campo de la placa se busca si el Taller ya conoce ese carro.
   *
   * Va en `blur` y no en cada tecla: consultar por cada letra dispara una
   * lectura a IndexedDB por pulsación y, sobre todo, enseñaría "no lo conozco"
   * mientras la placa está a medio escribir, que es ruido, no información.
   */
  protected async buscarPorPlaca() {
    /* Se espera a que la base esté lista antes de preguntarle. Entrando
       directo a esta pantalla con la app recién abierta, la consulta salía
       antes de que la base terminara de prepararse y contestaba "no lo
       conozco" sobre un carro que sí estaba. */
    await this.#datos.lista;

    const encontrado = await this.#datos.recepcion.reconocer(
      this.campos().placa,
    );
    this.conocido.set(encontrado);
    if (!encontrado) return;

    /* Se rellena lo que el Taller ya sabe, y queda editable: el carro pudo
       cambiar de dueño o el teléfono pudo cambiar. */
    this.campos.update((c) => ({
      ...c,
      marca: encontrado.marca,
      modelo: encontrado.modelo,
      anio: encontrado.anio ? String(encontrado.anio) : '',
      cliente: encontrado.cliente,
      telefono: encontrado.telefono,
    }));
  }

  protected get faltaAlgo(): boolean {
    const c = this.campos();
    return !c.placa.trim() || !c.marca.trim() || !c.cliente.trim();
  }

  protected async recibir() {
    if (this.faltaAlgo || this.guardando()) return;
    this.guardando.set(true);
    this.error.set(null);

    try {
      await this.#datos.lista;
      const c = this.campos();
      const anio = Number.parseInt(c.anio, 10);
      const orden = await this.#datos.recepcion.recibir(
        {
          placa: c.placa,
          marca: c.marca,
          modelo: c.modelo,
          anio: Number.isFinite(anio) ? anio : null,
          cliente: c.cliente,
          telefono: c.telefono,
          quienEntrega: c.quienEntrega,
          /* Una sola queja mientras la pantalla siga siendo un formulario
             plano. El flujo guiado recoge varias. */
          reportes: [
            {
              textual: c.reporta,
              capturadoPor: 'tecleado',
              cuando: [],
              desdeCuando: '',
              senales: [],
              especialidadSugerida: null,
              sugerenciaCorregida: false,
            },
          ],
          odometro: null,
          combustible: null,
          danosPrevios: '',
          objetosDentro: '',
        },
        await this.#datos.puestoActual(),
      );

      /* Se sale al Tablero con la Orden nueva ya seleccionada y su detalle
         abierto: el Asesor acaba de recibir un carro y lo siguiente que hace
         es comprobar que quedó donde tenía que quedar. */
      this.campos.set({ ...VACIO });
      this.conocido.set(null);
      await this.#router.navigateByUrl('/');
      this.#ordenes.seleccionar(orden.folio);
      this.#detalle.pedir();
    } catch (falla) {
      /* No queda nada escrito a medias: `recibir` es una sola transacción. */
      this.error.set(
        'No se pudo recibir el vehículo. No quedó nada guardado a medias, ' +
          'así que se puede volver a intentar. ' +
          (falla instanceof Error ? falla.message : ''),
      );
    } finally {
      this.guardando.set(false);
    }
  }
}
