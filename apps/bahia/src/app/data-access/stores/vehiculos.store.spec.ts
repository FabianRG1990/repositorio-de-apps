import { TestBed } from '@angular/core/testing';
import { VehiculosStore } from './vehiculos.store';

describe('VehiculosStore', () => {
  it('loads the seeded vehiculos on init', () => {
    const store = TestBed.inject(VehiculosStore);
    expect(store.entities()).toHaveLength(4);
  });

  it('crear adds a new vehiculo to the store', () => {
    const store = TestBed.inject(VehiculosStore);
    const antes = store.entities().length;

    store.crear({
      clienteId: 'cliente-1',
      placa: 'ZZZ-9999',
      marca: 'Mazda',
      modelo: '3',
      anio: 2022,
    });

    expect(store.entities().length).toBe(antes + 1);
  });
});
