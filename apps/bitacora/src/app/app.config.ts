import { registerLocaleData } from '@angular/common';
import localeEsCR from '@angular/common/locales/es-CR';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';

/**
 * Bitácora habla español de Costa Rica.
 *
 * Angular arranca en `en-US` mientras nadie diga lo contrario, y eso NO es un
 * detalle cosmético: el primer papel que salió de la impresora decía "24 de
 * August 2026". Un taller tico entregándole eso a un cliente es una app que
 * se nota importada.
 *
 * El dato de idioma va acá y no en cada `date` de cada plantilla porque es una
 * propiedad de la aplicación entera; declararlo por uso garantiza que el
 * próximo sitio que formatee una fecha se olvide.
 */
registerLocaleData(localeEsCR);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    { provide: LOCALE_ID, useValue: 'es-CR' },
  ],
};
