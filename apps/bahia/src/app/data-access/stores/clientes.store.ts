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
import { Cliente } from '../models/cliente.model';
import { ClientesDataService } from '../services/clientes-data.service';

export const ClientesStore = signalStore(
  { providedIn: 'root' },
  withEntities<Cliente>(),
  withState({ cargado: false }),
  withMethods((store, dataService = inject(ClientesDataService)) => ({
    cargar: rxMethod<void>(
      pipe(
        switchMap(() => dataService.getAll()),
        tap((clientes) =>
          patchState(store, setAllEntities(clientes), { cargado: true }),
        ),
      ),
    ),
    crear: rxMethod<Omit<Cliente, 'id'>>(
      pipe(
        switchMap((cliente) => dataService.create(cliente)),
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
