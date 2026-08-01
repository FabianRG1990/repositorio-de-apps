export type EstadoOrden =
  | 'Ingresado'
  | 'Diagnostico'
  | 'Reparacion'
  | 'Listo'
  | 'Entregado';

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
}
