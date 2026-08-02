import { Component, computed, input, output } from '@angular/core';
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
  avanzar = output<void>();

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
}
