import { FotosDeLaOrden } from './fotos';
import { acunarFolio, Repositorio, RepositorioVehiculos } from './repositorio';
import {
  ABIERTO,
  BitacoraDb,
  NO_BORRADO,
  type CuartosDeTanque,
  type Especialidad,
  type Orden,
  type Registro,
  type ReporteDelCliente,
} from './esquema';

/** Una queja del Cliente tal como sale de la pantalla, sin identidad todavía. */
export type ReporteNuevo = Omit<
  ReporteDelCliente,
  keyof Registro | 'ordenId' | 'posicion'
>;

/** Lo que el Asesor recoge cuando entra un carro. */
export interface DatosDeRecepcion {
  readonly placa: string;
  readonly marca: string;
  readonly modelo: string;
  readonly anio: number | null;
  readonly cliente: string;
  readonly telefono: string;
  /** Puede no ser el Cliente: en una flotilla es un chofer distinto cada vez. */
  readonly quienEntrega: string;
  /**
   * Las quejas del Cliente, en el orden en que las dijo.
   *
   * Son varias a propósito: nadie llega diciendo una sola cosa. "Suena al
   * frenar y además no prende el aire" son dos problemas, de dos
   * Especialidades distintas, y aplastarlos en un párrafo es justo lo que
   * hacía que después no se supiera a quién asignarlos.
   */
  readonly reportes: readonly ReporteNuevo[];
  readonly odometro: number | null;
  readonly combustible: CuartosDeTanque | null;
  readonly danosPrevios: string;
  readonly objetosDentro: string;
  /**
   * Las Fotos de cómo entró el carro, YA reducidas.
   *
   * Vienen reducidas y no en crudo porque comprimir es trabajo de CPU y no
   * puede correr dentro de una transacción de Dexie: la transacción se cierra
   * sola en cuanto el hilo cede el control. Se reducen antes, se escriben
   * dentro.
   */
  readonly fotos: readonly Blob[];
}

/** Trabajo que el Taller propuso y el Cliente no aprobó, esperando su regreso. */
export interface TrabajoPendienteDeAntes {
  readonly descripcion: string;
  readonly especialidad: Especialidad;
  readonly monto: number;
  readonly motivo: string | null;
  readonly declinadoEn: string;
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
  /** Cuándo entró la última vez. `null` si esta es la primera. */
  readonly ultimaVisitaEn: string | null;
  /** El último odómetro que se le leyó, para no partir de cero. */
  readonly ultimoOdometro: number | null;
  /**
   * Lo que se le recomendó y no aprobó, con su monto.
   *
   * Es el dato por el que se paga un sistema como este: el glosario dice que
   * el trabajo declinado "vuelve a proponerse cuando el Vehículo regresa", y
   * el Vehículo está regresando justo ahora. Sin esto, la app sabe que hay
   * ₡96 000 sobre la mesa y se los calla.
   */
  readonly pendienteDeAntes: readonly TrabajoPendienteDeAntes[];
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
    private readonly fotos = new FotosDeLaOrden(db, repo, ahora),
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

    /* Las Visitas se traen enteras y no se cuentan con `count()`: de las
       mismas filas salen la última fecha y el último odómetro, y pedirlas
       tres veces sería recorrer el mismo índice tres veces. */
    const visitas = await this.db.ordenes
      .where('vehiculoId')
      .equals(vehiculoId)
      .toArray();
    const porFecha = [...visitas].sort((a, b) =>
      b.recibidoEn.localeCompare(a.recibidoEn),
    );

    return {
      vehiculoId,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      clienteId: cliente?.id ?? null,
      cliente: cliente?.nombre ?? '',
      telefono: cliente?.telefono ?? '',
      visitas: visitas.length,
      ultimaVisitaEn: porFecha[0]?.recibidoEn ?? null,
      /* El odómetro NO es el de la última Visita sino el mayor de todas: las
         Órdenes pueden entrar desordenadas —dos Puestos sin conexión— y un
         kilometraje que retrocede se lee como error del Taller. */
      ultimoOdometro:
        visitas.reduce<number | null>(
          (mayor, o) =>
            typeof o.odometro === 'number' && o.odometro > (mayor ?? -1)
              ? o.odometro
              : mayor,
          null,
        ) ?? null,
      pendienteDeAntes: await this.#pendienteDeAntes(visitas.map((o) => o.id)),
    };
  }

  /**
   * El trabajo declinado de las Visitas anteriores de este carro.
   *
   * El glosario dice que el Trabajo declinado "vuelve a proponerse cuando el
   * Vehículo regresa". Este es el momento exacto en que regresa, así que es
   * acá donde tiene que aparecer — no en una pestaña que hay que acordarse de
   * abrir. Lo más reciente primero: una pastilla declinada hace una semana
   * pesa más en la conversación que una de hace dos años.
   */
  async #pendienteDeAntes(
    ordenIds: readonly string[],
  ): Promise<readonly TrabajoPendienteDeAntes[]> {
    if (!ordenIds.length) return [];

    const lineas = await this.db.lineas
      .where('ordenId')
      .anyOf(ordenIds as string[])
      .toArray();

    return lineas
      .filter((l) => l.declinadaEn !== NO_BORRADO && l.borradoEn === NO_BORRADO)
      .map((l) => ({
        descripcion: l.descripcion,
        especialidad: l.especialidad,
        monto: l.monto,
        motivo: l.motivoDeclinacion,
        declinadoEn: String(l.declinadaEn),
      }))
      .sort((a, b) => b.declinadoEn.localeCompare(a.declinadoEn));
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
        this.db.reportes,
        this.db.fotos,
        /* `lineas` entra al ámbito aunque acá no se escriba: `reconocer` las
           lee para traer lo declinado, y Dexie exige que la transacción
           interna sea un subconjunto de esta. Sin esto revienta en el primer
           carro conocido, que es justo el caso que más se demuestra. */
        this.db.lineas,
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

        const orden = await this.repo.crear(this.db.ordenes, {
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
          /* `notas` deja de ser donde vive la queja y queda como lo que su
             nombre dice. Lo que el Cliente reportó son Reportes, cada uno con
             su estructura; aplastarlos acá es lo que había antes. */
          notas: '',
          odometro: datos.odometro,
          combustible: datos.combustible,
          danosPrevios: datos.danosPrevios.trim(),
          objetosDentro: datos.objetosDentro.trim(),
        });

        /* En serie y no con `Promise.all`: `Repositorio.crear` incrementa el
           `++secuencia` del outbox, y el orden de reenvío tiene que ser el
           orden en que el Cliente dijo las cosas. */
        let posicion = 0;
        for (const reporte of datos.reportes) {
          if (!reporte.textual.trim()) continue;
          await this.repo.crear(this.db.reportes, {
            ordenId: orden.id,
            /* Se le quitan los espacios de los extremos —el dictado los deja—
               y nada más. Las palabras no se tocan: una queja reescrita por
               quien recibe ya trae un diagnóstico adentro. */
            textual: reporte.textual.trim(),
            capturadoPor: reporte.capturadoPor,
            cuando: reporte.cuando,
            desdeCuando: reporte.desdeCuando.trim(),
            senales: reporte.senales,
            especialidadSugerida: reporte.especialidadSugerida,
            sugerenciaCorregida: reporte.sugerenciaCorregida,
            posicion: posicion++,
          });
        }

        /* Las Fotos van en la MISMA transacción que la Orden: una foto sin su
           Orden, o una Orden sin las fotos que se le sacaron al carro, no
           significan nada — y la segunda es la que deja al Taller sin con qué
           contestar cuando alguien dice que el golpe no venía de antes. */
        await this.fotos.guardarReducidas(orden.id, datos.fotos);

        return orden;
      },
    );
  }
}
