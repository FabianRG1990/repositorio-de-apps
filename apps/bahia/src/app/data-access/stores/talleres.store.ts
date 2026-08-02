import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Taller } from '../models/taller.model';
import { TalleresDataService } from '../services/talleres-data.service';

export const TalleresStore = signalStore(
  { providedIn: 'root' },
  withEntities<Taller>(),
  // `cargado`: distingue "todavía no llegó nada de IndexedDB" de "ya
  // llegó y está vacío" — consumido por vistas que combinan varios stores
  // (ver KanbanBoard) para no pintar campos en blanco mientras cada uno
  // resuelve su propio viaje a IndexedDB en un momento ligeramente distinto.
  withState({ cargado: false }),
  withMethods((store, dataService = inject(TalleresDataService)) => ({
    cargar: rxMethod<void>(
      pipe(
        switchMap(() => dataService.getAll()),
        tap((talleres) =>
          patchState(store, setAllEntities(talleres), { cargado: true }),
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
