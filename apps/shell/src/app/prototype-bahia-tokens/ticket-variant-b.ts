// PROTOTYPE — Variante B: placa dominante, horizontal, franja de estado. Descartable.
import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { OrdenMock, ESTADO_LABEL } from './mock-orden';

@Component({
  selector: 'app-ticket-variant-b',
  template: `
    <article class="tarjeta" [attr.data-estado]="orden().estado">
      <div class="tarjeta__franja"></div>
      <div class="tarjeta__perforado"></div>
      <div class="tarjeta__placa-zona">
        <div class="placa">{{ orden().placa }}</div>
        <span class="tarjeta__vehiculo"
          >{{ orden().marca }} {{ orden().modelo }} · {{ orden().anio }}</span
        >
      </div>
      <div class="tarjeta__datos">
        <div class="dato">
          <span class="dato__label">Cliente</span>
          <span class="dato__valor"
            >{{ orden().clienteNombre }}
            @if (orden().visitasPrevias > 0) {
              <span class="tarjeta__recurrente"
                >({{ orden().visitasPrevias }} visitas)</span
              >
            }
          </span>
        </div>
        <div class="dato">
          <span class="dato__label">Km</span>
          <span class="dato__valor mono"
            >{{ orden().kilometraje | number }}</span
          >
        </div>
        <div class="dato dato--motivo">
          <span class="dato__label"
            >Motivo
            @if (orden().origenMotivo === 'voz') {
              <span title="Dictado por voz">🎙</span>
            }
          </span>
          <span class="dato__valor">{{ orden().motivoIngreso }}</span>
        </div>
        <div class="dato">
          <span class="dato__label">Orden</span>
          <span class="dato__valor mono dato__valor--secundario">{{
            orden().numero
          }}</span>
        </div>
      </div>
      <span class="tarjeta__estado-label">{{
        ESTADO_LABEL[orden().estado]
      }}</span>
    </article>
  `,
  styles: `
    .tarjeta {
      position: relative;
      width: 420px;
      display: grid;
      grid-template-columns: 140px 1fr;
      grid-template-rows: auto auto;
      background: var(--bahia-stone-50);
      border: var(--bahia-border-width) solid var(--bahia-stone-300);
      border-radius: var(--bahia-radius);
      box-shadow: var(--bahia-shadow);
      padding-left: 8px;
      font-family: var(--bahia-font-body);
      color: var(--bahia-stone-800);
      overflow: hidden;
    }

    .tarjeta__franja {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 8px;
    }

    .tarjeta__perforado {
      position: absolute;
      top: 0;
      left: 8px;
      right: 0;
      height: 6px;
      background-image: radial-gradient(
        circle,
        var(--bahia-stone-50) 2px,
        transparent 2.1px
      );
      background-size: 12px 12px;
      background-position: 6px -4px;
      background-color: var(--bahia-stone-300);
    }

    .tarjeta__placa-zona {
      grid-column: 1;
      grid-row: 1 / 3;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem 0.5rem;
      border-right: var(--bahia-border-width) solid var(--bahia-stone-200);
      margin-top: 6px;
    }

    .placa {
      font-family: var(--bahia-font-mono);
      font-weight: 600;
      font-size: var(--bahia-text-xl);
      letter-spacing: 0.08em;
      border: 2px solid var(--bahia-stone-800);
      border-radius: var(--bahia-radius);
      padding: 0.3rem 0.6rem;
      background: var(--bahia-stone-50);
    }

    .tarjeta__vehiculo {
      font-size: var(--bahia-text-xs);
      color: var(--bahia-stone-500);
      text-align: center;
    }

    .tarjeta__datos {
      grid-column: 2;
      grid-row: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem 1rem;
      padding: 1rem 1rem 0.5rem;
      margin-top: 6px;
    }

    .dato {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }

    .dato--motivo {
      grid-column: 1 / -1;
    }

    .dato__label {
      font-size: var(--bahia-text-xs);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--bahia-stone-500);
    }

    .dato__valor {
      font-size: var(--bahia-text-sm);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dato--motivo .dato__valor {
      white-space: normal;
    }

    .dato__valor--secundario {
      color: var(--bahia-stone-500);
    }

    .mono {
      font-family: var(--bahia-font-mono);
    }

    .tarjeta__recurrente {
      color: var(--bahia-accent-600);
      font-weight: 600;
      font-size: var(--bahia-text-xs);
    }

    .tarjeta__estado-label {
      grid-column: 2;
      grid-row: 2;
      align-self: end;
      justify-self: start;
      padding: 0.2rem 0.75rem 0.65rem;
      font-family: var(--bahia-font-title);
      font-weight: 700;
      font-size: var(--bahia-text-xs);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .tarjeta[data-estado='Ingresado'] .tarjeta__franja {
      background: var(--bahia-estado-ingresado-fg);
    }
    .tarjeta[data-estado='Ingresado'] .tarjeta__estado-label {
      color: var(--bahia-estado-ingresado-fg);
    }
    .tarjeta[data-estado='Diagnostico'] .tarjeta__franja {
      background: var(--bahia-estado-diagnostico-fg);
    }
    .tarjeta[data-estado='Diagnostico'] .tarjeta__estado-label {
      color: var(--bahia-estado-diagnostico-fg);
    }
    .tarjeta[data-estado='Reparacion'] .tarjeta__franja {
      background: var(--bahia-estado-reparacion-fg);
    }
    .tarjeta[data-estado='Reparacion'] .tarjeta__estado-label {
      color: var(--bahia-estado-reparacion-fg);
    }
    .tarjeta[data-estado='Listo'] .tarjeta__franja {
      background: var(--bahia-estado-listo-fg);
    }
    .tarjeta[data-estado='Listo'] .tarjeta__estado-label {
      color: var(--bahia-estado-listo-fg);
    }
    .tarjeta[data-estado='Entregado'] .tarjeta__franja {
      background: var(--bahia-estado-entregado-fg);
    }
    .tarjeta[data-estado='Entregado'] .tarjeta__estado-label {
      color: var(--bahia-estado-entregado-fg);
    }
  `,
  imports: [DecimalPipe],
})
export class TicketVariantB {
  orden = input.required<OrdenMock>();
  protected readonly ESTADO_LABEL = ESTADO_LABEL;
}
