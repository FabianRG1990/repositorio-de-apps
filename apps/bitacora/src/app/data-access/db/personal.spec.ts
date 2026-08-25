import { BitacoraDb, NO_BORRADO } from './esquema';
import { PersonalDelTaller } from './personal';
import { Repositorio } from './repositorio';

const TALLER = 'taller-1';
const RELOJ = '2026-01-01T08:00:00.000Z';

let db: BitacoraDb;
let repo: Repositorio;
let personal: PersonalDelTaller;

beforeEach(async () => {
  db = new BitacoraDb(`personal-${Math.random().toString(36).slice(2)}`);
  await db.open();
  repo = new Repositorio(db, TALLER, () => RELOJ);
  personal = new PersonalDelTaller(db, TALLER, repo);
});

afterEach(() => db.close());

/** Una Orden mínima a nombre de alguien, para lo que la baja tiene que cuidar. */
async function ordenDe(responsableId: string | null, estado = 'recibido') {
  return repo.crear(db.ordenes, {
    folio: `A1-${Math.random().toString(36).slice(2, 6)}`,
    puestoId: 'puesto-1',
    vehiculoId: 'vehiculo-1',
    clienteId: 'cliente-1',
    quienEntrega: 'Quien sea',
    responsableId,
    estado: estado as never,
    recibidoEn: RELOJ,
    entregadoEn: NO_BORRADO,
    proximaVisita: null,
    notas: '',
    odometro: null,
    combustible: null,
    danosPrevios: '',
    objetosDentro: '',
  });
}

describe('el alta de una Persona', () => {
  it('guarda el nombre recortado y el papel', async () => {
    const persona = await personal.crear({
      nombre: '  Luis Vargas  ',
      papel: 'tecnico',
      especialidades: ['mecanica'],
    });

    expect(persona.nombre).toBe('Luis Vargas');
    expect(persona.papel).toBe('tecnico');
    expect(persona.borradoEn).toBe(NO_BORRADO);
  });

  it('le guarda las Especialidades al Técnico', async () => {
    const persona = await personal.crear({
      nombre: 'Luis Vargas',
      papel: 'tecnico',
      especialidades: ['mecanica', 'pintura'],
    });

    expect(persona.especialidades).toEqual(['mecanica', 'pintura']);
  });

  it('no se las guarda a quien no ejecuta el trabajo', async () => {
    /* La Especialidad es de quien EJECUTA (glosario). Un Asesor con
       "pintura" pegada es un dato que nada lee y que miente al primer
       cambio de papel. */
    for (const papel of ['asesor', 'dueno'] as const) {
      const persona = await personal.crear({
        nombre: `Quien ${papel}`,
        papel,
        especialidades: ['pintura'],
      });
      expect(persona.especialidades).toEqual([]);
    }
  });

  it('las suelta cuando alguien deja de ser Técnico', async () => {
    const persona = await personal.crear({
      nombre: 'Luis Vargas',
      papel: 'tecnico',
      especialidades: ['mecanica'],
    });

    await personal.editar(persona.id, {
      nombre: 'Luis Vargas',
      papel: 'asesor',
      especialidades: ['mecanica'],
    });

    expect((await db.personas.get(persona.id))?.especialidades).toEqual([]);
  });
});

describe('el nombre, que es lo único que distingue a una Persona', () => {
  it('no puede quedar en blanco', async () => {
    expect(await personal.porQueNoSirveElNombre('   ')).toMatch(/en blanco/);
    await expect(
      personal.crear({ nombre: ' ', papel: 'asesor', especialidades: [] }),
    ).rejects.toThrow(/en blanco/);
  });

  it('no se puede repetir, ni cambiándole las mayúsculas o los acentos', async () => {
    await personal.crear({
      nombre: 'Luis Vargas',
      papel: 'tecnico',
      especialidades: [],
    });

    /* Sin cédula ni carné, dos "Luis Vargas" en la lista de Responsables
       dejan a quien elige adivinando cuál es cuál. */
    expect(await personal.porQueNoSirveElNombre('luis vargas')).toMatch(
      /Ya hay alguien/,
    );
    expect(await personal.porQueNoSirveElNombre('LUÍS VARGAS')).toMatch(
      /Ya hay alguien/,
    );
  });

  it('deja editar a alguien sin quejarse de su propio nombre', async () => {
    const persona = await personal.crear({
      nombre: 'Luis Vargas',
      papel: 'tecnico',
      especialidades: ['mecanica'],
    });

    expect(
      await personal.porQueNoSirveElNombre('Luis Vargas', persona.id),
    ).toBeNull();
    await expect(
      personal.editar(persona.id, {
        nombre: 'Luis Vargas',
        papel: 'tecnico',
        especialidades: ['pintura'],
      }),
    ).resolves.not.toThrow();
  });

  it('vuelve a estar libre cuando esa Persona se da de baja', async () => {
    const persona = await personal.crear({
      nombre: 'Luis Vargas',
      papel: 'tecnico',
      especialidades: [],
    });
    await personal.quitar(persona.id);

    /* La fila sigue ahí por el historial, pero el nombre no lo puede
       reservar para siempre: quien se fue no le quita el nombre a quien
       entra. */
    expect(await personal.porQueNoSirveElNombre('Luis Vargas')).toBeNull();
  });
});

describe('la baja', () => {
  it('es lógica: la Orden que respondió sigue apuntándole', async () => {
    const persona = await personal.crear({
      nombre: 'Luis Vargas',
      papel: 'tecnico',
      especialidades: [],
    });
    const orden = await ordenDe(persona.id);

    await personal.quitar(persona.id);

    /* Quién respondió por un trabajo no deja de ser cierto porque la
       persona se haya ido del taller. */
    expect((await db.ordenes.get(orden.id))?.responsableId).toBe(persona.id);
    expect((await db.personas.get(persona.id))?.nombre).toBe('Luis Vargas');
    expect(await personal.personas()).toHaveLength(0);
  });

  it('cuenta las Órdenes abiertas que deja, sin contar las entregadas', async () => {
    const persona = await personal.crear({
      nombre: 'Luis Vargas',
      papel: 'tecnico',
      especialidades: [],
    });
    await ordenDe(persona.id, 'en-proceso');
    await ordenDe(persona.id, 'listo');
    await ordenDe(persona.id, 'entregado');
    await ordenDe(null);

    expect(await personal.ordenesAbiertasDe(persona.id)).toBe(2);
  });
});

describe('a nombre de quién queda una Orden', () => {
  it('se pone y se quita', async () => {
    const persona = await personal.crear({
      nombre: 'Luis Vargas',
      papel: 'tecnico',
      especialidades: [],
    });
    const orden = await ordenDe(null);

    await personal.ponerResponsable(orden.id, persona.id);
    expect((await db.ordenes.get(orden.id))?.responsableId).toBe(persona.id);

    /* Quitarlo es legítimo: una Orden puede quedar sin dueño un rato mientras
       se decide quién la toma. */
    await personal.ponerResponsable(orden.id, null);
    expect((await db.ordenes.get(orden.id))?.responsableId).toBeNull();
  });

  it('no acepta a alguien que no existe', async () => {
    const orden = await ordenDe(null);
    await expect(
      personal.ponerResponsable(orden.id, 'persona-inventada'),
    ).rejects.toThrow(/no existe/);
    expect((await db.ordenes.get(orden.id))?.responsableId).toBeNull();
  });

  it('sigue aceptando a quien ya se dio de baja', async () => {
    const persona = await personal.crear({
      nombre: 'Luis Vargas',
      papel: 'tecnico',
      especialidades: [],
    });
    await personal.quitar(persona.id);
    const orden = await ordenDe(null);

    /* La fila sigue ahí, así que el nombre se puede seguir escribiendo. Es lo
       que permite devolverle una Orden a quien la respondía sin tener que
       darlo de alta otra vez. */
    await expect(
      personal.ponerResponsable(orden.id, persona.id),
    ).resolves.not.toThrow();
  });

  it('no comprueba la Especialidad contra la de la Orden', async () => {
    const pintor = await personal.crear({
      nombre: 'Kenneth Soto',
      papel: 'tecnico',
      especialidades: ['pintura'],
    });
    const orden = await ordenDe(null);

    /* El ADR 0003: el Responsable "responde por el trabajo, no necesariamente
       lo ejecuta todo". En un taller mixto quien coordina una Orden de
       mecánica y pintura no hace los dos oficios. */
    await expect(
      personal.ponerResponsable(orden.id, pintor.id),
    ).resolves.not.toThrow();
  });
});

describe('la lista', () => {
  it('sale por nombre y no por papel', async () => {
    for (const nombre of ['Óscar Mora', 'Ana Rojas', 'luis vargas']) {
      await personal.crear({ nombre, papel: 'tecnico', especialidades: [] });
    }

    /* Quien busca sabe el nombre, no en qué casilla lo metieron. Y el
       orden es el del español: la Ó va donde va, no al final. */
    expect((await personal.personas()).map((p) => p.nombre)).toEqual([
      'Ana Rojas',
      'luis vargas',
      'Óscar Mora',
    ]);
  });

  it('se puede pedir por papel', async () => {
    await personal.crear({
      nombre: 'Ana Rojas',
      papel: 'asesor',
      especialidades: [],
    });
    await personal.crear({
      nombre: 'Luis Vargas',
      papel: 'tecnico',
      especialidades: [],
    });

    expect((await personal.delPapel('tecnico')).map((p) => p.nombre)).toEqual([
      'Luis Vargas',
    ]);
  });
});
