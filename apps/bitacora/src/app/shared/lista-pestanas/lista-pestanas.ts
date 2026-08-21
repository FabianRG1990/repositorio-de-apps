import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

export interface Pestana {
  readonly id: string;
  readonly label: string;
  readonly icon: IconProp;
}

/**
 * La fila de pestañas de arriba del cuadro. Presentacional: no sabe qué panel
 * mostrar, solo cuál está activa y avisa cuando se elige otra.
 *
 * A propósito NO es `mat-tab-group`. Ese componente trae la animación y el
 * teclado gratis, pero impone su barra de tinta y su estructura de cabecera, y
 * el aspecto del estándar —pestañas trapezoidales al 100 % del ancho, en
 * mayúsculas, sin barra— sale más limpio a mano. El precio es implementar el
 * teclado, que es lo que hace el `tabindex` móvil de abajo.
 */
@Component({
  selector: 'app-lista-pestanas',
  templateUrl: './lista-pestanas.html',
  styleUrl: './lista-pestanas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule],
})
export class ListaPestanas {
  readonly pestanas = input.required<readonly Pestana[]>();
  readonly activa = input.required<string>();
  readonly etiqueta = input<string>('Vistas');
  readonly elegida = output<string>();

  /* Flechas para moverse entre pestañas, como manda el patrón de tablist de
     ARIA: el Tab salta FUERA del grupo, no de pestaña en pestaña. */
  alPresionarTecla(evento: KeyboardEvent, indice: number) {
    const total = this.pestanas().length;
    let siguiente: number | null = null;

    if (evento.key === 'ArrowRight') siguiente = (indice + 1) % total;
    else if (evento.key === 'ArrowLeft') siguiente = (indice - 1 + total) % total;
    else if (evento.key === 'Home') siguiente = 0;
    else if (evento.key === 'End') siguiente = total - 1;

    if (siguiente === null) return;

    evento.preventDefault();
    const destino = this.pestanas()[siguiente];
    this.elegida.emit(destino.id);

    const grupo = (evento.target as HTMLElement).closest('[role="tablist"]');
    grupo?.querySelectorAll<HTMLElement>('[role="tab"]')[siguiente]?.focus();
  }
}
