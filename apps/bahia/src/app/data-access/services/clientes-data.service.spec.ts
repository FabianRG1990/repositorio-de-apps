import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ClientesDataService } from './clientes-data.service';

describe('ClientesDataService', () => {
  let service: ClientesDataService;

  beforeEach(() => {
    service = TestBed.inject(ClientesDataService);
  });

  it('returns the seeded clientes', async () => {
    const clientes = await firstValueFrom(service.getAll());
    expect(clientes).toHaveLength(4);
    expect(clientes[0].nombre).toBe('María Fernández');
  });

  it('creates a cliente with a generated id and appends it', async () => {
    const creado = await firstValueFrom(
      service.create({ nombre: 'Nuevo Cliente', telefono: '555-0000' }),
    );
    expect(creado.id).toBeTruthy();

    const clientes = await firstValueFrom(service.getAll());
    expect(clientes).toHaveLength(5);
    expect(clientes[clientes.length - 1]).toEqual(creado);
  });
});
