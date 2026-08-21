import { Injectable, signal } from '@angular/core';

/**
 * La petición de "muéstrame esta Orden".
 *
 * Existe porque el detalle lo pinta el panel del shell y quien lo pide es una
 * fila de la lista, que está dos niveles más abajo y no puede —ni debe— tocar
 * el `MatSidenav`. La lista pide; el shell decide cómo enseñarlo, que no es lo
 * mismo en escritorio con el panel fijado que en una tableta donde el panel
 * está cerrado.
 *
 * Es un CONTADOR y no un booleano a propósito: pedir el detalle de la misma
 * Orden dos veces seguidas tiene que volver a abrir el panel si entretanto se
 * cerró, y un booleano que ya vale `true` no vuelve a notificar.
 */
@Injectable({ providedIn: 'root' })
export class DetalleStore {
  readonly #peticiones = signal(0);

  /** Sube en uno cada vez que alguien pide ver una Orden. Arranca en 0. */
  readonly peticiones = this.#peticiones.asReadonly();

  pedir() {
    this.#peticiones.update((n) => n + 1);
  }
}
