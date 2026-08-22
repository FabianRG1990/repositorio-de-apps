import { acunarFolio, Repositorio, RepositorioVehiculos } from './repositorio';
import { ABIERTO, BitacoraDb, NO_BORRADO, type Orden } from './esquema';

/** Lo que el Asesor escribe cuando entra un carro. */
export interface DatosDeRecepcion {
  readonly placa: string;
  readonly marca: string;
  readonly modelo: string;
  readonly anio: number | null;
  readonly cliente: string;
  readonly telefono: string;
  /** Puede no ser el Cliente: en una flotilla es un chofer distinto cada vez. */
  readonly quienEntrega: string;
  /** Lo que el Cliente reporta. Va a las notas de la Orden. */
  readonly reporta: string;
}

/** Lo que la app ya sabe de una Placa antes de que se termine de escribir. */
export interface VehiculoConocido {
  readonly vehiculoId: string;
  readonly marca: string;
  readonly modelo: string;
  readonly anio: number | null;
  readonly clienteId: string | null;
  readonly cliente: string;
  readonly telefono: string;
  /** Cuántas veces ha entrado al Taller. Es el historial, y es el argumento. */
  readonly visitas: number;
}

/**
 * Recibir un Vehículo: cinco escrituras que son UNA sola operación.
 *
 * Crear Cliente, Vehículo, Placa, Propiedad y Orden por separado deja estados
 * que no significan nada — un Vehículo sin Orden, o peor, un Folio ya acuñado
 * para una Orden que no llegó a existir. Un Folio quemado no se recupera: el
 * consecutivo del Puesto ya avanzó y ese número no vuelve.
 *
 * Es la misma lección que costó un bug en la semilla de #74: idempotente y
 * atómica no son lo mismo, y acá hace falta la segunda.
 *
 * Dexie reutiliza la transacción externa mientras el ámbito de las internas
 * sea un subconjunto del suyo, así que `Repositorio.crear` y `acunarFolio`
 * escriben dentro de esta y no abren la suya.
 */
export class RecepcionDeVehiculos {
  constructor(
    private readonly db: BitacoraDb,
    private readonly tallerId: string,
    private readonly repo: Repositorio,
    private readonly vehiculos: RepositorioVehiculos,
    private readonly ahora: () => string = () => new Date().toISOString(),
  ) {}

  /**
   * Qué sabe ya el Taller de esa Placa.
   *
   * El historial sigue al carro y no a la persona: si la Placa está vigente en
   * un Vehículo, se reutiliza ese Vehículo en vez de crear uno nuevo. Sin
   * esto, el mismo carro entra dos veces como dos carros distintos y el
   * historial —que es el producto— se parte en dos.
   */
  async reconocer(placa: string): Promise<VehiculoConocido | null> {
    const limpia = placa.trim();
    if (!limpia) return null;

    /* Se toma la vigencia MÁS RECIENTE, y no la primera que devuelva el
       índice, porque el esquema no impide que la misma Placa quede vigente en
       dos Vehículos a la vez: `cambiarPlaca` sostiene "un Vehículo tiene como
       mucho una Placa vigente", que no es lo mismo que "una Placa está
       vigente en como mucho un Vehículo". Pasa cuando una placa liberada se
       la queda otro carro y nadie cerró la del anterior — legal en Costa Rica
       (#35). Ante ese empate, el que la tomó último es el de ahora. */
    const ahora = this.ahora();
    const vigentes = (
      await this.db.vehiculoPlacas
        .where('[tallerId+placa]')
        .equals([this.tallerId, limpia])
        .toArray()
    )
      .filter((p) => p.vigenteDesde <= ahora && p.vigenteHasta > ahora)
      .sort((a, b) => b.vigenteDesde.localeCompare(a.vigenteDesde));

    const vehiculoId = vigentes[0]?.vehiculoId;
    if (!vehiculoId) return null;

    const vehiculo = await this.db.vehiculos.get(vehiculoId);
    if (!vehiculo || vehiculo.borradoEn !== NO_BORRADO) return null;

    const propiedad = await this.db.propiedades
      .where('[vehiculoId+hasta]')
      .equals([vehiculoId, ABIERTO])
      .first();
    const cliente = propiedad
      ? await this.db.clientes.get(propiedad.clienteId)
      : undefined;

    const visitas = await this.db.ordenes
      .where('vehiculoId')
      .equals(vehiculoId)
      .count();

    return {
      vehiculoId,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      clienteId: cliente?.id ?? null,
      cliente: cliente?.nombre ?? '',
      telefono: cliente?.telefono ?? '',
      visitas,
    };
  }

  /** Recibe el Vehículo y devuelve la Orden ya con su Folio. */
  async recibir(datos: DatosDeRecepcion, puestoId: string): Promise<Orden> {
    const momento = this.ahora();

    return this.db.transaction(
      'rw',
      [
        this.db.clientes,
        this.db.vehiculos,
        this.db.vehiculoPlacas,
        this.db.propiedades,
        this.db.ordenes,
        this.db.puestos,
        this.db.pendientes,
      ],
      async () => {
        /* El reconocimiento se repite DENTRO de la transacción y no se confía
           al que hizo la pantalla: entre que el Asesor escribió la placa y
           pulsó el botón, otra pestaña pudo haber recibido ese mismo carro. */
        const conocido = await this.reconocer(datos.placa);

        const clienteId =
          conocido?.clienteId ??
          (
            await this.repo.crear(this.db.clientes, {
              nombre: datos.cliente.trim(),
              telefono: datos.telefono.trim(),
              // Se pide al facturar, no al recibir.
              cedula: null,
            })
          ).id;

        let vehiculoId = conocido?.vehiculoId;
        if (!vehiculoId) {
          vehiculoId = (
            await this.repo.crear(this.db.vehiculos, {
              vin: null,
              marca: datos.marca.trim(),
              modelo: datos.modelo.trim(),
              anio: datos.anio,
              canonicoId: null,
              fusionadoEn: NO_BORRADO,
            })
          ).id;

          await this.vehiculos.cambiarPlaca(vehiculoId, datos.placa.trim());
          await this.repo.crear(this.db.propiedades, {
            vehiculoId,
            clienteId,
            desde: momento,
            hasta: ABIERTO,
          });
        }

        /* El Folio se acuña acá dentro. Si se acuñara antes de abrir la
           transacción y algo fallara, el consecutivo del Puesto ya habría
           avanzado y ese número quedaría quemado sin Orden que lo lleve. */
        const folio = await acunarFolio(this.db, puestoId);

        return this.repo.crear(this.db.ordenes, {
          folio,
          puestoId,
          vehiculoId,
          clienteId,
          quienEntrega: datos.quienEntrega.trim() || datos.cliente.trim(),
          responsableId: null,
          estado: 'recibido',
          recibidoEn: momento,
          entregadoEn: NO_BORRADO,
          proximaVisita: null,
          notas: datos.reporta.trim(),
        });
      },
    );
  }
}
