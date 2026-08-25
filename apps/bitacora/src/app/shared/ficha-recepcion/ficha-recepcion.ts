import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Especialidad } from '../../data-access/db/esquema';
import { EtiquetaEspecialidad } from '../etiqueta-especialidad/etiqueta-especialidad';
import { kilometros } from '../formato';

/** Una queja ya compuesta para leerse. */
export interface QuejaEnFicha {
  readonly titulo: string;
  /** Las palabras del Cliente. Se enseñan entrecomilladas y sin tocar. */
  readonly textual: string;
  readonly especialidad: Especialidad | null;
  /** "Ruido · Al frenar · desde esta semana", ya armado por quien la pasa. */
  readonly meta: string;
}

export interface DatosDeFicha {
  readonly placa: string;
  readonly carro: string;
  readonly cliente: string;
  readonly telefono: string;
  readonly quienEntrega: string;
  /** El nombre de quien responde por la Orden, o vacío si no lo tomó nadie. */
  readonly responsable: string;
  readonly odometro: number | null;
  readonly combustible: string;
  readonly danosPrevios: string;
  readonly objetosDentro: string;
  readonly quejas: readonly QuejaEnFicha[];
}

/**
 * La ficha: lo que se oyó y se miró, convertido en algo que se lee.
 *
 * Es presentacional a propósito y recibe todo ya compuesto. Así la misma
 * ficha sirve para confirmar antes de recibir —donde los datos todavía son
 * borrador— y para leer una Orden guardada, sin que el componente tenga que
 * saber de dónde vienen ni consultar la base.
 */
@Component({
  selector: 'app-ficha-recepcion',
  templateUrl: './ficha-recepcion.html',
  styleUrl: './ficha-recepcion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EtiquetaEspecialidad],
})
export class FichaRecepcion {
  readonly datos = input.required<DatosDeFicha>();
  /** Con `false` se omite la cabecera: el panel de detalle ya la tiene. */
  readonly conCabecera = input<boolean>(true);

  protected readonly kilometros = kilometros;
}
