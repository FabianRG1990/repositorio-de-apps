import { TestBed } from '@angular/core/testing';
import { ESTADOS_ORDEN } from '../models/orden-trabajo.model';
import { OrdenesStore } from './ordenes.store';

describe('OrdenesStore', () => {
  it('loads the seeded ordenes on init', () => {
    const store = TestBed.inject(OrdenesStore);
    const ordenes = store.entities();
    const estadosPresentes = new Set(ordenes.map((o) => o.estado));
    expect(ESTADOS_ORDEN.every((estado) => estadosPresentes.has(estado))).toBe(
      true,
    );
  });

  it('crear adds a new orden to the store', () => {
    const store = TestBed.inject(OrdenesStore);
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

    expect(store.entities().length).toBe(antes + 1);
  });

  it('cambiarEstado updates the estado of the target orden', () => {
    const store = TestBed.inject(OrdenesStore);
    const [primera] = store.entities();

    store.cambiarEstado({ id: primera.id, estado: 'Entregado' });

    const actualizada = store.entityMap()[primera.id];
    expect(actualizada.estado).toBe('Entregado');
  });
});
