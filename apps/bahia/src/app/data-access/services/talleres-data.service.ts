import { Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { Taller } from '../models/taller.model';
import { getBahiaDb } from '../persistence/bahia-db';

// Costura hacia un backend real: hoy resuelve contra IndexedDB; cuando
// exista un backend, esta es la única clase que cambia (a HttpClient) — el
// store y sus consumidores no se tocan.
//
// Solo `getAll`: la Fase 1 siembra un único taller y no tiene selector de
// taller ni pantalla de edición (ver ticket "Autenticación para la demo").
// Un sistema real necesitaría `create`/`update` para alta de talleres.
@Injectable({ providedIn: 'root' })
export class TalleresDataService {
  getAll(): Observable<Taller[]> {
    return defer(() => getBahiaDb().then((db) => db.getAll('talleres')));
  }
}
