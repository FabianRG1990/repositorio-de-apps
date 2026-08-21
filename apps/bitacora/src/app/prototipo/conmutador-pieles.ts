import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  computed,
  effect,
  inject,
  isDevMode,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

export type Piel = 'oficina' | 'taller';

const PIELES: readonly { id: Piel; nombre: string }[] = [
  { id: 'oficina', nombre: 'Oficina — bajo techo' },
  { id: 'taller', nombre: 'Taller — al sol' },
];

/**
 * PROTOTIPO DESECHABLE — ticket #79. No es código de producción: se borra
 * entero (esta carpeta y su línea en `app.ts`) cuando #80 ponga la
 * conmutación de verdad en Ajustes.
 *
 * Conmuta la piel escribiendo `data-piel` en <html>. La piel viaja en la URL
 * (`?piel=taller`) para que se pueda compartir un enlace a lo que se está
 * mirando y sobreviva a un recargado.
 *
 * No se muestra en el build de producción: `isDevMode()` lo apaga, así que un
 * merge distraído no puede publicar la barra.
 */
@Component({
  selector: 'app-conmutador-pieles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible) {
      <div class="barra" role="group" aria-label="Prototipo: piel visual">
        <span class="barra__etiqueta">#79</span>
        @for (piel of pieles; track piel.id) {
          <button
            type="button"
            class="barra__boton"
            [class.barra__boton--activo]="actual() === piel.id"
            [attr.aria-pressed]="actual() === piel.id"
            (click)="elegir(piel.id)"
          >
            {{ piel.nombre }}
          </button>
        }
        <span class="barra__pista">P alterna</span>
      </div>
    }
  `,
  styles: `
    .barra {
      position: fixed;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;

      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem;

      /* Deliberadamente ajeno a las dos pieles: no se evalúa, se usa. */
      border-radius: 999px;
      border: 2px solid #000;
      background: #fff100;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      font:
        500 0.8rem/1 system-ui,
        sans-serif;
      color: #000;
    }

    .barra__etiqueta,
    .barra__pista {
      padding: 0 0.5rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .barra__pista {
      font-weight: 400;
      opacity: 0.7;
    }

    .barra__boton {
      padding: 0.5rem 0.9rem;
      border-radius: 999px;
      border: 1px solid transparent;
      background: transparent;
      font: inherit;
      color: inherit;
      cursor: pointer;
    }

    .barra__boton--activo {
      border-color: #000;
      background: #000;
      color: #fff100;
    }

    .barra__boton:focus-visible {
      outline: 2px solid #000;
      outline-offset: 2px;
    }
  `,
  host: {
    '(document:keydown)': 'alPresionar($event)',
  },
})
export class ConmutadorPieles {
  readonly #router = inject(Router);
  readonly #documento = inject(DOCUMENT);
  readonly pieles = PIELES;
  readonly visible = isDevMode();

  /* La piel vive en una señal, NO en la URL. Los `routerLink` del menú no
     arrastran los query params, así que al navegar el `?piel=` desaparece y
     la piel se caía sola a la predeterminada a mitad del recorrido. La URL se
     lee al entrar —para que un enlace compartido abra la piel correcta— y se
     reescribe después de cada navegación, pero la fuente de verdad es esta. */
  readonly actual = signal<Piel>(
    // Se lee de la barra de direcciones y no del snapshot de la ruta: en el
    // componente raíz la navegación inicial todavía puede no haber resuelto,
    // y con el valor por defecto se pisaba el `?piel=` del enlace de entrada.
    new URLSearchParams(inject(DOCUMENT).location.search).get('piel') ===
      'taller'
      ? 'taller'
      : 'oficina',
  );

  readonly #enUrl = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((p) => p.get('piel'))),
    { initialValue: null },
  );

  readonly #siguiente = computed<Piel>(() =>
    this.actual() === 'oficina' ? 'taller' : 'oficina',
  );

  constructor() {
    effect(() => {
      const enUrl = this.#enUrl();
      // Solo se adopta lo que trae la URL cuando el parámetro viene de verdad;
      // que falte significa "se perdió al navegar", no "volvé a la de oficina".
      //
      // Y cuando falta NO se reescribe la URL: el prototipo no puede cambiar
      // lo que la app hace. Reponer el `?piel=` después de cada navegación
      // dejaba `/ordenes?piel=oficina` y tumbaba siete pruebas de punta a punta
      // que afirman sobre la URL. La piel se sostiene sola en la señal.
      if (enUrl === 'taller' || enUrl === 'oficina') {
        if (enUrl !== this.actual()) this.actual.set(enUrl);
      }
    });

    effect(() => {
      this.#documento.documentElement.dataset['piel'] = this.actual();
    });
  }

  elegir(piel: Piel) {
    this.actual.set(piel);
    this.#sincronizarUrl(piel);
  }

  /* Se reescribe la URL ACTUAL en vez de `navigate([])`: sin `relativeTo`, esa
     llamada resuelve contra la raíz y mandaba la app de vuelta al tablero cada
     vez que sincronizaba la piel. */
  #sincronizarUrl(piel: Piel) {
    const arbol = this.#router.parseUrl(this.#router.url);
    arbol.queryParams = { ...arbol.queryParams, piel };
    void this.#router.navigateByUrl(arbol, { replaceUrl: true });
  }

  /* La tecla no se roba mientras se escribe en un campo. */
  alPresionar(evento: KeyboardEvent) {
    if (!this.visible || evento.key.toLowerCase() !== 'p') return;
    const destino = evento.target as HTMLElement | null;
    if (
      destino?.closest('input, textarea, select, [contenteditable="true"]') !=
      null
    ) {
      return;
    }
    this.elegir(this.#siguiente());
  }
}
