import { Route } from '@angular/router';
import { Shell } from './shell/shell';

/**
 * El Shell es el componente de la ruta padre y las pantallas son sus hijas.
 * Eso es lo que hace que navegar cambie SOLO el contenido del cuadro: el
 * `mat-sidenav-container`, el menú y el panel derecho nunca se destruyen.
 *
 * El `title` de cada ruta es lo que lee la cabecera del cuadro, así que no hay
 * que mantener el nombre de la pantalla en dos sitios.
 */
export const appRoutes: Route[] = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: '',
        title: 'En el taller',
        loadComponent: () =>
          import('./pantallas/tablero/tablero').then((m) => m.Tablero),
      },
      {
        path: 'recepcion',
        title: 'Recepción',
        loadComponent: () =>
          import('./pantallas/recepcion/recepcion').then((m) => m.Recepcion),
      },
      {
        path: 'ordenes',
        title: 'Órdenes',
        loadComponent: () =>
          import('./pantallas/ordenes/ordenes').then((m) => m.Ordenes),
      },
      {
        path: 'proximas-visitas',
        title: 'Próximas visitas',
        loadComponent: () =>
          import('./pantallas/proximas-visitas/proximas-visitas').then(
            (m) => m.ProximasVisitas,
          ),
      },
      {
        path: 'ajustes',
        title: 'Ajustes',
        loadComponent: () =>
          import('./pantallas/ajustes/ajustes').then((m) => m.Ajustes),
      },
    ],
  },
];
