import { Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { EstadoOrden, OrdenTrabajo } from '../models/orden-trabajo.model';
import { getBahiaDb } from '../persistence/bahia-db';

@Injectable({ providedIn: 'root' })
export class OrdenesDataService {
  getAll(): Observable<OrdenTrabajo[]> {
    return defer(() => getBahiaDb().then((db) => db.getAll('ordenes')));
  }

  create(orden: Omit<OrdenTrabajo, 'id'>): Observable<OrdenTrabajo> {
    const creada: OrdenTrabajo = { ...orden, id: crypto.randomUUID() };
    return defer(() =>
      getBahiaDb().then(async (db) => {
        await db.put('ordenes', creada);
        return creada;
      }),
    );
  }

  // `defer` para que un id inexistente llegue como error del Observable
  // (canal que un HttpClient real también usaría), no como una excepción
  // síncrona que escapa antes de que exista una suscripción.
  update(id: string, cambios: Partial<OrdenTrabajo>): Observable<OrdenTrabajo> {
    return defer(() =>
      getBahiaDb().then(async (db) => {
        const existente = await db.get('ordenes', id);
        if (!existente) throw new Error(`Orden de trabajo ${id} no encontrada`);
        const actualizada = { ...existente, ...cambios };
        await db.put('ordenes', actualizada);
        return actualizada;
      }),
    );
  }

  updateEstado(id: string, estado: EstadoOrden): Observable<OrdenTrabajo> {
    return this.update(id, { estado });
  }
}
