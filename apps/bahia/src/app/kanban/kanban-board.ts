import { Component, computed, inject } from '@angular/core';
import { Cliente } from '../data-access/models/cliente.model';
import {
  EstadoOrden,
  ESTADOS_ORDEN,
  ESTADO_ORDEN_LABEL,
  OrdenTrabajo,
  siguienteEstado,
} from '../data-access/models/orden-trabajo.model';
import { Vehiculo } from '../data-access/models/vehiculo.model';
import { ClientesStore } from '../data-access/stores/clientes.store';
import { OrdenesStore } from '../data-access/stores/ordenes.store';
import { VehiculosStore } from '../data-access/stores/vehiculos.store';
import { TicketCard } from './ticket-card';

interface OrdenConDetalle {
  orden: OrdenTrabajo;
  cliente: Cliente | undefined;
  vehiculo: Vehiculo | undefined;
  visitasPrevias: number;
}

interface Columna {
  estado: EstadoOrden;
  label: string;
  ordenes: OrdenConDetalle[];
}

@Component({
  selector: 'app-kanban-board',
  templateUrl: './kanban-board.html',
  styleUrl: './kanban-board.scss',
  imports: [TicketCard],
})
export class KanbanBoard {
  private readonly ordenesStore = inject(OrdenesStore);
  private readonly clientesStore = inject(ClientesStore);
  private readonly vehiculosStore = inject(VehiculosStore);

  // Los 3 stores resuelven contra IndexedDB de forma independiente y no
  // necesariamente al mismo tiempo — sin esto, la primera pintura podía
  // mostrar la ficha con el cliente/vehículo todavía en blanco hasta que
  // esos dos stores terminaran de cargar.
  protected readonly cargando = computed(
    () =>
      !this.ordenesStore.cargado() ||
      !this.clientesStore.cargado() ||
      !this.vehiculosStore.cargado(),
  );

  private readonly ordenesConDetalle = computed<OrdenConDetalle[]>(() => {
    const ordenes = this.ordenesStore.entities();
    const clientesPorId = this.clientesStore.entityMap();
    const vehiculosPorId = this.vehiculosStore.entityMap();

    return ordenes.map((orden) => ({
      orden,
      cliente: clientesPorId[orden.clienteId],
      vehiculo: vehiculosPorId[orden.vehiculoId],
      visitasPrevias: ordenes.filter(
        (otra) => otra.vehiculoId === orden.vehiculoId && otra.id !== orden.id,
      ).length,
    }));
  });

  protected readonly columnas = computed<Columna[]>(() => {
    const detalle = this.ordenesConDetalle();
    return ESTADOS_ORDEN.map((estado) => ({
      estado,
      label: ESTADO_ORDEN_LABEL[estado],
      ordenes: detalle.filter((item) => item.orden.estado === estado),
    }));
  });

  protected avanzarEstado(orden: OrdenTrabajo): void {
    const siguiente = siguienteEstado(orden.estado);
    if (siguiente) {
      this.ordenesStore.cambiarEstado({ id: orden.id, estado: siguiente });
    }
  }
}
