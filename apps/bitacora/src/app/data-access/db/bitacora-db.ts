import { Injectable } from '@angular/core';
import {
  BitacoraDb,
  NO_BORRADO,
  type CuandoPasa,
  type CuartosDeTanque,
  type Especialidad,
  type EstadoOrden,
  type MedioDeAviso,
  type Papel,
  type SenalDeFalla,
} from './esquema';
import { CicloDeLaOrden } from './ciclo';
import { ConfiguracionDelTaller } from './configuracion';
import { FotosDeLaOrden } from './fotos';
import { PersonalDelTaller } from './personal';
import { RecepcionDeVehiculos } from './recepcion';
import { TrabajosDeLaOrden } from './trabajos';
import { acunarFolio, Repositorio, RepositorioVehiculos } from './repositorio';

/**
 * Un solo Taller mientras no haya selección de taller ni backend, pero el
 * campo `tallerId` existe en cada fila y encabeza cada índice compuesto desde
 * el día uno: añadir la columna después es una migración, y cambiar el orden
 * de un índice compuesto también.
 */
export const TALLER_DEMO = 'taller-demo';

interface SemillaLinea {
  descripcion: string;
  especialidad: Especialidad;
  horas: number;
  monto: number;
  /** El Cliente no la aprobó. Conserva su motivo y reaparece al volver. */
  declinada?: { motivo: string };
  /** El Cliente dijo que sí, y por dónde lo dijo (ADR 0007). */
  autorizada?: { por: string; medio: MedioDeAviso };
}

/** Una queja del Cliente sembrada, con lo que el intérprete habría propuesto. */
interface SemillaReporte {
  textual: string;
  cuando?: readonly CuandoPasa[];
  desdeCuando?: string;
  senales?: readonly SenalDeFalla[];
  especialidad: Especialidad | null;
}

/** Alguien del Taller, con las Especialidades que solo el Técnico lleva. */
interface SemillaPersona {
  nombre: string;
  papel: Papel;
  especialidades?: readonly Especialidad[];
}

/**
 * La gente del Taller.
 *
 * Se siembra por lo mismo que las Tarifas en #114: la sugerencia de
 * Responsable necesita de dónde salir el primer día, y un taller de demo sin
 * nadie adentro obligaría a configurar personal antes de poder mirar una
 * pantalla.
 *
 * Los tres papeles del ADR 0005 están representados porque la pantalla de
 * entrada ofrece los tres, y un Perfil sin nadie detrás se ve como un error.
 */
const PERSONAL: readonly SemillaPersona[] = [
  { nombre: 'Ana Rojas', papel: 'asesor' },
  { nombre: 'Fabián Ureña', papel: 'dueno' },
  {
    nombre: 'Luis Vargas',
    papel: 'tecnico',
    especialidades: ['mecanica', 'electricidad'],
  },
  { nombre: 'Kenneth Soto', papel: 'tecnico', especialidades: ['pintura'] },
  { nombre: 'Marta Cordero', papel: 'tecnico', especialidades: ['mecanica'] },
];

interface SemillaOrden {
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  cliente: string;
  telefono: string;
  estado: EstadoOrden;
  /**
   * A nombre de quién queda, por su nombre y no por su id (ADR 0003).
   *
   * Sin definir es una Orden que todavía no tomó nadie, que es un estado real
   * y no un hueco de la semilla: hay que poder verla para saber que se
   * distingue.
   */
  responsable?: string;
  /** Horas desde que entró: el criterio de orden del tablero (ADR 0003). */
  haceHoras: number;
  /** Horas desde que se entregó, si ya salió del Taller. */
  entregadoHaceHoras?: number;
  /** Se le avisó a Quien entrega hace tantas horas (ADR 0009). */
  avisadoHaceHoras?: number;
  /**
   * Dentro de cuántos días le toca volver (ADR 0011). Negativo si ya pasó.
   *
   * Va en días y no en fecha fija porque la semilla se instala el día que
   * alguien abre la app: una fecha escrita a mano queda vencida sola, y la
   * pantalla de Próximas visitas acabaría enseñando siempre lo mismo.
   */
  proximaVisitaEnDias?: number;
  notas: string;
  /** Cómo venía el carro al entrar. Es lo que respalda al Taller después. */
  odometro?: number;
  combustible?: CuartosDeTanque;
  danosPrevios?: string;
  objetosDentro?: string;
  /** Lo que el Cliente dijo, en sus palabras. */
  reportes?: readonly SemillaReporte[];
  lineas: readonly SemillaLinea[];
}

/**
 * `-6` → la fecha ISO de hace seis días, en hora local.
 *
 * Local y no UTC: la Próxima visita es un día de calendario, no un instante,
 * y `toISOString()` en Costa Rica (UTC-6) devolvería el día siguiente para
 * cualquier cosa después de las seis de la tarde.
 */
function enDias(dias: number): string {
  const cita = new Date();
  cita.setDate(cita.getDate() + dias);
  const mes = String(cita.getMonth() + 1).padStart(2, '0');
  const dia = String(cita.getDate()).padStart(2, '0');
  return `${cita.getFullYear()}-${mes}-${dia}`;
}

/* Los mismos datos que la app venía mostrando desde memoria. Las placas van
   con formatos distintos a propósito: #35 concluyó que no se validan con
   expresión regular. */
const SEMILLA: readonly SemillaOrden[] = [
  {
    placa: '863 549',
    marca: 'Toyota',
    modelo: 'Hilux',
    anio: 2019,
    cliente: 'Marielos Quesada',
    telefono: '8888-1111',
    estado: 'esperando-repuesto',
    responsable: 'Luis Vargas',
    haceHoras: 52,
    notas: 'Bomba de agua pedida a San José — sin fecha de llegada',
    odometro: 148320,
    combustible: 1,
    danosPrevios: 'Rayón largo en la puerta trasera derecha, ya venía',
    objetosDentro: 'Herramienta del dueño en el cajón',
    reportes: [
      {
        textual: 'Se está calentando cuando queda en presa, la aguja sube',
        cuando: ['siempre'],
        desdeCuando: 'como dos semanas',
        senales: ['luz-tablero'],
        especialidad: 'mecanica',
      },
    ],
    lineas: [
      {
        descripcion: 'Cambio de bomba de agua',
        especialidad: 'mecanica',
        horas: 4,
        monto: 145000,
        autorizada: { por: 'Marielos Quesada', medio: 'whatsapp' },
      },
      {
        descripcion: 'Purga del sistema',
        especialidad: 'mecanica',
        horas: 1,
        monto: 18000,
        autorizada: { por: 'Marielos Quesada', medio: 'whatsapp' },
      },
      /* Declinada: el Taller lo recomendó y el Cliente dijo que no. Se guarda
         con su motivo y su monto porque vuelve a proponerse cuando el carro
         regrese (glosario). */
      {
        descripcion: 'Cambio de faja de distribución',
        especialidad: 'mecanica',
        horas: 3,
        monto: 96000,
        declinada: { motivo: 'El cliente lo deja para la próxima visita' },
      },
    ],
  },
  {
    placa: 'TSJ 1204',
    marca: 'Hyundai',
    modelo: 'Elantra',
    anio: 2018,
    cliente: 'Taxis Los Yoses',
    telefono: '2222-3333',
    estado: 'en-proceso',
    responsable: 'Kenneth Soto',
    haceHoras: 28,
    notas: 'Guardabarros derecho, segunda mano de color',
    odometro: 312450,
    combustible: 2,
    danosPrevios: 'Golpe en el guardabarros derecho, es a lo que viene',
    objetosDentro: '',
    reportes: [
      {
        textual: 'Le dieron un golpe estacionado, el guardabarros derecho',
        desdeCuando: 'el sábado',
        senales: ['golpe-visible'],
        especialidad: 'pintura',
      },
    ],
    lineas: [
      {
        descripcion: 'Guardabarros derecho',
        especialidad: 'pintura',
        horas: 6,
        monto: 210000,
        autorizada: { por: 'Don Beto, el chofer', medio: 'presencial' },
      },
    ],
  },
  {
    placa: '742 118',
    marca: 'Nissan',
    modelo: 'Frontier',
    anio: 2021,
    cliente: 'Rodrigo Vargas',
    telefono: '8777-4444',
    estado: 'diagnostico',
    /* La única sin Responsable, y es la que lleva seis horas adentro: una
       Orden que todavía no tomó nadie es un estado real del taller, no un
       hueco de la semilla. Sin ella, la marca de "sin responsable" no se
       vería nunca al abrir la app por primera vez. */
    haceHoras: 6,
    notas: 'Alternador no carga en frío',
    odometro: 61870,
    combustible: 3,
    danosPrevios: '',
    objetosDentro: 'Silla de bebé atrás',
    /* Dos quejas de DOS Especialidades en la misma Visita: es el caso que un
       solo campo de notas no sabía representar, y el que justifica que el
       Reporte sea una entidad. */
    reportes: [
      {
        textual: 'En la mañana cuesta que prenda, hace un ruido y no arranca',
        cuando: ['en-frio', 'al-arrancar'],
        desdeCuando: 'como un mes',
        senales: ['no-enciende', 'ruido'],
        especialidad: 'electricidad',
      },
      {
        textual: 'Y también chilla cuando freno despacio',
        cuando: ['al-frenar'],
        desdeCuando: 'esta semana',
        senales: ['ruido'],
        especialidad: 'mecanica',
      },
    ],
    lineas: [
      {
        descripcion: 'Diagnóstico de carga',
        especialidad: 'electricidad',
        horas: 2,
        monto: 25000,
      },
      {
        descripcion: 'Cambio de alternador',
        especialidad: 'electricidad',
        horas: 2.5,
        monto: 178000,
        declinada: { motivo: 'Va a cotizar el repuesto por su cuenta' },
      },
    ],
  },
  {
    placa: '905 733',
    marca: 'Suzuki',
    modelo: 'Swift',
    anio: 2022,
    cliente: 'Ana Lucía Brenes',
    telefono: '8555-5555',
    estado: 'listo',
    responsable: 'Marta Cordero',
    haceHoras: 3,
    avisadoHaceHoras: 1,
    notas: 'Avisado por WhatsApp hace 1 h',
    odometro: 28100,
    combustible: 4,
    danosPrevios: '',
    objetosDentro: '',
    reportes: [
      {
        textual: 'Rechina al frenar, sobre todo cuando voy bajando',
        cuando: ['al-frenar'],
        desdeCuando: 'unos días',
        senales: ['ruido'],
        especialidad: 'mecanica',
      },
    ],
    lineas: [
      {
        descripcion: 'Cambio de pastillas',
        especialidad: 'mecanica',
        horas: 1.5,
        monto: 62000,
        autorizada: { por: 'Ana Lucía Brenes', medio: 'llamada' },
      },
    ],
  },
  /* Listo, avisado hace cinco días y ahí sigue. Es el caso que el ADR 0009
     manda señalar en el tablero, y sin una Orden así la marca de "sin
     recoger" no se vería nunca al abrir la app por primera vez. */
  {
    placa: 'SJB 4472',
    marca: 'Daihatsu',
    modelo: 'Terios',
    anio: 2016,
    cliente: 'Gerardo Mora',
    telefono: '8712-4488',
    estado: 'listo',
    responsable: 'Luis Vargas',
    haceHoras: 192,
    avisadoHaceHoras: 122,
    notas: 'Se le avisó dos veces y no contesta',
    odometro: 176400,
    combustible: 1,
    danosPrevios: 'Espejo derecho quebrado',
    objetosDentro: 'Silla de bebé',
    reportes: [
      {
        textual: 'No prende de una, hay que darle vuelta varias veces',
        cuando: ['en-frio', 'al-arrancar'],
        desdeCuando: 'como un mes',
        senales: ['no-enciende'],
        especialidad: 'electricidad',
      },
    ],
    lineas: [
      {
        descripcion: 'Cambio de batería',
        especialidad: 'electricidad',
        horas: 0.5,
        monto: 78000,
        autorizada: { por: 'Gerardo Mora', medio: 'whatsapp' },
      },
    ],
  },
  /* Ya entregada: sirve para que "En el taller" filtre de verdad. Sin una sola
     Orden fuera, el filtro pasaría igual sin estar haciendo nada. */
  {
    placa: 'CL 214 508',
    marca: 'Isuzu',
    modelo: 'D-Max',
    anio: 2017,
    cliente: 'Constructora Peñas Blancas',
    telefono: '2100-9090',
    estado: 'entregado',
    responsable: 'Marta Cordero',
    haceHoras: 96,
    entregadoHaceHoras: 20,
    avisadoHaceHoras: 26,
    proximaVisitaEnDias: 87,
    notas: 'Entregado al chofer con el reporte de frenos firmado',
    odometro: 205600,
    combustible: 2,
    danosPrevios: 'Cajón golpeado por trabajo, el cliente lo sabe',
    objetosDentro: '',
    reportes: [
      {
        textual: 'Vibra el volante cuando frena en la autopista',
        cuando: ['al-frenar', 'a-velocidad'],
        desdeCuando: 'hace rato',
        senales: ['vibracion'],
        especialidad: 'mecanica',
      },
    ],
    lineas: [
      {
        descripcion: 'Rectificado de discos',
        especialidad: 'mecanica',
        horas: 2,
        monto: 54000,
        autorizada: { por: 'Constructora Peñas Blancas', medio: 'whatsapp' },
      },
    ],
  },
  /* Se le pasó la fecha y quedó trabajo sin aprobar: es la llamada que el
     ADR 0011 quiere que el Taller pueda hacer, con qué proponer a mano. */
  {
    placa: 'BLT 992',
    marca: 'Kia',
    modelo: 'Rio',
    anio: 2020,
    cliente: 'Silvia Ramírez',
    telefono: '8330-7711',
    estado: 'entregado',
    responsable: 'Kenneth Soto',
    haceHoras: 1200,
    entregadoHaceHoras: 1100,
    proximaVisitaEnDias: -6,
    notas: 'Quedó de pensar lo de los amortiguadores',
    odometro: 92400,
    combustible: 3,
    danosPrevios: '',
    objetosDentro: '',
    reportes: [
      {
        textual: 'Salta mucho en los huecos y suena por delante',
        cuando: ['siempre'],
        desdeCuando: 'varios meses',
        senales: ['ruido'],
        especialidad: 'mecanica',
      },
    ],
    lineas: [
      {
        descripcion: 'Cambio de aceite y filtro',
        especialidad: 'mecanica',
        horas: 1,
        monto: 32000,
        autorizada: { por: 'Silvia Ramírez', medio: 'presencial' },
      },
      {
        descripcion: 'Cambio de amortiguadores delanteros',
        especialidad: 'mecanica',
        horas: 3,
        monto: 210000,
        declinada: { motivo: 'Lo deja para la próxima, no le alcanza ahora' },
      },
    ],
  },
  /* Esta semana. Sin nada declinado: la llamada es solo el recordatorio. */
  {
    placa: 'C 158 902',
    marca: 'Mitsubishi',
    modelo: 'L200',
    anio: 2015,
    cliente: 'Finca La Chácara',
    telefono: '2447-1200',
    estado: 'entregado',
    responsable: 'Luis Vargas',
    haceHoras: 700,
    entregadoHaceHoras: 640,
    proximaVisitaEnDias: 4,
    notas: 'Servicio cada 5000 km, lo trae el mismo peón',
    odometro: 318900,
    combustible: 4,
    danosPrevios: 'Balde con golpes de trabajo',
    objetosDentro: '',
    reportes: [
      {
        textual: 'Viene por el servicio, no trae ninguna queja',
        cuando: [],
        desdeCuando: '',
        senales: [],
        especialidad: 'mecanica',
      },
    ],
    lineas: [
      {
        descripcion: 'Servicio completo de 5000 km',
        especialidad: 'mecanica',
        horas: 2,
        monto: 68000,
        autorizada: { por: 'Finca La Chácara', medio: 'llamada' },
      },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class BitacoraDatos {
  readonly db = new BitacoraDb();
  readonly tallerId = TALLER_DEMO;
  readonly repo = new Repositorio(this.db, this.tallerId);
  readonly vehiculos = new RepositorioVehiculos(this.db, this.tallerId);
  readonly recepcion = new RecepcionDeVehiculos(
    this.db,
    this.tallerId,
    this.repo,
    this.vehiculos,
  );
  readonly trabajos = new TrabajosDeLaOrden(this.db, this.repo);
  readonly ciclo = new CicloDeLaOrden(this.db, this.repo);
  readonly fotos = new FotosDeLaOrden(this.db, this.repo);
  readonly configuracion = new ConfiguracionDelTaller(
    this.db,
    this.tallerId,
    this.repo,
  );
  readonly personal = new PersonalDelTaller(this.db, this.tallerId, this.repo);

  /** El Puesto desde el que este aparato acuña Folios. Fase 1 tiene uno solo. */
  async puestoActual(): Promise<string> {
    const puesto = await this.repo.vivos(this.db.puestos).first();
    if (!puesto) throw new Error('El Taller no tiene ningún Puesto');
    return puesto.id;
  }

  /** Se resuelve cuando la base está lista para consultarse. */
  readonly lista: Promise<void>;

  constructor() {
    this.lista = this.sembrar();
  }

  /**
   * Siembra la demo si la base está vacía.
   *
   * Va FUERA de la función de migración de Dexie a propósito: lo que corre
   * dentro de una migración se ejecuta una sola vez por versión y no se puede
   * repetir; una semilla tiene que poder comprobarse y reintentarse.
   *
   * Y va TODA dentro de una transacción, que es lo que le faltaba y costó un
   * bug: idempotente no alcanza. Sembrando fuera de transacción, una recarga a
   * mitad de camino dejaba la base con parte de las Órdenes escritas; al
   * volver a arrancar, `count() > 0` daba verdadero, la semilla se saltaba, y
   * el taller se quedaba para siempre con una base incompleta. Dentro de la
   * transacción es todo o nada: si se interrumpe, IndexedDB la deshace y el
   * siguiente arranque vuelve a intentarlo entero.
   */
  async sembrar(): Promise<void> {
    await this.db.open();

    await this.db.transaction(
      'rw',
      [
        this.db.talleres,
        this.db.tarifas,
        this.db.puestos,
        this.db.personas,
        this.db.clientes,
        this.db.vehiculos,
        this.db.vehiculoPlacas,
        this.db.propiedades,
        this.db.ordenes,
        this.db.reportes,
        this.db.lineas,
        this.db.autorizaciones,
        this.db.avisos,
        this.db.pendientes,
      ],
      async () => {
        // La comprobación va DENTRO: leerla fuera y escribir después deja el
        // hueco por el que se cuela una segunda siembra.
        if ((await this.db.ordenes.count()) > 0) return;
        await this.#sembrarTodo();
      },
    );
  }

  async #sembrarTodo(): Promise<void> {
    const taller = {
      id: this.tallerId,
      nombre: 'Taller Bitácora',
      especialidades: ['mecanica', 'electricidad', 'pintura'] as const,
      telefono: '2222-0000',
      direccion: 'San José, Costa Rica',
      cedulaJuridica: '3-101-000000',
      /* Tres días es un punto de partida, no una medida: el ADR 0009 dice que
         sin talleres observados cualquier número es una suposición. Por eso el
         Dueño lo puede cambiar. */
      diasParaSinRecoger: 3,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
      version: 1,
    };
    await this.db.talleres.put({
      ...taller,
      especialidades: [...taller.especialidades],
    });

    /* Las Tarifas existen en el esquema desde #74 y nadie las había creado
       nunca. Se siembran para que la sugerencia de monto tenga de dónde salir
       desde el primer arranque. */
    for (const [especialidad, porHora] of [
      ['mecanica', 14000],
      ['electricidad', 16000],
      ['pintura', 15000],
    ] as const) {
      await this.repo.crear(this.db.tarifas, { especialidad, porHora });
    }

    const puesto = await this.repo.crear(this.db.puestos, {
      nombre: 'Recepción',
      letra: 'A1',
      consecutivo: 2417,
    });

    /* La gente del Taller. `personas` era la última tabla del esquema que
       nadie había llenado nunca, y sin ella el ADR 0003 prometía un
       Responsable por Orden que ninguna Orden tenía. */
    const porNombre = new Map<string, string>();
    for (const p of PERSONAL) {
      const persona = await this.repo.crear(this.db.personas, {
        nombre: p.nombre,
        papel: p.papel,
        especialidades: [...(p.especialidades ?? [])],
      });
      porNombre.set(p.nombre, persona.id);
    }

    for (const s of SEMILLA) {
      const cliente = await this.repo.crear(this.db.clientes, {
        nombre: s.cliente,
        telefono: s.telefono,
        cedula: null,
      });

      const vehiculo = await this.repo.crear(this.db.vehiculos, {
        vin: null,
        marca: s.marca,
        modelo: s.modelo,
        anio: s.anio,
        canonicoId: null,
        fusionadoEn: NO_BORRADO,
      });
      await this.vehiculos.cambiarPlaca(vehiculo.id, s.placa);

      await this.repo.crear(this.db.propiedades, {
        vehiculoId: vehiculo.id,
        clienteId: cliente.id,
        desde: new Date().toISOString(),
        hasta: '9999-12-31T00:00:00.000Z',
      });

      const orden = await this.repo.crear(this.db.ordenes, {
        folio: await acunarFolio(this.db, puesto.id),
        puestoId: puesto.id,
        vehiculoId: vehiculo.id,
        clienteId: cliente.id,
        quienEntrega: s.cliente,
        responsableId: s.responsable
          ? (porNombre.get(s.responsable) ?? null)
          : null,
        estado: s.estado,
        recibidoEn: new Date(
          Date.now() - s.haceHoras * 60 * 60 * 1000,
        ).toISOString(),
        entregadoEn: s.entregadoHaceHoras
          ? new Date(
              Date.now() - s.entregadoHaceHoras * 60 * 60 * 1000,
            ).toISOString()
          : NO_BORRADO,
        proximaVisita:
          s.proximaVisitaEnDias === undefined
            ? null
            : enDias(s.proximaVisitaEnDias),
        notas: s.notas,
        odometro: s.odometro ?? null,
        combustible: s.combustible ?? null,
        danosPrevios: s.danosPrevios ?? '',
        objetosDentro: s.objetosDentro ?? '',
      });

      /* Las quejas se siembran como `tecleado`: son datos de demo, nadie las
         dictó. Marcarlas como dictadas inflaría el único número que dice si el
         micrófono se usa de verdad. */
      let posicion = 0;
      for (const reporte of s.reportes ?? []) {
        await this.repo.crear(this.db.reportes, {
          ordenId: orden.id,
          textual: reporte.textual,
          capturadoPor: 'tecleado',
          cuando: reporte.cuando ?? [],
          desdeCuando: reporte.desdeCuando ?? '',
          senales: reporte.senales ?? [],
          especialidadSugerida: reporte.especialidad,
          sugerenciaCorregida: false,
          posicion: posicion++,
        });
      }

      /* El Aviso de listo es una fila aparte, no un booleano en la Orden: dice
         a QUIÉN se avisó y POR QUÉ MEDIO, y es lo que contesta el "nadie me
         llamó" (ADR 0009). */
      if (s.avisadoHaceHoras !== undefined) {
        await this.repo.crear(this.db.avisos, {
          ordenId: orden.id,
          avisadoA: s.cliente,
          medio: 'whatsapp',
          avisadoEn: new Date(
            Date.now() - s.avisadoHaceHoras * 60 * 60 * 1000,
          ).toISOString(),
        });
      }

      for (const linea of s.lineas) {
        const creada = await this.repo.crear(this.db.lineas, {
          ordenId: orden.id,
          descripcion: linea.descripcion,
          especialidad: linea.especialidad,
          pagador: 'cliente',
          horasFacturadas: linea.horas,
          horasReales: 0,
          monto: linea.monto,
          declinadaEn: linea.declinada
            ? new Date(Date.now() - s.haceHoras * 60 * 60 * 1000).toISOString()
            : NO_BORRADO,
          motivoDeclinacion: linea.declinada?.motivo ?? null,
        });

        /* La constancia es una fila aparte, no un booleano en la Línea: dice
           QUIÉN autorizó y POR QUÉ MEDIO, que es lo que sostiene al Taller en
           una disputa (ADR 0007). */
        if (linea.autorizada) {
          await this.repo.crear(this.db.autorizaciones, {
            lineaId: creada.id,
            autorizadaPor: linea.autorizada.por,
            medio: linea.autorizada.medio,
            autorizadaEn: new Date(
              Date.now() - s.haceHoras * 60 * 60 * 1000,
            ).toISOString(),
          });
        }
      }
    }
  }
}
