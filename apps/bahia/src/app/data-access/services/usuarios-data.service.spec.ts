import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { UsuariosDataService } from './usuarios-data.service';

describe('UsuariosDataService', () => {
  let service: UsuariosDataService;

  beforeEach(() => {
    service = TestBed.inject(UsuariosDataService);
  });

  it('returns the seeded usuarios with distinct permission sets', async () => {
    const usuarios = await firstValueFrom(service.getAll());
    expect(usuarios).toHaveLength(3);
    const permisos = usuarios.map((u) => u.permisos.join(','));
    expect(new Set(permisos).size).toBe(usuarios.length);
  });
});
