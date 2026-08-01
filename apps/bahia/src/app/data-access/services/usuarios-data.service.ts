import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { SEED_USUARIOS } from '../seed/seed-data';

// Solo `getAll`: alimenta el selector de usuario/perfil simulado (ver
// ticket "Autenticación para la demo"). No hay gestión de usuarios en la
// Fase 1 — un sistema real necesitaría `create`/`update` para alta y
// edición de personal del taller.
@Injectable({ providedIn: 'root' })
export class UsuariosDataService {
  private readonly usuarios: Usuario[] = [...SEED_USUARIOS];

  getAll(): Observable<Usuario[]> {
    return of(this.usuarios);
  }
}
