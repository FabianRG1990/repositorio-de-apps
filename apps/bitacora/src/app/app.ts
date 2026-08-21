import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faBars,
  faCalendarCheck,
  faCarSide,
  faCircleInfo,
  faCircleMinus,
  faClipboardList,
  faGaugeHigh,
  faHandPointer,
  faKey,
  faScrewdriverWrench,
  faShop,
  faSliders,
  faTableColumns,
  faWarehouse,
} from '@fortawesome/pro-solid-svg-icons';
import { ConmutadorPieles } from './prototipo/conmutador-pieles';

@Component({
  imports: [RouterOutlet, ConmutadorPieles],
  selector: 'app-root',
  // El conmutador es del prototipo de #79 y se borra con él; en producción no
  // se dibuja (ver `isDevMode()` en el componente).
  template: '<router-outlet /><app-conmutador-pieles />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  /* Los iconos se registran una sola vez, acá, para que las plantillas puedan
     pedirlos por nombre (`['fas', 'bars']`) sin importarlos en cada
     componente. Es el patrón de la librería, y evita que cada pantalla arrastre
     su propio bloque de imports de iconos. */
  constructor() {
    inject(FaIconLibrary).addIcons(
      faBars,
      faCalendarCheck,
      faCarSide,
      faCircleInfo,
      faCircleMinus,
      faClipboardList,
      faGaugeHigh,
      faHandPointer,
      faKey,
      faScrewdriverWrench,
      faShop,
      faSliders,
      faTableColumns,
      faWarehouse,
    );
  }
}
