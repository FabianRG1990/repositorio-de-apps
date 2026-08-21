import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterModule,
  type IsActiveMatchOptions,
} from '@angular/router';
import { filter, startWith } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  ETIQUETA_PERFIL,
  OFICIO_PERFIL,
  PERFILES,
  PerfilStore,
  type Perfil,
} from '../../data-access/perfil.store';
import type { ItemMenu } from '../tipos';

const ICONO_PERFIL: Record<Perfil, IconProp> = {
  asesor: ['fas', 'headset'],
  tecnico: ['fas', 'screwdriver-wrench'],
  dueno: ['fas', 'chart-line'],
};

/* Todos los destinos que la app tiene, con su icono y su nombre. Qué subconjunto
   ve cada Perfil, y en qué orden, lo decide `OFRECIDO` en el store: acá vive el
   catálogo, allá la decisión del ADR 0005. */
const CATALOGO: Record<string, ItemMenu> = {
  '/': {
    icon: ['fas', 'gauge-high'],
    label: 'Tablero',
    route: '/',
    exact: true,
  },
  '/recepcion': {
    icon: ['fas', 'car-side'],
    label: 'Recepción',
    route: 'recepcion',
    exact: false,
  },
  '/ordenes': {
    icon: ['fas', 'clipboard-list'],
    label: 'Órdenes',
    route: 'ordenes',
    exact: false,
  },
  '/proximas-visitas': {
    icon: ['fas', 'calendar-check'],
    label: 'Próximas visitas',
    route: 'proximas-visitas',
    exact: false,
  },
  '/ajustes': {
    icon: ['fas', 'sliders'],
    label: 'Ajustes',
    route: 'ajustes',
    exact: false,
  },
};

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
  imports: [MatListModule, MatMenuModule, RouterModule, FontAwesomeModule],
})
export class MenuLateral {
  readonly #destroyRef = inject(DestroyRef);
  readonly #perfiles = inject(PerfilStore);
  readonly #router = inject(Router);
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

  readonly perfiles = PERFILES;
  readonly etiqueta = ETIQUETA_PERFIL;
  readonly oficio = OFICIO_PERFIL;
  readonly icono = ICONO_PERFIL;

  /* `router.isActive` no es una señal, así que `items` no se recalcularía al
     navegar. Esto le da el pulso: cada navegación terminada invalida el
     cómputo, que es lo que hace que la pantalla abierta se añada y se quite
     del menú cuando toca. */
  readonly #navegacion = toSignal(
    this.#router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
    ),
    { initialValue: null },
  );

  readonly perfilActual = this.#perfiles.perfil;
  readonly nombreDelPerfil = computed(() => {
    const p = this.#perfiles.perfil();
    return p ? ETIQUETA_PERFIL[p] : 'Sin elegir';
  });
  readonly iconoDelPerfil = computed<IconProp>(() => {
    const p = this.#perfiles.perfil();
    return p ? ICONO_PERFIL[p] : ['fas', 'headset'];
  });

  /**
   * Lo que este Perfil tiene delante, en su orden.
   *
   * Si la pantalla abierta no está en su lista, se AÑADE al final en vez de
   * desaparecer. El Perfil ofrece y no prohíbe: cambiar a Técnico estando en
   * Ajustes no puede dejar al usuario en una pantalla que el menú ya no
   * reconoce, sin rastro de dónde está ni cómo volver.
   */
  readonly items = computed<ItemMenu[]>(() => {
    this.#navegacion();
    const ofrecidas = this.#perfiles.ofrecido().menu;
    const items = ofrecidas.map((ruta) => CATALOGO[ruta]).filter(Boolean);

    const abierta = Object.keys(CATALOGO).find((ruta) =>
      this.#router.isActive(
        ruta,
        CATALOGO[ruta].exact ? this.exacta : this.porPrefijo,
      ),
    );
    if (abierta && !ofrecidas.includes(abierta)) items.push(CATALOGO[abierta]);

    return items;
  });

  /**
   * Cambiar de Perfil NO navega, y esa es la promesa del ADR: "cambiar de
   * Perfil en vivo es gratis y no pierde estado". El destino de entrada se
   * usa al entrar y solo ahí.
   */
  cambiarPerfil(perfil: Perfil) {
    this.#perfiles.elegir(perfil);
  }

  #limpiar() {
    if (!this.#temporizador) return;
    clearTimeout(this.#temporizador);
    this.#temporizador = null;
  }
}
