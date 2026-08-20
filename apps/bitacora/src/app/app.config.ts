import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    // El preset concreto lo elige #79; Aura es el de arranque de PrimeNG.
    //
    // `license` va sin valor a propósito mientras no haya clave: PrimeNG 22
    // exige una y sin ella inyecta un banner rojo fijo "Invalid PrimeUI
    // License", en shadow root cerrado y con z-index máximo. Ver el comentario
    // del componente de diagnóstico.
    providePrimeNG({ theme: { preset: Aura } }),
  ],
};
