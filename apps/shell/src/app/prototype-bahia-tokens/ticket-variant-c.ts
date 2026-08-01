// PROTOTYPE — Variante C: ficha técnica densa con stepper de pipeline, perforado lateral. Descartable.
import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ESTADOS_ORDEN, ESTADO_LABEL, OrdenMock } from './mock-orden';

@Component({
  selector: 'app-ticket-variant-c',
  template: `
    <article class="ficha">
      <div class="ficha__perforado"></div>
      <div class="ficha__contenido">
        <header class="ficha__header">
          <h3 class="ficha__titulo">{{ orden().clienteNombre }}</h3>
          <span class="ficha__chip mono">{{ orden().numero }}</span>
        </header>

        <div class="ficha__grid">
          <div class="campo">
            <span class="campo__label">Placa</span>
            <span class="campo__valor mono">{{ orden().placa }}</span>
          </div>
          <div class="campo">
            <span class="campo__label">Vehículo</span>
            <span class="campo__valor"
              >{{ orden().marca }} {{ orden().modelo }} ({{
                orden().anio
              }})</span
            >
          </div>
          <div class="campo">
            <span class="campo__label">Kilometraje</span>
            <span class="campo__valor mono"
              >{{ orden().kilometraje | number }} km</span
            >
          </div>
          <div class="campo">
            <span class="campo__label">Visitas previas</span>
            <span class="campo__valor">{{ orden().visitasPrevias }}</span>
          </div>
          <div class="campo campo--full">
            <span class="campo__label"
              >Motivo
              @if (orden().origenMotivo === 'voz') {
                <span title="Dictado por voz">🎙</span>
              }
            </span>
            <span class="campo__valor">{{ orden().motivoIngreso }}</span>
          </div>
        </div>

        <ol class="stepper">
          @for (etapa of etapas(); track etapa.clave) {
            <li
              class="stepper__paso"
              [class.stepper__paso--actual]="etapa.actual"
              [class.stepper__paso--pasado]="etapa.pasado"
            >
              <span class="stepper__punto"></span>
              <span class="stepper__label">{{ etapa.label }}</span>
            </li>
          }
        </ol>
      </div>
    </article>
  `,
  styles: `
    .ficha {
      width: 380px;
      display: flex;
      background: var(--bahia-stone-50);
      border: var(--bahia-border-width) solid var(--bahia-stone-300);
      border-radius: var(--bahia-radius);
      box-shadow: var(--bahia-shadow);
      font-family: var(--bahia-font-body);
      color: var(--bahia-stone-800);
      overflow: hidden;
    }

    .ficha__perforado {
      width: 10px;
      flex-shrink: 0;
      background-image: radial-gradient(
        circle,
        var(--bahia-stone-50) 2.5px,
        transparent 2.6px
      );
      background-size: 14px 14px;
      background-position: -5px 7px;
      background-color: var(--bahia-stone-300);
    }

    .ficha__contenido {
      flex: 1;
      padding: 0.9rem 1rem;
      min-width: 0;
    }

    .ficha__header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.6rem;
    }

    .ficha__titulo {
      font-family: var(--bahia-font-title);
      font-size: var(--bahia-text-lg);
      font-weight: 700;
      margin: 0;
    }

    .ficha__chip {
      font-size: var(--bahia-text-xs);
      color: var(--bahia-stone-500);
      background: var(--bahia-stone-100);
      border: var(--bahia-border-width) solid var(--bahia-stone-200);
      border-radius: var(--bahia-radius);
      padding: 0.1rem 0.4rem;
      flex-shrink: 0;
    }

    .ficha__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem 1rem;
      padding-bottom: 0.75rem;
      border-bottom: var(--bahia-border-width) dashed var(--bahia-stone-300);
      margin-bottom: 0.75rem;
    }

    .campo {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      min-width: 0;
    }

    .campo--full {
      grid-column: 1 / -1;
    }

    .campo__label {
      font-size: var(--bahia-text-xs);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--bahia-stone-500);
    }

    .campo__valor {
      font-size: var(--bahia-text-sm);
    }

    .mono {
      font-family: var(--bahia-font-mono);
    }

    .stepper {
      list-style: none;
      display: flex;
      margin: 0;
      padding: 0;
    }

    .stepper__paso {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      position: relative;
    }

    .stepper__paso::before {
      content: '';
      position: absolute;
      top: 5px;
      left: -50%;
      width: 100%;
      height: 2px;
      background: var(--bahia-stone-200);
      z-index: 0;
    }

    .stepper__paso:first-child::before {
      content: none;
    }

    .stepper__punto {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--bahia-stone-200);
      border: 2px solid var(--bahia-stone-50);
      outline: 2px solid var(--bahia-stone-300);
      z-index: 1;
    }

    .stepper__label {
      font-size: 0.65rem;
      text-align: center;
      color: var(--bahia-stone-500);
      line-height: 1.1;
    }

    .stepper__paso--pasado .stepper__punto {
      background: var(--bahia-stone-500);
      outline-color: var(--bahia-stone-500);
    }

    .stepper__paso--actual .stepper__punto {
      background: var(--bahia-accent-600);
      outline-color: var(--bahia-accent-600);
    }

    .stepper__paso--actual .stepper__label {
      color: var(--bahia-stone-800);
      font-weight: 600;
    }
  `,
  imports: [DecimalPipe],
})
export class TicketVariantC {
  orden = input.required<OrdenMock>();

  etapas = computed(() => {
    const actualIndex = ESTADOS_ORDEN.indexOf(this.orden().estado);
    return ESTADOS_ORDEN.map((clave, i) => ({
      clave,
      label: ESTADO_LABEL[clave],
      actual: i === actualIndex,
      pasado: i < actualIndex,
    }));
  });
}
