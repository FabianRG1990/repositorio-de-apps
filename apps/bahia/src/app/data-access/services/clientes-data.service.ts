import { Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { Cliente } from '../models/cliente.model';
import { getBahiaDb } from '../persistence/bahia-db';

// `update` no está aquí todavía: nada en la Fase 1 edita un cliente ya
// creado. Un sistema real lo necesitaría para corregir datos de contacto.
@Injectable({ providedIn: 'root' })
export class ClientesDataService {
  getAll(): Observable<Cliente[]> {
    return defer(() => getBahiaDb().then((db) => db.getAll('clientes')));
  }

  create(cliente: Omit<Cliente, 'id'>): Observable<Cliente> {
    const creado: Cliente = { ...cliente, id: crypto.randomUUID() };
    return defer(() =>
      getBahiaDb().then(async (db) => {
        await db.put('clientes', creado);
        return creado;
      }),
    );
  }
}
