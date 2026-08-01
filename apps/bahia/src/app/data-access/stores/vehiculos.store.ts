import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods } from '@ngrx/signals';
import { addEntity, setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Vehiculo } from '../models/vehiculo.model';
import { VehiculosDataService } from '../services/vehiculos-data.service';

export const VehiculosStore = signalStore(
  { providedIn: 'root' },
  withEntities<Vehiculo>(),
  withMethods((store, dataService = inject(VehiculosDataService)) => ({
    cargar: rxMethod<void>(
      pipe(
        switchMap(() => dataService.getAll()),
        tap((vehiculos) => patchState(store, setAllEntities(vehiculos))),
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
