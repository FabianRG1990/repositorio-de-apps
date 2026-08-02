import { TestBed } from '@angular/core/testing';
import { resetBahiaDbForTests } from '../persistence/bahia-db';
import { waitFor } from '../testing/wait-for';
import { ClientesStore } from './clientes.store';

describe('ClientesStore', () => {
  beforeEach(async () => {
    await resetBahiaDbForTests();
  });

  it('loads the seeded clientes on init', async () => {
    const store = TestBed.inject(ClientesStore);
    await waitFor(() => store.entities().length > 0);

    expect(store.entities()).toHaveLength(4);
  });

  it('crear adds a new cliente to the store', async () => {
    const store = TestBed.inject(ClientesStore);
    await waitFor(() => store.entities().length > 0);
    const antes = store.entities().length;

    store.crear({ nombre: 'Nuevo Cliente', telefono: '555-0000' });
    await waitFor(() => store.entities().length > antes);

    expect(store.entities().length).toBe(antes + 1);
  });
});
