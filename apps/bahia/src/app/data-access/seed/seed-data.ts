// Datos semilla curados a mano (ver ticket "Diseñar la capa de datos en
// memoria para la demo") — no generados con faker, por profesionalismo al
// mostrar la demo a dueños de taller reales y por reproducibilidad.
//
// Cubren los 5 estados del kanban (Ingresado → Entregado) y un vehículo
// (vehiculo-1, de María Fernández) con dos órdenes — una entregada en el
// pasado y una activa hoy — para demostrar en vivo "cliente recurrente".
import { Cliente } from '../models/cliente.model';
import { Factura } from '../models/factura.model';
import { OrdenTrabajo } from '../models/orden-trabajo.model';
import { Taller } from '../models/taller.model';
import { Usuario } from '../models/usuario.model';
import { Vehiculo } from '../models/vehiculo.model';

export const SEED_TALLER: Taller = {
  id: 'taller-1',
  nombre: 'Taller Bahía Centro',
  direccion: 'Av. de los Mecánicos 145, Zona Industrial',
};

export const SEED_USUARIOS: Usuario[] = [
  {
    id: 'usuario-1',
    tallerId: 'taller-1',
    nombre: 'Ana Torres',
    puesto: 'Recepción',
    permisos: ['recibir'],
  },
  {
    id: 'usuario-2',
    tallerId: 'taller-1',
    nombre: 'Luis Medina',
    puesto: 'Mecánico',
    permisos: ['diagnosticar'],
  },
  {
    id: 'usuario-3',
    tallerId: 'taller-1',
    nombre: 'Carla Rojas',
    puesto: 'Administración',
    permisos: ['recibir', 'diagnosticar', 'facturar', 'ver_reportes'],
  },
];

export const SEED_CLIENTES: Cliente[] = [
  { id: 'cliente-1', nombre: 'María Fernández', telefono: '555-0142' },
  { id: 'cliente-2', nombre: 'Jorge Salinas', telefono: '555-0198' },
  { id: 'cliente-3', nombre: 'Diana Paredes', telefono: '555-0163' },
  { id: 'cliente-4', nombre: 'Roberto Núñez', telefono: '555-0177' },
];

export const SEED_VEHICULOS: Vehiculo[] = [
  {
    id: 'vehiculo-1',
    clienteId: 'cliente-1',
    placa: 'PBH-3321',
    marca: 'Toyota',
    modelo: 'Corolla',
    anio: 2018,
  },
  {
    id: 'vehiculo-2',
    clienteId: 'cliente-2',
    placa: 'JLB-2290',
    marca: 'Nissan',
    modelo: 'Sentra',
    anio: 2020,
  },
  {
    id: 'vehiculo-3',
    clienteId: 'cliente-3',
    placa: 'RTS-4415',
    marca: 'Chevrolet',
    modelo: 'Aveo',
    anio: 2016,
  },
  {
    id: 'vehiculo-4',
    clienteId: 'cliente-4',
    placa: 'KDM-8827',
    marca: 'Kia',
    modelo: 'Rio',
    anio: 2021,
  },
];

export const SEED_ORDENES: OrdenTrabajo[] = [
  {
    id: 'orden-1',
    numero: 'OT-A1-0140',
    tallerId: 'taller-1',
    clienteId: 'cliente-1',
    vehiculoId: 'vehiculo-1',
    estado: 'Entregado',
    kilometraje: 81200,
    motivoIngreso: 'Cambio de aceite y filtros',
    origenMotivo: 'texto',
    fechaIngreso: '2026-05-12T09:30:00',
    diagnostico: 'Aceite y filtro visiblemente vencidos, sin daño adicional.',
  },
  {
    id: 'orden-2',
    numero: 'OT-A1-0148',
    tallerId: 'taller-1',
    clienteId: 'cliente-1',
    vehiculoId: 'vehiculo-1',
    estado: 'Diagnostico',
    kilometraje: 84500,
    motivoIngreso: 'Ruido metálico al frenar y cambio de aceite atrasado',
    origenMotivo: 'voz',
    fechaIngreso: '2026-08-01T08:14:00',
  },
  {
    id: 'orden-3',
    numero: 'OT-A1-0151',
    tallerId: 'taller-1',
    clienteId: 'cliente-2',
    vehiculoId: 'vehiculo-2',
    estado: 'Ingresado',
    kilometraje: 45300,
    motivoIngreso: 'Falla eléctrica intermitente en luces delanteras',
    origenMotivo: 'texto',
    fechaIngreso: '2026-08-01T10:05:00',
  },
  {
    id: 'orden-4',
    numero: 'OT-A1-0152',
    tallerId: 'taller-1',
    clienteId: 'cliente-3',
    vehiculoId: 'vehiculo-3',
    estado: 'Reparacion',
    kilometraje: 102300,
    motivoIngreso: 'Cambio de balatas y disco delantero derecho',
    origenMotivo: 'texto',
    fechaIngreso: '2026-07-30T11:20:00',
    diagnostico:
      'Balatas delanteras al 10% y disco derecho con rayado profundo — requiere reemplazo de ambos.',
  },
  {
    id: 'orden-5',
    numero: 'OT-A1-0153',
    tallerId: 'taller-1',
    clienteId: 'cliente-4',
    vehiculoId: 'vehiculo-4',
    estado: 'Listo',
    kilometraje: 28950,
    motivoIngreso: 'Revisión de sistema de frenos',
    origenMotivo: 'texto',
    fechaIngreso: '2026-07-29T15:45:00',
    diagnostico: 'Sistema de frenos dentro de parámetros — solo ajuste menor.',
  },
];

// Ver issue #11 (reapertura de alcance: facturar/ver_reportes). Solo
// orden-1 (OT-A1-0140) ya está "Entregado" desde el seed, así que es la
// única que puede tener una factura — sirve para que "ver_reportes"
// muestre datos reales desde el primer arranque, sin depender de que
// alguien facture algo en vivo primero.
export const SEED_FACTURAS: Factura[] = [
  {
    id: 'factura-1',
    ordenId: 'orden-1',
    numero: 'FA-A1-0001',
    fecha: '2026-05-12T12:00:00',
    conceptos: [
      { descripcion: 'Cambio de aceite sintético', monto: 450 },
      { descripcion: 'Filtro de aceite', monto: 120 },
      { descripcion: 'Mano de obra', monto: 200 },
    ],
  },
];
