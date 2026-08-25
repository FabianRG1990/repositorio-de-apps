import Dexie, { type EntityTable } from 'dexie';

/* ---------------------------------------------------------------------------
   Los dos centinelas, y por qué existen.

   Dexie documenta que "Compound indexes will only index objects that has valid
   keys for all contained keypaths". Traducido: una fila cuyo `borradoEn` sea
   `null` o `undefined` DESAPARECE de cualquier índice compuesto que lo
   incluya — y justo las filas que importan (las vivas, las placas vigentes)
   serían las invisibles. No da error: devuelve vacío.

   Por eso en este esquema `null` no entra nunca en una columna indexada. El
   "sigue abierto" se escribe con una fecha lejana y el "no borrado" con cero.
   --------------------------------------------------------------------------- */

/** Vigencia sin fin: se usa donde iría `null` en una columna indexada. */
export const ABIERTO = '9999-12-31T00:00:00.000Z';

/** Fila viva. El borrado es lógico y guarda la fecha en su lugar. */
export const NO_BORRADO = 0;

export type Marca = string;
export type Especialidad = 'mecanica' | 'electricidad' | 'pintura';
export type Pagador = 'cliente' | 'aseguradora';
export type MedioDeAviso = 'whatsapp' | 'llamada' | 'presencial';

/**
 * Cuánto combustible traía el carro, en cuartos de tanque.
 *
 * Se guardan cuartos y no litros ni porcentaje porque es lo que la aguja
 * permite leer: nadie mira el tablero y dice "31 %". Medir con más precisión
 * de la que tiene el instrumento es inventar el dato.
 */
export type CuartosDeTanque = 0 | 1 | 2 | 3 | 4;

/**
 * Lo que lleva toda entidad sincronizable desde el día uno.
 *
 * `creadoEn` / `actualizadoEn` / `borradoEn` son los tres campos que el
 * protocolo de replicación de referencia exige, y `version` es lo que permitirá
 * detectar la escritura a ciegas cuando exista servidor. Ponerlos después es
 * adivinar datos que ya no existen.
 */
export interface Registro {
  readonly id: string;
  readonly tallerId: string;
  creadoEn: string;
  actualizadoEn: string;
  /** `NO_BORRADO` o la fecha en que se borró. Nunca `null`: se indexa. */
  borradoEn: number | string;
  version: number;
}

export interface Taller {
  readonly id: string;
  nombre: string;
  /** Las que ofrece; con una sola, el filtro del tablero no aparece. */
  especialidades: readonly Especialidad[];

  /* --- Lo que va impreso ---------------------------------------------------
     El ADR 0008 los llama "los datos del Taller que van impresos en la factura
     y en la Orden". Sin ellos, los tres papeles salen sin membrete: un
     comprobante sin nombre ni teléfono no sirve para volver a llamar. */

  telefono: string;
  direccion: string;
  /** Va en la factura. Hacienda la exige; #75 decide el resto. */
  cedulaJuridica: string;

  creadoEn: string;
  actualizadoEn: string;
  version: number;
}

/** Cuánto cobra el Taller la hora de una Especialidad. */
export interface Tarifa extends Registro {
  especialidad: Especialidad;
  porHora: number;
}

/** Desde dónde se crean Órdenes. Su letra encabeza el Folio. */
export interface Puesto extends Registro {
  nombre: string;
  letra: string;
  /** Consecutivo propio: dos Puestos sin conexión no acuñan el mismo Folio. */
  consecutivo: number;
}

export interface Persona extends Registro {
  nombre: string;
  papel: 'asesor' | 'tecnico' | 'dueno';
  especialidades: readonly Especialidad[];
}

export interface Cliente extends Registro {
  nombre: string;
  telefono: string;
  /** Se pide al facturar, no al recibir. */
  cedula: string | null;
}

export interface Vehiculo extends Registro {
  /** Nulable, sin unicidad y sin validar el dígito verificador (#35). */
  vin: string | null;
  marca: string;
  modelo: string;
  anio: number | null;
  /** Apunta al Vehículo que absorbió a este, si hubo Fusión. */
  canonicoId: string | null;
  fusionadoEn: number | string;
}

/**
 * La Placa con su vigencia. No es la identidad del Vehículo: puede cambiar y
 * se conserva el historial (#35).
 *
 * La invariante "una sola placa vigente por Vehículo" NO es expresable en
 * IndexedDB —no hay índices parciales, solo un flag `unique` binario—, así que
 * la sostiene el repositorio dentro de la misma transacción.
 */
export interface VehiculoPlaca extends Registro {
  vehiculoId: string;
  placa: string;
  vigenteDesde: string;
  /** `ABIERTO` mientras sea la vigente. Nunca `null`: se indexa. */
  vigenteHasta: string;
}

/** Cliente ↔ Vehículo con rango temporal: el historial sigue al carro. */
export interface Propiedad extends Registro {
  vehiculoId: string;
  clienteId: string;
  desde: string;
  hasta: string;
}

export type EstadoOrden =
  | 'recibido'
  | 'diagnostico'
  | 'en-proceso'
  | 'esperando-repuesto'
  | 'listo'
  | 'entregado';

/** Orden = Visita: el hecho y el papel son la misma cosa (ADR 0001). */
export interface Orden extends Registro {
  /** `A1-2418`. Presentación, nunca identidad (decisión cara #0). */
  folio: string;
  puestoId: string;
  vehiculoId: string;
  clienteId: string;
  /** Puede no ser el Cliente: en una flotilla cambia cada vez. */
  quienEntrega: string;
  responsableId: string | null;
  estado: EstadoOrden;
  recibidoEn: string;
  entregadoEn: number | string;
  /** La escribe el Asesor a mano al cerrar; no se calcula (ADR 0011). */
  proximaVisita: string | null;
  notas: string;

  /* --- Estado de entrada: cómo venía el carro cuando se recibió. -----------
     Se anota una sola vez, al recibir, y no se vuelve a tocar. Es lo que
     sostiene al Taller cuando alguien dice "usted me rayó el carro" o "yo lo
     dejé con medio tanque", y por eso vive en la Orden y no en el Vehículo:
     describe ESTA Visita, no al carro. */

  /** Kilómetros marcados al entrar. `null` si el odómetro no se pudo leer. */
  odometro: number | null;
  /** Cuartos de tanque al entrar. `null` si nadie lo miró. */
  combustible: CuartosDeTanque | null;
  /** Golpes y rayones que YA traía. Prosa: se dicta o se escribe. */
  danosPrevios: string;
  /** Lo que el Cliente dejó adentro. Prosa: se dicta o se escribe. */
  objetosDentro: string;
}

/** Cuándo se manifiesta la queja. Son las condiciones que el Cliente reconoce. */
export type CuandoPasa =
  | 'al-frenar'
  | 'al-arrancar'
  | 'en-frio'
  | 'al-acelerar'
  | 'al-girar'
  | 'a-velocidad'
  | 'siempre';

/** Qué da la queja. Es lo que el Cliente percibe, no lo que el carro tiene. */
export type SenalDeFalla =
  | 'ruido'
  | 'vibracion'
  | 'olor'
  | 'humo'
  | 'luz-tablero'
  | 'fuga'
  | 'no-enciende'
  | 'se-apaga'
  | 'tira-agua'
  | 'golpe-visible';

/**
 * Lo que el Cliente dice que le pasa al carro, guardado como lo dijo.
 *
 * Es la **Queja** de las tres C del oficio —queja, causa, corrección—, y el
 * estándar es registrarla en las palabras del Cliente, no en las del Taller:
 * una queja reescrita por quien recibe ya trae un diagnóstico adentro, y
 * cuando el diagnóstico sale mal nadie puede volver a lo que de verdad se
 * dijo. Por eso `textual` no se normaliza nunca.
 *
 * Vive aparte de la Línea de servicio porque **no es lo mismo**: la queja es
 * del Cliente y existe desde que el carro entra; la Línea es del Taller y
 * nace al diagnosticar. Una queja puede terminar en tres Líneas, en una, o en
 * ninguna. Meterlas en la misma tabla obligaría a inventar una Línea sin
 * precio ni Especialidad en el momento de recibir.
 */
export interface ReporteDelCliente extends Registro {
  ordenId: string;
  /** Las palabras del Cliente, sin normalizar. */
  textual: string;
  /** Si se dictó o se tecleó. Se guarda para saber cuánto se usa el micrófono. */
  capturadoPor: 'dictado' | 'tecleado';
  cuando: readonly CuandoPasa[];
  /** "hoy", "esta semana", "hace un mes". Texto: el Cliente no sabe la fecha. */
  desdeCuando: string;
  senales: readonly SenalDeFalla[];
  /**
   * La Especialidad que el sistema propuso. `null` cuando no se atrevió.
   *
   * Es una SUGERENCIA guardada, no la Especialidad del trabajo: esa es de la
   * Línea de servicio (ADR 0001) y todavía no existe. Se conserva para poder
   * medir después si el intérprete acierta.
   */
  especialidadSugerida: Especialidad | null;
  /** Si quien recibió cambió la sugerencia a mano. */
  sugerenciaCorregida: boolean;
  /** El orden en que el Cliente las dijo. La primera suele ser la que duele. */
  posicion: number;
}

export interface LineaServicio extends Registro {
  ordenId: string;
  descripcion: string;
  /** La Especialidad vive acá y no en la Orden (ADR 0001). */
  especialidad: Especialidad;
  /** El Pagador también es de la Línea, no de la Orden (ADR 0002). */
  pagador: Pagador;
  horasFacturadas: number;
  horasReales: number;
  monto: number;
  /** Declinada: conserva motivo y monto, y reaparece en la próxima Visita. */
  declinadaEn: number | string;
  motivoDeclinacion: string | null;
}

/** Se autoriza trabajo por trabajo, no la Orden completa (ADR 0007). */
export interface Autorizacion extends Registro {
  lineaId: string;
  autorizadaPor: string;
  medio: MedioDeAviso;
  autorizadaEn: string;
}

/** Hecho registrado, no el mensaje: el mensaje viaja fuera (ADR 0009). */
export interface AvisoDeListo extends Registro {
  ordenId: string;
  avisadoA: string;
  medio: MedioDeAviso;
  avisadoEn: string;
}

/** Pertenece a la Orden, no a la Línea: muestra cómo entró el carro. */
export interface Foto extends Registro {
  ordenId: string;
  blob: Blob;
  tomadaEn: string;
}

/**
 * La costura de sincronización. Se llena desde el día uno y nadie la drena:
 * es la prueba de que la operación quedó registrada aunque no haya servidor.
 *
 * `++secuencia` es autoincremental a propósito. El orden de reenvío NO puede
 * salir de `Date.now()`: el reloj de pared puede retroceder, NTP lo escalona y
 * el usuario lo cambia a mano. Un contador que se incrementa dentro de la
 * misma transacción que la escritura es monótono por construcción.
 */
export interface OperacionPendiente {
  secuencia?: number;
  id: string;
  tallerId: string;
  entidad: string;
  entidadId: string;
  operacion: 'crear' | 'actualizar' | 'borrar';
  /** El cambio de campos, no el objeto entero: dos personas editando campos
      distintos de la misma Orden dejan de ser un conflicto. */
  cambios: Record<string, unknown>;
  creadoEn: string;
}

export class BitacoraDb extends Dexie {
  talleres!: EntityTable<Taller, 'id'>;
  tarifas!: EntityTable<Tarifa, 'id'>;
  puestos!: EntityTable<Puesto, 'id'>;
  personas!: EntityTable<Persona, 'id'>;
  clientes!: EntityTable<Cliente, 'id'>;
  vehiculos!: EntityTable<Vehiculo, 'id'>;
  vehiculoPlacas!: EntityTable<VehiculoPlaca, 'id'>;
  propiedades!: EntityTable<Propiedad, 'id'>;
  ordenes!: EntityTable<Orden, 'id'>;
  reportes!: EntityTable<ReporteDelCliente, 'id'>;
  lineas!: EntityTable<LineaServicio, 'id'>;
  autorizaciones!: EntityTable<Autorizacion, 'id'>;
  avisos!: EntityTable<AvisoDeListo, 'id'>;
  fotos!: EntityTable<Foto, 'id'>;
  pendientes!: EntityTable<OperacionPendiente, 'secuencia'>;

  constructor(nombre = 'bitacora') {
    super(nombre);

    /* Todos los índices compuestos van LIDERADOS POR `tallerId`. Cambiar ese
       orden después es una migración de todas las bases locales, y las
       consultas dependen de las partes iniciales del índice. */
    this.version(1).stores({
      talleres: 'id, nombre',
      tarifas: 'id, tallerId, [tallerId+borradoEn], [tallerId+especialidad]',
      puestos: 'id, tallerId, [tallerId+borradoEn], [tallerId+letra]',
      personas: 'id, tallerId, [tallerId+borradoEn], [tallerId+papel]',
      clientes: 'id, tallerId, [tallerId+borradoEn], nombre, telefono',

      vehiculos:
        'id, tallerId, [tallerId+borradoEn], vin, canonicoId, fusionadoEn',

      // `[vehiculoId+vigenteHasta]` resuelve "¿cuál es la placa vigente?" con
      // una búsqueda de rango contra el centinela.
      vehiculoPlacas:
        'id, tallerId, vehiculoId, [tallerId+placa], [vehiculoId+vigenteHasta]',

      propiedades: 'id, tallerId, [vehiculoId+hasta], [clienteId+hasta]',

      ordenes:
        'id, tallerId, vehiculoId, clienteId, folio, [tallerId+borradoEn], [tallerId+estado], [tallerId+actualizadoEn]',

      lineas:
        'id, tallerId, ordenId, [ordenId+borradoEn], [ordenId+especialidad], [tallerId+declinadaEn]',

      autorizaciones: 'id, tallerId, lineaId',
      avisos: 'id, tallerId, ordenId',
      fotos: 'id, tallerId, ordenId',

      pendientes: '++secuencia, id, tallerId, entidad, entidadId, creadoEn',
    });

    /* La versión 2 añade el Reporte del Cliente y el estado de entrada.
       Los campos nuevos de `ordenes` NO se declaran acá: Dexie solo lleva
       índices, no columnas, y ninguno de los cuatro se consulta por índice.
       Lo que sí hace falta es el `upgrade`, porque una base creada con la v1
       tiene Órdenes sin esos campos, y `undefined` viajaría tal cual a la cola
       de sincronización el día que exista servidor. */
    this.version(2)
      .stores({
        reportes: 'id, tallerId, ordenId, [ordenId+borradoEn]',
      })
      .upgrade((tx) =>
        tx
          .table<Orden>('ordenes')
          .toCollection()
          .modify((orden) => {
            orden.odometro ??= null;
            orden.combustible ??= null;
            orden.danosPrevios ??= '';
            orden.objetosDentro ??= '';
          }),
      );

    /* La versión 3 añade los datos impresos del Taller. Ningún índice nuevo
       —no se consulta un Taller por su teléfono—, así que solo hace falta
       rellenar el que ya exista: `undefined` viajaría tal cual a la cola de
       sincronización el día que haya servidor. */
    this.version(3).upgrade((tx) =>
      tx
        .table<Taller>('talleres')
        .toCollection()
        .modify((taller) => {
          taller.telefono ??= '';
          taller.direccion ??= '';
          taller.cedulaJuridica ??= '';
        }),
    );
  }
}
