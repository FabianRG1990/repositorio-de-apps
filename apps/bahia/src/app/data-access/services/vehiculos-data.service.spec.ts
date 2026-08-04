import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { resetBahiaDbForTests } from '../persistence/bahia-db';
import { VehiculosDataService } from './vehiculos-data.service';

describe('VehiculosDataService', () => {
  let service: VehiculosDataService;

  beforeEach(async () => {
    await resetBahiaDbForTests();
    service = TestBed.inject(VehiculosDataService);
  });

  it('returns the seeded vehiculos', async () => {
    const vehiculos = await firstValueFrom(service.getAll());
    expect(vehiculos).toHaveLength(4);
    expect(vehiculos[0].placa).toBe('PBH-3321');
  });

  it('creates a vehiculo with a generated id and persists it', async () => {
    const creado = await firstValueFrom(
      service.create({
        clienteId: 'cliente-1',
        placa: 'ZZZ-9999',
        marca: 'Mazda',
        modelo: '3',
        anio: 2022,
      }),
    );
    expect(creado.id).toBeTruthy();

    // getAll() de IndexedDB ordena por clave primaria, no por inserción —
    // no asumir posición, solo que el registro está presente.
    const vehiculos = await firstValueFrom(service.getAll());
    expect(vehiculos).toHaveLength(5);
    expect(vehiculos).toContainEqual(creado);
  });
});
