import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  inject,
  output,
  signal,
} from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { RouterModule, type IsActiveMatchOptions } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { ItemMenu } from '../tipos';

/** Lo que tarda el encabezado en desvanecerse antes de dejar de ocupar sitio. */
const DESVANECIDO_MS = 140;

/* `exact: true` a secas compara la URL ENTERA, query params incluidos: con
   `/?piel=taller` el enlace a `/` dejaba de marcarse activo (issue #86). Las
   opciones granulares comparan la ruta y se desentienden del resto. Son dos
   constantes y no objetos creados en la plantilla, para que la referencia sea
   estable con OnPush. */
const COINCIDENCIA_EXACTA: IsActiveMatchOptions = {
  paths: 'exact',
  queryParams: 'ignored',
  fragment: 'ignored',
  matrixParams: 'ignored',
};

const COINCIDENCIA_POR_PREFIJO: IsActiveMatchOptions = {
  paths: 'subset',
  queryParams: 'ignored',
  fragment: 'ignored',
  matrixParams: 'ignored',
};

@Component({
  selector: 'app-menu-lateral',
  templateUrl: './menu-lateral.html',
  styleUrl: './menu-lateral.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, RouterModule, FontAwesomeModule],
})
export class MenuLateral {
  readonly #destroyRef = inject(DestroyRef);
  #temporizador: ReturnType<typeof setTimeout> | null = null;

  readonly exacta = COINCIDENCIA_EXACTA;
  readonly porPrefijo = COINCIDENCIA_POR_PREFIJO;

  readonly estaColapsado = signal(false);
  readonly encabezadoVisible = signal(true);
  readonly encabezadoDesvaneciendo = signal(false);
  readonly itemElegido = output<void>();

  constructor() {
    this.#destroyRef.onDestroy(() => this.#limpiar());
  }

  /* Se desvanece primero y se quita después: sacarlo de golpe hace que la
     lista salte hacia arriba mientras el cajón todavía se está encogiendo. */
  @Input() set colapsado(valor: boolean) {
    if (valor === this.estaColapsado()) return;

    this.estaColapsado.set(valor);
    this.#limpiar();

    if (!valor) {
      this.encabezadoVisible.set(true);
      this.encabezadoDesvaneciendo.set(false);
      return;
    }

    this.encabezadoDesvaneciendo.set(true);
    this.#temporizador = setTimeout(() => {
      this.encabezadoVisible.set(false);
      this.#temporizador = null;
    }, DESVANECIDO_MS);
  }

  readonly items = signal<ItemMenu[]>([
    { icon: ['fas', 'gauge-high'], label: 'Tablero', route: '/', exact: true },
    {
      icon: ['fas', 'car-side'],
      label: 'Recepción',
      route: 'recepcion',
      exact: false,
    },
    {
      icon: ['fas', 'clipboard-list'],
      label: 'Órdenes',
      route: 'ordenes',
      exact: false,
    },
    {
      icon: ['fas', 'calendar-check'],
      label: 'Próximas visitas',
      route: 'proximas-visitas',
      exact: false,
    },
    {
      icon: ['fas', 'sliders'],
      label: 'Ajustes',
      route: 'ajustes',
      exact: false,
    },
  ]);

  #limpiar() {
    if (!this.#temporizador) return;
    clearTimeout(this.#temporizador);
    this.#temporizador = null;
  }
}
