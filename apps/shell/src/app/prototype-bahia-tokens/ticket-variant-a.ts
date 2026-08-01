// PROTOTYPE — Variante A: "recibo" vertical. Descartable.
import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { OrdenMock, ESTADO_LABEL } from './mock-orden';

@Component({
  selector: 'app-ticket-variant-a',
  template: `
    <article class="recibo">
      <div class="perforado perforado--top"></div>
      <header class="recibo__header">
        <span class="recibo__eyebrow">Orden de trabajo</span>
        <span class="recibo__numero">{{ orden().numero }}</span>
      </header>
      <div class="recibo__divisor"></div>
      <dl class="recibo__campos">
        <div class="recibo__campo">
          <dt>Placa</dt>
          <dd class="mono">{{ orden().placa }}</dd>
        </div>
        <div class="recibo__campo">
          <dt>Vehículo</dt>
          <dd>{{ orden().marca }} {{ orden().modelo }} · {{ orden().anio }}</dd>
        </div>
        <div class="recibo__campo">
          <dt>Cliente</dt>
          <dd>
            {{ orden().clienteNombre }}
            @if (orden().visitasPrevias > 0) {
              <span class="recibo__recurrente"
                >· {{ orden().visitasPrevias }} visitas previas</span
              >
            }
          </dd>
        </div>
        <div class="recibo__campo">
          <dt>Kilometraje</dt>
          <dd class="mono">{{ orden().kilometraje | number }} km</dd>
        </div>
        <div class="recibo__campo">
          <dt>
            Motivo
            @if (orden().origenMotivo === 'voz') {
              <span class="recibo__voz" title="Dictado por voz">🎙</span>
            }
          </dt>
          <dd>{{ orden().motivoIngreso }}</dd>
        </div>
      </dl>
      <footer class="recibo__stamp" [attr.data-estado]="orden().estado">
        {{ ESTADO_LABEL[orden().estado] }}
      </footer>
    </article>
  `,
  styles: `
    .recibo {
      width: 300px;
      background: var(--bahia-stone-50);
      border: var(--bahia-border-width) solid var(--bahia-stone-300);
      border-radius: var(--bahia-radius);
      box-shadow: var(--bahia-shadow);
      overflow: hidden;
      font-family: var(--bahia-font-body);
      color: var(--bahia-stone-800);
    }

    .perforado--top {
      height: 10px;
      background-image: radial-gradient(
        circle,
        var(--bahia-stone-50) 2.5px,
        transparent 2.6px
      );
      background-size: 14px 14px;
      background-position: 7px -5px;
      background-color: var(--bahia-stone-300);
    }

    .recibo__header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 1rem 1rem 0.5rem;
      text-align: center;
    }

    .recibo__eyebrow {
      font-family: var(--bahia-font-title);
      font-size: var(--bahia-text-xs);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--bahia-stone-500);
    }

    .recibo__numero {
      font-family: var(--bahia-font-mono);
      font-size: var(--bahia-text-2xl);
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .recibo__divisor {
      border-top: var(--bahia-border-width) dashed var(--bahia-stone-300);
      margin: 0 1rem;
    }

    .recibo__campos {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      padding: 0.85rem 1rem;
      margin: 0;
    }

    .recibo__campo dt {
      font-size: var(--bahia-text-xs);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--bahia-stone-500);
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .recibo__campo dd {
      margin: 0.15rem 0 0;
      font-size: var(--bahia-text-sm);
      line-height: 1.35;
    }

    .mono {
      font-family: var(--bahia-font-mono);
    }

    .recibo__recurrente {
      color: var(--bahia-accent-600);
      font-weight: 600;
    }

    .recibo__voz {
      font-size: var(--bahia-text-xs);
    }

    .recibo__stamp {
      text-align: center;
      padding: 0.6rem;
      font-family: var(--bahia-font-title);
      font-weight: 700;
      font-size: var(--bahia-text-sm);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border-top: var(--bahia-border-width) solid var(--bahia-stone-300);
    }

    .recibo__stamp[data-estado='Ingresado'] {
      color: var(--bahia-estado-ingresado-fg);
      background: var(--bahia-estado-ingresado-bg);
    }
    .recibo__stamp[data-estado='Diagnostico'] {
      color: var(--bahia-estado-diagnostico-fg);
      background: var(--bahia-estado-diagnostico-bg);
    }
    .recibo__stamp[data-estado='Reparacion'] {
      color: var(--bahia-estado-reparacion-fg);
      background: var(--bahia-estado-reparacion-bg);
    }
    .recibo__stamp[data-estado='Listo'] {
      color: var(--bahia-estado-listo-fg);
      background: var(--bahia-estado-listo-bg);
    }
    .recibo__stamp[data-estado='Entregado'] {
      color: var(--bahia-estado-entregado-fg);
      background: var(--bahia-estado-entregado-bg);
    }
  `,
  imports: [DecimalPipe],
})
export class TicketVariantA {
  orden = input.required<OrdenMock>();
  protected readonly ESTADO_LABEL = ESTADO_LABEL;
}
