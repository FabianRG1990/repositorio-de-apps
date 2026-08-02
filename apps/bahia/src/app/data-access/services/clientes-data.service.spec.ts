import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { resetBahiaDbForTests } from '../persistence/bahia-db';
import { ClientesDataService } from './clientes-data.service';

describe('ClientesDataService', () => {
  let service: ClientesDataService;

  beforeEach(async () => {
    await resetBahiaDbForTests();
    service = TestBed.inject(ClientesDataService);
  });

  it('returns the seeded clientes', async () => {
    const clientes = await firstValueFrom(service.getAll());
    expect(clientes).toHaveLength(4);
    expect(clientes[0].nombre).toBe('María Fernández');
  });

  it('creates a cliente with a generated id and persists it', async () => {
    const creado = await firstValueFrom(
      service.create({ nombre: 'Nuevo Cliente', telefono: '555-0000' }),
    );
    expect(creado.id).toBeTruthy();

    // getAll() de IndexedDB ordena por clave primaria, no por inserción —
    // no asumir posición, solo que el registro está presente.
    const clientes = await firstValueFrom(service.getAll());
    expect(clientes).toHaveLength(5);
    expect(clientes).toContainEqual(creado);
  });
});
