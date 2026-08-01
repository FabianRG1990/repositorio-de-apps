import { TestBed } from '@angular/core/testing';
import { ClientesStore } from './clientes.store';

describe('ClientesStore', () => {
  it('loads the seeded clientes on init', () => {
    const store = TestBed.inject(ClientesStore);
    expect(store.entities()).toHaveLength(4);
  });

  it('crear adds a new cliente to the store', () => {
    const store = TestBed.inject(ClientesStore);
    const antes = store.entities().length;

    store.crear({ nombre: 'Nuevo Cliente', telefono: '555-0000' });

    expect(store.entities().length).toBe(antes + 1);
  });
});
