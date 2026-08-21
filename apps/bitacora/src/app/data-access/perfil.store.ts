import { Injectable, computed, signal } from '@angular/core';

/** Los tres del ADR 0005. */
export type Perfil = 'asesor' | 'tecnico' | 'dueno';

export const ETIQUETA_PERFIL: Record<Perfil, string> = {
  asesor: 'Asesor',
  tecnico: 'Técnico',
  dueno: 'Dueño',
};

/**
 * Quién está usando la app.
 *
 * El ADR 0005 es explícito: el Perfil decide **qué se ofrece hacer**, no qué
 * está permitido. Acá no hay guardas de ruta, ni comprobaciones antes de
 * escribir, ni nada que se parezca a autenticación — sobre un selector sin
 * login eso sería teatro. Lo único que hace es que una pantalla pueda ofrecer
 * un control editable o mostrar el mismo dato en solo lectura.
 *
 * Arranca en Dueño porque todavía no hay dónde elegirlo: el selector es #90.
 */
@Injectable({ providedIn: 'root' })
export class PerfilStore {
  readonly #perfil = signal<Perfil>('dueno');

  readonly perfil = this.#perfil.asReadonly();

  /** Quien configura el Taller (ADR 0008). */
  readonly configuraElTaller = computed(() => this.#perfil() === 'dueno');

  elegir(perfil: Perfil) {
    this.#perfil.set(perfil);
  }
}
