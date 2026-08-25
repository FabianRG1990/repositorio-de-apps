import { Repositorio } from './repositorio';
import {
  BitacoraDb,
  NO_BORRADO,
  type AvisoDeListo,
  type EstadoOrden,
  type MedioDeAviso,
} from './esquema';

/**
 * Los estados por los que pasa un carro, en el orden en que suelen ocurrir.
 *
 * El orden es para PRESENTARLOS, no para imponerlos. Un carro vuelve de
 * "listo" a "en proceso" cuando algo sale mal, y de "esperando repuesto" a
 * "en proceso" cuando llega la pieza: una máquina rígida pelearía con el
 * taller en vez de describirlo.
 */
export const ESTADOS_EN_EL_TALLER: readonly EstadoOrden[] = [
  'recibido',
  'diagnostico',
  'en-proceso',
  'esperando-repuesto',
  'listo',
];

/** Quién recibió el aviso, y por dónde. */
export interface ConstanciaDeAviso {
  readonly avisadoA: string;
  readonly medio: MedioDeAviso;
}

/**
 * El ciclo de una Orden: de recibida a entregada.
 *
 * Estuvo quieto a propósito durante tres tickets porque es una máquina de
 * estados con sus propias decisiones. Lo que la destraba es que ya bloqueaba
 * otras dos cosas: el Aviso de listo ([ADR 0009]) y la Próxima visita
 * ([ADR 0011]), que se escribe **al cerrar la Orden**.
 */
export class CicloDeLaOrden {
  constructor(
    private readonly db: BitacoraDb,
    private readonly repo: Repositorio,
    private readonly ahora: () => string = () => new Date().toISOString(),
  ) {}

  /**
   * Mover el estado, sin orden forzado.
   *
   * Lo único que NO es un cambio de estado más es entregar: eso saca el carro
   * del taller y fija la fecha, así que tiene su propio verbo. Llegar a
   * `entregado` por acá sería fijar el estado sin fijar `entregadoEn`, y una
   * Orden entregada sin fecha de entrega no significa nada.
   */
  async moverA(ordenId: string, estado: EstadoOrden): Promise<void> {
    if (estado === 'entregado') {
      throw new Error('Para entregar el vehículo, usá "Entregar".');
    }

    await this.repo.actualizar(this.db.ordenes, ordenId, {
      estado,
      /* Volver a meter al taller un carro ya entregado limpia la fecha: si se
         quedara, la Orden diría que salió y sigue adentro a la vez. */
      entregadoEn: NO_BORRADO,
    });
  }

  /**
   * Registrar que se le avisó a Quien entrega.
   *
   * El [ADR 0009] decidió que Bitácora **arme el mensaje** y **registre el
   * hecho**, y que el mensaje salga por WhatsApp desde el teléfono del Asesor.
   * La constancia dice que se mandó, no que lo leyeron: WhatsApp está fuera
   * del sistema y no devuelve confirmación de lectura.
   *
   * Avisar NO mueve el estado por su cuenta. Son dos hechos distintos —el
   * trabajo terminó, y se le avisó al Cliente— y juntarlos haría imposible
   * registrar el segundo cuando el primero ya se había marcado antes.
   */
  async avisarQueEstaListo(
    ordenId: string,
    constancia: ConstanciaDeAviso,
  ): Promise<AvisoDeListo> {
    return this.db.transaction(
      'rw',
      [this.db.avisos, this.db.pendientes],
      async () => {
        /* Como con la Autorización: se retira el aviso anterior en vez de
           apilar otro. La pregunta que la Orden contesta es "¿se avisó, y
           cuándo?", en singular. Se borra en lógico, así que el historial
           sigue ahí. */
        for (const previo of await this.#avisosVivos(ordenId)) {
          await this.repo.borrar(this.db.avisos, previo.id);
        }

        return this.repo.crear(this.db.avisos, {
          ordenId,
          avisadoA: constancia.avisadoA.trim(),
          medio: constancia.medio,
          avisadoEn: this.ahora(),
        });
      },
    );
  }

  /** El aviso vigente de una Orden, si se dio alguno. */
  async avisoDe(ordenId: string): Promise<AvisoDeListo | null> {
    return (await this.#avisosVivos(ordenId))[0] ?? null;
  }

  /**
   * Entregar el Vehículo.
   *
   * Fija la fecha de entrega y, si el Asesor la escribió, la Próxima visita.
   * **La fecha se ofrece, no se exige** ([ADR 0011]): obligar a escribirla
   * produce fechas inventadas, y una lista de recordatorios llena de fechas
   * puestas por salir del paso vale menos que una lista corta.
   */
  async entregar(ordenId: string, proximaVisita: string | null): Promise<void> {
    await this.repo.actualizar(this.db.ordenes, ordenId, {
      estado: 'entregado',
      entregadoEn: this.ahora(),
      proximaVisita: proximaVisita?.trim() || null,
    });
  }

  /**
   * Deshacer la entrega.
   *
   * Entregar es un clic que cambia el mundo —el carro sale del tablero— y un
   * dedo torpe sobre una tableta no puede costar eso. Vuelve a `listo`, que
   * es el estado en el que estaba para poder entregarse.
   *
   * NO borra la Próxima visita: esa la escribió una persona pensando en el
   * carro, no en el estado de la Orden.
   */
  async deshacerEntrega(ordenId: string): Promise<void> {
    await this.repo.actualizar(this.db.ordenes, ordenId, {
      estado: 'listo',
      entregadoEn: NO_BORRADO,
    });
  }

  async #avisosVivos(ordenId: string): Promise<AvisoDeListo[]> {
    return (
      await this.db.avisos.where('ordenId').equals(ordenId).toArray()
    ).filter((a) => a.borradoEn === NO_BORRADO);
  }
}

/**
 * El mensaje de "ya está listo".
 *
 * Mismo mecanismo que el de la Autorización ([ADR 0007] y [ADR 0009]): se arma
 * el texto y lo manda WhatsApp. Bitácora no habla con nadie.
 */
export function mensajeDeListo(datos: {
  readonly folio: string;
  readonly vehiculo: string;
  readonly placa: string;
  readonly total: number;
}): string {
  const colones = `₡${datos.total.toLocaleString('es-CR')}`;

  return [
    `Orden ${datos.folio} · ${datos.vehiculo} (${datos.placa})`,
    '',
    'Su vehículo ya está listo, puede pasar a recogerlo.',
    ...(datos.total > 0 ? ['', `Total: ${colones}`] : []),
  ].join('\n');
}

/**
 * Cuántos días lleva listo sin que nadie lo recoja.
 *
 * `null` cuando no se ha avisado: el reloj del Vehículo sin recoger arranca
 * con el AVISO y no con el trabajo terminado. Un carro listo del que nadie se
 * enteró no es un carro que el Cliente esté dejando ahí — es uno al que el
 * Taller todavía no ha llamado, y eso es problema del Taller.
 */
export function diasSinRecoger(
  avisadoEn: string | null,
  ahora: number = Date.now(),
): number | null {
  if (!avisadoEn) return null;
  const transcurrido = ahora - new Date(avisadoEn).getTime();
  return Math.max(0, Math.floor(transcurrido / 86_400_000));
}

/**
 * El mensaje de "le tocaba volver".
 *
 * Bitácora no manda nada por su cuenta ([ADR 0011]): la lista dice a quién
 * llamar, una persona decide y envía. Es el mismo mecanismo del Aviso de
 * listo y de la Autorización.
 *
 * Si quedó trabajo declinado, va en el mensaje. El [ADR 0011] lo dice: la
 * visita planificada y el trabajo que el Cliente no aprobó son dos caminos
 * hacia la misma conversación, y el Asesor que llama sin eso a mano llama sin
 * saber qué proponer.
 */
export function mensajeDeProximaVisita(datos: {
  readonly taller: string;
  readonly vehiculo: string;
  readonly placa: string;
  readonly fecha: string;
  readonly pendiente: readonly string[];
}): string {
  const saludo = datos.taller
    ? `Buenas, le escribimos de ${datos.taller}.`
    : 'Buenas, le escribimos del taller.';

  return [
    saludo,
    '',
    `Su ${datos.vehiculo} (${datos.placa}) tenía revisión para el ${datos.fecha}.`,
    ...(datos.pendiente.length
      ? [
          '',
          'Quedó pendiente de la última visita:',
          ...datos.pendiente.map((p) => `- ${p}`),
        ]
      : []),
    '',
    '¿Le parece si lo agendamos?',
  ].join('\n');
}
