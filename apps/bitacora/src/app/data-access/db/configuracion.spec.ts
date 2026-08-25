import { ConfiguracionDelTaller } from './configuracion';
import { BitacoraDb, NO_BORRADO } from './esquema';
import { Repositorio } from './repositorio';

const TALLER = 'taller-1';
let db: BitacoraDb;
let config: ConfiguracionDelTaller;

beforeEach(async () => {
  const reloj = '2026-01-01T08:00:00.000Z';
  db = new BitacoraDb(`config-${Math.random().toString(36).slice(2)}`);
  await db.open();
  const repo = new Repositorio(db, TALLER, () => reloj);
  config = new ConfiguracionDelTaller(db, TALLER, repo, () => reloj);

  await db.talleres.put({
    id: TALLER,
    nombre: 'Taller Bitácora',
    especialidades: ['mecanica', 'electricidad', 'pintura'],
    telefono: '',
    direccion: '',
    cedulaJuridica: '',
    creadoEn: reloj,
    actualizadoEn: reloj,
    version: 1,
  });
  await config.crearPuesto('Recepción', 'A1');
});

afterEach(() => db.close());

describe('los datos que van impresos', () => {
  it('se guardan y suben la versión', async () => {
    await config.guardarDatos({
      nombre: '  Taller Los Yoses  ',
      telefono: '2222-3333',
      direccion: 'San Pedro',
      cedulaJuridica: '3-101-123456',
    });

    const taller = await config.taller();
    // Se recortan los espacios: van impresos y un espacio de más se ve.
    expect(taller?.nombre).toBe('Taller Los Yoses');
    expect(taller?.telefono).toBe('2222-3333');
    expect(taller?.version).toBe(2);
  });
});

/* ---------------------------------------------------------------------------
   La letra del Puesto encabeza el Folio (ADR 0010), y cada Puesto lleva su
   propio consecutivo para que dos sin conexión nunca acuñen el mismo. Esa
   promesa se cae si dos Puestos comparten letra.
   --------------------------------------------------------------------------- */
describe('la letra del Puesto', () => {
  it('no puede quedar en blanco', async () => {
    expect(await config.porQueNoSirveLaLetra('   ')).toContain('en blanco');
    await expect(config.crearPuesto('Patio', '  ')).rejects.toThrow();
  });

  it('no puede repetirse', async () => {
    const problema = await config.porQueNoSirveLaLetra('A1');

    expect(problema).toContain('folios iguales');
    await expect(config.crearPuesto('Otro', 'A1')).rejects.toThrow();
  });

  /* "a1" y "A1" acuñarían el mismo prefijo de Folio: no son dos letras. */
  it('la comparación no distingue mayúsculas', async () => {
    expect(await config.porQueNoSirveLaLetra('a1')).not.toBeNull();
  });

  it('un puesto puede conservar SU propia letra al renombrarse', async () => {
    const suyo = (await config.puestos())[0];

    await config.renombrarPuesto(suyo.id, 'Mostrador', 'A1');

    expect((await config.puestos())[0].nombre).toBe('Mostrador');
  });

  it('se guarda en mayúscula', async () => {
    await config.crearPuesto('Patio', 'b');

    expect((await config.puestos()).map((p) => p.letra)).toContain('B');
  });

  /* El primer Folio de un Puesto nuevo es el 1, no el siguiente de otro. */
  it('un puesto nuevo arranca su numeración en cero', async () => {
    const nuevo = await config.crearPuesto('Patio', 'C');

    expect(nuevo.consecutivo).toBe(0);
  });
});

describe('quitar un Puesto', () => {
  /* Sin Puesto no se acuña Folio, y sin Folio no se recibe un carro: la app
     dejaría de poder hacer lo único que tiene que hacer. */
  it('no se puede quitar el último', async () => {
    await expect(
      config.quitarPuesto((await config.puestos())[0].id),
    ).rejects.toThrow(/al menos un puesto/);
  });

  it('con dos, se puede quitar uno', async () => {
    await config.crearPuesto('Patio', 'B');

    await config.quitarPuesto((await config.puestos())[0].id);

    expect(await config.puestos()).toHaveLength(1);
  });

  /* Borrado lógico: los Folios que ese Puesto acuñó siguen significando lo
     mismo, y una ausencia no se puede sincronizar. */
  it('el borrado es lógico', async () => {
    await config.crearPuesto('Patio', 'B');
    const quitado = (await config.puestos())[0];

    await config.quitarPuesto(quitado.id);

    expect((await db.puestos.get(quitado.id))?.borradoEn).not.toBe(NO_BORRADO);
  });
});

describe('las Tarifas', () => {
  it('hay como mucho una viva por Especialidad', async () => {
    await config.fijarTarifa('mecanica', 14000);
    await config.fijarTarifa('mecanica', 15500);

    const tarifas = await config.tarifas();
    expect(tarifas.filter((t) => t.especialidad === 'mecanica')).toHaveLength(
      1,
    );
    expect(tarifas[0].porHora).toBe(15500);
  });

  it('cada oficio lleva la suya', async () => {
    await config.fijarTarifa('mecanica', 14000);
    await config.fijarTarifa('pintura', 15000);

    expect((await config.tarifas()).map((t) => t.porHora)).toEqual([
      14000, 15000,
    ]);
  });
});

describe('las Especialidades del Taller', () => {
  it('se guardan', async () => {
    await config.guardarEspecialidades(['mecanica', 'pintura']);

    expect((await config.taller())?.especialidades).toEqual([
      'mecanica',
      'pintura',
    ]);
  });

  /* Cada Línea de servicio lleva Especialidad (ADR 0001): sin ninguna
     configurada no habría de dónde elegirla, y el Taller no podría recibir. */
  it('no puede quedarse sin ninguna', async () => {
    await expect(config.guardarEspecialidades([])).rejects.toThrow(
      /al menos una/,
    );
  });

  it('con una sola se guarda igual', async () => {
    await config.guardarEspecialidades(['mecanica']);

    expect((await config.taller())?.especialidades).toEqual(['mecanica']);
  });
});
