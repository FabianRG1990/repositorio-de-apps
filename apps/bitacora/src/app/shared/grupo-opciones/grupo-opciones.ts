import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

export interface Opcion {
  readonly id: string;
  readonly etiqueta: string;
  /** Texto corto extra a la derecha: un monto, una pista. */
  readonly detalle?: string;
}

/**
 * Un grupo de opciones que se pulsan, para responder sin teclear.
 *
 * Existe porque la Recepción se llena de pie y con el Cliente enfrente: "¿al
 * frenar o al acelerar?" se contesta con el dedo en un segundo, y escribirlo
 * cuesta diez. Lo que se marca acá es lo que después hace consultable la
 * queja; lo que se dicta es lo que la hace fiel.
 *
 * Por dentro son `input` nativos —casilla o radio— escondidos bajo su
 * `label`. No son botones con `aria-pressed`: el navegador ya trae el
 * agrupado, el recorrido con flechas dentro de un grupo de radios, el estado
 * anunciado y el foco. Reimplementar eso a mano es donde se pierden los
 * detalles que no se notan hasta que alguien navega sin ratón.
 */
@Component({
  selector: 'app-grupo-opciones',
  templateUrl: './grupo-opciones.html',
  styleUrl: './grupo-opciones.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrupoOpciones {
  readonly nombre = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly opciones = input.required<readonly Opcion[]>();
  readonly seleccionadas = input<readonly string[]>([]);
  /** Varias a la vez (casillas) o una sola (radios). */
  readonly multiple = input<boolean>(true);
  readonly elegida = output<string>();

  protected marcada(id: string): boolean {
    return this.seleccionadas().includes(id);
  }
}
