import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { filter, startWith } from 'rxjs';
import { MenuLateral } from './menu-lateral/menu-lateral';
import { PanelDetalle } from './panel-detalle/panel-detalle';

/**
 * Consultas de medio del shell. Son las del estándar visual de referencia:
 * `estrecho` decide si los
 * cajones pasan a modo `over` (encima del contenido, con backdrop) o siguen en
 * `side` (empujando el contenido); las otras dos deciden si el header muestra
 * solo iconos.
 */
const ESTRECHO = '(max-width: 1100px)';
const MOVIL = '(max-width: 640px)';
const APAISADO_BAJO = '(max-height: 520px) and (orientation: landscape)';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatSidenavModule,
    RouterOutlet,
    FontAwesomeModule,
    MenuLateral,
    PanelDetalle,
  ],
})
export class Shell {
  readonly #router = inject(Router);

  readonly #medios = toSignal(
    inject(BreakpointObserver).observe([ESTRECHO, MOVIL, APAISADO_BAJO]),
    {
      initialValue: {
        matches: false,
        breakpoints: {
          [ESTRECHO]: false,
          [MOVIL]: false,
          [APAISADO_BAJO]: false,
        },
      },
    },
  );

  readonly esEstrecho = computed(
    () => this.#medios().breakpoints[ESTRECHO] ?? false,
  );
  readonly esCompacto = computed(
    () =>
      (this.#medios().breakpoints[MOVIL] ?? false) ||
      (this.#medios().breakpoints[APAISADO_BAJO] ?? false),
  );

  /** El menú no se cierra al colapsar: se encoge a un riel de solo iconos. */
  readonly colapsado = signal(false);
  readonly panelFijado = signal(true);

  readonly anchoMenu = computed(() =>
    this.esEstrecho() ? '260px' : this.colapsado() ? '6.062rem' : '14.625rem',
  );
  readonly anchoPanel = computed(() =>
    this.esEstrecho() ? '260px' : '14.625rem',
  );
  readonly hueco = computed(() => (this.esEstrecho() ? '0' : '0.2rem'));

  /* El margen del contenido es lo que se anima: al cambiar, el cuadro entero
     se desliza. Ver la transición de 500 ms en shell.scss. */
  readonly margenIzquierdo = computed(() =>
    this.esEstrecho() ? '0' : `calc(${this.anchoMenu()} + ${this.hueco()})`,
  );
  readonly margenDerecho = computed(() =>
    this.esEstrecho()
      ? '0'
      : this.panelFijado()
        ? `calc(${this.anchoPanel()} + ${this.hueco()})`
        : '0',
  );

  /* El título sale de la ruta activa, no de una variable duplicada: se baja
     hasta la ruta más profunda y se lee su `title`. */
  readonly #navegacion = toSignal(
    this.#router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
    ),
    { initialValue: null },
  );

  readonly titulo = computed(() => {
    this.#navegacion();
    let ruta = this.#router.routerState.snapshot.root;
    while (ruta.firstChild) ruta = ruta.firstChild;
    return ruta.title ?? 'Bitácora';
  });

  alPulsarMenu(menu: MatSidenav) {
    return this.esEstrecho() ? menu.toggle() : this.colapsado.update((v) => !v);
  }

  /** En estrecho el cajón tapa el contenido, así que se cierra al elegir. */
  alElegirDelMenu(menu: MatSidenav) {
    if (!this.esEstrecho()) return;
    void menu.close();
  }

  alAlternarPanel(panel: MatSidenav) {
    return this.esEstrecho()
      ? panel.toggle()
      : this.panelFijado.update((v) => !v);
  }
}
