// PROTOTYPE — datos de muestra curados a mano para evaluar tokens de diseño. Descartable.

export type EstadoOrden =
  | 'Ingresado'
  | 'Diagnostico'
  | 'Reparacion'
  | 'Listo'
  | 'Entregado';

export interface OrdenMock {
  numero: string;
  estado: EstadoOrden;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  clienteNombre: string;
  visitasPrevias: number;
  motivoIngreso: string;
  origenMotivo: 'voz' | 'texto';
  fechaIngreso: string;
}

export const ORDEN_MOCK: OrdenMock = {
  numero: 'OT-0148',
  estado: 'Diagnostico',
  placa: 'PBH-3321',
  marca: 'Toyota',
  modelo: 'Corolla',
  anio: 2018,
  kilometraje: 84500,
  clienteNombre: 'María Fernández',
  visitasPrevias: 3,
  motivoIngreso: 'Ruido metálico al frenar y cambio de aceite atrasado',
  origenMotivo: 'voz',
  fechaIngreso: '2026-08-01T08:14:00',
};

export const ESTADOS_ORDEN: EstadoOrden[] = [
  'Ingresado',
  'Diagnostico',
  'Reparacion',
  'Listo',
  'Entregado',
];

export const ESTADO_LABEL: Record<EstadoOrden, string> = {
  Ingresado: 'Ingresado',
  Diagnostico: 'En diagnóstico',
  Reparacion: 'En reparación',
  Listo: 'Listo',
  Entregado: 'Entregado',
};
