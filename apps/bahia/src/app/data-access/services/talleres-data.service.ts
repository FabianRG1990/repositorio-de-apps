import { Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { Taller } from '../models/taller.model';
import { getBahiaDb } from '../persistence/bahia-db';

// Costura hacia un backend real: hoy resuelve contra IndexedDB; cuando
// exista un backend, esta es la única clase que cambia (a HttpClient) — el
// store y sus consumidores no se tocan.
//
// La Fase 1 siembra un único taller y no tiene selector de taller ni
// pantalla de alta (ver ticket "Autenticación para la demo"). `update` solo
// existe para persistir cambios de `configuracion` desde el panel de
// Configuración.
@Injectable({ providedIn: 'root' })
export class TalleresDataService {
  getAll(): Observable<Taller[]> {
    return defer(() => getBahiaDb().then((db) => db.getAll('talleres')));
  }

  update(id: string, cambios: Partial<Taller>): Observable<Taller> {
    return defer(() =>
      getBahiaDb().then(async (db) => {
        const existente = await db.get('talleres', id);
        if (!existente) throw new Error(`Taller ${id} no encontrado`);
        const actualizado = { ...existente, ...cambios };
        await db.put('talleres', actualizado);
        return actualizado;
      }),
    );
  }
}
