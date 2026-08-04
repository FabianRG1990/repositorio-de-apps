import { TestBed } from '@angular/core/testing';
import { totalFactura } from '../models/factura.model';
import { resetBahiaDbForTests } from '../persistence/bahia-db';
import { waitFor } from '../testing/wait-for';
import { FacturasStore } from './facturas.store';

describe('FacturasStore', () => {
  beforeEach(async () => {
    await resetBahiaDbForTests();
  });

  it('loads the seeded factura on init', async () => {
    const store = TestBed.inject(FacturasStore);
    await waitFor(() => store.cargado());

    expect(store.entities()).toHaveLength(1);
    expect(totalFactura(store.entities()[0])).toBe(770);
  });

  it('crear adds a new factura to the store', async () => {
    const store = TestBed.inject(FacturasStore);
    await waitFor(() => store.cargado());
    const antes = store.entities().length;

    store.crear({
      ordenId: 'orden-5',
      numero: 'FA-0002',
      fecha: '2026-08-01T12:00:00',
      conceptos: [{ descripcion: 'Revisión de frenos', monto: 300 }],
    });
    await waitFor(() => store.entities().length > antes);

    expect(store.entities().length).toBe(antes + 1);
  });
});
