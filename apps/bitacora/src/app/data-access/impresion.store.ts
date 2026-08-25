import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

/**
 * Para quién se imprime. No son el mismo papel con distinto encabezado:
 * cambia el CONTENIDO, porque cambia quién lo lee y para qué.
 *
 * - `taller`  — va al parabrisas. Sin montos: el mecánico no cotiza, ejecuta.
 * - `cliente` — qué se le hizo y cuánto, con lo declinado como recordatorio.
 * - `archivo` — todo, con el estado de entrada y quién autorizó qué.
 */
export type DocumentoImpreso = 'taller' | 'cliente' | 'archivo';

/**
 * Qué papel hay que sacar.
 *
 * Es un store y no una llamada directa a `window.print()` porque el papel
 * **todavía no existe** cuando se pulsa el botón: la hoja se pinta solo para
 * el documento elegido, así que primero hay que decir cuál, dejar que Angular
 * lo pinte, y recién entonces imprimir. Llamando a `print()` en el mismo
 * cuadro sale una hoja en blanco.
 */
@Injectable({ providedIn: 'root' })
export class ImpresionStore {
  readonly #documento = signal<DocumentoImpreso | null>(null);
  readonly #ventana = inject(DOCUMENT).defaultView;
  readonly #raiz = inject(DOCUMENT).documentElement;

  /** Qué se está imprimiendo, o `null` si nada. */
  readonly documento = this.#documento.asReadonly();

  imprimir(documento: DocumentoImpreso) {
    if (!this.#ventana) return;

    this.#documento.set(documento);
    /* La bandera en `<html>` es lo que la hoja de impresión mira para tapar
       la app y dejar solo el papel. Va en el elemento raíz y no en el cuerpo
       porque la ventana de la Orden se pinta en la CAPA SUPERIOR, fuera del
       flujo del `<body>`: una regla colgada del cuerpo no la alcanza. */
    this.#raiz.dataset['imprimiendo'] = documento;

    /* Dos cuadros de espera y no `setTimeout(0)`: el primero deja que Angular
       aplique el cambio de señal, el segundo que el navegador pinte el papel.
       Con uno solo, en Firefox salía la hoja del documento anterior. */
    this.#ventana.requestAnimationFrame(() =>
      this.#ventana?.requestAnimationFrame(() => {
        this.#ventana?.print();
        this.#limpiar();
      }),
    );
  }

  /**
   * `print()` es SÍNCRONO: no vuelve hasta que se cierra el diálogo del
   * sistema, así que limpiar justo después es correcto y no hace falta
   * escuchar `afterprint` —que además no dispara en todos los navegadores
   * cuando se cancela—.
   */
  #limpiar() {
    delete this.#raiz.dataset['imprimiendo'];
    this.#documento.set(null);
  }
}
