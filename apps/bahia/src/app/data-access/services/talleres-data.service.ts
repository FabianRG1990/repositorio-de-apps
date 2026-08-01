import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Taller } from '../models/taller.model';
import { SEED_TALLER } from '../seed/seed-data';

// Costura hacia un backend real: hoy resuelve en memoria con `of(...)`;
// cuando exista un backend, esta es la única clase que cambia (a
// HttpClient) — el store y sus consumidores no se tocan.
//
// Solo `getAll`: la Fase 1 siembra un único taller y no tiene selector de
// taller ni pantalla de edición (ver ticket "Autenticación para la demo").
// Un sistema real necesitaría `create`/`update` para alta de talleres.
@Injectable({ providedIn: 'root' })
export class TalleresDataService {
  private readonly talleres: Taller[] = [SEED_TALLER];

  getAll(): Observable<Taller[]> {
    return of(this.talleres);
  }
}
