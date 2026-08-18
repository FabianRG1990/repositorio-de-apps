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
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Factura } from '../models/factura.model';
import { FacturasDataService } from '../services/facturas-data.service';

export const FacturasStore = signalStore(
  { providedIn: 'root' },
  withEntities<Factura>(),
  withState({ cargado: false }),
  withMethods((store, dataService = inject(FacturasDataService)) => ({
    cargar: rxMethod<void>(
      pipe(
        switchMap(() => dataService.getAll()),
        tap((facturas) =>
          patchState(store, setAllEntities(facturas), { cargado: true }),
        ),
      ),
    ),
    crear: rxMethod<Omit<Factura, 'id'>>(
      pipe(
        switchMap((factura) => dataService.create(factura)),
        tap((creada) => patchState(store, addEntity(creada))),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      store.cargar();
    },
  }),
);
