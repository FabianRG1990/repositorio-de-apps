import {
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Cliente } from '../data-access/models/cliente.model';
import {
  Concepto,
  Factura,
  totalFactura,
} from '../data-access/models/factura.model';
import {
  ESTADOS_ORDEN,
  ESTADO_ORDEN_LABEL,
  OrdenTrabajo,
  siguienteEstado,
} from '../data-access/models/orden-trabajo.model';
import { Vehiculo } from '../data-access/models/vehiculo.model';

// Ficha de orden de trabajo — variante C ganadora del prototipo de tokens de
// diseño ("ficha técnica + stepper de pipeline", ver rama
// prototype/bahia-design-tokens). Adaptada aquí a las entidades reales
// (antes tomaba un solo objeto mock aplanado); cliente/vehículo llegan ya
// resueltos porque el tablero es quien conoce ambos stores.
@Component({
  selector: 'app-ticket-card',
  templateUrl: './ticket-card.html',
  styleUrl: './ticket-card.scss',
  imports: [DecimalPipe, CurrencyPipe],
})
export class TicketCard {
  orden = input.required<OrdenTrabajo>();
  cliente = input<Cliente>();
  vehiculo = input<Vehiculo>();
  visitasPrevias = input(0);
  // Si el usuario en sesión tiene el permiso `diagnosticar`/`facturar` — lo
  // decide KanbanBoard, esta ficha no conoce SesionStore.
  puedeDiagnosticar = input(false);
  puedeAvanzar = input(false);
  puedeFacturar = input(false);
  factura = input<Factura>();
  avanzar = output<void>();
  guardarDiagnostico = output<string>();
  guardarFactura = output<Concepto[]>();

  // Buffer editable, independiente del diagnóstico ya guardado — se
  // resincroniza solo si `orden` cambia de identidad (p. ej. al guardar).
  protected readonly diagnosticoEditado = linkedSignal(
    () => this.orden().diagnostico ?? '',
  );

  protected readonly etapas = computed(() => {
    const actualIndex = ESTADOS_ORDEN.indexOf(this.orden().estado);
    return ESTADOS_ORDEN.map((clave, i) => ({
      clave,
      label: ESTADO_ORDEN_LABEL[clave],
      actual: i === actualIndex,
      pasado: i < actualIndex,
    }));
  });

  protected readonly siguienteEstadoLabel = computed(() => {
    const siguiente = siguienteEstado(this.orden().estado);
    return siguiente ? ESTADO_ORDEN_LABEL[siguiente] : undefined;
  });

  protected readonly puedeAvanzarAhora = computed(
    () => this.puedeAvanzar() && this.siguienteEstadoLabel() !== undefined,
  );

  // El diagnóstico se redacta mientras la orden está en esa etapa; una vez
  // que avanza, queda como registro de solo lectura.
  protected readonly editandoDiagnostico = computed(
    () => this.puedeDiagnosticar() && this.orden().estado === 'Diagnostico',
  );

  protected onDiagnosticoInput(event: Event): void {
    this.diagnosticoEditado.set((event.target as HTMLTextAreaElement).value);
  }

  protected enviarDiagnostico(): void {
    const texto = this.diagnosticoEditado().trim();
    if (texto) {
      this.guardarDiagnostico.emit(texto);
    }
  }

  // Solo se puede facturar una vez "Entregado", y solo mientras no exista
  // ya una factura para esta orden — una vez guardada queda fija (ver
  // issue #11), no hay flujo de edición posterior.
  protected readonly editandoFactura = computed(
    () =>
      this.puedeFacturar() &&
      this.orden().estado === 'Entregado' &&
      !this.factura(),
  );

  protected readonly conceptosEnEdicion = signal<Concepto[]>([]);
  protected readonly nuevaDescripcion = signal('');
  protected readonly nuevoMonto = signal<number | null>(null);

  protected readonly totalEnEdicion = computed(() =>
    this.conceptosEnEdicion().reduce((suma, c) => suma + c.monto, 0),
  );

  protected readonly totalFacturaGuardada = computed(() => {
    const factura = this.factura();
    return factura ? totalFactura(factura) : 0;
  });

  protected onNuevaDescripcionInput(event: Event): void {
    this.nuevaDescripcion.set((event.target as HTMLInputElement).value);
  }

  protected onNuevoMontoInput(event: Event): void {
    const valor = (event.target as HTMLInputElement).valueAsNumber;
    this.nuevoMonto.set(Number.isNaN(valor) ? null : valor);
  }

  protected agregarConcepto(): void {
    const descripcion = this.nuevaDescripcion().trim();
    const monto = this.nuevoMonto();
    if (!descripcion || !monto || monto <= 0) return;

    this.conceptosEnEdicion.update((conceptos) => [
      ...conceptos,
      { descripcion, monto },
    ]);
    this.nuevaDescripcion.set('');
    this.nuevoMonto.set(null);
  }

  protected quitarConcepto(indice: number): void {
    this.conceptosEnEdicion.update((conceptos) =>
      conceptos.filter((_, i) => i !== indice),
    );
  }

  protected enviarFactura(): void {
    if (this.conceptosEnEdicion().length === 0) return;
    this.guardarFactura.emit(this.conceptosEnEdicion());
    this.conceptosEnEdicion.set([]);
  }
}
