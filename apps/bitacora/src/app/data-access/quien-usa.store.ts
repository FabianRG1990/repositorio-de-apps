import { Injectable, computed, inject } from '@angular/core';
import type { Persona } from './db/esquema';
import { PerfilStore } from './perfil.store';
import { TallerStore } from './taller.store';

/**
 * Quién tiene el aparato en la mano.
 *
 * Existe porque la respuesta necesita las dos mitades y ninguna de las dos la
 * tiene sola: el [PerfilStore] sabe qué recuerda ESTE aparato —un Papel y, si
 * se dijo, el id de una Persona—, y el [TallerStore] sabe a quién tiene el
 * Taller registrado. Meter una en la otra las ataría: el Perfil se guarda en
 * el almacenamiento local del navegador y el personal vive en la base.
 *
 * No es autenticación, y no se le puede pedir que lo sea. El [ADR 0005] es
 * tajante en que el Perfil dice qué se OFRECE, *"no qué está permitido"*; acá
 * nadie demuestra ser quien dice, y por eso decirlo es opcional.
 */
@Injectable({ providedIn: 'root' })
export class QuienUsaStore {
  readonly #perfiles = inject(PerfilStore);
  readonly #taller = inject(TallerStore);

  /**
   * La Persona elegida, o `null` si no se dijo o ya no está.
   *
   * Se resuelve contra el personal VIVO en cada lectura y no se copia: alguien
   * a quien dieron de baja mientras su tableta seguía abierta deja de estar
   * elegido solo, sin que nadie tenga que ir a limpiarlo. Es también lo que
   * evita que un id viejo del almacenamiento local sobreviva a un borrado de
   * la base.
   */
  readonly persona = computed<Persona | null>(() => {
    const id = this.#perfiles.personaId();
    if (!id) return null;
    return this.#taller.personal().find((p) => p.id === id) ?? null;
  });

  /** Quiénes podrían ser: la gente del Papel con el que se está usando. */
  readonly candidatas = computed<readonly Persona[]>(() => {
    const perfil = this.#perfiles.perfil();
    if (!perfil) return [];
    return this.#taller.personalPorPapel().get(perfil) ?? [];
  });

  /**
   * Si vale la pena preguntar quién es.
   *
   * Con nadie de ese Papel configurado no hay pregunta que hacer, y hacerla
   * igual dejaría una pantalla con un título y ninguna opción — que es cómo se
   * ve una app rota. Es el huevo y la gallina del primer arranque: sin esto, el
   * Dueño no podría entrar a crear la primera Persona.
   */
  readonly hayAQuienPreguntar = computed(() => this.candidatas().length > 0);

  /** Lo que se pone en el pie del menú: el nombre si lo hay, si no el Papel. */
  readonly comoSeLlama = computed(() => this.persona()?.nombre ?? null);
}
