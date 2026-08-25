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
import {
  ESTADOS_EN_EL_TALLER,
  mensajeDeListo,
} from '../../data-access/db/ciclo';
import type { EstadoOrden, MedioDeAviso } from '../../data-access/db/esquema';
import { enlaceDeWhatsApp } from '../../data-access/db/trabajos';
import type { Orden } from '../../data-access/ordenes.store';
import { Boton } from '../boton/boton';
import { fechaLarga } from '../formato';
import { GrupoOpciones, type Opcion } from '../grupo-opciones/grupo-opciones';
import { ETIQUETA_MEDIO } from '../trabajos-orden/trabajos-orden';

/* Los mismos rótulos que la insignia del tablero: el estado se llama igual en
   los dos sitios o deja de ser el mismo estado. */
const ETIQUETA_ESTADO: Record<EstadoOrden, string> = {
  recibido: 'Recibido',
  diagnostico: 'En diagnóstico',
  'en-proceso': 'En proceso',
  'esperando-repuesto': 'Esperando repuesto',
  listo: 'Listo para entrega',
  entregado: 'Entregado',
};

const ESTADOS: readonly Opcion[] = ESTADOS_EN_EL_TALLER.map((id) => ({
  id,
  etiqueta: ETIQUETA_ESTADO[id],
}));

const MEDIOS: readonly Opcion[] = [
  { id: 'whatsapp', etiqueta: 'WhatsApp' },
  { id: 'llamada', etiqueta: 'Llamada' },
  { id: 'presencial', etiqueta: 'En persona' },
];

/**
 * El ciclo de la Orden: dónde va el carro y cuándo sale.
 *
 * Estuvo quieto tres tickets a propósito. Lo que lo destraba es que bloqueaba
 * el Aviso de listo ([ADR 0009]) y la Próxima visita ([ADR 0011]), que se
 * escribe **al cerrar la Orden** — y cerrar una Orden no existía.
 *
 * Los estados se ofrecen **sin orden forzado**. Un carro vuelve de "listo" a
 * "en proceso" cuando algo sale mal, y de "esperando repuesto" a "en proceso"
 * cuando llega la pieza: una máquina rígida pelearía con el taller en vez de
 * describirlo.
 */
@Component({
  selector: 'app-ciclo-orden',
  templateUrl: './ciclo-orden.html',
  styleUrl: './ciclo-orden.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, Boton, GrupoOpciones],
})
export class CicloOrden {
  readonly #datos = inject(BitacoraDatos);

  readonly orden = input.required<Orden>();

  protected readonly estados = ESTADOS;
  protected readonly medios = MEDIOS;
  protected readonly etiquetaMedio = ETIQUETA_MEDIO;

  protected readonly avisando = signal(false);
  protected readonly entregando = signal(false);
  protected readonly ocupado = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly aQuien = signal('');
  protected readonly medio = signal<MedioDeAviso>('whatsapp');
  protected readonly proximaVisita = signal('');

  protected readonly entregada = computed(
    () => this.orden().estadoClave === 'entregado',
  );

  protected readonly listo = computed(
    () => this.orden().estadoClave === 'listo',
  );

  protected readonly totalAprobado = computed(() =>
    this.orden()
      .lineas.filter((l) => !l.declinada)
      .reduce((t, l) => t + l.monto, 0),
  );

  protected readonly enlaceWhatsApp = computed(() => {
    const o = this.orden();
    return enlaceDeWhatsApp(
      o.telefono,
      mensajeDeListo({
        folio: o.folio,
        vehiculo: o.vehiculo,
        placa: o.placa,
        total: this.totalAprobado(),
      }),
    );
  });

  /* --- mover el estado ---------------------------------------------------- */

  protected async moverA(estado: string) {
    if (estado === this.orden().estadoClave) return;
    await this.#operar(() =>
      this.#datos.ciclo.moverA(this.orden().id, estado as EstadoOrden),
    );
  }

  protected readonly fechaLarga = fechaLarga;

  protected elegirMedio(medio: string) {
    this.medio.set(medio as MedioDeAviso);
  }

  /* --- avisar ------------------------------------------------------------- */

  protected abrirAviso() {
    /* Se avisa a QUIEN ENTREGA y no al Cliente: en una flotilla es un chofer
       distinto cada vez, y es quien va a venir a recoger el carro. */
    this.aQuien.set(this.orden().cliente);
    this.medio.set('whatsapp');
    this.error.set(null);
    this.entregando.set(false);
    this.avisando.set(true);
  }

  protected async avisar() {
    if (!this.aQuien().trim()) return;
    await this.#operar(async () => {
      await this.#datos.ciclo.avisarQueEstaListo(this.orden().id, {
        avisadoA: this.aQuien(),
        medio: this.medio(),
      });
      this.avisando.set(false);
    });
  }

  /* --- entregar ----------------------------------------------------------- */

  protected abrirEntrega() {
    this.proximaVisita.set('');
    this.error.set(null);
    this.avisando.set(false);
    this.entregando.set(true);
  }

  protected async entregar() {
    await this.#operar(async () => {
      await this.#datos.ciclo.entregar(
        this.orden().id,
        this.proximaVisita() || null,
      );
      this.entregando.set(false);
    });
  }

  protected async deshacerEntrega() {
    await this.#operar(() => this.#datos.ciclo.deshacerEntrega(this.orden().id));
  }

  protected cancelar() {
    this.avisando.set(false);
    this.entregando.set(false);
    this.error.set(null);
  }

  async #operar(accion: () => Promise<unknown>) {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set(null);
    try {
      await this.#datos.lista;
      await accion();
    } catch (falla) {
      this.error.set(
        falla instanceof Error ? falla.message : 'No se pudo guardar.',
      );
    } finally {
      this.ocupado.set(false);
    }
  }
}
