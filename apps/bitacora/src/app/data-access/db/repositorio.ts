import type { EntityTable, Table } from 'dexie';
import { uuidv7 } from 'uuidv7';
import {
  ABIERTO,
  BitacoraDb,
  NO_BORRADO,
  type OperacionPendiente,
  type Registro,
} from './esquema';

/**
 * El punto único de escritura.
 *
 * Todo lo que toca la base pasa por acá, y no es una convención de estilo: es
 * lo que sostiene dos invariantes que IndexedDB no puede sostener sola.
 *
 * 1. **La fila del outbox se escribe en la MISMA transacción que el dato.**
 *    Encolar aparte crea estados donde el dato se guardó y la operación se
 *    perdió, o al revés.
 * 2. **La unicidad condicional de la placa vigente.** IndexedDB no tiene
 *    índices parciales: `UNIQUE(tallerId, placa) WHERE vigente` no es
 *    expresable. Si las escrituras se dispersan, esa invariante no se puede
 *    recuperar después.
 *
 * Los identificadores son **UUIDv7**, no v4: van ordenados por tiempo, así que
 * los listados "lo más reciente" salen del propio índice de la clave. Cambiar
 * el esquema de IDs más tarde obliga a reescribir cada fila y cada referencia
 * en bases locales que nadie puede alcanzar — es la decisión más cara de
 * revertir de toda la capa.
 */
export class Repositorio {
  constructor(
    protected readonly db: BitacoraDb,
    protected readonly tallerId: string,
    /** Inyectable para que las pruebas no dependan del reloj de la máquina. */
    protected readonly ahora: () => string = () => new Date().toISOString(),
  ) {}

  /** Crea sellando las marcas y encolando la operación, todo en una vuelta. */
  async crear<T extends Registro>(
    tabla: EntityTable<T, 'id'>,
    datos: Omit<T, keyof Registro>,
  ): Promise<T> {
    const momento = this.ahora();
    const fila = {
      ...datos,
      id: uuidv7(),
      tallerId: this.tallerId,
      creadoEn: momento,
      actualizadoEn: momento,
      borradoEn: NO_BORRADO,
      version: 1,
    } as unknown as T;

    await this.db.transaction('rw', tabla, this.db.pendientes, async () => {
      await tabla.add(fila as never);
      await this.#encolar(tabla.name, fila.id, 'crear', {
        ...(fila as unknown as Record<string, unknown>),
      });
    });

    return fila;
  }

  async actualizar<T extends Registro>(
    tabla: EntityTable<T, 'id'>,
    id: string,
    cambios: Partial<Omit<T, keyof Registro>>,
  ): Promise<void> {
    await this.db.transaction('rw', tabla, this.db.pendientes, async () => {
      const actual = await tabla.get(id as never);
      if (!actual) throw new Error(`No existe ${tabla.name}/${id}`);

      await tabla.update(
        id as never,
        {
          ...cambios,
          actualizadoEn: this.ahora(),
          version: actual.version + 1,
        } as never,
      );
      await this.#encolar(
        tabla.name,
        id,
        'actualizar',
        cambios as Record<string, unknown>,
      );
    });
  }

  /**
   * Borrado SIEMPRE lógico.
   *
   * Offline, un borrado tiene que ser un registro y no una ausencia: si la
   * fila desaparece, al sincronizar no hay forma de distinguir "esto lo borré"
   * de "esto todavía no me llegó", y el registro resucita. Convertirlo en
   * lógico más tarde no se puede migrar, porque la información ya no existe.
   */
  async borrar<T extends Registro>(
    tabla: EntityTable<T, 'id'>,
    id: string,
  ): Promise<void> {
    const momento = this.ahora();
    await this.db.transaction('rw', tabla, this.db.pendientes, async () => {
      const actual = await tabla.get(id as never);
      if (!actual) throw new Error(`No existe ${tabla.name}/${id}`);

      await tabla.update(
        id as never,
        {
          borradoEn: momento,
          actualizadoEn: momento,
          version: actual.version + 1,
        } as never,
      );
      await this.#encolar(tabla.name, id, 'borrar', { borradoEn: momento });
    });
  }

  /** Lo vivo de una tabla: `borradoEn` es el centinela, nunca `null`. */
  vivos<T extends Registro>(tabla: EntityTable<T, 'id'>) {
    return tabla
      .where('[tallerId+borradoEn]')
      .equals([this.tallerId, NO_BORRADO]);
  }

  async #encolar(
    entidad: string,
    entidadId: string,
    operacion: OperacionPendiente['operacion'],
    cambios: Record<string, unknown>,
  ) {
    await this.db.pendientes.add({
      id: uuidv7(),
      tallerId: this.tallerId,
      entidad,
      entidadId,
      operacion,
      cambios,
      creadoEn: this.ahora(),
    } as OperacionPendiente);
  }
}

/**
 * Lo del Vehículo que no cabe en el repositorio genérico: la Placa con su
 * vigencia, y la Fusión.
 */
export class RepositorioVehiculos extends Repositorio {
  /**
   * Cambia la Placa cerrando la anterior y abriendo la nueva, en una sola
   * transacción.
   *
   * Acá vive la invariante que IndexedDB no puede declarar: **un Vehículo
   * tiene como mucho una Placa vigente**. Se comprueba leyendo dentro de la
   * misma transacción `rw`, que es lo que la vuelve fiable.
   */
  async cambiarPlaca(vehiculoId: string, placa: string): Promise<void> {
    const momento = this.ahora();

    await this.db.transaction(
      'rw',
      this.db.vehiculoPlacas,
      this.db.pendientes,
      async () => {
        const vigentes = await this.db.vehiculoPlacas
          .where('[vehiculoId+vigenteHasta]')
          .equals([vehiculoId, ABIERTO])
          .toArray();

        for (const anterior of vigentes) {
          if (anterior.placa === placa) return;
          await this.db.vehiculoPlacas.update(anterior.id, {
            vigenteHasta: momento,
            actualizadoEn: momento,
            version: anterior.version + 1,
          });
        }

        const fila = {
          id: uuidv7(),
          tallerId: this.tallerId,
          vehiculoId,
          placa,
          vigenteDesde: momento,
          // El centinela, no `null`: esta columna está en un índice compuesto
          // y con `null` la placa vigente sería invisible para la consulta.
          vigenteHasta: ABIERTO,
          creadoEn: momento,
          actualizadoEn: momento,
          borradoEn: NO_BORRADO,
          version: 1,
        };

        await this.db.vehiculoPlacas.add(fila);
        await this.db.pendientes.add({
          id: uuidv7(),
          tallerId: this.tallerId,
          entidad: 'vehiculoPlacas',
          entidadId: fila.id,
          operacion: 'crear',
          cambios: { ...fila },
          creadoEn: momento,
        } as OperacionPendiente);
      },
    );
  }

  /** La Placa vigente, o `null` si el Vehículo no tiene ninguna abierta. */
  async placaVigente(vehiculoId: string): Promise<string | null> {
    const fila = await this.db.vehiculoPlacas
      .where('[vehiculoId+vigenteHasta]')
      .equals([vehiculoId, ABIERTO])
      .first();

    return fila?.placa ?? null;
  }

  /**
   * Qué Vehículo llevaba esa Placa en esa fecha.
   *
   * El índice acota por `[tallerId+placa]` y el filtro temporal se hace en
   * memoria a propósito: IndexedDB admite UN solo rango por consulta, así que
   * `vigenteDesde <= fecha` y `vigenteHasta > fecha` no se pueden servir las
   * dos por índice. Con un puñado de placas por vehículo da igual.
   */
  async vehiculoConPlacaEn(placa: string, fecha: string) {
    const candidatas = await this.db.vehiculoPlacas
      .where('[tallerId+placa]')
      .equals([this.tallerId, placa])
      .toArray();

    return (
      candidatas.find((p) => p.vigenteDesde <= fecha && p.vigenteHasta > fecha)
        ?.vehiculoId ?? null
    );
  }

  /**
   * Une dos registros que resultaron ser el mismo carro, conservando el
   * historial de los dos. El absorbido no se borra: queda apuntando al que
   * queda, porque su Folio ya está impreso en papeles que andan por ahí.
   */
  async fusionar(absorbidoId: string, canonicoId: string): Promise<void> {
    const momento = this.ahora();

    await this.db.transaction(
      'rw',
      this.db.vehiculos,
      this.db.ordenes,
      this.db.vehiculoPlacas,
      this.db.propiedades,
      this.db.pendientes,
      async () => {
        await this.db.vehiculos.update(absorbidoId, {
          canonicoId,
          fusionadoEn: momento,
          actualizadoEn: momento,
        });

        for (const tabla of [
          this.db.ordenes,
          this.db.vehiculoPlacas,
          this.db.propiedades,
        ]) {
          await (tabla as unknown as Table<Record<string, unknown>, string>)
            .where('vehiculoId')
            .equals(absorbidoId)
            .modify((fila) => {
              fila['vehiculoId'] = canonicoId;
              fila['actualizadoEn'] = momento;
            });
        }

        await this.db.pendientes.add({
          id: uuidv7(),
          tallerId: this.tallerId,
          entidad: 'vehiculos',
          entidadId: absorbidoId,
          operacion: 'actualizar',
          cambios: { canonicoId, fusionadoEn: momento },
          creadoEn: momento,
        } as OperacionPendiente);
      },
    );
  }
}

/**
 * Acuña el Folio de una Orden: letra del Puesto y consecutivo propio de ese
 * Puesto, incrementado dentro de la transacción para que dos Puestos sin
 * conexión nunca acuñen el mismo.
 *
 * El Folio es PRESENTACIÓN, nunca identidad. Es la única decisión de esta capa
 * cuyo error sale del sistema: el número va impreso en una factura que el
 * Cliente ya tiene en la mano.
 */
export async function acunarFolio(
  db: BitacoraDb,
  puestoId: string,
): Promise<string> {
  return db.transaction('rw', db.puestos, async () => {
    const puesto = await db.puestos.get(puestoId);
    if (!puesto) throw new Error(`No existe el Puesto ${puestoId}`);

    const consecutivo = puesto.consecutivo + 1;
    await db.puestos.update(puestoId, { consecutivo });

    return `${puesto.letra}-${consecutivo}`;
  });
}
