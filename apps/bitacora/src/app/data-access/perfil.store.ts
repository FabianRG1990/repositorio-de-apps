import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';

/** Los tres del ADR 0005. */
export type Perfil = 'asesor' | 'tecnico' | 'dueno';

export const ETIQUETA_PERFIL: Record<Perfil, string> = {
  asesor: 'Asesor',
  tecnico: 'Técnico',
  dueno: 'Dueño',
};

/** Lo que hace cada uno, en las palabras del ADR 0005. */
export const OFICIO_PERFIL: Record<Perfil, string> = {
  asesor: 'Recibe, cotiza y trata con el Cliente',
  tecnico: 'Ejecuta el trabajo y registra horas',
  dueno: 'Ve el negocio y configura el Taller',
};

export const PERFILES: readonly Perfil[] = ['asesor', 'tecnico', 'dueno'];

/**
 * Qué le ofrece la app a cada Perfil: dónde entra y qué le pone en el menú.
 *
 * OFRECE, no permite. No hay guardas de ruta ni comprobaciones antes de
 * escribir: cualquiera de estas rutas se abre escribiendo la URL, y ninguna
 * pantalla comprueba el Perfil para dejar hacer algo. Lo único que cambia es
 * qué se pone delante, que es literalmente lo que decidió el ADR 0005.
 *
 * El orden de cada lista importa: es el del menú, y lo primero es lo que ese
 * Perfil mira más veces al día.
 */
export interface LoQueSeOfrece {
  /** Dónde cae al ENTRAR. Solo se usa al entrar (ver `elegir`). */
  readonly inicio: string;
  /** Rutas del menú, en orden. */
  readonly menu: readonly string[];
}

/* Los tres destinos de entrada tienen contenido hoy. Recepción y Próximas
   visitas todavía son un párrafo, así que mandar ahí al Asesor sería abrir la
   demo en una pantalla vacía; cuando existan, este mapa es el único sitio que
   hay que tocar. */
export const OFRECIDO: Record<Perfil, LoQueSeOfrece> = {
  asesor: {
    inicio: '/',
    menu: ['/', '/recepcion', '/ordenes', '/proximas-visitas'],
  },
  tecnico: {
    inicio: '/ordenes',
    menu: ['/ordenes', '/'],
  },
  dueno: {
    inicio: '/ajustes',
    menu: ['/', '/ordenes', '/ajustes'],
  },
};

const CLAVE = 'bitacora.perfil';

/**
 * Quién está usando la app.
 *
 * El ADR 0005 es explícito: el Perfil decide **qué pantalla se abre y qué se
 * ofrece hacer**, no qué está permitido. Acá no hay guardas de ruta, ni
 * comprobaciones antes de escribir, ni nada que se parezca a autenticación —
 * sobre un selector sin login eso sería teatro.
 *
 * Es del APARATO y no del Taller: dice quién tiene la tableta en la mano
 * ahora mismo, así que se guarda en el almacenamiento local. Es el corte
 * contrario al de la apariencia, que sí es del Taller (ADR 0013).
 */
@Injectable({ providedIn: 'root' })
export class PerfilStore {
  readonly #documento = inject(DOCUMENT);
  readonly #perfil = signal<Perfil | null>(this.#leerGuardado());

  /**
   * `null` mientras nadie haya elegido. No arranca en Dueño: si arrancara con
   * un valor, no habría forma de distinguir "todavía no eligió" de "eligió
   * Dueño", y la pantalla de entrada no sabría si le toca aparecer.
   */
  readonly perfil = this.#perfil.asReadonly();

  /** Ya se eligió alguna vez en este aparato. */
  readonly elegido = computed(() => this.#perfil() !== null);

  /** Quien configura el Taller (ADR 0008). Sin Perfil elegido, nadie. */
  readonly configuraElTaller = computed(() => this.#perfil() === 'dueno');

  /** Lo que la app le pone delante. Sin Perfil elegido, lo del Asesor. */
  readonly ofrecido = computed(() => OFRECIDO[this.#perfil() ?? 'asesor']);

  /**
   * Cambia de Perfil. NO navega a propósito.
   *
   * El ADR promete que cambiar de Perfil en vivo "es gratis y no pierde
   * estado", y llevarse al usuario a otra pantalla es exactamente perder el
   * estado. El destino de entrada se usa al ENTRAR, que es lo que dice la otra
   * mitad de la frase: "el Perfil determina qué pantalla se abre".
   */
  elegir(perfil: Perfil) {
    this.#perfil.set(perfil);
    try {
      this.#documento.defaultView?.localStorage.setItem(CLAVE, perfil);
    } catch {
      /* Modo privado o almacenamiento lleno: la app sigue, sin recordar. */
    }
  }

  /** Vuelve al estado de recién instalado. Existe para poder probarlo. */
  olvidar() {
    this.#perfil.set(null);
    try {
      this.#documento.defaultView?.localStorage.removeItem(CLAVE);
    } catch {
      /* Igual que arriba: no recordar no es motivo para romperse. */
    }
  }

  #leerGuardado(): Perfil | null {
    try {
      const crudo = this.#documento.defaultView?.localStorage.getItem(CLAVE);
      return PERFILES.includes(crudo as Perfil) ? (crudo as Perfil) : null;
    } catch {
      return null;
    }
  }
}
