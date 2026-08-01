// PROTOTYPE — contenedor de la ruta throwaway /prototype/bahia-tokens. Descartable.
// Tres variantes de la tarjeta de "orden de trabajo" para reaccionar y elegir, switcheables por ?variant=.
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { ORDEN_MOCK } from './mock-orden';
import { TicketVariantA } from './ticket-variant-a';
import { TicketVariantB } from './ticket-variant-b';
import { TicketVariantC } from './ticket-variant-c';
import { PrototypeSwitcher, VariantePrototipo } from './prototype-switcher';

const VARIANTES: VariantePrototipo[] = [
  { clave: 'A', nombre: 'Recibo vertical' },
  { clave: 'B', nombre: 'Placa dominante' },
  { clave: 'C', nombre: 'Ficha técnica + stepper' },
];

@Component({
  selector: 'app-bahia-tokens-prototype',
  imports: [TicketVariantA, TicketVariantB, TicketVariantC, PrototypeSwitcher],
  styleUrl: './tokens.scss',
  template: `
    <div class="pagina">
      <p class="pagina__nota">
        PROTOTYPE — tres variantes de la tarjeta de orden de trabajo, para
        reaccionar y elegir. Descartable, ver ticket
        "Prototipar tokens de diseño Angular".
      </p>

      <section class="showcase">
        <h2 class="showcase__titulo">Tipografía</h2>
        <div class="showcase__fuentes">
          <p class="f-title">Space Grotesk — títulos (Aa Bb Cc 0123)</p>
          <p class="f-body">Inter — texto de cuerpo (Aa Bb Cc 0123)</p>
          <p class="f-mono">IBM Plex Mono — datos: PBH-3321 · OT-0148 · 84500 km</p>
        </div>

        <h2 class="showcase__titulo">Paleta</h2>
        <div class="showcase__swatches">
          <span class="swatch" style="background: var(--bahia-stone-100)">stone-100</span>
          <span class="swatch" style="background: var(--bahia-stone-300)">stone-300</span>
          <span class="swatch" style="background: var(--bahia-stone-600); color: #fff">stone-600</span>
          <span class="swatch" style="background: var(--bahia-accent-600); color: #fff">acento</span>
          <span class="swatch" style="background: var(--bahia-estado-ingresado-bg); color: var(--bahia-estado-ingresado-fg)">ingresado</span>
          <span class="swatch" style="background: var(--bahia-estado-diagnostico-bg); color: var(--bahia-estado-diagnostico-fg)">diagnóstico</span>
          <span class="swatch" style="background: var(--bahia-estado-reparacion-bg); color: var(--bahia-estado-reparacion-fg)">reparación</span>
          <span class="swatch" style="background: var(--bahia-estado-listo-bg); color: var(--bahia-estado-listo-fg)">listo</span>
          <span class="swatch" style="background: var(--bahia-estado-entregado-bg); color: var(--bahia-estado-entregado-fg)">entregado</span>
        </div>
      </section>

      <section class="tarjeta-zona">
        @switch (variante()) {
          @case ('A') {
            <app-ticket-variant-a [orden]="orden" />
          }
          @case ('B') {
            <app-ticket-variant-b [orden]="orden" />
          }
          @case ('C') {
            <app-ticket-variant-c [orden]="orden" />
          }
        }
      </section>
    </div>

    <app-prototype-switcher
      [variantes]="variantes"
      [actual]="variante()"
      (cambio)="cambiarVariante($event)"
    />
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background: var(--bahia-stone-100);
      font-family: var(--bahia-font-body);
      padding: 2rem 1.5rem 6rem;
    }

    .pagina {
      max-width: 960px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .pagina__nota {
      font-size: var(--bahia-text-xs);
      color: var(--bahia-stone-500);
      background: var(--bahia-stone-50);
      border: var(--bahia-border-width) dashed var(--bahia-stone-300);
      border-radius: var(--bahia-radius);
      padding: 0.5rem 0.75rem;
    }

    .showcase__titulo {
      font-family: var(--bahia-font-title);
      font-size: var(--bahia-text-lg);
      margin: 0 0 0.5rem;
    }

    .showcase__fuentes {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin: 0 0 1.5rem;
    }

    .f-title {
      font-family: var(--bahia-font-title);
      font-size: var(--bahia-text-xl);
      font-weight: 700;
      margin: 0;
    }

    .f-body {
      font-family: var(--bahia-font-body);
      font-size: var(--bahia-text-base);
      margin: 0;
    }

    .f-mono {
      font-family: var(--bahia-font-mono);
      font-size: var(--bahia-text-base);
      margin: 0;
    }

    .showcase__swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .swatch {
      padding: 0.5rem 0.75rem;
      border-radius: var(--bahia-radius);
      font-size: var(--bahia-text-xs);
      border: var(--bahia-border-width) solid rgb(0 0 0 / 8%);
    }

    .tarjeta-zona {
      display: flex;
      justify-content: center;
      padding: 1rem 0;
    }
  `,
})
export class BahiaTokensPrototype {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly orden = ORDEN_MOCK;
  protected readonly variantes = VARIANTES;

  protected readonly variante = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('variant') ?? 'A')),
    { initialValue: 'A' },
  );

  cambiarVariante(clave: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { variant: clave },
      queryParamsHandling: 'merge',
    });
  }
}
