import { Component, computed, inject } from '@angular/core';
import { Cliente } from '../data-access/models/cliente.model';
import {
  Concepto,
  Factura,
  siguienteNumeroFactura,
} from '../data-access/models/factura.model';
import { getCodigoPuesto } from '../data-access/persistence/bahia-db';
import {
  EstadoOrden,
  ESTADOS_ORDEN,
  ESTADO_ORDEN_LABEL,
  OrdenTrabajo,
  siguienteEstado,
} from '../data-access/models/orden-trabajo.model';
import { Vehiculo } from '../data-access/models/vehiculo.model';
import { ClientesStore } from '../data-access/stores/clientes.store';
import { FacturasStore } from '../data-access/stores/facturas.store';
import { OrdenesStore } from '../data-access/stores/ordenes.store';
import { SesionStore } from '../data-access/stores/sesion.store';
import { TalleresStore } from '../data-access/stores/talleres.store';
import { VehiculosStore } from '../data-access/stores/vehiculos.store';
import { TicketCard } from './ticket-card';

interface OrdenConDetalle {
  orden: OrdenTrabajo;
  cliente: Cliente | undefined;
  vehiculo: Vehiculo | undefined;
  visitasPrevias: number;
  factura: Factura | undefined;
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
  private readonly facturasStore = inject(FacturasStore);
  private readonly sesionStore = inject(SesionStore);
  private readonly talleresStore = inject(TalleresStore);

  protected readonly puedeDiagnosticar = computed(() =>
    this.sesionStore.tienePermiso('diagnosticar'),
  );

  // Además del permiso del usuario, la función debe estar habilitada en la
  // configuración del taller (ver issue #13) — desactivarla no oculta
  // facturas ya guardadas (TicketCard las sigue mostrando vía `factura()`),
  // solo bloquea crear una nueva.
  protected readonly puedeFacturar = computed(
    () =>
      this.sesionStore.tienePermiso('facturar') &&
      this.talleresStore.configuracion().facturarHabilitado,
  );

  // Ningún permiso de Usuario.permisos se pensó para "mover el pipeline" en
  // general — el ticket de autenticación solo gatea recibir/diagnosticar.
  // Se reusa `diagnosticar` como aproximación razonable (en la práctica
  // habilita a mecánico/administración, bloquea a recepción, que en la
  // vida real solo hace el ingreso). Un sistema real probablemente
  // querría un permiso propio por transición (reparar, entregar...).
  protected readonly puedeAvanzar = computed(() =>
    this.sesionStore.tienePermiso('diagnosticar'),
  );

  // Los stores resuelven contra IndexedDB de forma independiente y no
  // necesariamente al mismo tiempo — sin esto, la primera pintura podía
  // mostrar la ficha con el cliente/vehículo todavía en blanco hasta que
  // esos stores terminaran de cargar.
  protected readonly cargando = computed(
    () =>
      !this.ordenesStore.cargado() ||
      !this.clientesStore.cargado() ||
      !this.vehiculosStore.cargado() ||
      !this.facturasStore.cargado(),
  );

  private readonly ordenesConDetalle = computed<OrdenConDetalle[]>(() => {
    const ordenes = this.ordenesStore.entities();
    const clientesPorId = this.clientesStore.entityMap();
    const vehiculosPorId = this.vehiculosStore.entityMap();
    const facturaPorOrdenId = new Map(
      this.facturasStore
        .entities()
        .map((factura) => [factura.ordenId, factura]),
    );

    return ordenes.map((orden) => ({
      orden,
      cliente: clientesPorId[orden.clienteId],
      vehiculo: vehiculosPorId[orden.vehiculoId],
      visitasPrevias: ordenes.filter(
        (otra) => otra.vehiculoId === orden.vehiculoId && otra.id !== orden.id,
      ).length,
      factura: facturaPorOrdenId.get(orden.id),
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

  protected guardarDiagnostico(orden: OrdenTrabajo, diagnostico: string): void {
    this.ordenesStore.guardarDiagnostico({ id: orden.id, diagnostico });
  }

  // `async` porque el código del puesto vive en la base local (ver issue #46).
  protected async guardarFactura(
    orden: OrdenTrabajo,
    conceptos: Concepto[],
  ): Promise<void> {
    const codigoPuesto = await getCodigoPuesto();

    this.facturasStore.crear({
      ordenId: orden.id,
      numero: siguienteNumeroFactura(
        this.facturasStore.entities(),
        codigoPuesto,
      ),
      fecha: new Date().toISOString(),
      conceptos,
    });
  }
}
