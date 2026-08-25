import { BitacoraDb, NO_BORRADO } from './esquema';
import { RecepcionDeVehiculos } from './recepcion';
import { Repositorio, RepositorioVehiculos } from './repositorio';

const TALLER = 'taller-1';
let db: BitacoraDb;
let recepcion: RecepcionDeVehiculos;
let repo: Repositorio;
let puestoId: string;
let reloj: string;

const DATOS = {
  placa: '863 549',
  marca: 'Toyota',
  modelo: 'Hilux',
  anio: 2019,
  cliente: 'Marielos Quesada',
  telefono: '8888-1111',
  quienEntrega: 'Marielos Quesada',
  reportes: [
    {
      textual: 'Hace un ruido al frenar',
      capturadoPor: 'tecleado' as const,
      cuando: ['al-frenar' as const],
      desdeCuando: 'esta semana',
      senales: ['ruido' as const],
      especialidadSugerida: 'mecanica' as const,
      sugerenciaCorregida: false,
    },
  ],
  odometro: 148320,
  combustible: 2 as const,
  danosPrevios: 'Rayón en la puerta trasera derecha',
  objetosDentro: '',
  fotos: [] as Blob[],
};

beforeEach(async () => {
  reloj = '2026-01-01T08:00:00.000Z';
  db = new BitacoraDb(`recepcion-${Math.random().toString(36).slice(2)}`);
  await db.open();
  const ahora = () => reloj;
  repo = new Repositorio(db, TALLER, ahora);
  const vehiculos = new RepositorioVehiculos(db, TALLER, ahora);
  recepcion = new RecepcionDeVehiculos(db, TALLER, repo, vehiculos, ahora);

  puestoId = (
    await repo.crear(db.puestos, {
      nombre: 'Recepción',
      letra: 'A1',
      consecutivo: 2417,
    })
  ).id;
});

afterEach(() => db.close());

describe('recibir un Vehículo', () => {
  it('deja la Orden lista, con su Folio y en estado Recibido', async () => {
    const orden = await recepcion.recibir(DATOS, puestoId);

    expect(orden.folio).toBe('A1-2418');
    expect(orden.estado).toBe('recibido');
    expect(orden.recibidoEn).toBe(reloj);
    expect(orden.entregadoEn).toBe(NO_BORRADO);
    // La Orden nace SIN Líneas: se añaden al diagnosticar.
    expect(await db.lineas.count()).toBe(0);
  });

  it('crea Cliente, Vehículo, Placa y Propiedad de una vez', async () => {
    await recepcion.recibir(DATOS, puestoId);

    expect(await db.clientes.count()).toBe(1);
    expect(await db.vehiculos.count()).toBe(1);
    expect(await db.vehiculoPlacas.count()).toBe(1);
    expect(await db.propiedades.count()).toBe(1);
  });

  /* La cédula se pide al facturar, no al recibir (glosario). */
  it('no pide la cédula al recibir', async () => {
    await recepcion.recibir(DATOS, puestoId);

    expect((await db.clientes.toCollection().first())?.cedula).toBeNull();
  });

  /* En una flotilla, quien deja el carro es un chofer distinto cada vez. */
  it('guarda a Quien entrega aunque no sea el Cliente', async () => {
    const orden = await recepcion.recibir(
      { ...DATOS, quienEntrega: 'Don Beto, el chofer' },
      puestoId,
    );

    expect(orden.quienEntrega).toBe('Don Beto, el chofer');
  });

  it('si nadie dice quién entrega, se asume el Cliente', async () => {
    const orden = await recepcion.recibir(
      { ...DATOS, quienEntrega: '   ' },
      puestoId,
    );

    expect(orden.quienEntrega).toBe('Marielos Quesada');
  });

  /* El Folio lleva la letra del Puesto y su consecutivo propio (ADR 0010). */
  it('cada Orden se lleva el siguiente Folio del Puesto', async () => {
    const a = await recepcion.recibir(DATOS, puestoId);
    const b = await recepcion.recibir(
      { ...DATOS, placa: 'TSJ 1204' },
      puestoId,
    );

    expect([a.folio, b.folio]).toEqual(['A1-2418', 'A1-2419']);
    expect((await db.puestos.get(puestoId))?.consecutivo).toBe(2419);
  });

  /* Las placas no se validan con expresión regular (#35): en el país conviven
     formatos distintos y rechazar uno legítimo bloquea el ingreso del carro. */
  it('acepta cualquier formato de placa', async () => {
    for (const placa of ['863 549', 'TSJ 1204', 'CL 123456', 'MOT 45']) {
      const orden = await recepcion.recibir({ ...DATOS, placa }, puestoId);
      expect(orden.folio).toBeTruthy();
    }

    expect(await db.vehiculos.count()).toBe(4);
  });
});

describe('el historial sigue al carro', () => {
  /* Si el mismo carro entrara dos veces como dos Vehículos distintos, el
     historial —que es el producto— se partiría en dos. */
  it('la segunda visita reutiliza el Vehículo, no lo duplica', async () => {
    await recepcion.recibir(DATOS, puestoId);
    reloj = '2026-06-01T08:00:00.000Z';
    await recepcion.recibir(DATOS, puestoId);

    expect(await db.vehiculos.count()).toBe(1);
    expect(await db.clientes.count()).toBe(1);
    expect(await db.ordenes.count()).toBe(2);
  });

  it('reconoce la Placa y trae el Cliente y las visitas', async () => {
    await recepcion.recibir(DATOS, puestoId);

    const conocido = await recepcion.reconocer('863 549');

    expect(conocido).toMatchObject({
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2019,
      cliente: 'Marielos Quesada',
      telefono: '8888-1111',
      visitas: 1,
    });
  });

  it('una placa que nunca entró no reconoce nada', async () => {
    expect(await recepcion.reconocer('000 000')).toBeNull();
    expect(await recepcion.reconocer('   ')).toBeNull();
  });

  /* La placa se puede liberar y pasar a otro carro: es legal en Costa Rica y
     es justo lo que una clave primaria sobre la placa habría roto (#35).

     Acá se deja a propósito SIN cerrar la vigencia del primero, que es el
     estado inconsistente que el esquema no impide: `cambiarPlaca` garantiza
     "un Vehículo, una Placa vigente", no "una Placa, un Vehículo". Ante ese
     empate gana el que la tomó último. */
  it('con la misma placa vigente en dos carros, gana el último', async () => {
    await recepcion.recibir(DATOS, puestoId);
    reloj = '2026-06-01T08:00:00.000Z';

    const vehiculos = new RepositorioVehiculos(db, TALLER, () => reloj);
    const otro = await repo.crear(db.vehiculos, {
      vin: null,
      marca: 'Nissan',
      modelo: 'Frontier',
      anio: 2021,
      canonicoId: null,
      fusionadoEn: NO_BORRADO,
    });
    // El carro viejo suelta la placa y el nuevo la toma.
    await vehiculos.cambiarPlaca(otro.id, '863 549');

    expect((await recepcion.reconocer('863 549'))?.marca).toBe('Nissan');
  });
});

describe('recibir es una sola operación', () => {
  /* Cinco escrituras que no pueden quedar a medias: un Vehículo sin Orden, o
     peor, un Folio ya acuñado para una Orden que no existe. Un Folio quemado
     no se recupera. */
  it('si algo falla no queda nada escrito, ni el Folio gastado', async () => {
    const consecutivoAntes = (await db.puestos.get(puestoId))?.consecutivo;

    await expect(
      recepcion.recibir(DATOS, 'puesto-que-no-existe'),
    ).rejects.toThrow();

    expect(await db.ordenes.count()).toBe(0);
    expect(await db.vehiculos.count()).toBe(0);
    expect(await db.clientes.count()).toBe(0);
    expect(await db.vehiculoPlacas.count()).toBe(0);
    expect(await db.propiedades.count()).toBe(0);
    expect((await db.puestos.get(puestoId))?.consecutivo).toBe(
      consecutivoAntes,
    );
  });

  /* Todo lo que se escribe tiene que quedar en la cola de sincronización, o
     la Orden existiría solo en este aparato (ADR 0014). */
  it('encola las cinco escrituras para sincronizar', async () => {
    await recepcion.recibir(DATOS, puestoId);

    const entidades = (await db.pendientes.orderBy('secuencia').toArray())
      .filter((o) => o.operacion === 'crear')
      .map((o) => o.entidad);

    expect(entidades).toContain('clientes');
    expect(entidades).toContain('vehiculos');
    expect(entidades).toContain('propiedades');
    expect(entidades).toContain('ordenes');
  });
});
