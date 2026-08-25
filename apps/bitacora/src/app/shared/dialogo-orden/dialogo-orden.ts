import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  ETIQUETA_CUANDO,
  ETIQUETA_SENAL,
  listar,
  tanqueLegible,
} from '../../data-access/etiquetas-reporte';
import {
  ImpresionStore,
  type DocumentoImpreso,
} from '../../data-access/impresion.store';
import {
  OrdenesStore,
  tiempoParadoLegible,
} from '../../data-access/ordenes.store';
import { Boton } from '../boton/boton';
import { BitacoraDatos } from '../../data-access/db/bitacora-db';
import { EspacioStore } from '../../data-access/espacio.store';
import { EtiquetaEspecialidad } from '../etiqueta-especialidad/etiqueta-especialidad';
import { GaleriaFotos } from '../galeria-fotos/galeria-fotos';
import { colones, kilometros } from '../formato';
import { InsigniaEstado } from '../insignia-estado/insignia-estado';
import { TrabajosOrden } from '../trabajos-orden/trabajos-orden';

/**
 * La Orden completa, en su propia ventana.
 *
 * Antes vivía en el panel derecho, que mide 310 px: ahí no caben las Líneas de
 * servicio con sus montos, las quejas del Cliente y el estado de entrada sin
 * convertirse en una columna larguísima de texto envuelto. El panel se queda
 * con el vistazo y la Orden entera se abre acá.
 *
 * Es un `<dialog>` NATIVO y no `MatDialog`. `showModal()` trae la trampa de
 * foco, el `Esc`, el fondo inerte, el `::backdrop` y la devolución del foco al
 * botón que lo abrió, sin librería. `MatDialog` haría lo mismo pero con su
 * propia carcasa encima —la que hubo que pelear en las pestañas, en la fila y
 * en el menú desplegable— y arrastra un fallo abierto por el que el foco se le
 * escapa con Shift+Tab (angular/components#18799).
 */
@Component({
  selector: 'app-dialogo-orden',
  templateUrl: './dialogo-orden.html',
  styleUrl: './dialogo-orden.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FontAwesomeModule,
    Boton,
    EtiquetaEspecialidad,
    InsigniaEstado,
    TrabajosOrden,
    GaleriaFotos,
  ],
})
export class DialogoOrden {
  readonly store = inject(OrdenesStore);
  readonly #documento = inject(DOCUMENT);
  readonly #impresion = inject(ImpresionStore);
  readonly #datos = inject(BitacoraDatos);
  readonly #disco = inject(EspacioStore);

  /* No puede ser `#privado`: Angular no admite un campo privado de JavaScript
     como destino de `viewChild` (NG1053). */
  protected readonly ventana =
    viewChild.required<ElementRef<HTMLDialogElement>>('ventana');

  protected readonly tiempo = tiempoParadoLegible;
  protected readonly colones = colones;
  protected readonly kilometros = kilometros;
  protected readonly tanque = tanqueLegible;

  protected readonly orden = this.store.seleccionada;

  /** Lo aprobado, que es lo que se cobra. Lo declinado se suma aparte. */
  protected readonly totalAprobado = computed(() =>
    (this.orden()?.lineas ?? [])
      .filter((l) => !l.declinada)
      .reduce((t, l) => t + l.monto, 0),
  );

  protected readonly declinadas = computed(() =>
    (this.orden()?.lineas ?? []).filter((l) => l.declinada),
  );

  protected readonly totalDeclinado = computed(() =>
    this.declinadas().reduce((t, l) => t + l.monto, 0),
  );

  abrir() {
    const ventana = this.ventana().nativeElement;
    if (ventana.open) return;
    ventana.showModal();
    /* `showModal` deja el fondo inerte pero NO impide que la página siga
       desplazándose detrás. Con la rueda del ratón sobre el velo, el tablero
       se movía debajo de la ventana. */
    this.#documento.documentElement.style.overflow = 'hidden';
  }

  cerrar() {
    this.ventana().nativeElement.close();
  }

  /** El navegador devuelve el foco al botón que abrió; solo hay que limpiar. */
  protected alCerrar() {
    this.#documento.documentElement.style.overflow = '';
  }

  /**
   * Pulsar el velo cierra.
   *
   * El velo es el `::backdrop` del propio `<dialog>`, así que el clic llega
   * con `target` igual a la ventana. Comparar el punto contra su rectángulo y
   * no `event.target === ventana` a secas: con la tarjeta a sangre dentro del
   * `<dialog>`, un clic en el borde del padding también apuntaría a la ventana
   * y cerraría sin querer.
   */
  protected alPulsarFuera(evento: MouseEvent) {
    const ventana = this.ventana().nativeElement;
    if (evento.target !== ventana) return;

    const caja = ventana.getBoundingClientRect();
    const dentro =
      evento.clientX >= caja.left &&
      evento.clientX <= caja.right &&
      evento.clientY >= caja.top &&
      evento.clientY <= caja.bottom;
    if (!dentro) ventana.close();
  }

  /**
   * Sacar el papel.
   *
   * La ventana NO se cierra: el papel se imprime con ella abierta y quien
   * imprime casi siempre saca dos —la del taller y la del cliente— una detrás
   * de otra. Cerrarla obligaría a volver a abrirla para el segundo.
   */
  protected imprimir(documento: DocumentoImpreso) {
    this.#impresion.imprimir(documento);
  }

  /**
   * Guardar fotos desde la Orden.
   *
   * Se reduce y se guarda una por una, no todas a la vez: con cuatro fotos de
   * 4 MB en paralelo el hilo se queda sin aire y la ventana deja de responder
   * mientras dura. Una detrás de otra, cada una aparece al terminar.
   */
  protected async agregarFotos(archivos: readonly File[]) {
    const orden = this.orden();
    if (!orden) return;
    await this.#datos.lista;
    for (const archivo of archivos) {
      await this.#datos.fotos.guardar(orden.id, archivo);
    }
    // Guardar fotos es lo único que mueve la aguja del disco de verdad.
    await this.#disco.revisar();
  }

  protected async quitarFoto(fotoId: string) {
    await this.#datos.lista;
    await this.#datos.fotos.quitar(fotoId);
    await this.#disco.revisar();
  }

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
}
