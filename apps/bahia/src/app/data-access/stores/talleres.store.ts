import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import {
  CONFIGURACION_TALLER_DEFECTO,
  ConfiguracionTaller,
  Taller,
} from '../models/taller.model';
import { TalleresDataService } from '../services/talleres-data.service';

export const TalleresStore = signalStore(
  { providedIn: 'root' },
  withEntities<Taller>(),
  // `cargado`: distingue "todavía no llegó nada de IndexedDB" de "ya
  // llegó y está vacío" — consumido por vistas que combinan varios stores
  // (ver KanbanBoard) para no pintar campos en blanco mientras cada uno
  // resuelve su propio viaje a IndexedDB en un momento ligeramente distinto.
  withState({ cargado: false }),
  withComputed(({ entities }) => ({
    // Fase 1 siembra un único taller — sin selector de taller.
    taller: computed(() => entities()[0] as Taller | undefined),
  })),
  withComputed(({ taller }) => ({
    // Ausente en el registro sembrado = valores por defecto, sin migrar.
    configuracion: computed(
      (): ConfiguracionTaller =>
        taller()?.configuracion ?? CONFIGURACION_TALLER_DEFECTO,
    ),
  })),
  withMethods((store, dataService = inject(TalleresDataService)) => ({
    cargar: rxMethod<void>(
      pipe(
        switchMap(() => dataService.getAll()),
        tap((talleres) =>
          patchState(store, setAllEntities(talleres), { cargado: true }),
        ),
      ),
    ),
    actualizarConfiguracion: rxMethod<Partial<ConfiguracionTaller>>(
      pipe(
        switchMap((cambios) => {
          const taller = store.taller();
          if (!taller) throw new Error('Taller no encontrado');
          return dataService.update(taller.id, {
            configuracion: { ...store.configuracion(), ...cambios },
          });
        }),
        tap((actualizado) =>
          patchState(
            store,
            updateEntity({ id: actualizado.id, changes: actualizado }),
          ),
        ),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      store.cargar();
    },
  }),
);
