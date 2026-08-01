import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ESTADOS_ORDEN } from '../models/orden-trabajo.model';
import { OrdenesDataService } from './ordenes-data.service';

describe('OrdenesDataService', () => {
  let service: OrdenesDataService;

  beforeEach(() => {
    service = TestBed.inject(OrdenesDataService);
  });

  it('seeds at least one orden in every kanban estado', async () => {
    const ordenes = await firstValueFrom(service.getAll());
    const estadosPresentes = new Set(ordenes.map((o) => o.estado));
    expect(ESTADOS_ORDEN.every((estado) => estadosPresentes.has(estado))).toBe(
      true,
    );
  });

  it('seeds a vehiculo with more than one previous visit', async () => {
    const ordenes = await firstValueFrom(service.getAll());
    const porVehiculo = new Map<string, number>();
    for (const orden of ordenes) {
      porVehiculo.set(
        orden.vehiculoId,
        (porVehiculo.get(orden.vehiculoId) ?? 0) + 1,
      );
    }
    expect([...porVehiculo.values()].some((count) => count > 1)).toBe(true);
  });

  it('creates an orden with a generated id', async () => {
    const creada = await firstValueFrom(
      service.create({
        numero: 'OT-0999',
        tallerId: 'taller-1',
        clienteId: 'cliente-1',
        vehiculoId: 'vehiculo-1',
        estado: 'Ingresado',
        kilometraje: 90000,
        motivoIngreso: 'Prueba',
        origenMotivo: 'texto',
        fechaIngreso: '2026-08-01T12:00:00',
      }),
    );
    expect(creada.id).toBeTruthy();
  });

  it('updateEstado changes only the estado of the target orden', async () => {
    const [primera] = await firstValueFrom(service.getAll());
    const actualizada = await firstValueFrom(
      service.updateEstado(primera.id, 'Entregado'),
    );
    expect(actualizada.estado).toBe('Entregado');
    expect(actualizada.numero).toBe(primera.numero);
  });

  it('updateEstado throws for an unknown id', async () => {
    await expect(
      firstValueFrom(service.updateEstado('no-existe', 'Listo')),
    ).rejects.toThrow();
  });
});
