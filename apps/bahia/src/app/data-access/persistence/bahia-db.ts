import {
  deleteDB,
  DBSchema,
  IDBPDatabase,
  IDBPTransaction,
  openDB,
  StoreNames,
} from 'idb';
import { Cliente } from '../models/cliente.model';
import { Factura } from '../models/factura.model';
import { OrdenTrabajo } from '../models/orden-trabajo.model';
import { Taller } from '../models/taller.model';
import { Usuario } from '../models/usuario.model';
import { Vehiculo } from '../models/vehiculo.model';
import {
  SEED_CLIENTES,
  SEED_FACTURAS,
  SEED_ORDENES,
  SEED_TALLER,
  SEED_USUARIOS,
  SEED_VEHICULOS,
} from '../seed/seed-data';

interface BahiaDbSchema extends DBSchema {
  talleres: { key: string; value: Taller };
  usuarios: { key: string; value: Usuario };
  clientes: { key: string; value: Cliente };
  vehiculos: { key: string; value: Vehiculo };
  ordenes: { key: string; value: OrdenTrabajo };
  facturas: { key: string; value: Factura };
  puesto: { key: string; value: { id: string; codigo: string } };
}

const DB_NAME = 'bahia-db';
// v2 agrega `facturas` (ver issue #11) y v3 el `puesto` (ver issue #46) — el
// `upgrade` de abajo distingue instalación fresca de actualización por
// `oldVersion`, para no recrear (y volver a sembrar) los object stores que ya
// existen en una base real que un navegador ya haya persistido.
const DB_VERSION = 3;

// Clave del único registro de `puesto`: cada base pertenece a un navegador, y
// cada navegador es un puesto.
const PUESTO_ACTUAL = 'actual';

// Código atribuido a los folios que ya existían antes de que hubiera puestos.
// Es el mismo que usa el seed, porque representan lo que emitió el taller
// hasta ahora.
const PUESTO_HISTORICO = 'A1';

// Dos caracteres base36 en mayúscula — 1296 combinaciones. Corto para dictarlo
// por teléfono junto al folio, que es como se usa en la práctica.
function generarCodigoPuesto(): string {
  const parte = () =>
    Math.floor(Math.random() * 36)
      .toString(36)
      .toUpperCase();
  return `${parte()}${parte()}`;
}

// Antepone el puesto histórico a los folios que no lo llevan. Conserva el
// número: `OT-0140` queda `OT-A1-0140`. Los que ya tienen puesto no se tocan,
// así que volver a correrla no hace daño.
async function migrarFoliosSinPuesto(
  transaction: IDBPTransaction<
    BahiaDbSchema,
    ArrayLike<StoreNames<BahiaDbSchema>>,
    'versionchange'
  >,
): Promise<void> {
  const ordenes = transaction.objectStore('ordenes');
  for (const orden of await ordenes.getAll()) {
    if (/^OT-\d+$/.test(orden.numero)) {
      await ordenes.put({
        ...orden,
        numero: orden.numero.replace(/^OT-/, `OT-${PUESTO_HISTORICO}-`),
      });
    }
  }

  const facturas = transaction.objectStore('facturas');
  for (const factura of await facturas.getAll()) {
    if (/^FA-\d+$/.test(factura.numero)) {
      await facturas.put({
        ...factura,
        numero: factura.numero.replace(/^FA-/, `FA-${PUESTO_HISTORICO}-`),
      });
    }
  }
}

let dbPromise: Promise<IDBPDatabase<BahiaDbSchema>> | undefined;

// Base de datos única para las entidades (ver ticket "Persistencia local
// para no perder datos de la demo"). Cada DataService la usa directamente
// como su almacén — esta es la costura hacia un backend real: cuando exista,
// solo cambian los DataServices (a HttpClient), no los stores ni la UI.
//
// Cada object store se siembra una sola vez, dentro de `upgrade`, la
// primera vez que se crea — las siguientes aperturas reciben los datos
// tal como quedaron persistidos.
export function getBahiaDb(): Promise<IDBPDatabase<BahiaDbSchema>> {
  dbPromise ??= openDB<BahiaDbSchema>(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        const talleres = db.createObjectStore('talleres', { keyPath: 'id' });
        await talleres.put(SEED_TALLER);

        const usuarios = db.createObjectStore('usuarios', { keyPath: 'id' });
        await Promise.all(
          SEED_USUARIOS.map((usuario) => usuarios.put(usuario)),
        );

        const clientes = db.createObjectStore('clientes', { keyPath: 'id' });
        await Promise.all(
          SEED_CLIENTES.map((cliente) => clientes.put(cliente)),
        );

        const vehiculos = db.createObjectStore('vehiculos', {
          keyPath: 'id',
        });
        await Promise.all(
          SEED_VEHICULOS.map((vehiculo) => vehiculos.put(vehiculo)),
        );

        const ordenes = db.createObjectStore('ordenes', { keyPath: 'id' });
        await Promise.all(SEED_ORDENES.map((orden) => ordenes.put(orden)));
      }

      if (oldVersion < 2) {
        const facturas = db.createObjectStore('facturas', { keyPath: 'id' });
        await Promise.all(
          SEED_FACTURAS.map((factura) => facturas.put(factura)),
        );
      }

      // El código de puesto se acuña una sola vez, al crear la base, y no
      // vuelve a cambiar: si cambiara, los folios ya emitidos por este puesto
      // dejarían de pertenecer a su serie.
      if (oldVersion < 3) {
        const puesto = db.createObjectStore('puesto', { keyPath: 'id' });
        await puesto.put({
          id: PUESTO_ACTUAL,
          codigo: generarCodigoPuesto(),
        });

        // Una base que ya existía trae folios del formato viejo, sin puesto
        // ("OT-0140"). Se les antepone el código histórico A1 —el mismo que
        // usa el seed— para que no convivan dos formatos en pantalla.
        //
        // Esto NO renumera nada: `OT-0140` pasa a `OT-A1-0140`, conserva su
        // número y solo gana la atribución del puesto que lo emitió.
        // Renumerar sí sería inaceptable, porque estos folios pueden estar
        // impresos en una factura ya entregada (ver issue #46).
        if (oldVersion >= 1) {
          await migrarFoliosSinPuesto(transaction);
        }
      }
    },
  });
  return dbPromise;
}

// El código del puesto en el que corre esta instalación. Cada navegador tiene
// su propia base, así que cada uno acuña el suyo y nadie tiene que
// coordinarse — que es justo lo que no se puede hacer sin conexión.
export async function getCodigoPuesto(): Promise<string> {
  const db = await getBahiaDb();
  const registro = await db.get('puesto', PUESTO_ACTUAL);
  if (!registro) throw new Error('La base no tiene código de puesto');
  return registro.codigo;
}

// Solo para tests: cierra y borra la base para que cada test arranque de
// una base recién sembrada, en vez de arrastrar mutaciones de tests
// anteriores (el singleton de arriba, por diseño, sobrevive entre tests).
export async function resetBahiaDbForTests(): Promise<void> {
  if (dbPromise) {
    (await dbPromise).close();
    dbPromise = undefined;
  }
  await deleteDB(DB_NAME);
}
