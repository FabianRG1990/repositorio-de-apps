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
 * OFRECE, no permite — y eso obliga a que TODAS las pantallas sigan en el
 * menú. La primera versión de esto le daba a cada Perfil un subconjunto, y el
 * resultado medido fue que un Dueño no tenía NINGÚN camino en la interfaz
 * hasta Recepción ni hasta Próximas visitas: quedaban solo para quien supiera
 * escribir la URL a mano. Eso no es ofrecer menos, es prohibir sin decirlo.
 *
 * Lo que cambia por Perfil es el ORDEN: primero lo que ese Perfil mira más
 * veces al día. Eso sí es ofrecer, y no le quita nada a nadie.
 */
export interface LoQueSeOfrece {
  /** Dónde cae al ENTRAR. Solo se usa al entrar (ver `elegir`). */
  readonly inicio: string;
  /** Las rutas del menú, TODAS, ordenadas para este Perfil. */
  readonly menu: readonly string[];
}

/* Las cinco pantallas están en las tres listas: lo que cambia es el orden.

   Los tres entran por una pantalla con datos a la vista. El Dueño entraba por
   Ajustes, y medido resultó ser la peor primera impresión posible: Ajustes
   abre en la pestaña Taller, que hoy es un párrafo, así que el Perfil que
   suena a "yo mando acá" aterrizaba en la única pantalla de la app con cero
   contenido. Entra por el Tablero como los demás; a Ajustes llega desde el
   menú, donde lo tiene de primero. */
export const OFRECIDO: Record<Perfil, LoQueSeOfrece> = {
  asesor: {
    inicio: '/',
    menu: ['/', '/recepcion', '/ordenes', '/proximas-visitas', '/ajustes'],
  },
  tecnico: {
    inicio: '/ordenes',
    menu: ['/ordenes', '/', '/recepcion', '/proximas-visitas', '/ajustes'],
  },
  dueno: {
    inicio: '/',
    menu: ['/', '/ajustes', '/ordenes', '/recepcion', '/proximas-visitas'],
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
