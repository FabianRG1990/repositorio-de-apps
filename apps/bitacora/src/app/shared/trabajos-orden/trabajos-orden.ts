import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BitacoraDatos } from '../../data-access/db/bitacora-db';
import type {
  Especialidad,
  MedioDeAviso,
  Pagador,
} from '../../data-access/db/esquema';
import {
  enlaceDeWhatsApp,
  mensajeDeAutorizacion,
} from '../../data-access/db/trabajos';
import { ETIQUETA_ESPECIALIDAD_REPORTE } from '../../data-access/etiquetas-reporte';
import { TallerStore } from '../../data-access/taller.store';
import type { Orden } from '../../data-access/ordenes.store';
import { Boton } from '../boton/boton';
import { EtiquetaEspecialidad } from '../etiqueta-especialidad/etiqueta-especialidad';
import { colones } from '../formato';
import { GrupoOpciones, type Opcion } from '../grupo-opciones/grupo-opciones';

const ESPECIALIDADES: readonly Opcion[] = (
  Object.entries(ETIQUETA_ESPECIALIDAD_REPORTE) as [Especialidad, string][]
).map(([id, etiqueta]) => ({ id, etiqueta }));

/* El Pagador es de la Línea y no de la Orden (ADR 0002): una misma Orden lleva
   mecánica que paga el Cliente y pintura que paga una Aseguradora. */
const PAGADORES: readonly Opcion[] = [
  { id: 'cliente', etiqueta: 'El cliente' },
  { id: 'aseguradora', etiqueta: 'Una aseguradora' },
];

/* Los tres medios por los que un "sí" puede llegar. WhatsApp primero porque es
   por donde el ADR 0007 decidió que ocurra la conversación. */
const MEDIOS: readonly Opcion[] = [
  { id: 'whatsapp', etiqueta: 'WhatsApp' },
  { id: 'llamada', etiqueta: 'Llamada' },
  { id: 'presencial', etiqueta: 'En persona' },
];

export const ETIQUETA_MEDIO: Record<MedioDeAviso, string> = {
  whatsapp: 'por WhatsApp',
  llamada: 'por llamada',
  presencial: 'en persona',
};

const TRABAJO_VACIO = {
  descripcion: '',
  especialidad: 'mecanica' as Especialidad,
  pagador: 'cliente' as Pagador,
  horas: '',
  monto: '',
};

/**
 * Los trabajos de una Orden, y lo que se les hace.
 *
 * Tres verbos y nada más: **anotar**, **autorizar** y **declinar**. Es lo que
 * el taller hace entre recibir el carro y entregarlo, y es donde estaba el
 * hueco: la Orden se leía y se imprimía desde #108, pero no se editaba, así
 * que el papel del Cliente solo podía llevar el diagnóstico.
 *
 * La regla que lo gobierna es del glosario: **se autoriza trabajo por trabajo,
 * no la Orden completa**, y la constancia dice quién dijo que sí y por dónde.
 */
@Component({
  selector: 'app-trabajos-orden',
  templateUrl: './trabajos-orden.html',
  styleUrl: './trabajos-orden.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, Boton, EtiquetaEspecialidad, GrupoOpciones],
})
export class TrabajosOrden {
  readonly #datos = inject(BitacoraDatos);
  readonly #taller = inject(TallerStore);

  readonly orden = input.required<Orden>();

  protected readonly especialidades = ESPECIALIDADES;
  protected readonly pagadores = PAGADORES;
  protected readonly medios = MEDIOS;
  protected readonly colones = colones;
  protected readonly etiquetaMedio = ETIQUETA_MEDIO;

  /** Qué formulario está abierto. Solo uno a la vez: la Orden es estrecha. */
  protected readonly anotando = signal(false);
  protected readonly autorizando = signal<string | null>(null);
  protected readonly declinando = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly trabajo = signal({ ...TRABAJO_VACIO });
  protected readonly quienAutoriza = signal('');
  protected readonly medio = signal<MedioDeAviso>('whatsapp');
  protected readonly motivo = signal('');

  /**
   * Lo que la Tarifa sugiere para las horas escritas.
   *
   * Es una SUGERENCIA y no un cálculo, tal como el ADR 0021 lo dejó dicho: la
   * tarifa cubre la mano de obra y el monto incluye repuestos, que es donde
   * #15 encontró que la mecánica hace su dinero. Se enseña al lado del campo y
   * se puede pulsar para copiarla; el campo se sigue escribiendo a mano.
   */
  protected readonly montoSugerido = computed(() => {
    const t = this.trabajo();
    const horas = Number.parseFloat(t.horas);
    const porHora = this.#taller.porHora().get(t.especialidad);
    if (!Number.isFinite(horas) || horas <= 0 || !porHora) return null;
    return Math.round(horas * porHora);
  });

  protected usarSugerencia() {
    const sugerido = this.montoSugerido();
    if (sugerido) this.escribirTrabajo('monto', String(sugerido));
  }

  protected readonly aprobadas = computed(() =>
    this.orden().lineas.filter((l) => !l.declinada),
  );

  protected readonly declinadas = computed(() =>
    this.orden().lineas.filter((l) => l.declinada),
  );

  protected readonly totalAprobado = computed(() =>
    this.aprobadas().reduce((t, l) => t + l.monto, 0),
  );

  protected readonly totalDeclinado = computed(() =>
    this.declinadas().reduce((t, l) => t + l.monto, 0),
  );

  /**
   * Lo que todavía no tiene respuesta del Cliente.
   *
   * Es lo único que entra en el mensaje de WhatsApp: mandarle una lista donde
   * ya aprobó la mitad lo obliga a leerla entera otra vez para encontrar lo
   * que falta.
   */
  protected readonly sinRespuesta = computed(() =>
    this.orden().lineas.filter((l) => !l.declinada && !l.autorizacion),
  );

  protected readonly enlaceWhatsApp = computed(() => {
    const orden = this.orden();
    const pendientes = this.sinRespuesta();
    if (!pendientes.length) return null;

    return enlaceDeWhatsApp(
      orden.telefono,
      mensajeDeAutorizacion({
        folio: orden.folio,
        vehiculo: orden.vehiculo,
        placa: orden.placa,
        pendientes: pendientes.map((l) => ({
          descripcion: l.descripcion,
          monto: l.monto,
        })),
      }),
    );
  });

  /* --- anotar ------------------------------------------------------------ */

  protected escribirTrabajo(campo: keyof typeof TRABAJO_VACIO, valor: string) {
    this.trabajo.update((t) => ({ ...t, [campo]: valor }));
  }

  protected get faltaParaAnotar(): string | null {
    const t = this.trabajo();
    if (!t.descripcion.trim()) return 'Falta decir qué es el trabajo.';
    if (!t.monto.trim()) return 'Falta el monto.';
    return null;
  }

  protected abrirAnotar() {
    this.trabajo.set({ ...TRABAJO_VACIO });
    this.error.set(null);
    this.anotando.set(true);
  }

  protected async anotar() {
    if (this.faltaParaAnotar || this.guardando()) return;
    const t = this.trabajo();

    await this.#operar(() =>
      this.#datos.trabajos.agregar(this.orden().id, {
        descripcion: t.descripcion,
        especialidad: t.especialidad,
        pagador: t.pagador,
        horas: Number.parseFloat(t.horas) || 0,
        monto: Number.parseInt(t.monto.replace(/\D/g, ''), 10) || 0,
      }),
    );
    this.anotando.set(false);
  }

  /* --- autorizar --------------------------------------------------------- */

  protected abrirAutorizar(lineaId: string) {
    this.quienAutoriza.set(this.orden().cliente);
    this.medio.set('whatsapp');
    this.error.set(null);
    this.declinando.set(null);
    this.autorizando.set(lineaId);
  }

  protected async autorizar(lineaId: string) {
    if (!this.quienAutoriza().trim() || this.guardando()) return;

    await this.#operar(() =>
      this.#datos.trabajos.autorizar(lineaId, {
        autorizadaPor: this.quienAutoriza(),
        medio: this.medio(),
      }),
    );
    this.autorizando.set(null);
  }

  /* --- declinar ---------------------------------------------------------- */

  protected abrirDeclinar(lineaId: string) {
    this.motivo.set('');
    this.error.set(null);
    this.autorizando.set(null);
    this.declinando.set(lineaId);
  }

  protected async declinar(lineaId: string) {
    if (this.guardando()) return;

    await this.#operar(() =>
      this.#datos.trabajos.declinar(lineaId, this.motivo()),
    );
    this.declinando.set(null);
  }

  protected async deshacerDeclinacion(lineaId: string) {
    await this.#operar(() => this.#datos.trabajos.deshacerDeclinacion(lineaId));
  }

  protected cancelar() {
    this.anotando.set(false);
    this.autorizando.set(null);
    this.declinando.set(null);
    this.error.set(null);
  }

  /**
   * El envoltorio de toda escritura.
   *
   * La lista NO se refresca a mano: `liveQuery` re-emite cuando la base cambia
   * y el store recompone. Acá solo hay que decir si algo falló.
   */
  async #operar(accion: () => Promise<unknown>) {
    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.#datos.lista;
      await accion();
    } catch (falla) {
      this.error.set(
        'No se pudo guardar. No quedó nada a medias, así que se puede volver ' +
          'a intentar. ' +
          (falla instanceof Error ? falla.message : ''),
      );
    } finally {
      this.guardando.set(false);
    }
  }
}
