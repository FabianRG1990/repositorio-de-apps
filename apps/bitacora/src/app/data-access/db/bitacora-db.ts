import { Injectable } from '@angular/core';
import {
  BitacoraDb,
  NO_BORRADO,
  type Especialidad,
  type EstadoOrden,
} from './esquema';
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
}

interface SemillaOrden {
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  cliente: string;
  telefono: string;
  estado: EstadoOrden;
  /** Horas desde que entró: el criterio de orden del tablero (ADR 0003). */
  haceHoras: number;
  notas: string;
  lineas: readonly SemillaLinea[];
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
    haceHoras: 52,
    notas: 'Bomba de agua pedida a San José — sin fecha de llegada',
    lineas: [
      {
        descripcion: 'Cambio de bomba de agua',
        especialidad: 'mecanica',
        horas: 4,
      },
      { descripcion: 'Purga del sistema', especialidad: 'mecanica', horas: 1 },
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
    haceHoras: 28,
    notas: 'Guardabarros derecho, segunda mano de color',
    lineas: [
      {
        descripcion: 'Guardabarros derecho',
        especialidad: 'pintura',
        horas: 6,
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
    haceHoras: 6,
    notas: 'Alternador no carga en frío',
    lineas: [
      {
        descripcion: 'Diagnóstico de carga',
        especialidad: 'electricidad',
        horas: 2,
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
    haceHoras: 3,
    notas: 'Avisado por WhatsApp hace 1 h',
    lineas: [
      {
        descripcion: 'Cambio de pastillas',
        especialidad: 'mecanica',
        horas: 1.5,
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
        this.db.puestos,
        this.db.clientes,
        this.db.vehiculos,
        this.db.vehiculoPlacas,
        this.db.propiedades,
        this.db.ordenes,
        this.db.lineas,
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
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
      version: 1,
    };
    await this.db.talleres.put({
      ...taller,
      especialidades: [...taller.especialidades],
    });

    const puesto = await this.repo.crear(this.db.puestos, {
      nombre: 'Recepción',
      letra: 'A1',
      consecutivo: 2417,
    });

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
        responsableId: null,
        estado: s.estado,
        recibidoEn: new Date(
          Date.now() - s.haceHoras * 60 * 60 * 1000,
        ).toISOString(),
        entregadoEn: NO_BORRADO,
        proximaVisita: null,
        notas: s.notas,
      });

      for (const linea of s.lineas) {
        await this.repo.crear(this.db.lineas, {
          ordenId: orden.id,
          descripcion: linea.descripcion,
          especialidad: linea.especialidad,
          pagador: 'cliente',
          horasFacturadas: linea.horas,
          horasReales: 0,
          monto: 0,
          declinadaEn: NO_BORRADO,
          motivoDeclinacion: null,
        });
      }
    }
  }
}
