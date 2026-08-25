import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ListaPestanas,
  type Pestana,
} from '../../shared/lista-pestanas/lista-pestanas';
import { Apariencia } from './apariencia/apariencia';
import { AjustesEspecialidades } from './especialidades/especialidades';
import { AjustesTaller } from './taller/taller';

const PESTANAS: readonly Pestana[] = [
  { id: 'taller', label: 'Taller', icon: ['fas', 'shop'] },
  {
    id: 'especialidades',
    label: 'Especialidades',
    icon: ['fas', 'screwdriver-wrench'],
  },
  { id: 'apariencia', label: 'Apariencia', icon: ['fas', 'sliders'] },
];

/**
 * Ajustes con pestañas, igual que en el estándar. La pestaña de apariencia
 * lleva los tres ajustes del Taller: piel, tamaño y color de marca (#80).
 */
@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.html',
  styleUrl: './ajustes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListaPestanas, Apariencia, AjustesTaller, AjustesEspecialidades],
})
export class Ajustes {
  readonly pestanas = PESTANAS;

  /* Abre en Apariencia y no en Taller: Taller y Especialidades todavía son un
     párrafo cada una, así que abrir por la primera dejaba la pantalla en
     blanco. Desde #114 las tres tienen contenido, así que vuelve a abrir en
     'taller', que es lo que el Dueño viene a hacer. */
  readonly activa = signal<string>('taller');
}
