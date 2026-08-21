import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { TonoEstado } from '../../data-access/ordenes.store';

/**
 * El estado de una Orden: color, FORMA y texto.
 *
 * La forma no es adorno. #18 §6.2 regla 2 (ANSI/HFES 100-2007 §7.2.5.3): el
 * color nunca es el único portador de información. Un asesor con deuteranopía
 * —uno de cada doce hombres— no distingue el ámbar del verde, y en el patio
 * bajo el sol la saturación se va antes que la forma.
 *
 * `mat-chip` no sirve acá por dos razones medibles: su altura es un token fijo
 * de 32/28/24 px (`chips/_m3-chip.scss`) y el marcador tiene que medir 20 px
 * —ANSI/HFES §7.2.6.2: un carácter solo se DISCRIMINA por color a partir de 30
 * minutos de arco, ~23–30 px a 45 cm—, y además el chip de Material es
 * focusable, así que dentro del `<button>` de la fila metería un objetivo de
 * foco anidado.
 */
@Component({
  selector: 'app-insignia-estado',
  template: `<span class="insignia" [attr.data-tono]="tono()">{{
    texto()
  }}</span>`,
  styleUrl: './insignia-estado.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsigniaEstado {
  readonly texto = input.required<string>();
  readonly tono = input.required<TonoEstado>();
}
