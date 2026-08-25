import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { BitacoraDatos } from './db/bitacora-db';
import type { DatosDelTaller } from './db/configuracion';
import type { Especialidad, Puesto, Tarifa } from './db/esquema';

/** Lo que hay configurado, compuesto para las pantallas. */
export interface ConfiguracionVista {
  readonly datos: DatosDelTaller;
  /** Desde cuántos días avisado se señala un Vehículo sin recoger (ADR 0009). */
  readonly diasParaSinRecoger: number;
  readonly especialidades: readonly Especialidad[];
  readonly tarifas: readonly Tarifa[];
  readonly puestos: readonly Puesto[];
}

const VACIA: ConfiguracionVista = {
  datos: { nombre: '', telefono: '', direccion: '', cedulaJuridica: '' },
  diasParaSinRecoger: 3,
  especialidades: [],
  tarifas: [],
  puestos: [],
};

/**
 * Lo que el Dueño configura, visto desde las pantallas.
 *
 * Va por `liveQuery` como el resto: cambiar una Especialidad en Ajustes tiene
 * que mover el filtro del tablero sin que nadie refresque, y cambiar el nombre
 * tiene que salir en el siguiente papel que se imprima.
 */
@Injectable({ providedIn: 'root' })
export class TallerStore {
  readonly #datos = inject(BitacoraDatos);

  readonly configuracion = toSignal(from(liveQuery(() => this.#componer())), {
    initialValue: VACIA,
  });

  /**
   * Las Especialidades que ofrece el Taller.
   *
   * De acá sale la decisión que el [ADR 0003] y el [ADR 0008] llaman "la única
   * configuración que cambia lo que se ve": con una sola, el filtro del
   * tablero no aparece.
   */
  readonly especialidades = computed(() => this.configuracion().especialidades);

  /** Con una sola Especialidad, filtrar por Especialidad no dice nada. */
  readonly hayQueFiltrar = computed(() => this.especialidades().length > 1);

  /**
   * Si la configuración ya llegó de la base.
   *
   * `liveQuery` tarda un instante en emitir, y hasta entonces esto devuelve la
   * configuración vacía. Sin poder distinguir "vacía" de "todavía no llegó",
   * un clic en el primer instante actúa sobre una lista vacía: en vez de
   * QUITAR una Especialidad la AÑADE, y de paso borra las otras dos.
   *
   * Ninguna Especialidad es un estado imposible —la capa de datos no deja
   * guardarlo— así que la lista vacía solo puede significar que no ha llegado.
   */
  readonly cargado = computed(
    () => this.configuracion().especialidades.length > 0,
  );

  /** Desde cuántos días avisado un Vehículo cuenta como sin recoger. */
  readonly diasParaSinRecoger = computed(
    () => this.configuracion().diasParaSinRecoger,
  );

  /** `mecanica` → 14000. Lo que la Tarifa sirve para sugerir. */
  readonly porHora = computed(() => {
    const mapa = new Map<Especialidad, number>();
    for (const t of this.configuracion().tarifas) {
      mapa.set(t.especialidad, t.porHora);
    }
    return mapa;
  });

  async #componer(): Promise<ConfiguracionVista> {
    const config = this.#datos.configuracion;
    const [taller, tarifas, puestos] = await Promise.all([
      config.taller(),
      config.tarifas(),
      config.puestos(),
    ]);

    if (!taller) return VACIA;

    return {
      datos: {
        nombre: taller.nombre,
        telefono: taller.telefono ?? '',
        direccion: taller.direccion ?? '',
        cedulaJuridica: taller.cedulaJuridica ?? '',
      },
      diasParaSinRecoger: taller.diasParaSinRecoger ?? 3,
      especialidades: taller.especialidades,
      tarifas,
      puestos,
    };
  }
}
