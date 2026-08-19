import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { totalFactura } from '../models/factura.model';
import { resetBahiaDbForTests } from '../persistence/bahia-db';
import { FacturasDataService } from './facturas-data.service';

describe('FacturasDataService', () => {
  let service: FacturasDataService;

  beforeEach(async () => {
    await resetBahiaDbForTests();
    service = TestBed.inject(FacturasDataService);
  });

  it('returns the seeded factura for the orden ya entregada', async () => {
    const facturas = await firstValueFrom(service.getAll());
    expect(facturas).toHaveLength(1);
    expect(facturas[0].ordenId).toBe('orden-1');
    expect(totalFactura(facturas[0])).toBe(770);
  });

  it('creates a factura with a generated id and persists it', async () => {
    const creada = await firstValueFrom(
      service.create({
        ordenId: 'orden-5',
        numero: 'FA-A1-0002',
        fecha: '2026-08-01T12:00:00',
        conceptos: [{ descripcion: 'Revisión de frenos', monto: 300 }],
      }),
    );
    expect(creada.id).toBeTruthy();

    const facturas = await firstValueFrom(service.getAll());
    expect(facturas).toHaveLength(2);
    expect(facturas).toContainEqual(creada);
  });
});
