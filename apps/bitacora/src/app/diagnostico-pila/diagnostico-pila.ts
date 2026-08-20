import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCarWrench } from '@fortawesome/pro-solid-svg-icons';
import { faClock } from '@fortawesome/pro-regular-svg-icons';
import { NgIcon, provideIcons } from '@ng-icons/core';
// Los iconos viven en las subrutas por estilo (`/regular`, `/bold`, `/fill`…);
// la raíz del paquete no exporta ninguno.
import { phosphorWrench } from '@ng-icons/phosphor-icons/regular';

/**
 * Comprobación de que la pila de UI carga y renderiza de punta a punta.
 *
 * No es diseño: el sistema visual lo fija el ticket de la doble piel (#79),
 * y este componente se va cuando llegue. Existe porque instalar un paquete y
 * verlo en `node_modules` no prueba nada — lo que prueba la cadena es un
 * icono Pro dibujado en pantalla, que solo puede venir del registro privado
 * de FontAwesome, y un componente de Material tomando sus tokens de tema.
 */
@Component({
  selector: 'app-diagnostico-pila',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    FontAwesomeModule,
    NgIcon,
  ],
  providers: [provideIcons({ phosphorWrench })],
  templateUrl: './diagnostico-pila.html',
  styleUrl: './diagnostico-pila.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosticoPila {
  /** De `@fortawesome/pro-solid-svg-icons`: no existe en la edición gratuita. */
  protected readonly iconoPro = faCarWrench;
  /** De `@fortawesome/pro-regular-svg-icons`: otro estilo, también Pro. */
  protected readonly iconoProRegular = faClock;
}
