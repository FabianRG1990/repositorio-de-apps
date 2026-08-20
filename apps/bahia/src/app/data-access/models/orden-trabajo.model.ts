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

// "OT-A1-0001", "OT-A1-0002"... — el folio lleva el código del puesto que lo
// acuñó, y cada puesto lleva su propia serie.
//
// Antes era un consecutivo único calculado sobre TODAS las órdenes locales, y
// eso producía folios repetidos: dos puestos sin conexión veían el mismo
// máximo y acuñaban el mismo número. El folio va impreso en la factura, así
// que no es un id interno que se pueda renumerar en silencio (issue #46).
//
// Al mirar solo los folios del propio puesto, la unicidad deja de depender de
// que los puestos se coordinen — que es exactamente lo que no pueden hacer
// estando offline.
export function siguienteNumeroOrden(
  ordenes: OrdenTrabajo[],
  codigoPuesto: string,
): string {
  const patron = new RegExp(`^OT-${codigoPuesto}-(\\d+)$`);
  const maxActual = ordenes.reduce((max, orden) => {
    const coincidencia = patron.exec(orden.numero);
    const numero = coincidencia ? Number(coincidencia[1]) : 0;
    return Math.max(max, numero);
  }, 0);
  return `OT-${codigoPuesto}-${String(maxActual + 1).padStart(4, '0')}`;
}
