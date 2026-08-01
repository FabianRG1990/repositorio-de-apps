import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Taller } from '../models/taller.model';
import { TalleresDataService } from '../services/talleres-data.service';

export const TalleresStore = signalStore(
  { providedIn: 'root' },
  withEntities<Taller>(),
  withMethods((store, dataService = inject(TalleresDataService)) => ({
    cargar: rxMethod<void>(
      pipe(
        switchMap(() => dataService.getAll()),
        tap((talleres) => patchState(store, setAllEntities(talleres))),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      store.cargar();
    },
  }),
);
