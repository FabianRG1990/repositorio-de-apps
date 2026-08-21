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

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: '<router-outlet />',
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
