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
  faChartLine,
  faCheck,
  faGaugeHigh,
  faHandPointer,
  faHeadset,
  faKey,
  faRightLeft,
  faScrewdriverWrench,
  faShop,
  faSliders,
  faTableColumns,
  faWarehouse,
} from '@fortawesome/pro-solid-svg-icons';
import { ConfiguracionTallerStore } from './data-access/configuracion-taller.store';

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
    /* Se pide acá para que exista desde el arranque: es quien escribe la piel
       y la densidad del Taller en <html>. Si solo lo inyectara la pantalla de
       Ajustes, la apariencia no se aplicaría hasta abrirla. */
    inject(ConfiguracionTallerStore);

    inject(FaIconLibrary).addIcons(
      faBars,
      faCalendarCheck,
      faCarSide,
      faChartLine,
      faCheck,
      faCircleInfo,
      faCircleMinus,
      faClipboardList,
      faGaugeHigh,
      faHandPointer,
      faHeadset,
      faKey,
      faRightLeft,
      faScrewdriverWrench,
      faShop,
      faSliders,
      faTableColumns,
      faWarehouse,
    );
  }
}
