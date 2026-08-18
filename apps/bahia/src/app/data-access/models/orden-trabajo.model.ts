export type EstadoOrden =
  'Ingresado' | 'Diagnostico' | 'Reparacion' | 'Listo' | 'Entregado';

export const ESTADOS_ORDEN: EstadoOrden[] = [
  'Ingresado',
  'Diagnostico',
  'Reparacion',
  'Listo',
  'Entregado',
];

export const ESTADO_ORDEN_LABEL: Record<EstadoOrden, string> = {
  Ingresado: 'Ingresado',
  Diagnostico: 'En diagnóstico',
  Reparacion: 'En reparación',
  Listo: 'Listo',
  Entregado: 'Entregado',
};

// Único lugar que sabe "qué sigue" en el pipeline — el tablero kanban y la
// ficha de cada orden lo consultan para no duplicar la secuencia.
export function siguienteEstado(estado: EstadoOrden): EstadoOrden | undefined {
  return ESTADOS_ORDEN[ESTADOS_ORDEN.indexOf(estado) + 1];
}

export interface OrdenTrabajo {
  id: string;
  numero: string;
  tallerId: string;
  clienteId: string;
  vehiculoId: string;
  estado: EstadoOrden;
  // Kilometraje registrado en el ingreso de esta orden — no vive en Vehiculo
  // porque cambia en cada visita.
  kilometraje: number;
  motivoIngreso: string;
  origenMotivo: 'voz' | 'texto';
  fechaIngreso: string;
  // Hallazgos del mecánico — se llena en la etapa "En diagnóstico" (ver
  // ticket "Autenticación para la demo": permiso `diagnosticar` → editar
  // diagnóstico). Ausente en órdenes que todavía no pasaron por ahí.
  diagnostico?: string;
}

// "OT-0001", "OT-0002"... — el siguiente número disponible a partir de las
// órdenes ya existentes (no un contador aparte, para no desincronizarse).
export function siguienteNumeroOrden(ordenes: OrdenTrabajo[]): string {
  const maxActual = ordenes.reduce((max, orden) => {
    const coincidencia = /^OT-(\d+)$/.exec(orden.numero);
    const numero = coincidencia ? Number(coincidencia[1]) : 0;
    return Math.max(max, numero);
  }, 0);
  return `OT-${String(maxActual + 1).padStart(4, '0')}`;
}
