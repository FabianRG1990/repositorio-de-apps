import { Injectable } from '@angular/core';
import { defer, Observable, of } from 'rxjs';
import { EstadoOrden, OrdenTrabajo } from '../models/orden-trabajo.model';
import { SEED_ORDENES } from '../seed/seed-data';

@Injectable({ providedIn: 'root' })
export class OrdenesDataService {
  private ordenes: OrdenTrabajo[] = [...SEED_ORDENES];

  getAll(): Observable<OrdenTrabajo[]> {
    return of(this.ordenes);
  }

  create(orden: Omit<OrdenTrabajo, 'id'>): Observable<OrdenTrabajo> {
    const creada: OrdenTrabajo = { ...orden, id: crypto.randomUUID() };
    this.ordenes = [...this.ordenes, creada];
    return of(creada);
  }

  // `defer` para que un id inexistente llegue como error del Observable
  // (canal que un HttpClient real también usaría), no como una excepción
  // síncrona que escapa antes de que exista una suscripción.
  update(id: string, cambios: Partial<OrdenTrabajo>): Observable<OrdenTrabajo> {
    return defer(() => {
      this.ordenes = this.ordenes.map((orden) =>
        orden.id === id ? { ...orden, ...cambios } : orden,
      );
      return of(this.encontrar(id));
    });
  }

  updateEstado(id: string, estado: EstadoOrden): Observable<OrdenTrabajo> {
    return this.update(id, { estado });
  }

  private encontrar(id: string): OrdenTrabajo {
    const orden = this.ordenes.find((o) => o.id === id);
    if (!orden) throw new Error(`Orden de trabajo ${id} no encontrada`);
    return orden;
  }
}
