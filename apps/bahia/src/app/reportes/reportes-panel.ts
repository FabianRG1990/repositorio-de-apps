import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { totalFactura } from '../data-access/models/factura.model';
import {
  ESTADOS_ORDEN,
  ESTADO_ORDEN_LABEL,
} from '../data-access/models/orden-trabajo.model';
import { ClientesStore } from '../data-access/stores/clientes.store';
import { FacturasStore } from '../data-access/stores/facturas.store';
import { OrdenesStore } from '../data-access/stores/ordenes.store';
import { VehiculosStore } from '../data-access/stores/vehiculos.store';

// Rango abierto (desde/hasta vacíos) = sin límite en ese extremo — se ve
// igual que sin filtro, tal como se decidió en el issue #11.
function dentroDeRango(fechaIso: string, desde: string, hasta: string): boolean {
  const fecha = new Date(fechaIso).getTime();
  if (desde && fecha < new Date(desde).getTime()) return false;
  if (hasta && fecha > new Date(`${hasta}T23:59:59.999`).getTime()) return false;
  return true;
}

@Component({
  selector: 'app-reportes-panel',
  templateUrl: './reportes-panel.html',
  styleUrl: './reportes-panel.scss',
  imports: [CurrencyPipe],
})
export class ReportesPanel {
  private readonly ordenesStore = inject(OrdenesStore);
  private readonly facturasStore = inject(FacturasStore);
  private readonly vehiculosStore = inject(VehiculosStore);
  private readonly clientesStore = inject(ClientesStore);

  protected readonly cargando = computed(
    () =>
      !this.ordenesStore.cargado() ||
      !this.facturasStore.cargado() ||
      !this.vehiculosStore.cargado() ||
      !this.clientesStore.cargado(),
  );

  protected readonly abierto = signal(false);
  protected readonly fechaDesde = signal('');
  protected readonly fechaHasta = signal('');

  private readonly ordenesFiltradas = computed(() =>
    this.ordenesStore
      .entities()
      .filter((orden) =>
        dentroDeRango(orden.fechaIngreso, this.fechaDesde(), this.fechaHasta()),
      ),
  );

  private readonly facturasFiltradas = computed(() =>
    this.facturasStore
      .entities()
      .filter((factura) =>
        dentroDeRango(factura.fecha, this.fechaDesde(), this.fechaHasta()),
      ),
  );

  protected readonly conteoPorEstado = computed(() => {
    const ordenes = this.ordenesFiltradas();
    return ESTADOS_ORDEN.map((estado) => ({
      estado,
      label: ESTADO_ORDEN_LABEL[estado],
      conteo: ordenes.filter((orden) => orden.estado === estado).length,
    }));
  });

  protected readonly totalFacturado = computed(() =>
    this.facturasFiltradas().reduce(
      (suma, factura) => suma + totalFactura(factura),
      0,
    ),
  );

  // Puede haber empate — se listan todos los vehículos en el máximo, no
  // solo el primero.
  protected readonly vehiculosConMasVisitas = computed(() => {
    const conteoPorVehiculo = new Map<string, number>();
    for (const orden of this.ordenesFiltradas()) {
      conteoPorVehiculo.set(
        orden.vehiculoId,
        (conteoPorVehiculo.get(orden.vehiculoId) ?? 0) + 1,
      );
    }

    const maximo = Math.max(0, ...conteoPorVehiculo.values());
    if (maximo === 0) return [];

    const vehiculosPorId = this.vehiculosStore.entityMap();
    const clientesPorId = this.clientesStore.entityMap();

    return [...conteoPorVehiculo.entries()]
      .filter(([, conteo]) => conteo === maximo)
      .map(([vehiculoId, conteo]) => {
        const vehiculo = vehiculosPorId[vehiculoId];
        const cliente = vehiculo
          ? clientesPorId[vehiculo.clienteId]
          : undefined;
        return {
          label: vehiculo
            ? `${vehiculo.placa} — ${vehiculo.marca} ${vehiculo.modelo} (${cliente?.nombre ?? 'cliente desconocido'})`
            : 'Vehículo desconocido',
          conteo,
        };
      });
  });

  protected abrir(): void {
    if (this.cargando()) return;
    this.abierto.set(true);
  }

  protected cerrar(): void {
    this.abierto.set(false);
  }

  protected onFechaDesdeInput(event: Event): void {
    this.fechaDesde.set((event.target as HTMLInputElement).value);
  }

  protected onFechaHastaInput(event: Event): void {
    this.fechaHasta.set((event.target as HTMLInputElement).value);
  }

  protected limpiarFechas(): void {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
  }
}
