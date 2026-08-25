import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { pesoLegible } from '../../data-access/db/fotos';
import { EspacioStore } from '../../data-access/espacio.store';
import { Boton } from '../boton/boton';

/** Una foto para enseñar, venga de la base o de la cámara hace un segundo. */
export interface FotoParaVer {
  readonly id: string;
  readonly blob: Blob;
}

/**
 * Las Fotos del Vehículo: miniaturas, visor a pantalla completa y quitar.
 *
 * Es la misma pieza en dos sitios con dos orígenes distintos —en Recepción las
 * fotos todavía no existen en la base, y en la Orden vienen de ella— así que
 * recibe blobs y no sabe de dónde salieron.
 *
 * **Las URL de objeto se crean y se destruyen acá.** Cada `createObjectURL`
 * retiene el blob entero en memoria hasta que se revoca o se cierra la
 * pestaña; con fotos de un par de cientos de kilobytes y una sesión larga de
 * mostrador, eso se acumula. El mapa de abajo es lo que garantiza que por cada
 * URL creada haya una revocada.
 */
@Component({
  selector: 'app-galeria-fotos',
  templateUrl: './galeria-fotos.html',
  styleUrl: './galeria-fotos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, Boton],
})
export class GaleriaFotos {
  protected readonly disco = inject(EspacioStore);

  readonly fotos = input.required<readonly FotoParaVer[]>();
  /** Con `false` la galería solo se mira: es la de una Orden ya entregada. */
  readonly editable = input(true);
  readonly etiqueta = input('Fotos del vehículo');
  readonly agregadas = output<readonly File[]>();
  readonly quitada = output<string>();

  protected readonly visor =
    viewChild.required<ElementRef<HTMLDialogElement>>('visor');

  protected readonly mirando = signal<string | null>(null);
  protected readonly ocupado = signal(false);
  protected readonly pesoLegible = pesoLegible;

  readonly #urls = new Map<string, string>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const url of this.#urls.values()) URL.revokeObjectURL(url);
      this.#urls.clear();
    });
  }

  /**
   * Las fotos con su URL, y de paso la limpieza de las que ya no están.
   *
   * Va en un `computed` porque tiene que recalcularse cuando la lista cambia,
   * y ese es exactamente el momento en que hay que revocar lo que sobra: una
   * foto quitada cuya URL siga viva retiene su blob para siempre.
   */
  protected readonly conUrl = computed(() => {
    const actuales = this.fotos();
    const vivos = new Set(actuales.map((f) => f.id));

    for (const [id, url] of this.#urls) {
      if (vivos.has(id)) continue;
      URL.revokeObjectURL(url);
      this.#urls.delete(id);
    }

    return actuales.map((foto) => {
      let url = this.#urls.get(foto.id);
      if (!url) {
        url = URL.createObjectURL(foto.blob);
        this.#urls.set(foto.id, url);
      }
      return { ...foto, url };
    });
  });

  protected readonly peso = computed(() =>
    this.fotos().reduce((t, f) => t + f.blob.size, 0),
  );

  protected readonly abierta = computed(
    () => this.conUrl().find((f) => f.id === this.mirando()) ?? null,
  );

  protected async alElegirArchivos(evento: Event) {
    const entrada = evento.target as HTMLInputElement;
    const archivos = [...(entrada.files ?? [])];
    /* Se limpia el campo enseguida: sin esto, elegir la MISMA foto dos veces
       seguidas no dispara `change` la segunda vez y parece que no funcionó. */
    entrada.value = '';
    if (!archivos.length) return;

    this.ocupado.set(true);
    try {
      this.agregadas.emit(archivos);
    } finally {
      this.ocupado.set(false);
    }
  }

  protected abrir(id: string) {
    this.mirando.set(id);
    this.visor().nativeElement.showModal();
  }

  protected cerrarVisor() {
    this.visor().nativeElement.close();
  }

  protected alCerrarVisor() {
    this.mirando.set(null);
  }
}
