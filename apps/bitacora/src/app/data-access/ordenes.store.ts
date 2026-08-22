import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { BitacoraDatos } from './db/bitacora-db';
import { ABIERTO, NO_BORRADO, type EstadoOrden } from './db/esquema';

export type TonoEstado = 'ok' | 'espera' | 'riesgo';
export type ClaveEspecialidad = 'mecanica' | 'electricidad' | 'pintura';

export interface LineaServicio {
  readonly descripcion: string;
  readonly especialidad: ClaveEspecialidad;
  readonly horas: number;
  readonly monto: number;
  /** Lo que el Taller recomendó y el Cliente no aprobó. Conserva su motivo. */
  readonly declinada: boolean;
  readonly motivoDeclinacion: string | null;
}

/** Lo que la pantalla necesita de una Orden, ya compuesto. */
export interface Orden {
  readonly folio: string;
  readonly placa: string;
  readonly vehiculo: string;
  readonly cliente: string;
  readonly estado: string;
  /** La clave del dominio, para filtrar. `estado` es la etiqueta que se lee. */
  readonly estadoClave: EstadoOrden;
  readonly tono: TonoEstado;
  /** Horas desde que el Vehículo entró. Es el criterio de orden (ADR 0003). */
  readonly tiempoParado: number;
  readonly detalle: string;
  readonly lineas: readonly LineaServicio[];
  /* Las Especialidades que toca la Orden, sin repetir y en orden fijo. Se
     derivan de las Líneas y no se guardan en la Orden: la Especialidad es de
     la Línea (ADR 0001), así que una Orden puede tocar tres. El prototipo
     mostraba una sola porque no tenía Líneas. */
  readonly especialidades: readonly ClaveEspecialidad[];
}

/* El orden en que salen los chips es fijo y no el de captura: si dependiera de
   qué Línea se escribió primero, dos Órdenes con el mismo trabajo pondrían los
   colores en distinto sitio y la lista dejaría de escanearse. */
const ORDEN_ESPECIALIDADES: readonly ClaveEspecialidad[] = [
  'mecanica',
  'electricidad',
  'pintura',
];

/* El estado es un dato del dominio; el tono y la etiqueta son presentación.
   Viven acá y no en la base para que cambiar cómo se ve un estado no sea una
   migración de todas las bases locales. */
const PRESENTACION: Record<
  EstadoOrden,
  { etiqueta: string; tono: TonoEstado }
> = {
  recibido: { etiqueta: 'Recibido', tono: 'espera' },
  diagnostico: { etiqueta: 'En diagnóstico', tono: 'espera' },
  'en-proceso': { etiqueta: 'En proceso', tono: 'espera' },
  'esperando-repuesto': { etiqueta: 'Esperando repuesto', tono: 'riesgo' },
  listo: { etiqueta: 'Listo para entrega', tono: 'ok' },
  entregado: { etiqueta: 'Entregado', tono: 'ok' },
};

/**
 * Las Órdenes que ve el tablero, compuestas desde la base.
 *
 * La API pública —`ordenes()`, `seleccionada()`, `seleccionar()`— es la misma
 * que cuando los datos vivían en memoria: ese era el trato al escribirla, y
 * este ticket es el que lo cobra. Ninguna plantilla cambió al mover el
 * respaldo.
 *
 * `liveQuery` re-emite cuando la base cambia, incluso desde otra pestaña, así
 * que la vista sigue al dato sin que nadie tenga que refrescar a mano.
 */
@Injectable({ providedIn: 'root' })
export class OrdenesStore {
  readonly #datos = inject(BitacoraDatos);
  readonly #folioSeleccionado = signal<string | null>(null);

  readonly #vista = toSignal(from(liveQuery(() => this.#componer())), {
    initialValue: [] as readonly Orden[],
  });

  /** Arriba lo que más duele: el tablero ordena por Tiempo parado. */
  readonly ordenes = computed(() =>
    [...this.#vista()].sort((a, b) => b.tiempoParado - a.tiempoParado),
  );

  readonly folioSeleccionado = this.#folioSeleccionado.asReadonly();

  /**
   * Lo que está físicamente en el Taller: todo lo no entregado.
   *
   * Lo Listo NO se va de acá. El carro terminado sigue ocupando espacio hasta
   * que el Cliente lo recoge —el glosario lo llama Vehículo sin recoger— y por
   * eso el tablero lo sigue señalando. "Por entregar" es una vista de lo
   * mismo, no una gaveta aparte.
   */
  readonly enElTaller = computed(() =>
    this.ordenes().filter((o) => o.estadoClave !== 'entregado'),
  );

  /** El trabajo terminó y el carro sigue ahí esperando a que lo recojan. */
  readonly porEntregar = computed(() =>
    this.ordenes().filter((o) => o.estadoClave === 'listo'),
  );

  /**
   * Lo que el Taller recomendó y el Cliente no aprobó.
   *
   * Se lista por LÍNEA y no por Orden: el trabajo declinado es de la Línea
   * (ADR 0002), así que una misma Orden puede tener una aprobada y otra
   * declinada, y agrupar por Orden escondería justo eso.
   */
  readonly declinadas = computed(() =>
    this.ordenes().flatMap((orden) =>
      orden.lineas
        .filter((linea) => linea.declinada)
        .map((linea) => ({ orden, linea })),
    ),
  );

  readonly seleccionada = computed(
    () =>
      this.#vista().find((o) => o.folio === this.#folioSeleccionado()) ?? null,
  );

  /**
   * Elegir una Orden. Es IDEMPOTENTE: volver a pulsar la misma no la
   * deselecciona.
   *
   * Antes hacía de interruptor, y el efecto era que pulsar dos veces la misma
   * fila vaciaba el panel de detalle y lo dejaba en "Elegí una Orden". Visto
   * desde la pantalla eso se lee como que la app dejó de responder, no como
   * que uno mismo la deseleccionó. Quitar la selección es un gesto aparte
   * —`limpiarSeleccion`—, no el mismo gesto repetido.
   */
  seleccionar(folio: string) {
    this.#folioSeleccionado.set(folio);
  }

  limpiarSeleccion() {
    this.#folioSeleccionado.set(null);
  }

  async #componer(): Promise<readonly Orden[]> {
    const { db, tallerId } = this.#datos;

    const ordenes = await db.ordenes
      .where('[tallerId+borradoEn]')
      .equals([tallerId, NO_BORRADO])
      .toArray();

    return Promise.all(
      ordenes.map(async (orden) => {
        const [vehiculo, cliente, placa, lineas] = await Promise.all([
          db.vehiculos.get(orden.vehiculoId),
          db.clientes.get(orden.clienteId),
          db.vehiculoPlacas
            .where('[vehiculoId+vigenteHasta]')
            .equals([orden.vehiculoId, ABIERTO])
            .first(),
          db.lineas
            .where('[ordenId+borradoEn]')
            .equals([orden.id, NO_BORRADO])
            .toArray(),
        ]);

        const presentacion = PRESENTACION[orden.estado];
        /* Lo declinado no cuenta como Especialidad tocada: nadie lo está
           trabajando, así que pintar su color en la fila diría que sí. */
        const tocadas = new Set(
          lineas
            .filter((l) => l.declinadaEn === NO_BORRADO)
            .map((l) => l.especialidad),
        );

        return {
          folio: orden.folio,
          placa: placa?.placa ?? '',
          vehiculo: [vehiculo?.marca, vehiculo?.modelo, vehiculo?.anio]
            .filter(Boolean)
            .join(' '),
          cliente: cliente?.nombre ?? '',
          estado: presentacion.etiqueta,
          estadoClave: orden.estado,
          tono: presentacion.tono,
          tiempoParado: Math.max(
            0,
            Math.round(
              (Date.now() - new Date(orden.recibidoEn).getTime()) / 3_600_000,
            ),
          ),
          detalle: orden.notas,
          lineas: lineas.map((l) => ({
            descripcion: l.descripcion,
            especialidad: l.especialidad,
            horas: l.horasFacturadas,
            monto: l.monto,
            declinada: l.declinadaEn !== NO_BORRADO,
            motivoDeclinacion: l.motivoDeclinacion,
          })),
          especialidades: ORDEN_ESPECIALIDADES.filter((e) => tocadas.has(e)),
        } satisfies Orden;
      }),
    );
  }
}

/** `52` → `2 d 4 h`. El tiempo parado se lee de un vistazo, no se calcula. */
export function tiempoParadoLegible(horas: number): string {
  if (horas < 24) return `${horas} h`;
  const dias = Math.floor(horas / 24);
  const resto = horas % 24;
  return resto ? `${dias} d ${resto} h` : `${dias} d`;
}

export const ETIQUETA_ESPECIALIDAD: Record<ClaveEspecialidad, string> = {
  mecanica: 'Mecánica',
  electricidad: 'Electricidad',
  pintura: 'Pintura',
};
