import {
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Cliente } from '../data-access/models/cliente.model';
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
  imports: [DecimalPipe],
})
export class TicketCard {
  orden = input.required<OrdenTrabajo>();
  cliente = input<Cliente>();
  vehiculo = input<Vehiculo>();
  visitasPrevias = input(0);
  // Si el usuario en sesión tiene el permiso `diagnosticar` — lo decide
  // KanbanBoard, esta ficha no conoce SesionStore.
  puedeDiagnosticar = input(false);
  puedeAvanzar = input(false);
  avanzar = output<void>();
  guardarDiagnostico = output<string>();

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
}
