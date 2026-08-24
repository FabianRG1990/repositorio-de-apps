import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EtiquetaEspecialidad } from '../../shared/etiqueta-especialidad/etiqueta-especialidad';
import { InsigniaEstado } from '../../shared/insignia-estado/insignia-estado';
import {
  ETIQUETA_CUANDO,
  ETIQUETA_SENAL,
  listar,
  tanqueLegible,
} from '../../data-access/etiquetas-reporte';
import {
  OrdenesStore,
  tiempoParadoLegible,
} from '../../data-access/ordenes.store';
import { kilometros } from '../../shared/formato';
import {
  FichaRecepcion,
  type DatosDeFicha,
} from '../../shared/ficha-recepcion/ficha-recepcion';

/**
 * El panel derecho del estándar: contextual al contenido central. En el diseño
 * de referencia ese sitio lo ocupa el carrito de compra; acá lo ocupa el detalle
 * de la Orden que esté seleccionada, que es el equivalente de dominio.
 *
 * No navega ni cambia de ruta: solo refleja lo que el centro tiene elegido.
 */
@Component({
  selector: 'app-panel-detalle',
  templateUrl: './panel-detalle.html',
  styleUrl: './panel-detalle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FontAwesomeModule,
    InsigniaEstado,
    EtiquetaEspecialidad,
    FichaRecepcion,
  ],
})
export class PanelDetalle {
  readonly store = inject(OrdenesStore);
  protected readonly tiempo = tiempoParadoLegible;
  protected readonly tanque = tanqueLegible;
  protected readonly kilometros = kilometros;

  /**
   * Lo que el Cliente dijo al entregar el carro, con la MISMA ficha que se
   * enseñó al recibirlo.
   *
   * Reusar el componente no es ahorro de código: es lo que garantiza que lo
   * que se confirmó en el mostrador y lo que se lee tres días después sean
   * literalmente la misma cosa. Sin cabecera, porque el panel ya tiene la
   * suya con el Folio, el Vehículo y el Cliente.
   */
  protected readonly ficha = computed<DatosDeFicha | null>(() => {
    const orden = this.store.seleccionada();
    if (!orden) return null;

    return {
      placa: orden.placa,
      carro: orden.vehiculo,
      cliente: orden.cliente,
      telefono: '',
      quienEntrega: '',
      odometro: orden.entrada.odometro,
      combustible: tanqueLegible(orden.entrada.combustible),
      danosPrevios: orden.entrada.danosPrevios,
      objetosDentro: orden.entrada.objetosDentro,
      quejas: orden.reportes.map((r) => ({
        titulo: r.titulo,
        textual: r.textual,
        especialidad: r.especialidad,
        meta: [
          listar(ETIQUETA_SENAL, r.senales),
          listar(ETIQUETA_CUANDO, r.cuando),
          r.desdeCuando ? `desde ${r.desdeCuando}` : '',
        ]
          .filter(Boolean)
          .join(' · '),
      })),
    };
  });
}
