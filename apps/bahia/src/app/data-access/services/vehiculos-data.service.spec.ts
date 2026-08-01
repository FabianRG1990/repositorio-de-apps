import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { VehiculosDataService } from './vehiculos-data.service';

describe('VehiculosDataService', () => {
  let service: VehiculosDataService;

  beforeEach(() => {
    service = TestBed.inject(VehiculosDataService);
  });

  it('returns the seeded vehiculos', async () => {
    const vehiculos = await firstValueFrom(service.getAll());
    expect(vehiculos).toHaveLength(4);
    expect(vehiculos[0].placa).toBe('PBH-3321');
  });

  it('creates a vehiculo with a generated id and appends it', async () => {
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

    const vehiculos = await firstValueFrom(service.getAll());
    expect(vehiculos).toHaveLength(5);
    expect(vehiculos[vehiculos.length - 1]).toEqual(creado);
  });
});
