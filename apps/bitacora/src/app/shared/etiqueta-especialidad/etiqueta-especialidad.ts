import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  ETIQUETA_ESPECIALIDAD,
  type ClaveEspecialidad,
} from '../../data-access/ordenes.store';

/**
 * Los matices son categóricos y están medidos, no elegidos por gusto.
 *
 * El primer reparto dejaba mecánica en 210° y pintura en 185°: en pantalla
 * eran el mismo turquesa (ΔE OKLab 0,039, por debajo de lo que el ojo separa).
 * Estos tres están a 60° o más entre sí y a 33° de cualquier matiz semántico,
 * para que la categoría no se lea como estado. ΔE mínimo medido: 0,090.
 *
 * El MATIZ vive acá porque es dominio —qué especialidad es—, y la claridad y
 * el croma viven en la piel, porque son contraste. Es el mismo corte que usa
 * el color de marca del Taller.
 */
const MATIZ: Record<ClaveEspecialidad, number> = {
  mecanica: 250,
  electricidad: 310,
  pintura: 190,
};

@Component({
  selector: 'app-etiqueta-especialidad',
  template: `<span class="esp" [style.--esp-h]="matiz()"
    ><span class="esp__texto" [class.solo-lectores]="soloMarca()">{{
      etiqueta()
    }}</span></span
  >`,
  styleUrl: './etiqueta-especialidad.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EtiquetaEspecialidad {
  readonly especialidad = input.required<ClaveEspecialidad>();

  /**
   * En la fila compacta no cabe otra palabra, así que se queda solo el cuadro
   * de color. El nombre NO se borra: se oculta visualmente y sigue en el árbol
   * de accesibilidad, porque si el color fuera el único portador del dato la
   * insignia entera dejaría de cumplir #18 §6.2 regla 2.
   */
  readonly soloMarca = input(false);

  protected readonly matiz = computed(() => MATIZ[this.especialidad()]);
  protected readonly etiqueta = computed(
    () => ETIQUETA_ESPECIALIDAD[this.especialidad()],
  );
}
