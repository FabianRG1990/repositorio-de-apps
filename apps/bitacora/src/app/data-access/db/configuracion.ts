import { Repositorio } from './repositorio';
import {
  BitacoraDb,
  NO_BORRADO,
  type Especialidad,
  type Puesto,
  type Taller,
  type Tarifa,
} from './esquema';

/** Los datos del Taller que van impresos (ADR 0008). */
export interface DatosDelTaller {
  readonly nombre: string;
  readonly telefono: string;
  readonly direccion: string;
  readonly cedulaJuridica: string;
}

/**
 * Lo que el Dueño configura.
 *
 * El [ADR 0008] le dio al Perfil Dueño exactamente estas atribuciones, y
 * llevaban sin construir desde entonces: las Especialidades que ofrece el
 * Taller, las Tarifas de cada una, y los datos que van impresos.
 *
 * La regla que las separa: **configurar las Especialidades es lo único que
 * cambia lo que se VE** —con una sola, el filtro del tablero desaparece—; las
 * demás son datos que viajan al papel.
 */
export class ConfiguracionDelTaller {
  constructor(
    private readonly db: BitacoraDb,
    private readonly tallerId: string,
    private readonly repo: Repositorio,
    private readonly ahora: () => string = () => new Date().toISOString(),
  ) {}

  async taller(): Promise<Taller | undefined> {
    return this.db.talleres.get(this.tallerId);
  }

  /**
   * El Taller no pasa por `Repositorio`: no es un `Registro`.
   *
   * Le faltan `tallerId` y `borradoEn` a propósito — es la fila que DEFINE el
   * taller, no una fila que le pertenezca, y borrarla lógicamente no
   * significaría nada. Por eso las marcas se sellan a mano acá.
   */
  async guardarDatos(datos: DatosDelTaller): Promise<void> {
    const taller = await this.taller();
    if (!taller) throw new Error('No existe el Taller');

    await this.db.talleres.put({
      ...taller,
      nombre: datos.nombre.trim(),
      telefono: datos.telefono.trim(),
      direccion: datos.direccion.trim(),
      cedulaJuridica: datos.cedulaJuridica.trim(),
      actualizadoEn: this.ahora(),
      version: taller.version + 1,
    });
  }

  /**
   * Desde cuántos días avisado se señala un Vehículo sin recoger.
   *
   * El [ADR 0009] lo dejó ajustable a propósito: sin talleres reales
   * observados cualquier número es una suposición, y una suposición enterrada
   * en el código no se corrige con lo que se aprenda del uso.
   */
  async fijarDiasParaSinRecoger(dias: number): Promise<void> {
    const taller = await this.taller();
    if (!taller) throw new Error('No existe el Taller');

    await this.db.talleres.put({
      ...taller,
      diasParaSinRecoger: Math.max(1, Math.round(dias)),
      actualizadoEn: this.ahora(),
      version: taller.version + 1,
    });
  }

  /**
   * Qué Especialidades ofrece.
   *
   * **Nunca se queda sin ninguna.** Un Taller que no ofrece nada no puede
   * recibir un carro: cada Línea de servicio lleva Especialidad (ADR 0001), y
   * sin ninguna configurada no habría de dónde elegirla.
   */
  async guardarEspecialidades(
    especialidades: readonly Especialidad[],
  ): Promise<void> {
    if (!especialidades.length) {
      throw new Error('El Taller tiene que ofrecer al menos una Especialidad');
    }

    const taller = await this.taller();
    if (!taller) throw new Error('No existe el Taller');

    await this.db.talleres.put({
      ...taller,
      especialidades: [...especialidades],
      actualizadoEn: this.ahora(),
      version: taller.version + 1,
    });
  }

  /* --- Tarifas ------------------------------------------------------------ */

  async tarifas(): Promise<readonly Tarifa[]> {
    return (await this.repo.vivos(this.db.tarifas).toArray()).sort((a, b) =>
      a.especialidad.localeCompare(b.especialidad),
    );
  }

  /**
   * Cuánto cobra la hora de una Especialidad.
   *
   * Hay como mucho UNA Tarifa viva por Especialidad: se actualiza la que haya
   * en vez de crear otra. Dos tarifas vivas para el mismo oficio dejarían a
   * quien las lea eligiendo cuál vale, que es una pregunta sin respuesta.
   */
  async fijarTarifa(
    especialidad: Especialidad,
    porHora: number,
  ): Promise<void> {
    const existente = (await this.tarifas()).find(
      (t) => t.especialidad === especialidad,
    );

    if (existente) {
      await this.repo.actualizar(this.db.tarifas, existente.id, { porHora });
      return;
    }
    await this.repo.crear(this.db.tarifas, { especialidad, porHora });
  }

  /* --- Puestos ------------------------------------------------------------ */

  async puestos(): Promise<readonly Puesto[]> {
    return (await this.repo.vivos(this.db.puestos).toArray()).sort((a, b) =>
      a.letra.localeCompare(b.letra),
    );
  }

  /**
   * Comprueba la letra de un Puesto antes de guardarla.
   *
   * El [ADR 0010] hizo que la letra encabece el Folio, y que cada Puesto lleve
   * su propio consecutivo para que dos Puestos sin conexión nunca acuñen el
   * mismo. Esa promesa se cae si dos Puestos comparten letra, o si uno la deja
   * en blanco: los Folios dejarían de distinguirse.
   *
   * Devuelve el motivo, no un booleano, porque quien lo llama tiene que poder
   * decirle a la persona QUÉ está mal.
   */
  async porQueNoSirveLaLetra(
    letra: string,
    exceptoId?: string,
  ): Promise<string | null> {
    const limpia = letra.trim().toUpperCase();
    if (!limpia) return 'La letra no puede quedar en blanco.';

    const repetida = (await this.puestos()).some(
      (p) => p.id !== exceptoId && p.letra.toUpperCase() === limpia,
    );
    return repetida
      ? `Ya hay un puesto con la letra ${limpia}. Dos puestos con la misma letra acuñarían folios iguales.`
      : null;
  }

  async crearPuesto(nombre: string, letra: string): Promise<Puesto> {
    const problema = await this.porQueNoSirveLaLetra(letra);
    if (problema) throw new Error(problema);

    return this.repo.crear(this.db.puestos, {
      nombre: nombre.trim() || 'Sin nombre',
      letra: letra.trim().toUpperCase(),
      /* Arranca en cero: el primer Folio de un Puesto nuevo es el 1, no el
         siguiente de otro. `acunarFolio` incrementa antes de usar. */
      consecutivo: 0,
    });
  }

  async renombrarPuesto(
    id: string,
    nombre: string,
    letra: string,
  ): Promise<void> {
    const problema = await this.porQueNoSirveLaLetra(letra, id);
    if (problema) throw new Error(problema);

    await this.repo.actualizar(this.db.puestos, id, {
      nombre: nombre.trim() || 'Sin nombre',
      letra: letra.trim().toUpperCase(),
    });
  }

  /**
   * Quitar un Puesto.
   *
   * **No se puede quitar el último.** Sin Puesto no se acuña Folio, y sin
   * Folio no se recibe un carro: la app dejaría de poder hacer lo único que
   * tiene que hacer.
   *
   * Es borrado lógico, así que los Folios que ese Puesto acuñó siguen
   * significando lo mismo.
   */
  async quitarPuesto(id: string): Promise<void> {
    const vivos = await this.puestos();
    if (vivos.length <= 1) {
      throw new Error(
        'Tiene que quedar al menos un puesto: sin puesto no se puede recibir un vehículo.',
      );
    }
    await this.repo.borrar(this.db.puestos, id);
  }

  /** Cuántas Órdenes acuñó ya, para poder decirlo antes de quitarlo. */
  async ordenesDelPuesto(id: string): Promise<number> {
    return (
      await this.db.ordenes
        .where('[tallerId+borradoEn]')
        .equals([this.tallerId, NO_BORRADO])
        .toArray()
    ).filter((o) => o.puestoId === id).length;
  }
}
