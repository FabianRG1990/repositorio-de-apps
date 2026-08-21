import { ABIERTO, BitacoraDb, NO_BORRADO } from './esquema';
import { acunarFolio, Repositorio, RepositorioVehiculos } from './repositorio';

const TALLER = 'taller-1';
let db: BitacoraDb;
let repo: Repositorio;
let vehiculos: RepositorioVehiculos;
let reloj: string;

beforeEach(async () => {
  reloj = '2026-01-01T00:00:00.000Z';
  db = new BitacoraDb(`bitacora-prueba-${Math.random().toString(36).slice(2)}`);
  await db.open();
  const ahora = () => reloj;
  repo = new Repositorio(db, TALLER, ahora);
  vehiculos = new RepositorioVehiculos(db, TALLER, ahora);
});

afterEach(async () => {
  db.close();
});

describe('la trampa del centinela', () => {
  /* Esta es LA prueba del ticket. Dexie documenta que un índice compuesto solo
     indexa objetos con clave válida en TODOS sus campos, así que una fila con
     `null` en una columna del índice desaparece de la consulta — sin error, en
     silencio, y justo las filas que importan. */
  it('encuentra la placa vigente porque se marcó con el centinela', async () => {
    await vehiculos.cambiarPlaca('vehiculo-1', '863 549');

    expect(await vehiculos.placaVigente('vehiculo-1')).toBe('863 549');
  });

  it('con null en vez del centinela, la placa vigente se vuelve invisible', async () => {
    // Se escribe a mano lo que el repositorio nunca escribiría, para dejar
    // demostrado POR QUÉ no lo escribe.
    await db.vehiculoPlacas.add({
      id: 'con-null',
      tallerId: TALLER,
      vehiculoId: 'vehiculo-2',
      placa: '742 118',
      vigenteDesde: reloj,
      vigenteHasta: null as unknown as string,
      creadoEn: reloj,
      actualizadoEn: reloj,
      borradoEn: NO_BORRADO,
      version: 1,
    });

    // La fila existe...
    expect(await db.vehiculoPlacas.get('con-null')).toBeTruthy();
    // ...y aun así el índice compuesto no la ve. Devuelve vacío, no error.
    expect(await vehiculos.placaVigente('vehiculo-2')).toBeNull();
  });

  it('lo vivo se consulta por índice compuesto contra NO_BORRADO', async () => {
    const cliente = await repo.crear(db.clientes, {
      nombre: 'Marielos Quesada',
      telefono: '8888-8888',
      cedula: null,
    });
    await repo.crear(db.clientes, {
      nombre: 'Rodrigo Vargas',
      telefono: '7777-7777',
      cedula: null,
    });

    await repo.borrar(db.clientes, cliente.id);

    const vivos = await repo.vivos(db.clientes).toArray();
    expect(vivos.map((c) => c.nombre)).toEqual(['Rodrigo Vargas']);
  });
});

describe('la Placa y su vigencia', () => {
  it('cambiar de placa cierra la anterior y deja una sola vigente', async () => {
    await vehiculos.cambiarPlaca('vehiculo-1', '863 549');
    reloj = '2026-06-01T00:00:00.000Z';
    await vehiculos.cambiarPlaca('vehiculo-1', 'TSJ 1204');

    const todas = await db.vehiculoPlacas
      .where('vehiculoId')
      .equals('vehiculo-1')
      .toArray();

    expect(todas).toHaveLength(2);
    expect(todas.filter((p) => p.vigenteHasta === ABIERTO)).toHaveLength(1);
    expect(await vehiculos.placaVigente('vehiculo-1')).toBe('TSJ 1204');
  });

  it('conserva el historial: quién llevaba la placa en una fecha dada', async () => {
    await vehiculos.cambiarPlaca('vehiculo-1', '863 549');
    reloj = '2026-06-01T00:00:00.000Z';
    await vehiculos.cambiarPlaca('vehiculo-1', 'TSJ 1204');
    // La placa liberada se la queda otro carro: es legal en Costa Rica y es
    // exactamente lo que una PK sobre la placa habría roto.
    await vehiculos.cambiarPlaca('vehiculo-9', '863 549');

    expect(
      await vehiculos.vehiculoConPlacaEn('863 549', '2026-03-01T00:00:00.000Z'),
    ).toBe('vehiculo-1');
    expect(
      await vehiculos.vehiculoConPlacaEn('863 549', '2026-09-01T00:00:00.000Z'),
    ).toBe('vehiculo-9');
  });

  it('repetir la placa vigente no abre una fila nueva', async () => {
    await vehiculos.cambiarPlaca('vehiculo-1', '863 549');
    await vehiculos.cambiarPlaca('vehiculo-1', '863 549');

    expect(
      await db.vehiculoPlacas.where('vehiculoId').equals('vehiculo-1').count(),
    ).toBe(1);
  });
});

describe('la costura de sincronización', () => {
  it('encola cada escritura en la misma vuelta que el dato', async () => {
    const cliente = await repo.crear(db.clientes, {
      nombre: 'Ana Lucía Brenes',
      telefono: '6666-6666',
      cedula: null,
    });
    await repo.actualizar(db.clientes, cliente.id, { telefono: '6000-0000' });
    await repo.borrar(db.clientes, cliente.id);

    const cola = await db.pendientes.orderBy('secuencia').toArray();
    expect(cola.map((o) => o.operacion)).toEqual([
      'crear',
      'actualizar',
      'borrar',
    ]);
    expect(cola.every((o) => o.entidad === 'clientes')).toBe(true);
  });

  it('la cola lleva el cambio de campos, no el objeto entero', async () => {
    const cliente = await repo.crear(db.clientes, {
      nombre: 'Taxis Los Yoses',
      telefono: '2222-2222',
      cedula: null,
    });
    await repo.actualizar(db.clientes, cliente.id, { telefono: '2000-0000' });

    const actualizacion = await db.pendientes
      .where('entidadId')
      .equals(cliente.id)
      .and((o) => o.operacion === 'actualizar')
      .first();

    expect(actualizacion?.cambios).toEqual({ telefono: '2000-0000' });
  });

  it('ordena por un contador y no por el reloj, que puede retroceder', async () => {
    await repo.crear(db.clientes, { nombre: 'A', telefono: '1', cedula: null });
    // El reloj de pared se va hacia atrás: NTP escalona, el usuario lo cambia.
    reloj = '2025-01-01T00:00:00.000Z';
    await repo.crear(db.clientes, { nombre: 'B', telefono: '2', cedula: null });

    const cola = await db.pendientes.orderBy('secuencia').toArray();
    expect(cola.map((o) => o.cambios['nombre'])).toEqual(['A', 'B']);
  });
});

describe('el borrado y las marcas', () => {
  it('el borrado es lógico: la fila queda con su fecha', async () => {
    const cliente = await repo.crear(db.clientes, {
      nombre: 'Para borrar',
      telefono: '1',
      cedula: null,
    });
    await repo.borrar(db.clientes, cliente.id);

    const fila = await db.clientes.get(cliente.id);
    expect(fila).toBeTruthy();
    expect(fila?.borradoEn).toBe(reloj);
  });

  it('cada escritura sube la versión', async () => {
    const cliente = await repo.crear(db.clientes, {
      nombre: 'Versionado',
      telefono: '1',
      cedula: null,
    });
    expect(cliente.version).toBe(1);

    await repo.actualizar(db.clientes, cliente.id, { telefono: '2' });
    expect((await db.clientes.get(cliente.id))?.version).toBe(2);
  });

  it('los identificadores salen ordenados por tiempo', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      const c = await repo.crear(db.clientes, {
        nombre: `Cliente ${i}`,
        telefono: '1',
        cedula: null,
      });
      ids.push(c.id);
    }

    // UUIDv7, no v4: el orden lexicográfico es el de creación, así que los
    // listados "lo más reciente" salen del propio índice de la clave.
    expect([...ids].sort()).toEqual(ids);
  });
});

describe('el Folio', () => {
  it('lleva la letra del Puesto y su consecutivo propio', async () => {
    const recepcion = await repo.crear(db.puestos, {
      nombre: 'Recepción',
      letra: 'A',
      consecutivo: 240,
    });
    const patio = await repo.crear(db.puestos, {
      nombre: 'Patio',
      letra: 'B',
      consecutivo: 0,
    });

    expect(await acunarFolio(db, recepcion.id)).toBe('A-241');
    expect(await acunarFolio(db, recepcion.id)).toBe('A-242');
    // Dos Puestos sin conexión no pueden acuñar el mismo Folio.
    expect(await acunarFolio(db, patio.id)).toBe('B-1');
  });
});

describe('la Fusión de vehículos', () => {
  it('lleva el historial al canónico y deja el rastro en el absorbido', async () => {
    const canonico = await repo.crear(db.vehiculos, {
      vin: null,
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2019,
      canonicoId: null,
      fusionadoEn: NO_BORRADO,
    });
    const duplicado = await repo.crear(db.vehiculos, {
      vin: null,
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2019,
      canonicoId: null,
      fusionadoEn: NO_BORRADO,
    });
    await vehiculos.cambiarPlaca(duplicado.id, '905 733');

    await vehiculos.fusionar(duplicado.id, canonico.id);

    expect(await vehiculos.placaVigente(canonico.id)).toBe('905 733');
    const absorbido = await db.vehiculos.get(duplicado.id);
    expect(absorbido?.canonicoId).toBe(canonico.id);
    // No se borra: su Folio ya está impreso en papeles que andan por ahí.
    expect(absorbido?.borradoEn).toBe(NO_BORRADO);
  });
});
