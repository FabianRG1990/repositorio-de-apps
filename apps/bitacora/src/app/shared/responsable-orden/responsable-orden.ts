import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { BitacoraDatos } from '../../data-access/db/bitacora-db';
import type { Orden } from '../../data-access/ordenes.store';
import { TallerStore } from '../../data-access/taller.store';

/**
 * A nombre de quién queda la Orden.
 *
 * El [ADR 0003] decidió **un Responsable por Orden** y no un ejecutor por
 * Línea de servicio: la Orden sabe quién responde por ella, no quién hizo cada
 * trabajo. Por eso acá se elige UNA persona y no una por Especialidad.
 *
 * Se puede dejar en nadie, y se puede cambiar cuantas veces haga falta: en un
 * taller el trabajo cambia de manos, y un campo que solo se escribe una vez
 * acabaría mintiendo a la semana.
 *
 * Se ofrecen los Técnicos, que es de donde sale el Responsable según el
 * glosario, pero **no se comprueba su Especialidad contra la de la Orden**: el
 * mismo ADR dice que quien responde *"no necesariamente lo ejecuta todo"*, y
 * en un taller mixto el Responsable de una Orden de mecánica y pintura es
 * quien la coordina.
 */
@Component({
  selector: 'app-responsable-orden',
  templateUrl: './responsable-orden.html',
  styleUrl: './responsable-orden.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponsableOrden {
  readonly #datos = inject(BitacoraDatos);
  readonly #taller = inject(TallerStore);

  readonly orden = input.required<Orden>();

  protected readonly error = signal<string | null>(null);

  /**
   * A quién se puede poner, con quien ya está aunque no sea Técnico.
   *
   * Lo segundo importa: una Orden puede venir de antes a nombre de un Asesor,
   * o de alguien a quien dieron de baja. Si la lista no lo incluyera, el
   * desplegable saltaría solo a otra persona nada más abrirse y el cambio
   * quedaría hecho sin que nadie lo pidiera.
   */
  protected readonly candidatas = computed(() => {
    const tecnicos = this.#taller.personalPorPapel().get('tecnico') ?? [];
    const actual = this.orden().responsable;
    if (!actual || tecnicos.some((t) => t.id === actual.id)) return tecnicos;
    return [{ id: actual.id, nombre: actual.nombre }, ...tecnicos];
  });

  protected async poner(personaId: string) {
    this.error.set(null);
    try {
      await this.#datos.personal.ponerResponsable(
        this.orden().id,
        personaId || null,
      );
    } catch (falla) {
      this.error.set(
        falla instanceof Error ? falla.message : 'No se pudo guardar.',
      );
    }
  }
}
