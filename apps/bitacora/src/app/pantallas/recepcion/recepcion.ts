import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { BitacoraDatos } from '../../data-access/db/bitacora-db';
import type {
  CuandoPasa,
  CuartosDeTanque,
  Especialidad,
  SenalDeFalla,
} from '../../data-access/db/esquema';
import type { VehiculoConocido } from '../../data-access/db/recepcion';
import { DetalleStore } from '../../data-access/detalle.store';
import { OrdenesStore } from '../../data-access/ordenes.store';
import {
  ETIQUETA_CUANDO,
  ETIQUETA_ESPECIALIDAD_REPORTE,
  ETIQUETA_SENAL,
  ETIQUETA_TANQUE,
  tanqueLegible,
} from '../../data-access/etiquetas-reporte';
import { interpretar } from '../../data-access/interpretar-reporte';
import {
  CampoDictado,
  type Escrito,
} from '../../shared/campo-dictado/campo-dictado';
import { EtiquetaEspecialidad } from '../../shared/etiqueta-especialidad/etiqueta-especialidad';
import { colones, kilometros } from '../../shared/formato';
import {
  FichaRecepcion,
  type DatosDeFicha,
} from '../../shared/ficha-recepcion/ficha-recepcion';
import {
  GrupoOpciones,
  type Opcion,
} from '../../shared/grupo-opciones/grupo-opciones';
import { Boton } from '../../shared/boton/boton';

export type Paso = 'carro' | 'queja' | 'entrada' | 'ficha';

interface DefinicionDePaso {
  readonly id: Paso;
  readonly titulo: string;
  readonly icono: IconProp;
}

/**
 * Cuatro pasos, ni uno solo ni siete.
 *
 * La recomendación de forma para un formulario por pasos es de tres a cinco,
 * con el contador completo a la vista —"Paso 2 de 4"—, porque lo que quien lo
 * llena necesita saber es cuánto falta, no en cuál va.
 *
 * Cuatro es lo que salió de agrupar por CONVERSACIÓN y no por tabla: primero
 * se habla del carro, después de qué le pasa, después se camina alrededor
 * mirándolo, y al final se confirma. Ese es el orden en que ocurre de verdad
 * en el mostrador.
 */
const PASOS: readonly DefinicionDePaso[] = [
  { id: 'carro', titulo: 'El carro', icono: ['fas', 'car-side'] },
  { id: 'queja', titulo: 'Qué le pasa', icono: ['fas', 'comment-dots'] },
  { id: 'entrada', titulo: 'Cómo entró', icono: ['fas', 'clipboard-check'] },
  { id: 'ficha', titulo: 'Confirmar', icono: ['fas', 'circle-check'] },
];

/* Las etiquetas salen del vocabulario común: el panel de detalle enseña estas
   mismas claves, y una señal escrita de dos formas distintas en la misma app
   se lee como dos cosas distintas. */
const comoOpciones = <C extends string>(
  etiquetas: Record<C, string>,
): readonly Opcion[] =>
  (Object.entries(etiquetas) as [C, string][]).map(([id, etiqueta]) => ({
    id,
    etiqueta,
  }));

const CUANDOS = comoOpciones(ETIQUETA_CUANDO);
const SENALES = comoOpciones(ETIQUETA_SENAL);

/* Atajos para "¿desde cuándo?". El campo sigue siendo texto libre: nadie
   llega diciendo una fecha, dice "como dos semanas". */
const DESDE_CUANDO: readonly Opcion[] = [
  { id: 'Hoy', etiqueta: 'Hoy' },
  { id: 'Esta semana', etiqueta: 'Esta semana' },
  { id: 'Como un mes', etiqueta: 'Como un mes' },
  { id: 'Hace rato', etiqueta: 'Hace rato' },
];

const ESPECIALIDADES = comoOpciones(ETIQUETA_ESPECIALIDAD_REPORTE);
const TANQUE = comoOpciones(ETIQUETA_TANQUE);

/** Una queja mientras se está recogiendo, antes de tener identidad. */
interface Queja {
  readonly clave: number;
  textual: string;
  capturadoPor: 'dictado' | 'tecleado';
  cuando: readonly CuandoPasa[];
  desdeCuando: string;
  senales: readonly SenalDeFalla[];
  especialidad: Especialidad | null;
  /** Lo que propuso el intérprete, para saber si se corrigió a mano. */
  sugerida: Especialidad | null;
  porque: readonly string[];
  titulo: string;
  /* Qué grupos tocó la persona. Desde que toca uno, el intérprete deja de
     escribir en él: desmarcar algo y verlo volver solo dos segundos después
     —porque se siguió dictando— es la clase de detalle que hace que se deje
     de confiar en toda la pantalla. */
  tocoCuando: boolean;
  tocoSenales: boolean;
  tocoEspecialidad: boolean;
}

let siguienteClave = 0;
function quejaVacia(): Queja {
  return {
    clave: siguienteClave++,
    textual: '',
    capturadoPor: 'tecleado',
    cuando: [],
    desdeCuando: '',
    senales: [],
    especialidad: null,
    sugerida: null,
    porque: [],
    titulo: '',
    tocoCuando: false,
    tocoSenales: false,
    tocoEspecialidad: false,
  };
}

function alternar<T extends string>(lista: readonly T[], id: T): readonly T[] {
  return lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
}

/**
 * Recibir un Vehículo, guiado.
 *
 * Lo que había era un formulario plano de ocho campos con un `textarea` al
 * final. Eso alcanza para abrir una Orden, pero no para lo que de verdad
 * compra un taller: la queja del Cliente en sus palabras, con qué la
 * acompaña y desde cuándo, y el estado en que entró el carro. Sin eso el
 * diagnóstico no tiene de dónde colgar y una disputa no tiene con qué
 * contestarse (#15, #106).
 *
 * **La estructura la pone la pantalla, no la voz.** Es lo que permite tener
 * un ayudante que pregunta sin caer en lo que ADR 0004 descartó —dictar una
 * Orden entera y que la máquina la reparta—: cada respuesta sigue siendo un
 * campo de prosa o un botón, y el micrófono solo ahorra tecleo.
 */
@Component({
  selector: 'app-recepcion',
  templateUrl: './recepcion.html',
  styleUrl: './recepcion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Boton,
    FontAwesomeModule,
    CampoDictado,
    GrupoOpciones,
    EtiquetaEspecialidad,
    FichaRecepcion,
  ],
})
export class Recepcion {
  readonly #datos = inject(BitacoraDatos);
  readonly #ordenes = inject(OrdenesStore);
  readonly #detalle = inject(DetalleStore);
  readonly #router = inject(Router);

  protected readonly pasos = PASOS;
  protected readonly cuandos = CUANDOS;
  protected readonly senales = SENALES;
  protected readonly desdeCuando = DESDE_CUANDO;
  protected readonly especialidades = ESPECIALIDADES;
  protected readonly tanque = TANQUE;
  protected readonly colones = colones;
  protected readonly kilometros = kilometros;

  protected readonly paso = signal<Paso>('carro');
  /** Hasta dónde se llegó. Volver atrás nunca quita lo ya alcanzado. */
  protected readonly masLejos = signal(0);

  protected readonly carro = signal({
    placa: '',
    marca: '',
    modelo: '',
    anio: '',
    cliente: '',
    telefono: '',
    quienEntrega: '',
  });

  protected readonly quejas = signal<readonly Queja[]>([quejaVacia()]);

  protected readonly entrada = signal({
    odometro: '',
    combustible: null as CuartosDeTanque | null,
    danosPrevios: '',
    objetosDentro: '',
  });

  protected readonly conocido = signal<VehiculoConocido | null>(null);
  protected readonly buscando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly indicePaso = computed(() =>
    PASOS.findIndex((p) => p.id === this.paso()),
  );

  protected readonly pendienteTotal = computed(() =>
    (this.conocido()?.pendienteDeAntes ?? []).reduce((t, l) => t + l.monto, 0),
  );

  protected readonly quejasConTexto = computed(() =>
    this.quejas().filter((q) => q.textual.trim()),
  );

  /**
   * Todo lo recogido, ya compuesto para leerse.
   *
   * La ficha se arma acá y no dentro del componente que la pinta: así el
   * mismo componente sirve para confirmar antes de recibir y para leer una
   * Orden guardada, sin que sepa de dónde salen los datos.
   */
  protected readonly ficha = computed<DatosDeFicha>(() => {
    const c = this.carro();
    const e = this.entrada();
    const km = Number.parseInt(e.odometro, 10);

    return {
      placa: c.placa,
      carro: [c.marca, c.modelo, c.anio].filter(Boolean).join(' '),
      cliente: c.cliente,
      telefono: c.telefono,
      quienEntrega: c.quienEntrega,
      odometro: Number.isFinite(km) ? km : null,
      combustible: this.etiquetaTanque(e.combustible),
      danosPrevios: e.danosPrevios,
      objetosDentro: e.objetosDentro,
      quejas: this.quejasConTexto().map((q) => {
        const meta = [
          this.etiquetasDe(SENALES, q.senales),
          this.etiquetasDe(CUANDOS, q.cuando),
          q.desdeCuando ? `desde ${q.desdeCuando}` : '',
        ]
          .filter(Boolean)
          .join(' · ');

        return {
          titulo: q.titulo,
          textual: q.textual,
          especialidad: q.especialidad,
          /* Si lo etiquetado no dice nada más que el título, no se repite:
             una sola señal sin nada más produce "No enciende" arriba y "No
             enciende" abajo, que se lee como un error de la pantalla. */
          meta: meta === q.titulo ? '' : meta,
        };
      }),
    };
  });

  /**
   * Qué falta para poder pasar del paso actual, dicho en una frase.
   *
   * Devuelve texto y no un booleano porque un botón apagado sin explicación
   * es indistinguible de uno roto: quien lo mira no sabe si le falta algo o
   * si la app dejó de responder.
   */
  protected readonly faltaParaSeguir = computed<string | null>(() => {
    const c = this.carro();
    switch (this.paso()) {
      case 'carro':
        if (!c.placa.trim()) return 'Falta la placa.';
        if (!c.marca.trim()) return 'Falta la marca.';
        if (!c.cliente.trim()) return 'Falta el nombre del cliente.';
        return null;
      case 'queja':
        return this.quejasConTexto().length
          ? null
          : 'Anotá al menos una cosa de las que dijo el cliente.';
      default:
        return null;
    }
  });

  protected escribirCarro(campo: string, valor: string) {
    this.carro.update((c) => ({ ...c, [campo]: valor }));
    if (campo === 'placa') this.error.set(null);
  }

  protected escribirEntrada(
    campo: 'danosPrevios' | 'objetosDentro',
    escrito: Escrito,
  ) {
    this.entrada.update((x) => ({ ...x, [campo]: escrito.texto }));
  }

  protected escribirOdometro(valor: string) {
    // Solo dígitos: el odómetro no lleva coma, ni punto, ni "km".
    this.entrada.update((x) => ({ ...x, odometro: valor.replace(/\D/g, '') }));
  }

  protected elegirTanque(id: string) {
    this.entrada.update((x) => ({
      ...x,
      combustible: Number(id) as CuartosDeTanque,
    }));
  }

  /**
   * Al salir del campo de la placa se busca si el Taller ya conoce ese carro.
   *
   * Va en `blur` y no en cada tecla: consultar por pulsación dispara una
   * lectura a IndexedDB por letra y, sobre todo, enseñaría "no lo conozco"
   * mientras la placa está a medio escribir, que es ruido y no información.
   */
  protected async buscarPorPlaca() {
    const placa = this.carro().placa.trim();
    if (!placa) {
      this.conocido.set(null);
      return;
    }

    this.buscando.set(true);
    try {
      /* Se espera a que la base esté lista antes de preguntarle. Entrando
         directo a esta pantalla con la app recién abierta, la consulta salía
         antes de que la base terminara de prepararse y contestaba "no lo
         conozco" sobre un carro que sí estaba. */
      await this.#datos.lista;
      const encontrado = await this.#datos.recepcion.reconocer(placa);
      this.conocido.set(encontrado);
      if (!encontrado) return;

      /* Se rellena lo que el Taller ya sabe y queda editable —el carro pudo
         cambiar de dueño—, pero NO se pisa lo que ya esté escrito: quien
         corrigió la marca a mano no quiere verla volver al valor viejo. */
      this.carro.update((c) => ({
        ...c,
        marca: c.marca || encontrado.marca,
        modelo: c.modelo || encontrado.modelo,
        anio: c.anio || (encontrado.anio ? String(encontrado.anio) : ''),
        cliente: c.cliente || encontrado.cliente,
        telefono: c.telefono || encontrado.telefono,
      }));
    } finally {
      this.buscando.set(false);
    }
  }

  /* --- Las quejas -------------------------------------------------------- */

  protected agregarQueja() {
    this.quejas.update((qs) => [...qs, quejaVacia()]);
  }

  protected quitarQueja(clave: number) {
    this.quejas.update((qs) => {
      const quedan = qs.filter((q) => q.clave !== clave);
      // Nunca se queda sin ninguna: un paso vacío no se entiende.
      return quedan.length ? quedan : [quejaVacia()];
    });
  }

  /** El texto cambió: se reinterpreta y se rellena solo lo que nadie tocó. */
  protected escribirQueja(clave: number, escrito: Escrito) {
    this.quejas.update((qs) =>
      qs.map((q) => {
        if (q.clave !== clave) return q;

        const leido = interpretar(escrito.texto);
        return {
          ...q,
          textual: escrito.texto,
          capturadoPor:
            escrito.origen === 'dictado' ? 'dictado' : q.capturadoPor,
          titulo: leido.titulo,
          porque: leido.porque,
          sugerida: leido.especialidad,
          cuando: q.tocoCuando ? q.cuando : leido.cuando,
          senales: q.tocoSenales ? q.senales : leido.senales,
          especialidad: q.tocoEspecialidad
            ? q.especialidad
            : leido.especialidad,
        };
      }),
    );
  }

  protected alternarCuando(clave: number, id: string) {
    this.#tocar(clave, 'tocoCuando', (q) => ({
      ...q,
      cuando: alternar(q.cuando, id as CuandoPasa),
    }));
  }

  protected alternarSenal(clave: number, id: string) {
    this.#tocar(clave, 'tocoSenales', (q) => ({
      ...q,
      senales: alternar(q.senales, id as SenalDeFalla),
    }));
  }

  protected elegirEspecialidad(clave: number, id: string) {
    this.#tocar(clave, 'tocoEspecialidad', (q) => ({
      ...q,
      especialidad: id as Especialidad,
    }));
  }

  protected elegirDesdeCuando(clave: number, id: string) {
    this.escribirDesdeCuando(clave, id);
  }

  protected escribirDesdeCuando(clave: number, valor: string) {
    this.quejas.update((qs) =>
      qs.map((q) => (q.clave === clave ? { ...q, desdeCuando: valor } : q)),
    );
  }

  #tocar(
    clave: number,
    marca: 'tocoCuando' | 'tocoSenales' | 'tocoEspecialidad',
    cambio: (q: Queja) => Queja,
  ) {
    this.quejas.update((qs) =>
      qs.map((q) => (q.clave === clave ? { ...cambio(q), [marca]: true } : q)),
    );
  }

  /* --- Navegación -------------------------------------------------------- */

  protected irA(paso: Paso) {
    const destino = PASOS.findIndex((p) => p.id === paso);
    // Solo hacia donde ya se llegó: adelantarse saltaría lo obligatorio.
    if (destino > this.masLejos()) return;
    this.paso.set(paso);
  }

  protected siguiente() {
    if (this.faltaParaSeguir()) return;
    const indice = this.indicePaso();
    const siguiente = PASOS[indice + 1];
    if (!siguiente) return;
    this.paso.set(siguiente.id);
    this.masLejos.update((m) => Math.max(m, indice + 1));
  }

  protected atras() {
    const anterior = PASOS[this.indicePaso() - 1];
    if (anterior) this.paso.set(anterior.id);
  }

  /* --- El final ---------------------------------------------------------- */

  protected async recibir() {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.error.set(null);

    try {
      await this.#datos.lista;
      const c = this.carro();
      const e = this.entrada();
      const anio = Number.parseInt(c.anio, 10);
      const odometro = Number.parseInt(e.odometro, 10);

      const orden = await this.#datos.recepcion.recibir(
        {
          placa: c.placa,
          marca: c.marca,
          modelo: c.modelo,
          anio: Number.isFinite(anio) ? anio : null,
          cliente: c.cliente,
          telefono: c.telefono,
          quienEntrega: c.quienEntrega,
          odometro: Number.isFinite(odometro) ? odometro : null,
          combustible: e.combustible,
          danosPrevios: e.danosPrevios,
          objetosDentro: e.objetosDentro,
          reportes: this.quejasConTexto().map((q) => ({
            textual: q.textual,
            capturadoPor: q.capturadoPor,
            cuando: q.cuando,
            desdeCuando: q.desdeCuando,
            senales: q.senales,
            especialidadSugerida: q.especialidad,
            /* Se guarda si la sugerencia se corrigió a mano: es lo que
               permitirá saber después si el intérprete acierta, en vez de
               suponerlo. */
            sugerenciaCorregida:
              q.tocoEspecialidad && q.especialidad !== q.sugerida,
          })),
        },
        await this.#datos.puestoActual(),
      );

      /* Se sale al Tablero con la Orden nueva ya seleccionada y su detalle
         abierto: quien acaba de recibir un carro lo siguiente que hace es
         comprobar que quedó donde tenía que quedar. */
      await this.#router.navigateByUrl('/');
      this.#ordenes.seleccionar(orden.folio);
      this.#detalle.pedir();
    } catch (falla) {
      /* No queda nada escrito a medias: `recibir` es una sola transacción. */
      this.error.set(
        'No se pudo recibir el vehículo. No quedó nada guardado a medias, ' +
          'así que se puede volver a intentar. ' +
          (falla instanceof Error ? falla.message : ''),
      );
    } finally {
      this.guardando.set(false);
    }
  }

  protected readonly etiquetaTanque = tanqueLegible;

  protected etiquetasDe(
    opciones: readonly Opcion[],
    ids: readonly string[],
  ): string {
    return ids
      .map((id) => opciones.find((o) => o.id === id)?.etiqueta ?? id)
      .join(' · ');
  }
}
