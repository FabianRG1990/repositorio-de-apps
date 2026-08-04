import { Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { Factura } from '../models/factura.model';
import { getBahiaDb } from '../persistence/bahia-db';

// `update` no está aquí: una factura se guarda una sola vez y queda fija
// (ver issue #11) — no hay ningún flujo que la edite después de creada.
@Injectable({ providedIn: 'root' })
export class FacturasDataService {
  getAll(): Observable<Factura[]> {
    return defer(() => getBahiaDb().then((db) => db.getAll('facturas')));
  }

  create(factura: Omit<Factura, 'id'>): Observable<Factura> {
    const creada: Factura = { ...factura, id: crypto.randomUUID() };
    return defer(() =>
      getBahiaDb().then(async (db) => {
        await db.put('facturas', creada);
        return creada;
      }),
    );
  }
}
