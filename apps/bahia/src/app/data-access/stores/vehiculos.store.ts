import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { addEntity, setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Vehiculo } from '../models/vehiculo.model';
import { VehiculosDataService } from '../services/vehiculos-data.service';

export const VehiculosStore = signalStore(
  { providedIn: 'root' },
  withEntities<Vehiculo>(),
  withState({ cargado: false }),
  withMethods((store, dataService = inject(VehiculosDataService)) => ({
    cargar: rxMethod<void>(
      pipe(
        switchMap(() => dataService.getAll()),
        tap((vehiculos) =>
          patchState(store, setAllEntities(vehiculos), { cargado: true }),
        ),
      ),
    ),
    crear: rxMethod<Omit<Vehiculo, 'id'>>(
      pipe(
        switchMap((vehiculo) => dataService.create(vehiculo)),
        tap((creado) => patchState(store, addEntity(creado))),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      store.cargar();
    },
  }),
);
