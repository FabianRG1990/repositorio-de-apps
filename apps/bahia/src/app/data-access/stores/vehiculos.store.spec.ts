import { TestBed } from '@angular/core/testing';
import { resetBahiaDbForTests } from '../persistence/bahia-db';
import { waitFor } from '../testing/wait-for';
import { VehiculosStore } from './vehiculos.store';

describe('VehiculosStore', () => {
  beforeEach(async () => {
    await resetBahiaDbForTests();
  });

  it('loads the seeded vehiculos on init', async () => {
    const store = TestBed.inject(VehiculosStore);
    await waitFor(() => store.cargado());

    expect(store.entities()).toHaveLength(4);
  });

  it('crear adds a new vehiculo to the store', async () => {
    const store = TestBed.inject(VehiculosStore);
    await waitFor(() => store.cargado());
    const antes = store.entities().length;

    store.crear({
      clienteId: 'cliente-1',
      placa: 'ZZZ-9999',
      marca: 'Mazda',
      modelo: '3',
      anio: 2022,
    });
    await waitFor(() => store.entities().length > antes);

    expect(store.entities().length).toBe(antes + 1);
  });
});
