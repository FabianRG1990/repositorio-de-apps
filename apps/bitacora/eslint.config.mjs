import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      /* `attribute` además de `element`: un componente que ES una fila de
         lista tiene que declararse `li[app-fila-orden]`, porque un
         `<app-fila-orden>` dentro de un `<ul>` no es HTML válido y rompe la
         relación lista↔elemento que el lector de pantalla anuncia. Es el
         mismo motivo por el que `mat-list-item` acepta las dos formas. */
      '@angular-eslint/component-selector': [
        'error',
        {
          type: ['element', 'attribute'],
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    // Override or add rules here
    rules: {},
  },
];
