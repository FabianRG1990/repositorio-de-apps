import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Vehiculo } from '../models/vehiculo.model';
import { SEED_VEHICULOS } from '../seed/seed-data';

// `update` no está aquí todavía: nada en la Fase 1 edita un vehículo ya
// registrado. Un sistema real lo necesitaría para corregir datos del
// vehículo.
@Injectable({ providedIn: 'root' })
export class VehiculosDataService {
  private vehiculos: Vehiculo[] = [...SEED_VEHICULOS];

  getAll(): Observable<Vehiculo[]> {
    return of(this.vehiculos);
  }

  create(vehiculo: Omit<Vehiculo, 'id'>): Observable<Vehiculo> {
    const creado: Vehiculo = { ...vehiculo, id: crypto.randomUUID() };
    this.vehiculos = [...this.vehiculos, creado];
    return of(creado);
  }
}
