import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { UsuariosDataService } from '../services/usuarios-data.service';

export const UsuariosStore = signalStore(
  { providedIn: 'root' },
  withEntities<Usuario>(),
  withMethods((store, dataService = inject(UsuariosDataService)) => ({
    cargar: rxMethod<void>(
      pipe(
        switchMap(() => dataService.getAll()),
        tap((usuarios) => patchState(store, setAllEntities(usuarios))),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      store.cargar();
    },
  }),
);
