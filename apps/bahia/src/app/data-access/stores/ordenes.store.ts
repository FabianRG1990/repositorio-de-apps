import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  addEntity,
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { EstadoOrden, OrdenTrabajo } from '../models/orden-trabajo.model';
import { OrdenesDataService } from '../services/ordenes-data.service';

export const OrdenesStore = signalStore(
  { providedIn: 'root' },
  withEntities<OrdenTrabajo>(),
  withState({ cargado: false }),
  withMethods((store, dataService = inject(OrdenesDataService)) => ({
    cargar: rxMethod<void>(
      pipe(
        switchMap(() => dataService.getAll()),
        tap((ordenes) =>
          patchState(store, setAllEntities(ordenes), { cargado: true }),
        ),
      ),
    ),
    crear: rxMethod<Omit<OrdenTrabajo, 'id'>>(
      pipe(
        switchMap((orden) => dataService.create(orden)),
        tap((creada) => patchState(store, addEntity(creada))),
      ),
    ),
    cambiarEstado: rxMethod<{ id: string; estado: EstadoOrden }>(
      pipe(
        switchMap(({ id, estado }) => dataService.updateEstado(id, estado)),
        tap((actualizada) =>
          patchState(
            store,
            updateEntity({ id: actualizada.id, changes: actualizada }),
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
