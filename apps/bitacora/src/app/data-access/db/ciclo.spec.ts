import { CicloDeLaOrden, diasSinRecoger, mensajeDeListo } from './ciclo';
import { BitacoraDb, NO_BORRADO } from './esquema';
import { Repositorio } from './repositorio';

const TALLER = 'taller-1';
let db: BitacoraDb;
let repo: Repositorio;
let ciclo: CicloDeLaOrden;
let ordenId: string;
let reloj: string;

beforeEach(async () => {
  reloj = '2026-01-01T08:00:00.000Z';
  db = new BitacoraDb(`ciclo-${Math.random().toString(36).slice(2)}`);
  await db.open();
  const ahora = () => reloj;
  repo = new Repositorio(db, TALLER, ahora);
  ciclo = new CicloDeLaOrden(db, repo, ahora);

  ordenId = (
    await repo.crear(db.ordenes, {
      folio: 'A1-2418',
      puestoId: 'puesto',
      vehiculoId: 'vehiculo',
      clienteId: 'cliente',
      quienEntrega: 'Marielos',
      responsableId: null,
      estado: 'recibido',
      recibidoEn: reloj,
      entregadoEn: NO_BORRADO,
      proximaVisita: null,
      notas: '',
      odometro: null,
      combustible: null,
      danosPrevios: '',
      objetosDentro: '',
    })
  ).id;
});

afterEach(() => db.close());

const orden = async () => {
  const fila = await db.ordenes.get(ordenId);
  if (!fila) throw new Error('La Orden se perdió');
  return fila;
};

const avisosVivos = async () =>
  (await db.avisos.where('ordenId').equals(ordenId).toArray()).filter(
    (a) => a.borradoEn === NO_BORRADO,
  );

describe('mover el estado', () => {
  it('va hacia adelante', async () => {
    await ciclo.moverA(ordenId, 'en-proceso');

    expect((await orden()).estado).toBe('en-proceso');
  });

  /* La máquina no es rígida a propósito: un carro vuelve de "listo" a "en
     proceso" cuando algo sale mal. Forzar el orden pelearía con el taller. */
  it('y también hacia atrás', async () => {
    await ciclo.moverA(ordenId, 'listo');
    await ciclo.moverA(ordenId, 'en-proceso');

    expect((await orden()).estado).toBe('en-proceso');
  });

  /* Llegar a `entregado` por acá fijaría el estado sin fijar la fecha, y una
     Orden entregada sin fecha de entrega no significa nada. */
  it('no se puede entregar por este camino', async () => {
    await expect(ciclo.moverA(ordenId, 'entregado')).rejects.toThrow(
      /Entregar/,
    );
  });

  it('volver a meterlo al taller limpia la fecha de entrega', async () => {
    await ciclo.entregar(ordenId, null);

    await ciclo.moverA(ordenId, 'en-proceso');

    expect((await orden()).entregadoEn).toBe(NO_BORRADO);
  });
});

describe('el aviso de listo', () => {
  it('deja constancia de a quién y por dónde', async () => {
    await ciclo.avisarQueEstaListo(ordenId, {
      avisadoA: '  Marielos  ',
      medio: 'whatsapp',
    });

    const aviso = await ciclo.avisoDe(ordenId);
    expect(aviso?.avisadoA).toBe('Marielos');
    expect(aviso?.medio).toBe('whatsapp');
  });

  /* La pregunta que la Orden contesta es "¿se avisó, y cuándo?", en singular:
     el aviso anterior se retira en vez de apilarse. */
  it('avisar de nuevo retira el anterior', async () => {
    await ciclo.avisarQueEstaListo(ordenId, {
      avisadoA: 'Marielos',
      medio: 'llamada',
    });
    await ciclo.avisarQueEstaListo(ordenId, {
      avisadoA: 'Don Beto',
      medio: 'whatsapp',
    });

    const vivos = await avisosVivos();
    expect(vivos).toHaveLength(1);
    expect(vivos[0].avisadoA).toBe('Don Beto');
  });

  /* Borrado lógico: el historial de a quién se le avisó sigue ahí, y una
     ausencia no se puede sincronizar. */
  it('el aviso retirado no se borra de verdad', async () => {
    await ciclo.avisarQueEstaListo(ordenId, {
      avisadoA: 'Marielos',
      medio: 'llamada',
    });
    await ciclo.avisarQueEstaListo(ordenId, {
      avisadoA: 'Don Beto',
      medio: 'whatsapp',
    });

    expect(await db.avisos.where('ordenId').equals(ordenId).count()).toBe(2);
  });

  /* Son dos hechos distintos: el trabajo terminó, y se le avisó al Cliente.
     Juntarlos haría imposible registrar el segundo cuando el primero ya se
     había marcado antes. */
  it('avisar no mueve el estado', async () => {
    await ciclo.moverA(ordenId, 'listo');

    await ciclo.avisarQueEstaListo(ordenId, {
      avisadoA: 'Marielos',
      medio: 'whatsapp',
    });

    expect((await orden()).estado).toBe('listo');
  });

  it('sin avisar no hay aviso', async () => {
    expect(await ciclo.avisoDe(ordenId)).toBeNull();
  });
});

describe('entregar', () => {
  it('fija el estado y la fecha', async () => {
    await ciclo.entregar(ordenId, null);

    const o = await orden();
    expect(o.estado).toBe('entregado');
    expect(o.entregadoEn).toBe(reloj);
  });

  it('guarda la próxima visita si se escribió', async () => {
    await ciclo.entregar(ordenId, '2026-07-01');

    expect((await orden()).proximaVisita).toBe('2026-07-01');
  });

  /* Se ofrece, no se exige (ADR 0011): obligar produce fechas inventadas, y
     una lista de recordatorios llena de fechas puestas por salir del paso
     vale menos que una lista corta. */
  it('sin próxima visita se entrega igual', async () => {
    await ciclo.entregar(ordenId, '   ');

    expect((await orden()).proximaVisita).toBeNull();
  });
});

describe('deshacer la entrega', () => {
  it('devuelve el carro a listo', async () => {
    await ciclo.entregar(ordenId, '2026-07-01');

    await ciclo.deshacerEntrega(ordenId);

    const o = await orden();
    expect(o.estado).toBe('listo');
    expect(o.entregadoEn).toBe(NO_BORRADO);
  });

  /* La Próxima visita la escribió una persona pensando en el carro, no en el
     estado de la Orden: deshacer un clic torpe no puede borrarla. */
  it('no borra la próxima visita', async () => {
    await ciclo.entregar(ordenId, '2026-07-01');

    await ciclo.deshacerEntrega(ordenId);

    expect((await orden()).proximaVisita).toBe('2026-07-01');
  });
});

describe('el mensaje de listo', () => {
  const SWIFT = {
    folio: 'A1-2418',
    vehiculo: 'Suzuki Swift 2019',
    placa: 'BMW-321',
  };

  it('lleva folio, carro y placa', () => {
    const texto = mensajeDeListo({ ...SWIFT, total: 0 });

    expect(texto).toContain('A1-2418');
    expect(texto).toContain('Suzuki Swift 2019');
    expect(texto).toContain('BMW-321');
  });

  it('lleva el total cuando hay algo que cobrar', () => {
    const texto = mensajeDeListo({ ...SWIFT, total: 62000 });

    // El separador de miles de es-CR es un espacio fino, no una coma.
    expect(texto).toMatch(/Total: ₡62\s000/u);
  });

  /* Una Orden sin trabajos aprobados no debe anunciar "Total: ₡0": suena a
     error, y el Cliente llama para preguntar qué pasó. */
  it('sin monto no menciona el total', () => {
    expect(mensajeDeListo({ ...SWIFT, total: 0 })).not.toContain('Total');
  });
});

describe('los días sin recoger', () => {
  const AHORA = new Date('2026-01-10T08:00:00.000Z').getTime();

  it('cuenta desde el aviso', () => {
    expect(diasSinRecoger('2026-01-07T08:00:00.000Z', AHORA)).toBe(3);
  });

  it('el mismo día son cero', () => {
    expect(diasSinRecoger('2026-01-10T02:00:00.000Z', AHORA)).toBe(0);
  });

  /* El reloj arranca con el AVISO y no con el trabajo terminado: un carro
     listo del que nadie se enteró no es uno que el Cliente esté dejando ahí
     — es uno al que el Taller todavía no ha llamado. */
  it('sin aviso no hay cuenta', () => {
    expect(diasSinRecoger(null, AHORA)).toBeNull();
  });
});
