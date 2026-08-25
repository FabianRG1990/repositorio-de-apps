import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { mensajeDeProximaVisita } from '../../data-access/db/ciclo';
import { enlaceDeWhatsApp } from '../../data-access/db/trabajos';
import { OrdenesStore, type Orden } from '../../data-access/ordenes.store';
import { TallerStore } from '../../data-access/taller.store';
import { Boton } from '../../shared/boton/boton';
import { colones, fechaLarga } from '../../shared/formato';
import { agruparVisitas, cuandoLegible, diasParaLaVisita } from './agenda';

/**
 * A quién hay que llamar.
 *
 * El [ADR 0011] la decidió como "una lista aparte, ordenada por fecha, que el
 * Taller revisa cuando quiere", y explícitamente **no** en el tablero: el
 * tablero es la pantalla del trabajo de hoy, y meterle carros que ni siquiera
 * están presentes le quita el sentido de "lo que está parado".
 *
 * La fecha la escribió el Asesor al entregar. Acá no se calcula nada: sin
 * fecha escrita, el Vehículo no aparece nunca. Es un recordatorio, no un
 * motor de mantenimiento.
 *
 * Cada visita trae a la vista **lo que quedó declinado** la última vez. Es lo
 * que el mismo ADR llama los dos caminos hacia la misma conversación de
 * venta: llamar sin eso a mano es llamar sin saber qué proponer.
 */
@Component({
  selector: 'app-proximas-visitas',
  templateUrl: './proximas-visitas.html',
  styleUrl: './proximas-visitas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, Boton],
})
export class ProximasVisitas {
  readonly #ordenes = inject(OrdenesStore);
  readonly #taller = inject(TallerStore);

  protected readonly colones = colones;
  protected readonly fechaLarga = fechaLarga;

  protected readonly grupos = computed(() =>
    agruparVisitas(this.#ordenes.proximasVisitas()),
  );

  protected readonly cuantas = computed(
    () => this.#ordenes.proximasVisitas().length,
  );

  protected cuando(visita: Orden): string {
    return cuandoLegible(diasParaLaVisita(visita.proximaVisita ?? ''));
  }

  /** Lo que el Cliente no aprobó la última vez, con su monto. */
  protected pendiente(visita: Orden) {
    return visita.lineas.filter((l) => l.declinada);
  }

  protected enlace(visita: Orden): string {
    return enlaceDeWhatsApp(
      visita.telefono,
      mensajeDeProximaVisita({
        taller: this.#taller.configuracion().datos.nombre,
        vehiculo: visita.vehiculo,
        placa: visita.placa,
        fecha: fechaLarga(visita.proximaVisita ?? ''),
        pendiente: this.pendiente(visita).map((l) => l.descripcion),
      }),
    );
  }
}
