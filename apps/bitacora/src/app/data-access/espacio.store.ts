import { Injectable, computed, signal } from '@angular/core';
import { asegurarElEspacio, type EspacioEnDisco } from './db/fotos';

/** Por encima de esto se avisa: llenar el disco no puede ser una sorpresa. */
const APRETADO = 0.8;

/**
 * Cuánto espacio queda, y si el navegador se comprometió a no borrar.
 *
 * Esto NO estaba en el [ADR 0006](../../docs/adr/0006-fotos-en-la-orden.md) y
 * salió de investigar antes de construir las Fotos: **WebKit borra los datos
 * de un origen que no haya tenido interacción en siete días**. Para una app
 * cuyos datos viven solo en el navegador eso no es una molestia, es pérdida de
 * historial — y el historial es el producto.
 *
 * Se pide `persist()` al arrancar. El navegador puede decir que no —Chromium
 * lo niega sin señales de uso, y Safari puede negarlo siempre—, y lo único
 * honesto es saberlo en vez de suponer que los datos están a salvo.
 */
@Injectable({ providedIn: 'root' })
export class EspacioStore {
  readonly #espacio = signal<EspacioEnDisco | null>(null);

  readonly espacio = this.#espacio.asReadonly();

  /** Se está acabando. `false` mientras no haya dato: no se alarma a ciegas. */
  readonly apretado = computed(() => {
    const proporcion = this.#espacio()?.proporcion;
    return proporcion !== null && proporcion !== undefined
      ? proporcion > APRETADO
      : false;
  });

  constructor() {
    void this.revisar();
  }

  /**
   * Vuelve a mirar. Se llama al arrancar y después de guardar Fotos, que es
   * lo único que mueve la aguja de verdad.
   */
  async revisar(): Promise<void> {
    this.#espacio.set(await asegurarElEspacio());
  }
}
