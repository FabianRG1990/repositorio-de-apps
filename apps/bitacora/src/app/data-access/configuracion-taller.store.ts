import {
  DOCUMENT,
  Injectable,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { derivarDeLaMarca } from './color-marca';

export type Piel = 'oficina' | 'taller';
export type Densidad = 'compacta' | 'normal' | 'guantes';

export interface Apariencia {
  readonly piel: Piel;
  readonly densidad: Densidad;
  /** Color de marca del Taller, en hexadecimal. */
  readonly marca: string;
}

export const ETIQUETA_PIEL: Record<Piel, string> = {
  oficina: 'Oficina',
  taller: 'Taller',
};

export const ETIQUETA_DENSIDAD: Record<Densidad, string> = {
  compacta: 'Compacta',
  normal: 'Normal',
  guantes: 'Guantes',
};

const CLAVE = 'bitacora.apariencia';
const MARCA_POR_DEFECTO = '#3da5c2';

/* La luminancia y el croma los pone la piel; del color de marca solo se toma
   el matiz. Los valores son los de los acentos que cada piel ya tenía, para
   que la marca por defecto reproduzca exactamente el aspecto de antes. */
const ACENTO: Record<
  Piel,
  { fuerte: [number, number]; suave: [number, number] }
> = {
  oficina: { fuerte: [0.68, 0.09], suave: [0.8, 0.06] },
  taller: { fuerte: [0.63, 0.1], suave: [0.42, 0.09] },
};

/**
 * La apariencia es del Taller: una sola configuración, igual en todos los
 * aparatos, decidido con el usuario el 2026-08-21. La cambia el Dueño
 * (ADR 0008), y los demás Perfiles la ven sin poder editarla — sin muro, que
 * es lo que manda el ADR 0005.
 *
 * Hoy se guarda en el dispositivo porque el esquema de #74 todavía no existe.
 * La forma de esta API —señales de solo lectura hacia afuera, mutación por
 * métodos— es la que ese ticket tiene que conservar al mover el respaldo, tal
 * como se hizo con `OrdenesStore`.
 */
@Injectable({ providedIn: 'root' })
export class ConfiguracionTallerStore {
  readonly #documento = inject(DOCUMENT);
  readonly #apariencia = signal<Apariencia>(this.#leerGuardado());

  readonly apariencia = this.#apariencia.asReadonly();
  readonly piel = computed(() => this.#apariencia().piel);
  readonly densidad = computed(() => this.#apariencia().densidad);
  readonly marca = computed(() => this.#apariencia().marca);

  constructor() {
    effect(() => this.#aplicar(this.#apariencia()));
  }

  cambiarPiel(piel: Piel) {
    this.#guardar({ ...this.#apariencia(), piel });
  }

  cambiarDensidad(densidad: Densidad) {
    this.#guardar({ ...this.#apariencia(), densidad });
  }

  cambiarMarca(marca: string) {
    this.#guardar({ ...this.#apariencia(), marca });
  }

  #guardar(apariencia: Apariencia) {
    this.#apariencia.set(apariencia);
    try {
      this.#documento.defaultView?.localStorage.setItem(
        CLAVE,
        JSON.stringify(apariencia),
      );
    } catch {
      /* Modo privado o almacenamiento lleno: la app sigue, sin recordar. */
    }
  }

  #leerGuardado(): Apariencia {
    const ventana = this.#documento.defaultView;
    try {
      const crudo = ventana?.localStorage.getItem(CLAVE);
      if (crudo) {
        const guardado = JSON.parse(crudo) as Partial<Apariencia>;
        return {
          piel: guardado.piel === 'taller' ? 'taller' : 'oficina',
          densidad:
            guardado.densidad === 'compacta' || guardado.densidad === 'guantes'
              ? guardado.densidad
              : 'normal',
          marca:
            typeof guardado.marca === 'string' &&
            /^#[0-9a-f]{6}$/i.test(guardado.marca)
              ? guardado.marca
              : MARCA_POR_DEFECTO,
        };
      }
    } catch {
      /* Lo guardado no se pudo leer: se arranca de cero, no se rompe. */
    }

    /* Sin nada elegido todavía, se mira si el sistema PIDE MÁS CONTRASTE.
       No se mira `prefers-color-scheme`: esa preferencia es de tema claro u
       oscuro por gusto, y el modo taller no es un gusto — es alto contraste
       para el sol. `prefers-contrast: more` es la única de las dos que
       significa lo mismo que este ajuste. */
    const pideContraste =
      ventana?.matchMedia?.('(prefers-contrast: more)').matches ?? false;

    return {
      piel: pideContraste ? 'taller' : 'oficina',
      densidad: 'normal',
      marca: MARCA_POR_DEFECTO,
    };
  }

  #aplicar({ piel, densidad, marca }: Apariencia) {
    const raiz = this.#documento.documentElement;
    raiz.dataset['piel'] = piel;
    raiz.dataset['densidad'] = densidad;

    const { fuerte, suave } = ACENTO[piel];
    raiz.style.setProperty(
      '--app-accent-strong',
      derivarDeLaMarca(marca, fuerte[0], fuerte[1]),
    );
    raiz.style.setProperty(
      '--app-accent',
      derivarDeLaMarca(marca, suave[0], suave[1]),
    );
  }
}
