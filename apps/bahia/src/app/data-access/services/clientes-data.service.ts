import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Cliente } from '../models/cliente.model';
import { SEED_CLIENTES } from '../seed/seed-data';

// `update` no está aquí todavía: nada en la Fase 1 edita un cliente ya
// creado. Un sistema real lo necesitaría para corregir datos de contacto.
@Injectable({ providedIn: 'root' })
export class ClientesDataService {
  private clientes: Cliente[] = [...SEED_CLIENTES];

  getAll(): Observable<Cliente[]> {
    return of(this.clientes);
  }

  create(cliente: Omit<Cliente, 'id'>): Observable<Cliente> {
    const creado: Cliente = { ...cliente, id: crypto.randomUUID() };
    this.clientes = [...this.clientes, creado];
    return of(creado);
  }
}
