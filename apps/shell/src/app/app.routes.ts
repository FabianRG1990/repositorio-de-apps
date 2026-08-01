import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  // PROTOTYPE — throwaway, ver ticket "Prototipar tokens de diseño Angular"
  {
    path: 'prototype/bahia-tokens',
    loadComponent: () =>
      import('./prototype-bahia-tokens/bahia-tokens-prototype').then(
        (m) => m.BahiaTokensPrototype,
      ),
  },
];
