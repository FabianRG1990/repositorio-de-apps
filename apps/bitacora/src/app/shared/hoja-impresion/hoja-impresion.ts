import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  ETIQUETA_CUANDO,
  ETIQUETA_ESPECIALIDAD_REPORTE,
  ETIQUETA_SENAL,
  listar,
  tanqueLegible,
} from '../../data-access/etiquetas-reporte';
import { ImpresionStore } from '../../data-access/impresion.store';
import {
  ETIQUETA_ESPECIALIDAD,
  OrdenesStore,
} from '../../data-access/ordenes.store';
import { colones, kilometros } from '../formato';

/**
 * El papel.
 *
 * Existe solo cuando se está imprimiendo: en pantalla no se ve nunca. No es un
 * "modo impresión" de la Orden — es **otro documento**, con otro contenido,
 * por cada lector:
 *
 * - **Taller**: sin montos. El mecánico no cotiza, ejecuta, y una hoja con
 *   precios pegada al parabrisas es una hoja con precios circulando por el
 *   patio. Lleva la placa grande porque se lee a un brazo de distancia, la
 *   queja del Cliente en sus palabras —que es lo que hay que reproducir para
 *   diagnosticar— y casillas para marcar y anotar horas.
 * - **Cliente**: qué se hizo y cuánto, y lo declinado **como recordatorio**.
 *   Ese bloque es lo que lo trae de vuelta.
 * - **Archivo**: todo, incluido el estado en que entró el carro y quién
 *   autorizó qué. Es el papel que contesta una disputa.
 *
 * Va en blanco y negro y NO usa los tokens de la piel: el papel no tiene piel
 * de oficina ni de taller, y un fondo oscuro impreso es un cartucho gastado.
 */
@Component({
  selector: 'app-hoja-impresion',
  templateUrl: './hoja-impresion.html',
  styleUrl: './hoja-impresion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
})
export class HojaImpresion {
  readonly #impresion = inject(ImpresionStore);
  readonly #ordenes = inject(OrdenesStore);

  protected readonly documento = this.#impresion.documento;
  protected readonly orden = this.#ordenes.seleccionada;
  protected readonly hoy = new Date();

  protected readonly colones = colones;
  protected readonly kilometros = kilometros;
  protected readonly tanque = tanqueLegible;
  protected readonly nombreEspecialidad = ETIQUETA_ESPECIALIDAD;

  protected readonly aprobadas = computed(() =>
    (this.orden()?.lineas ?? []).filter((l) => !l.declinada),
  );

  protected readonly declinadas = computed(() =>
    (this.orden()?.lineas ?? []).filter((l) => l.declinada),
  );

  protected readonly totalAprobado = computed(() =>
    this.aprobadas().reduce((t, l) => t + l.monto, 0),
  );

  protected readonly totalDeclinado = computed(() =>
    this.declinadas().reduce((t, l) => t + l.monto, 0),
  );

  protected readonly rotulo: Record<string, string> = {
    taller: 'Orden de trabajo',
    cliente: 'Comprobante para el cliente',
    archivo: 'Copia para archivo',
  };

  protected metaDe(reporte: {
    readonly senales: readonly string[];
    readonly cuando: readonly string[];
    readonly desdeCuando: string;
  }): string {
    return [
      listar(ETIQUETA_SENAL, reporte.senales as never),
      listar(ETIQUETA_CUANDO, reporte.cuando as never),
      reporte.desdeCuando ? `desde ${reporte.desdeCuando}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  protected especialidadDe(clave: string): string {
    return (
      ETIQUETA_ESPECIALIDAD_REPORTE[
        clave as keyof typeof ETIQUETA_ESPECIALIDAD_REPORTE
      ] ?? clave
    );
  }
}
