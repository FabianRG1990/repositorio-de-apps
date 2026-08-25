import { Repositorio } from './repositorio';
import {
  BitacoraDb,
  NO_BORRADO,
  type Especialidad,
  type Papel,
  type Persona,
} from './esquema';

/** Lo que se captura de una Persona. Lo demás lo sella el `Repositorio`. */
export interface DatosDePersona {
  readonly nombre: string;
  readonly papel: Papel;
  readonly especialidades: readonly Especialidad[];
}

/**
 * La gente del Taller.
 *
 * `personas` era la última tabla del esquema sin un solo uso: existe desde
 * [#74] y quedó fuera dos veces a propósito —[#114] no la puso en Ajustes,
 * [#116] no puso el Responsable en la Orden— las dos por la misma razón, que
 * el personal no existía.
 *
 * El costo era que el [ADR 0003] prometía **un Responsable por Orden** y
 * `responsableId` valía `null` en los tres sitios que crean Órdenes.
 *
 * Nada de esto es autenticación. El [ADR 0005] es tajante: el Perfil dice qué
 * se OFRECE, *"no qué está permitido"*, y que ahora las personas tengan nombre
 * no cambia eso — no hay contraseña, ni guarda, ni nada que se le parezca.
 */
export class PersonalDelTaller {
  constructor(
    private readonly db: BitacoraDb,
    private readonly tallerId: string,
    private readonly repo: Repositorio,
  ) {}

  /**
   * Todo el personal vivo, ordenado por nombre.
   *
   * Por nombre y no por papel: la lista se usa para BUSCAR a alguien, y quien
   * busca sabe el nombre. Agrupar por papel obligaría a saber primero en qué
   * casilla lo metieron.
   */
  async personas(): Promise<readonly Persona[]> {
    return (await this.repo.vivos(this.db.personas).toArray()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es'),
    );
  }

  /** Los de un papel. De acá sale a quién se le puede atribuir una Orden. */
  async delPapel(papel: Papel): Promise<readonly Persona[]> {
    return (await this.personas()).filter((p) => p.papel === papel);
  }

  /**
   * Comprueba el nombre antes de guardarlo.
   *
   * Se exige y se comprueba repetido porque el nombre es lo ÚNICO que
   * identifica a una Persona en pantalla: no hay cédula, ni carné, ni foto. Dos
   * "Luis Vargas" en la lista de Responsables dejan a quien elige adivinando
   * cuál es cuál, y la Orden queda a nombre de una moneda al aire.
   *
   * Devuelve el motivo y no un booleano, porque quien lo llama tiene que poder
   * decirle a la persona QUÉ está mal.
   */
  async porQueNoSirveElNombre(
    nombre: string,
    exceptoId?: string,
  ): Promise<string | null> {
    const limpio = nombre.trim();
    if (!limpio) return 'El nombre no puede quedar en blanco.';

    const repetido = (await this.personas()).some(
      (p) =>
        p.id !== exceptoId &&
        p.nombre.localeCompare(limpio, 'es', { sensitivity: 'base' }) === 0,
    );
    return repetido
      ? `Ya hay alguien que se llama ${limpio}. Dos nombres iguales no se distinguen a la hora de elegir el responsable.`
      : null;
  }

  async crear(datos: DatosDePersona): Promise<Persona> {
    const problema = await this.porQueNoSirveElNombre(datos.nombre);
    if (problema) throw new Error(problema);

    return this.repo.crear(this.db.personas, {
      nombre: datos.nombre.trim(),
      papel: datos.papel,
      especialidades: this.#especialidadesDe(datos),
    });
  }

  async editar(id: string, datos: DatosDePersona): Promise<void> {
    const problema = await this.porQueNoSirveElNombre(datos.nombre, id);
    if (problema) throw new Error(problema);

    await this.repo.actualizar(this.db.personas, id, {
      nombre: datos.nombre.trim(),
      papel: datos.papel,
      especialidades: this.#especialidadesDe(datos),
    });
  }

  /**
   * Dar de baja a alguien.
   *
   * Es borrado lógico, como todo acá, y esta vez importa más que de costumbre:
   * las Órdenes que esa Persona respondió siguen apuntando a su `id`. Si la
   * fila desapareciera, el historial diría que esas Órdenes no fueron de nadie
   * — y quién respondió por un trabajo no deja de ser cierto porque la persona
   * se haya ido del taller.
   *
   * **No se le quita el Responsable a las Órdenes que ya tiene**, ni siquiera a
   * las abiertas. Reasignar es una decisión del Taller, no una consecuencia
   * automática de una baja, y hacerlo en silencio borraría el dato justo
   * cuando alguien va a preguntar por él.
   */
  async quitar(id: string): Promise<void> {
    await this.repo.borrar(this.db.personas, id);
  }

  /** Cuántas Órdenes abiertas responde, para poder decirlo antes de la baja. */
  async ordenesAbiertasDe(id: string): Promise<number> {
    return (
      await this.db.ordenes
        .where('[tallerId+borradoEn]')
        .equals([this.tallerId, NO_BORRADO])
        .toArray()
    ).filter((o) => o.responsableId === id && o.estado !== 'entregado').length;
  }

  /**
   * Solo el Técnico lleva Especialidades.
   *
   * El glosario define la Especialidad como lo que se **ejecuta**; el Asesor
   * trata con el Cliente y el Dueño responde por el taller. Guardárselas a
   * ellos sería un dato que nada lee y que al primer cambio de papel queda
   * mintiendo.
   *
   * El [ADR 0003] avisa además que el MVP **no valida** la relación
   * Técnico↔Especialidad: sin ejecutor por Línea no hay nada contra qué
   * comprobarla. Se captura, no bloquea nada.
   */
  #especialidadesDe(datos: DatosDePersona): Especialidad[] {
    return datos.papel === 'tecnico' ? [...datos.especialidades] : [];
  }
}
