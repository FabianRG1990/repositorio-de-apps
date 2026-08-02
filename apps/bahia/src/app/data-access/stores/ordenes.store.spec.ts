import { TestBed } from '@angular/core/testing';
import { ESTADOS_ORDEN } from '../models/orden-trabajo.model';
import { resetBahiaDbForTests } from '../persistence/bahia-db';
import { waitFor } from '../testing/wait-for';
import { OrdenesStore } from './ordenes.store';

describe('OrdenesStore', () => {
  beforeEach(async () => {
    await resetBahiaDbForTests();
  });

  it('loads the seeded ordenes on init', async () => {
    const store = TestBed.inject(OrdenesStore);
    await waitFor(() => store.cargado());

    const estadosPresentes = new Set(store.entities().map((o) => o.estado));
    expect(ESTADOS_ORDEN.every((estado) => estadosPresentes.has(estado))).toBe(
      true,
    );
  });

  it('crear adds a new orden to the store', async () => {
    const store = TestBed.inject(OrdenesStore);
    await waitFor(() => store.cargado());
    const antes = store.entities().length;

    store.crear({
      numero: 'OT-0999',
      tallerId: 'taller-1',
      clienteId: 'cliente-1',
      vehiculoId: 'vehiculo-1',
      estado: 'Ingresado',
      kilometraje: 90000,
      motivoIngreso: 'Prueba',
      origenMotivo: 'texto',
      fechaIngreso: '2026-08-01T12:00:00',
    });
    await waitFor(() => store.entities().length > antes);

    expect(store.entities().length).toBe(antes + 1);
  });

  it('cambiarEstado updates the estado of the target orden', async () => {
    const store = TestBed.inject(OrdenesStore);
    await waitFor(() => store.cargado());
    const [primera] = store.entities();

    store.cambiarEstado({ id: primera.id, estado: 'Entregado' });
    await waitFor(() => store.entityMap()[primera.id]?.estado === 'Entregado');

    expect(store.entityMap()[primera.id].estado).toBe('Entregado');
  });
});
