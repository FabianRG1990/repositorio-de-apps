import { Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { Vehiculo } from '../models/vehiculo.model';
import { getBahiaDb } from '../persistence/bahia-db';

// `update` no está aquí todavía: nada en la Fase 1 edita un vehículo ya
// registrado. Un sistema real lo necesitaría para corregir datos del
// vehículo.
@Injectable({ providedIn: 'root' })
export class VehiculosDataService {
  getAll(): Observable<Vehiculo[]> {
    return defer(() => getBahiaDb().then((db) => db.getAll('vehiculos')));
  }

  create(vehiculo: Omit<Vehiculo, 'id'>): Observable<Vehiculo> {
    const creado: Vehiculo = { ...vehiculo, id: crypto.randomUUID() };
    return defer(() =>
      getBahiaDb().then(async (db) => {
        await db.put('vehiculos', creado);
        return creado;
      }),
    );
  }
}
