import { Repositorio } from './repositorio';
import {
  BitacoraDb,
  NO_BORRADO,
  type Autorizacion,
  type Especialidad,
  type LineaServicio,
  type MedioDeAviso,
  type Pagador,
} from './esquema';

/** Lo que el Asesor escribe al anotar un trabajo. */
export interface TrabajoNuevo {
  readonly descripcion: string;
  readonly especialidad: Especialidad;
  readonly pagador: Pagador;
  readonly horas: number;
  /**
   * Lo que se le cobra al Pagador por este trabajo, repuestos incluidos.
   *
   * Se escribe, no se calcula. Las Tarifas existen en el esquema pero son de
   * Ajustes › Taller y todavía no hay ninguna; y aunque las hubiera, horas por
   * tarifa da la **mano de obra**, no el trabajo: #15 encontró que el margen
   * sobre repuestos es donde la mecánica hace su dinero.
   */
  readonly monto: number;
}

/** Quién dijo que sí, y por dónde. */
export interface ConstanciaDeAutorizacion {
  readonly autorizadaPor: string;
  readonly medio: MedioDeAviso;
}

/**
 * Lo que se le hace a una Orden después de recibirla: anotar trabajos,
 * registrar que el Cliente los aprobó, y registrar que no.
 *
 * La regla que gobierna todo esto es del glosario y del [ADR 0007]: **se
 * autoriza trabajo por trabajo, no la Orden completa**, y la constancia dice
 * quién autorizó y por qué medio. #15 lo pone más crudo: es lo único que
 * protege al taller en una disputa.
 */
export class TrabajosDeLaOrden {
  constructor(
    private readonly db: BitacoraDb,
    private readonly repo: Repositorio,
    private readonly ahora: () => string = () => new Date().toISOString(),
  ) {}

  /** Anota un trabajo. Nace sin autorizar: nadie ha dicho que sí todavía. */
  async agregar(
    ordenId: string,
    trabajo: TrabajoNuevo,
  ): Promise<LineaServicio> {
    return this.repo.crear(this.db.lineas, {
      ordenId,
      descripcion: trabajo.descripcion.trim(),
      especialidad: trabajo.especialidad,
      pagador: trabajo.pagador,
      horasFacturadas: trabajo.horas,
      /* Las horas REALES las llena el técnico al trabajar, no el asesor al
         cotizar. Se guardan separadas desde el día uno porque #15 encontró que
         la eficiencia del técnico es irrecuperable si se mezclan. */
      horasReales: 0,
      monto: trabajo.monto,
      declinadaEn: NO_BORRADO,
      motivoDeclinacion: null,
    });
  }

  /**
   * El Cliente dijo que sí.
   *
   * Si la Línea estaba declinada, **deja de estarlo**. Una Línea autorizada y
   * declinada a la vez no es un estado más rico: es una constancia que se
   * contradice, y la constancia existe precisamente para que alguien pueda
   * apoyarse en ella meses después.
   *
   * Las dos escrituras van en una transacción por lo mismo de siempre: una
   * autorización sin su Línea actualizada, o al revés, no significa nada.
   */
  async autorizar(
    lineaId: string,
    constancia: ConstanciaDeAutorizacion,
  ): Promise<Autorizacion> {
    return this.db.transaction(
      'rw',
      [this.db.lineas, this.db.autorizaciones, this.db.pendientes],
      async () => {
        const linea = await this.db.lineas.get(lineaId);
        if (!linea) throw new Error(`No existe la línea ${lineaId}`);

        if (linea.declinadaEn !== NO_BORRADO) {
          await this.repo.actualizar(this.db.lineas, lineaId, {
            declinadaEn: NO_BORRADO,
            motivoDeclinacion: null,
          });
        }

        /* Si ya estaba autorizada se retira la constancia anterior en vez de
           apilar otra: la pregunta que la Orden tiene que poder contestar es
           "quién autorizó esto", en singular. Se borra en lógico —como todo
           acá— así que el historial no se pierde. */
        for (const previa of await this.#autorizacionesVivas(lineaId)) {
          await this.repo.borrar(this.db.autorizaciones, previa.id);
        }

        return this.repo.crear(this.db.autorizaciones, {
          lineaId,
          autorizadaPor: constancia.autorizadaPor.trim(),
          medio: constancia.medio,
          autorizadaEn: this.ahora(),
        });
      },
    );
  }

  /**
   * El Cliente dijo que no.
   *
   * Conserva motivo y monto: el Trabajo declinado vuelve a proponerse cuando
   * el Vehículo regresa (glosario), y sin el monto la propuesta habría que
   * rehacerla de memoria.
   *
   * Si estaba autorizada, la autorización se retira. Mismo motivo que arriba:
   * la constancia no puede decir que el Cliente aprobó algo que rechazó.
   */
  async declinar(lineaId: string, motivo: string): Promise<void> {
    const momento = this.ahora();

    await this.db.transaction(
      'rw',
      [this.db.lineas, this.db.autorizaciones, this.db.pendientes],
      async () => {
        const linea = await this.db.lineas.get(lineaId);
        if (!linea) throw new Error(`No existe la línea ${lineaId}`);

        for (const previa of await this.#autorizacionesVivas(lineaId)) {
          await this.repo.borrar(this.db.autorizaciones, previa.id);
        }

        await this.repo.actualizar(this.db.lineas, lineaId, {
          declinadaEn: momento,
          motivoDeclinacion: motivo.trim() || null,
        });
      },
    );
  }

  /**
   * Deshacer la declinación.
   *
   * Existe porque declinar es un clic sin vuelta atrás sobre una tableta que
   * se usa de pie: un dedo torpe no puede costar una venta. NO devuelve la
   * autorización que hubiera antes — eso hay que volver a registrarlo, porque
   * quién dijo que sí y cuándo es un hecho, no un estado que se restaura.
   */
  async deshacerDeclinacion(lineaId: string): Promise<void> {
    await this.repo.actualizar(this.db.lineas, lineaId, {
      declinadaEn: NO_BORRADO,
      motivoDeclinacion: null,
    });
  }

  /** La constancia viva de una Línea, si alguien la autorizó. */
  async autorizacionDe(lineaId: string): Promise<Autorizacion | null> {
    return (await this.#autorizacionesVivas(lineaId))[0] ?? null;
  }

  async #autorizacionesVivas(lineaId: string): Promise<Autorizacion[]> {
    return (
      await this.db.autorizaciones.where('lineaId').equals(lineaId).toArray()
    ).filter((a) => a.borradoEn === NO_BORRADO);
  }
}

/**
 * El mensaje que el Asesor le manda al Cliente para pedirle la autorización.
 *
 * El [ADR 0007] decidió que la conversación ocurra por WhatsApp, desde el
 * teléfono del Asesor y sin servidor: acá solo se arma el texto y se abre
 * `wa.me` con él listo. Bitácora no manda nada.
 *
 * Solo entra lo que **no está autorizado ni declinado**: mandarle al Cliente
 * una lista donde ya aprobó la mitad lo obliga a leerla entera otra vez para
 * encontrar lo que falta.
 */
export function mensajeDeAutorizacion(datos: {
  readonly folio: string;
  readonly vehiculo: string;
  readonly placa: string;
  readonly pendientes: readonly {
    readonly descripcion: string;
    readonly monto: number;
  }[];
}): string {
  const colones = (monto: number) => `₡${monto.toLocaleString('es-CR')}`;
  const total = datos.pendientes.reduce((t, l) => t + l.monto, 0);

  return [
    `Orden ${datos.folio} · ${datos.vehiculo} (${datos.placa})`,
    '',
    'Le cuento lo que encontramos:',
    ...datos.pendientes.map((l) => `• ${l.descripcion} — ${colones(l.monto)}`),
    '',
    `Total: ${colones(total)}`,
    '',
    '¿Le damos para adelante?',
  ].join('\n');
}

/** El enlace que abre WhatsApp con el mensaje puesto. */
export function enlaceDeWhatsApp(telefono: string, mensaje: string): string {
  /* Solo dígitos: `wa.me` no acepta guiones ni espacios, y en Costa Rica los
     teléfonos se escriben "8888-1111" en todas partes. El 506 se antepone
     cuando el número trae los ocho dígitos de acá y ningún indicativo. */
  const soloDigitos = telefono.replace(/\D/g, '');
  const numero = soloDigitos.length === 8 ? `506${soloDigitos}` : soloDigitos;

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
