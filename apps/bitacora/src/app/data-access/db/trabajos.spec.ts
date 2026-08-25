import { BitacoraDb, NO_BORRADO } from './esquema';
import { Repositorio } from './repositorio';
import {
  TrabajosDeLaOrden,
  enlaceDeWhatsApp,
  mensajeDeAutorizacion,
} from './trabajos';

const TALLER = 'taller-1';
let db: BitacoraDb;
let repo: Repositorio;
let trabajos: TrabajosDeLaOrden;
let ordenId: string;
let reloj: string;

const PASTILLAS = {
  descripcion: 'Cambio de pastillas',
  especialidad: 'mecanica' as const,
  pagador: 'cliente' as const,
  horas: 1.5,
  monto: 62000,
};

beforeEach(async () => {
  reloj = '2026-01-01T08:00:00.000Z';
  db = new BitacoraDb(`trabajos-${Math.random().toString(36).slice(2)}`);
  await db.open();
  const ahora = () => reloj;
  repo = new Repositorio(db, TALLER, ahora);
  trabajos = new TrabajosDeLaOrden(db, repo, ahora);

  ordenId = (
    await repo.crear(db.ordenes, {
      folio: 'A1-2418',
      puestoId: 'puesto',
      vehiculoId: 'vehiculo',
      clienteId: 'cliente',
      quienEntrega: 'Marielos',
      responsableId: null,
      estado: 'diagnostico',
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

describe('anotar un trabajo', () => {
  it('nace sin autorizar y sin declinar', async () => {
    const linea = await trabajos.agregar(ordenId, PASTILLAS);

    expect(linea.descripcion).toBe('Cambio de pastillas');
    expect(linea.monto).toBe(62000);
    expect(linea.declinadaEn).toBe(NO_BORRADO);
    // Nadie ha dicho que sí todavía.
    expect(await trabajos.autorizacionDe(linea.id)).toBeNull();
  });

  /* Las horas reales las llena el técnico al trabajar, no el asesor al
     cotizar. Se guardan separadas desde el día uno porque #15 encontró que la
     eficiencia del técnico es irrecuperable si se mezclan. */
  it('las horas facturadas y las reales son dos cosas', async () => {
    const linea = await trabajos.agregar(ordenId, PASTILLAS);

    expect(linea.horasFacturadas).toBe(1.5);
    expect(linea.horasReales).toBe(0);
  });

  /* El Pagador es de la Línea y no de la Orden (ADR 0002): una misma Orden
     lleva mecánica que paga el Cliente y pintura que paga una Aseguradora. */
  it('cada trabajo lleva su propio pagador', async () => {
    const delCliente = await trabajos.agregar(ordenId, PASTILLAS);
    const deLaAseguradora = await trabajos.agregar(ordenId, {
      ...PASTILLAS,
      descripcion: 'Guardabarros derecho',
      especialidad: 'pintura',
      pagador: 'aseguradora',
    });

    expect(delCliente.pagador).toBe('cliente');
    expect(deLaAseguradora.pagador).toBe('aseguradora');
  });
});

describe('la constancia de autorización', () => {
  it('guarda quién dijo que sí y por dónde', async () => {
    const linea = await trabajos.agregar(ordenId, PASTILLAS);

    await trabajos.autorizar(linea.id, {
      autorizadaPor: 'Marielos Quesada',
      medio: 'whatsapp',
    });

    expect(await trabajos.autorizacionDe(linea.id)).toMatchObject({
      autorizadaPor: 'Marielos Quesada',
      medio: 'whatsapp',
      autorizadaEn: reloj,
    });
  });

  /* La pregunta que la Orden tiene que contestar es "quién autorizó esto", en
     singular. */
  it('autorizar dos veces no apila constancias', async () => {
    const linea = await trabajos.agregar(ordenId, PASTILLAS);

    await trabajos.autorizar(linea.id, {
      autorizadaPor: 'Marielos',
      medio: 'llamada',
    });
    reloj = '2026-01-02T08:00:00.000Z';
    await trabajos.autorizar(linea.id, {
      autorizadaPor: 'Don Beto, el chofer',
      medio: 'presencial',
    });

    const vigente = await trabajos.autorizacionDe(linea.id);
    expect(vigente?.autorizadaPor).toBe('Don Beto, el chofer');
    // La anterior se retira en lógico: el historial no se pierde.
    expect(await db.autorizaciones.count()).toBe(2);
  });
});

describe('declinar', () => {
  it('conserva el motivo y el monto', async () => {
    const linea = await trabajos.agregar(ordenId, PASTILLAS);

    await trabajos.declinar(linea.id, 'Lo deja para la próxima visita');

    const guardada = await db.lineas.get(linea.id);
    expect(guardada?.declinadaEn).toBe(reloj);
    expect(guardada?.motivoDeclinacion).toBe('Lo deja para la próxima visita');
    /* Sin el monto, la propuesta habría que rehacerla de memoria cuando el
       carro vuelva. */
    expect(guardada?.monto).toBe(62000);
  });

  it('sin motivo se guarda igual, con el motivo vacío', async () => {
    const linea = await trabajos.agregar(ordenId, PASTILLAS);

    await trabajos.declinar(linea.id, '   ');

    expect((await db.lineas.get(linea.id))?.motivoDeclinacion).toBeNull();
  });

  /* Declinar es un clic sin vuelta atrás sobre una tableta que se usa de pie:
     un dedo torpe no puede costar una venta. */
  it('se puede deshacer', async () => {
    const linea = await trabajos.agregar(ordenId, PASTILLAS);
    await trabajos.declinar(linea.id, 'Fue sin querer');

    await trabajos.deshacerDeclinacion(linea.id);

    const guardada = await db.lineas.get(linea.id);
    expect(guardada?.declinadaEn).toBe(NO_BORRADO);
    expect(guardada?.motivoDeclinacion).toBeNull();
  });
});

/* ---------------------------------------------------------------------------
   La invariante.

   Autorizada Y declinada a la vez no es un estado más rico: es una constancia
   que se contradice, y la constancia existe precisamente para que alguien
   pueda apoyarse en ella meses después.
   --------------------------------------------------------------------------- */
describe('nunca autorizada y declinada a la vez', () => {
  it('declinar una autorizada le retira la autorización', async () => {
    const linea = await trabajos.agregar(ordenId, PASTILLAS);
    await trabajos.autorizar(linea.id, {
      autorizadaPor: 'Marielos',
      medio: 'whatsapp',
    });

    await trabajos.declinar(linea.id, 'Se arrepintió');

    expect(await trabajos.autorizacionDe(linea.id)).toBeNull();
    expect((await db.lineas.get(linea.id))?.declinadaEn).not.toBe(NO_BORRADO);
  });

  it('autorizar una declinada le quita la declinación', async () => {
    const linea = await trabajos.agregar(ordenId, PASTILLAS);
    await trabajos.declinar(linea.id, 'Lo pensó mejor');

    await trabajos.autorizar(linea.id, {
      autorizadaPor: 'Marielos',
      medio: 'llamada',
    });

    const guardada = await db.lineas.get(linea.id);
    expect(guardada?.declinadaEn).toBe(NO_BORRADO);
    expect(guardada?.motivoDeclinacion).toBeNull();
    expect(await trabajos.autorizacionDe(linea.id)).not.toBeNull();
  });

  /* Deshacer la declinación NO devuelve la autorización que hubiera antes:
     quién dijo que sí y cuándo es un hecho, no un estado que se restaura. */
  it('deshacer la declinación no resucita la autorización vieja', async () => {
    const linea = await trabajos.agregar(ordenId, PASTILLAS);
    await trabajos.autorizar(linea.id, {
      autorizadaPor: 'Marielos',
      medio: 'whatsapp',
    });
    await trabajos.declinar(linea.id, 'Se arrepintió');

    await trabajos.deshacerDeclinacion(linea.id);

    expect(await trabajos.autorizacionDe(linea.id)).toBeNull();
  });
});

describe('el mensaje que se le manda al Cliente', () => {
  const DATOS = {
    folio: 'A1-2420',
    vehiculo: 'Nissan Frontier 2021',
    placa: '742 118',
    pendientes: [
      { descripcion: 'Diagnóstico de carga', monto: 25000 },
      { descripcion: 'Cambio de alternador', monto: 178000 },
    ],
  };

  it('lleva el carro, los trabajos y el total', () => {
    const mensaje = mensajeDeAutorizacion(DATOS);

    expect(mensaje).toContain('A1-2420');
    expect(mensaje).toContain('742 118');
    expect(mensaje).toContain('Diagnóstico de carga');
    expect(mensaje).toMatch(/Total: ₡203\s000/u);
  });

  /* En Costa Rica los teléfonos se escriben "8888-1111" en todas partes, y
     `wa.me` solo acepta dígitos. */
  it('el enlace limpia el teléfono y le pone el 506', () => {
    const enlace = enlaceDeWhatsApp('8777-4444', 'hola');

    expect(enlace).toContain('https://wa.me/50687774444');
    expect(enlace).toContain('text=hola');
  });

  it('un número que ya trae indicativo no se toca', () => {
    expect(enlaceDeWhatsApp('+506 8777 4444', 'x')).toContain(
      'wa.me/50687774444',
    );
  });

  it('el texto viaja escapado', () => {
    const enlace = enlaceDeWhatsApp('88881111', 'Total: ₡1 000\n¿Le damos?');

    expect(enlace).not.toContain('\n');
    expect(enlace).toContain('%0A');
  });
});
