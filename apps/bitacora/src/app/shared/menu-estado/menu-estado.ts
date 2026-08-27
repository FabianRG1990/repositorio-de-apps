import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BitacoraDatos } from '../../data-access/db/bitacora-db';
import { ESTADOS_EN_EL_TALLER } from '../../data-access/db/ciclo';
import type { EstadoOrden } from '../../data-access/db/esquema';
import { PRESENTACION, type Orden } from '../../data-access/ordenes.store';
import { InsigniaEstado } from '../insignia-estado/insignia-estado';

/**
 * La insignia de estado, pulsable: cambia el estado desde donde se lee.
 *
 * El ciclo completo existía desde [#116] pero vivía **solo dentro de la
 * ventana** de la Orden, así que mover un carro de "en proceso" a "listo"
 * costaba cuatro pasos —abrir, esperar, elegir, cerrar— para el verbo más
 * frecuente del taller. El tablero, que es la pantalla en la que se está todo
 * el día, solo sabía leer ([#120]).
 *
 * ## Por qué la insignia y no un botón nuevo
 *
 * La rejilla de la fila está medida al píxel en [#77] y tiene cinco
 * configuraciones entre densidades y reflujo: una columna más la reabre
 * entera. La insignia ya ocupa una celda y ya es donde el ojo va a leer el
 * estado, así que cambiarlo ahí no añade nada que aprender.
 *
 * ## Los cinco, no "el siguiente"
 *
 * El [ADR 0024] decidió que el estado se mueve **sin orden forzado**: un carro
 * vuelve de "listo" a "en proceso" cuando algo sale mal en la prueba de ruta.
 * Un botón de "siguiente paso" sería más corto y le mentiría al taller.
 *
 * `entregado` no está en la lista: tiene su propio verbo porque saca el carro
 * del Taller y fija la fecha, y un clic desde una lista es exactamente la
 * forma de hacerlo sin querer.
 *
 * ## Por qué `MatMenu`
 *
 * Trae la trampa de foco, el `Esc`, el recorrido con flechas, el `aria-expanded`
 * del disparador y la devolución del foco al cerrar. Es el mismo desplegable
 * que el conmutador de Perfil del menú lateral, así que el taller ya lo ha
 * visto abrirse una vez.
 */
@Component({
  selector: 'app-menu-estado',
  templateUrl: './menu-estado.html',
  styleUrl: './menu-estado.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuModule, FontAwesomeModule, InsigniaEstado],
})
export class MenuEstado {
  readonly #datos = inject(BitacoraDatos);

  readonly orden = input.required<Orden>();

  protected readonly estados = ESTADOS_EN_EL_TALLER;
  protected readonly presentacion = PRESENTACION;
  protected readonly error = signal<string | null>(null);

  /**
   * La Orden entregada no se cambia desde acá.
   *
   * Devolverla al Taller es deshacer la entrega —que limpia la fecha— y eso
   * vive en la ventana, con su propio botón. Acá la insignia se queda quieta y
   * se lee, como antes.
   */
  protected readonly sePuedeMover = computed(
    () => this.orden().estadoClave !== 'entregado',
  );

  protected async moverA(estado: EstadoOrden) {
    if (estado === this.orden().estadoClave) return;

    this.error.set(null);
    try {
      await this.#datos.lista;
      await this.#datos.ciclo.moverA(this.orden().id, estado);
    } catch (falla) {
      this.error.set(
        falla instanceof Error ? falla.message : 'No se pudo cambiar.',
      );
    }
  }
}
