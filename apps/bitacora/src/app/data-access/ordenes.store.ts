import { Injectable, computed, signal } from '@angular/core';

export type TonoEstado = 'ok' | 'espera' | 'riesgo';
export type ClaveEspecialidad = 'mecanica' | 'electricidad' | 'pintura';

export interface LineaServicio {
  readonly descripcion: string;
  readonly especialidad: ClaveEspecialidad;
  readonly horas: number;
}

export interface Orden {
  readonly folio: string;
  readonly placa: string;
  readonly vehiculo: string;
  readonly cliente: string;
  readonly estado: string;
  readonly tono: TonoEstado;
  /** Horas desde que el Vehículo entró. Es el criterio de orden (ADR 0003). */
  readonly tiempoParado: number;
  readonly detalle: string;
  readonly lineas: readonly LineaServicio[];
}

/* Datos sembrados, los mismos del prototipo de temas. Las placas ticas van con
   formato variado a propósito: #35 concluyó que NO se valida con regexp. */
const SEMILLA: readonly Orden[] = [
  {
    folio: 'A1-2418',
    placa: '863 549',
    vehiculo: 'Toyota Hilux 2019',
    cliente: 'Marielos Quesada',
    estado: 'Esperando repuesto',
    tono: 'riesgo',
    tiempoParado: 52,
    detalle: 'Bomba de agua pedida a San José — sin fecha de llegada',
    lineas: [
      { descripcion: 'Cambio de bomba de agua', especialidad: 'mecanica', horas: 4 },
      { descripcion: 'Purga del sistema', especialidad: 'mecanica', horas: 1 },
    ],
  },
  {
    folio: 'A1-2420',
    placa: 'TSJ 1204',
    vehiculo: 'Hyundai Elantra 2018',
    cliente: 'Taxis Los Yoses',
    estado: 'En proceso',
    tono: 'espera',
    tiempoParado: 28,
    detalle: 'Guardabarros derecho, segunda mano de color',
    lineas: [
      { descripcion: 'Guardabarros derecho', especialidad: 'pintura', horas: 6 },
    ],
  },
  {
    folio: 'A1-2419',
    placa: '742 118',
    vehiculo: 'Nissan Frontier 2021',
    cliente: 'Rodrigo Vargas',
    estado: 'En diagnóstico',
    tono: 'espera',
    tiempoParado: 6,
    detalle: 'Alternador no carga en frío',
    lineas: [
      { descripcion: 'Diagnóstico de carga', especialidad: 'electricidad', horas: 2 },
    ],
  },
  {
    folio: 'A1-2421',
    placa: '905 733',
    vehiculo: 'Suzuki Swift 2022',
    cliente: 'Ana Lucía Brenes',
    estado: 'Listo para entrega',
    tono: 'ok',
    tiempoParado: 3,
    detalle: 'Avisado por WhatsApp hace 1 h',
    lineas: [
      { descripcion: 'Cambio de pastillas', especialidad: 'mecanica', horas: 1.5 },
    ],
  },
];

/**
 * Store en memoria mientras el esquema Dexie de #74 no exista. La forma de la
 * API —señales de solo lectura hacia afuera, mutación por métodos— es la que
 * ese ticket tiene que conservar al cambiar el respaldo.
 */
@Injectable({ providedIn: 'root' })
export class OrdenesStore {
  readonly #ordenes = signal<readonly Orden[]>(SEMILLA);
  readonly #folioSeleccionado = signal<string | null>(null);

  /** Arriba lo que más duele: el tablero ordena por Tiempo parado. */
  readonly ordenes = computed(() =>
    [...this.#ordenes()].sort((a, b) => b.tiempoParado - a.tiempoParado),
  );

  readonly folioSeleccionado = this.#folioSeleccionado.asReadonly();

  readonly seleccionada = computed(
    () =>
      this.#ordenes().find((o) => o.folio === this.#folioSeleccionado()) ?? null,
  );

  seleccionar(folio: string) {
    this.#folioSeleccionado.update((actual) =>
      actual === folio ? null : folio,
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
