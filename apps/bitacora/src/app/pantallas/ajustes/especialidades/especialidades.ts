import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BitacoraDatos } from '../../../data-access/db/bitacora-db';
import type { Especialidad } from '../../../data-access/db/esquema';
import { ETIQUETA_ESPECIALIDAD_REPORTE } from '../../../data-access/etiquetas-reporte';
import { PerfilStore } from '../../../data-access/perfil.store';
import { TallerStore } from '../../../data-access/taller.store';
import { EtiquetaEspecialidad } from '../../../shared/etiqueta-especialidad/etiqueta-especialidad';
import {
  GrupoOpciones,
  type Opcion,
} from '../../../shared/grupo-opciones/grupo-opciones';

const TODAS: readonly Opcion[] = (
  Object.entries(ETIQUETA_ESPECIALIDAD_REPORTE) as [Especialidad, string][]
).map(([id, etiqueta]) => ({ id, etiqueta }));

/**
 * Qué Especialidades ofrece el Taller.
 *
 * Es **la única configuración que cambia lo que se ve** — así la llaman el
 * [ADR 0003] y el [ADR 0008]—: con una sola, el filtro del tablero desaparece
 * y la pantalla queda exactamente igual que la de un taller de un solo oficio.
 *
 * Por eso la pantalla lo dice antes de que se toque nada, en vez de dejar que
 * se descubra: una configuración cuyo efecto no se anuncia se prueba a ciegas.
 */
@Component({
  selector: 'app-ajustes-especialidades',
  templateUrl: './especialidades.html',
  styleUrl: './especialidades.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, GrupoOpciones, EtiquetaEspecialidad],
})
export class AjustesEspecialidades {
  readonly #datos = inject(BitacoraDatos);
  readonly #perfiles = inject(PerfilStore);
  protected readonly taller = inject(TallerStore);

  protected readonly todas = TODAS;
  protected readonly error = signal<string | null>(null);

  /* El mismo interruptor que Apariencia: al resto no se le OFRECE editar,
     que no es lo mismo que prohibírselo (ADR 0005 y 0013). */
  protected readonly puedeEditar = this.#perfiles.configuraElTaller;

  protected readonly elegidas = computed(() => this.taller.especialidades());

  /** Lo que va a pasar con lo que hay marcado ahora mismo. */
  protected readonly consecuencia = computed(() =>
    this.elegidas().length > 1
      ? 'El tablero ofrece filtrar por especialidad.'
      : 'Con una sola, el tablero no ofrece filtrar: la pantalla queda igual que la de un taller de un solo oficio.',
  );

  protected async alternar(id: string) {
    const especialidad = id as Especialidad;
    const actuales = this.elegidas();
    const siguientes = actuales.includes(especialidad)
      ? actuales.filter((e) => e !== especialidad)
      : [...actuales, especialidad];

    this.error.set(null);
    try {
      await this.#datos.lista;
      await this.#datos.configuracion.guardarEspecialidades(siguientes);
    } catch (falla) {
      /* El mensaje viene escrito desde la capa de datos: quitar la última
         Especialidad deja al Taller sin poder recibir un carro, y eso hay que
         decirlo con esas palabras y no con un "no se pudo guardar". */
      this.error.set(
        falla instanceof Error ? falla.message : 'No se pudo guardar.',
      );
    }
  }
}
