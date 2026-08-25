import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { filter, startWith } from 'rxjs';
import { DetalleStore } from '../data-access/detalle.store';
import { PerfilStore } from '../data-access/perfil.store';
import { MenuLateral } from './menu-lateral/menu-lateral';
import { DialogoOrden } from '../shared/dialogo-orden/dialogo-orden';
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
    DialogoOrden,
  ],
})
export class Shell {
  readonly #router = inject(Router);
  readonly #detalle = inject(DetalleStore);
  readonly #perfiles = inject(PerfilStore);

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

  /* `viewChild` no puede ir en un campo `#privado`: el compilador lo lee desde
     fuera de la clase para conectarlo con la plantilla (NG1053). */
  protected readonly panelDetalle = viewChild.required<MatSidenav>('panel');
  protected readonly ventanaOrden = viewChild.required(DialogoOrden);

  constructor() {
    /* Se entra eligiendo un Perfil (ADR 0005). La comprobación va acá y no en
       una guarda de ruta: una guarda intercepta CADA navegación y es lo que el
       ADR descarta —nada está prohibido—. El Shell se construye una sola vez,
       cuando el router ya resolvió la primera ruta, así que esto corre
       exactamente al entrar y nunca más. */
    if (!this.#perfiles.elegido()) {
      void this.#router.navigateByUrl('/entrar');
    }

    /* Ver orden PIDE la Orden, y ahora se enseña en su ventana y no en el
       panel. El panel derecho mide 310 px: ahí las Líneas con sus montos, las
       quejas y el estado de entrada se convertían en una columna larguísima de
       texto envuelto. El panel se queda con el vistazo.

       El contador arranca en 0 y ese primer valor no abre nada: si no, la
       ventana se abriría sola al cargar la app. */
    effect(() => {
      if (this.#detalle.peticiones() === 0) return;
      untracked(() => this.ventanaOrden().abrir());
    });
  }

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
