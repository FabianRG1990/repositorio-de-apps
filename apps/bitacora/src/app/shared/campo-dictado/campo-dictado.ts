import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Dictado } from '../../data-access/dictado';

/**
 * El texto y de dónde salió.
 *
 * El origen se propaga porque el Reporte lo guarda: es el único número que
 * dice si el micrófono se usa de verdad o si es un botón que nadie toca.
 */
export interface Escrito {
  readonly texto: string;
  readonly origen: 'tecleado' | 'dictado';
}

/**
 * Un campo de prosa con micrófono al lado.
 *
 * Es la forma concreta de lo que ADR 0004 decidió: **el dictado es un
 * acelerador sobre campos que ya funcionan escribiendo**. El `textarea` es el
 * campo; el micrófono es un botón que le mete texto. Quitando el botón, el
 * componente sigue siendo un campo de texto completo — esa es la prueba de
 * que la voz no se volvió el camino.
 *
 * Lo que se va oyendo se enseña aparte y en gris, no dentro del `textarea`:
 * metido dentro habría que borrarlo y reescribirlo en cada resultado parcial,
 * lo que mueve el cursor y machaca lo que la persona esté corrigiendo a mano
 * mientras habla.
 */
@Component({
  selector: 'app-campo-dictado',
  templateUrl: './campo-dictado.html',
  styleUrl: './campo-dictado.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, FontAwesomeModule],
})
export class CampoDictado {
  protected readonly dictado = inject(Dictado);

  /** Identifica el campo: solo uno dicta a la vez en toda la pantalla. */
  readonly campo = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly valor = input<string>('');
  readonly ayuda = input<string>('');
  readonly marcador = input<string>('');
  readonly filas = input<number>(3);
  readonly cambiado = output<Escrito>();

  protected readonly escuchandoEste = computed(
    () => this.dictado.campo() === this.campo(),
  );

  protected readonly parcial = computed(() =>
    this.escuchandoEste() ? this.dictado.parcial() : '',
  );

  /* El problema solo se enseña en el campo que lo provocó. Repetido en los
     tres campos de la pantalla, un "no hay internet" se lee como tres fallos
     distintos. */
  protected readonly problema = computed(() =>
    this.escuchandoEste() ? this.dictado.problema() : null,
  );

  protected readonly etiquetaBoton = computed(() =>
    this.escuchandoEste()
      ? `Dejar de dictar ${this.etiqueta()}`
      : `Dictar ${this.etiqueta()}`,
  );

  /**
   * Lo que se anuncia a quien no ve la pantalla.
   *
   * Es el ESTADO, no el texto que se va oyendo: los resultados parciales
   * cambian varias veces por segundo y una región viva que los repita
   * convierte el lector de pantalla en ruido continuo. El texto reconocido ya
   * llega al `textarea`, que es donde se espera encontrarlo.
   */
  protected readonly anuncio = computed(() => {
    if (!this.escuchandoEste()) return '';
    if (this.dictado.estado() === 'pidiendo-permiso')
      return 'Pidiendo permiso…';
    if (this.dictado.estado() === 'escuchando') return 'Escuchando';
    return '';
  });

  protected alternarMicrofono() {
    this.dictado.alternar(this.campo(), (texto) => this.#anadir(texto));
  }

  protected escribir(texto: string) {
    this.cambiado.emit({ texto, origen: 'tecleado' });
  }

  /**
   * Lo dictado se AÑADE a lo que ya había, no lo reemplaza.
   *
   * El Cliente habla en tandas —"suena al frenar"… pausa… "y también vibra"—
   * y cada tanda cierra su propio resultado final. Reemplazando, la segunda
   * frase borraría la primera.
   */
  #anadir(texto: string) {
    const actual = this.valor().trimEnd();
    const junto = actual ? `${actual} ${texto}` : texto;
    this.cambiado.emit({ texto: junto, origen: 'dictado' });
  }
}
