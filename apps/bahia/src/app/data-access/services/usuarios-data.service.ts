import { Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { getBahiaDb } from '../persistence/bahia-db';

// Solo `getAll`: alimenta el selector de usuario/perfil simulado (ver
// ticket "Autenticación para la demo"). No hay gestión de usuarios en la
// Fase 1 — un sistema real necesitaría `create`/`update` para alta y
// edición de personal del taller.
@Injectable({ providedIn: 'root' })
export class UsuariosDataService {
  getAll(): Observable<Usuario[]> {
    return defer(() => getBahiaDb().then((db) => db.getAll('usuarios')));
  }
}
