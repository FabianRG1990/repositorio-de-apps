import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  ConfiguracionTallerStore,
  ETIQUETA_DENSIDAD,
  ETIQUETA_PIEL,
  type Densidad,
  type Piel,
} from '../../../data-access/configuracion-taller.store';
import { PerfilStore } from '../../../data-access/perfil.store';

interface OpcionPiel {
  readonly id: Piel;
  readonly nombre: string;
  readonly para: string;
}

interface OpcionDensidad {
  readonly id: Densidad;
  readonly nombre: string;
  readonly para: string;
}

const PIELES: readonly OpcionPiel[] = [
  { id: 'oficina', nombre: ETIQUETA_PIEL.oficina, para: 'Bajo techo' },
  {
    id: 'taller',
    nombre: ETIQUETA_PIEL.taller,
    para: 'Al sol, alto contraste',
  },
];

const DENSIDADES: readonly OpcionDensidad[] = [
  {
    id: 'compacta',
    nombre: ETIQUETA_DENSIDAD.compacta,
    para: 'Monitor de recepción',
  },
  { id: 'normal', nombre: ETIQUETA_DENSIDAD.normal, para: 'Uso general' },
  {
    id: 'guantes',
    nombre: ETIQUETA_DENSIDAD.guantes,
    para: 'Tableta en el patio',
  },
];

/**
 * Los tres ajustes de apariencia del Taller (#80).
 *
 * Son del Taller y no de cada aparato, así que se ven iguales en todos. Los
 * cambia el Dueño (ADR 0008); los otros Perfiles ven exactamente lo mismo pero
 * sin controles, porque el ADR 0005 dice que el Perfil ofrece y no prohíbe:
 * no hay muro, ni aviso de "no tenés permiso", ni nada que aparente ser un
 * sistema de permisos sobre un selector sin login.
 */
@Component({
  selector: 'app-apariencia',
  templateUrl: './apariencia.html',
  styleUrl: './apariencia.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Apariencia {
  readonly config = inject(ConfiguracionTallerStore);
  readonly #perfil = inject(PerfilStore);

  readonly pieles = PIELES;
  readonly densidades = DENSIDADES;
  readonly puedeEditar = this.#perfil.configuraElTaller;
}
