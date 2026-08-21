import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ListaPestanas,
  type Pestana,
} from '../../shared/lista-pestanas/lista-pestanas';

const PESTANAS: readonly Pestana[] = [
  { id: 'taller', label: 'Taller', icon: ['fas', 'shop'] },
  { id: 'especialidades', label: 'Especialidades', icon: ['fas', 'screwdriver-wrench'] },
  { id: 'apariencia', label: 'Apariencia', icon: ['fas', 'sliders'] },
];

/**
 * Ajustes con pestañas, igual que en el estándar. La pestaña de apariencia es
 * la que #80 tiene que llenar con tema, densidad y color de marca.
 */
@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.html',
  styleUrl: './ajustes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListaPestanas],
})
export class Ajustes {
  readonly pestanas = PESTANAS;
  readonly activa = signal<string>('taller');
}
